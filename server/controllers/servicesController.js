const store = require('../services/store');
const { getHaversineDistance } = require('../algorithms/graphRouter');
const { sendPassIssuedEmail, sendIssueReportEmail, isPlaceholderEmail } = require('../services/emailService');

// 1. Dynamic Stop Live Departure Board
exports.getStopBoard = async (req, res, next) => {
  try {
    const { stopId } = req.params;
    const stop = await store.getStopById(stopId);
    if (!stop) {
      return res.status(404).json({ success: false, message: 'Bus stop not found.' });
    }

    const buses = await store.getAllBuses();
    const routes = await store.getAllRoutes();

    // Find routes passing through this stop
    const routesThroughStop = routes.filter(r =>
      (r.stops || []).some(s => (s.stop?._id || s.stop).toString() === stopId.toString())
    );

    // Compute live arrival predictions for each bus serving this stop
    const arrivals = [];

    for (const route of routesThroughStop) {
      const stopIndex = route.stops.findIndex(s => (s.stop?._id || s.stop).toString() === stopId.toString());
      const routeBuses = buses.filter(b => (b.route?._id || b.route || '').toString() === route._id.toString());

      for (const bus of routeBuses) {
        if (bus.status === 'maintenance') continue;

        // Calculate dynamic distance from bus current location to stop
        let distanceMeters = 1500;
        if (bus.currentLocation?.latitude && bus.currentLocation?.longitude) {
          distanceMeters = getHaversineDistance(
            bus.currentLocation.latitude,
            bus.currentLocation.longitude,
            stop.latitude,
            stop.longitude
          );
        }

        // Live ETA calculation: based on current telemetry speed (or default 30 km/h)
        const speedKmh = Math.max(15, bus.speed || bus.currentLocation?.speed || 30);
        const speedMetersPerMin = (speedKmh * 1000) / 60;
        let dynamicEtaMins = Math.max(1, Math.round(distanceMeters / speedMetersPerMin) + (bus.delayMinutes || 0));

        // Format arrival clock time
        const now = new Date();
        const arrivalDate = new Date(now.getTime() + dynamicEtaMins * 60000);
        const formattedClock = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        arrivals.push({
          busId: bus._id,
          busNumber: bus.busNumber,
          routeCode: route.code,
          routeName: route.name,
          routeColor: route.color || '#0c87eb',
          etaMinutes: dynamicEtaMins,
          clockTime: formattedClock,
          distanceMeters,
          occupancyPercentage: bus.occupancyPercentage,
          crowdLevel: bus.crowdLevel,
          currentPassengers: bus.currentPassengers,
          capacity: bus.capacity,
          status: bus.status,
          delayMinutes: bus.delayMinutes || 0,
          direction: bus.direction || 'outbound',
          speed: speedKmh
        });
      }
    }

    // Sort by soonest arrival
    arrivals.sort((a, b) => a.etaMinutes - b.etaMinutes);

    res.status(200).json({
      success: true,
      stop: {
        id: stop._id,
        name: stop.name,
        code: stop.code,
        zone: stop.zone,
        latitude: stop.latitude,
        longitude: stop.longitude
      },
      serverTime: new Date(),
      count: arrivals.length,
      arrivals
    });
  } catch (error) {
    next(error);
  }
};

// 2. Digital QR Bus Pass Generator
exports.generatePass = async (req, res, next) => {
  try {
    const { busId, busNumber, routeId, fromStop, toStop, seatPreference } = req.body;

    let bus = null;
    if (busId) {
      bus = await store.getBusById(busId);
    }
    if (!bus && busNumber) {
      const allBuses = await store.getBuses();
      bus = allBuses.find(b => b.busNumber.toLowerCase() === busNumber.toLowerCase() || String(b._id) === busNumber);
    }
    if (!bus) {
      const allBuses = await store.getBuses();
      bus = allBuses[0];
    }
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Target bus not found.' });
    }

    const route = routeId ? await store.getRouteById(routeId) : (bus.route || null);

    // Random seat generation
    const seatNum = Math.floor(1 + Math.random() * (bus.capacity || 50));
    const timeEpochPart = Date.now().toString(36).toUpperCase();
    const randomTicketSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleanBusTag = bus.busNumber.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
    const passCode = `GNTA-TKN-${cleanBusTag}-${timeEpochPart}-${randomTicketSuffix}`;
    const tokenHash = Math.random().toString(16).substring(2, 10).toUpperCase() + '-' + Math.random().toString(16).substring(2, 10).toUpperCase();

    // Valid strictly for 10 minutes from issuance (live dynamic boarding token)
    const validUntil = new Date(Date.now() + 10 * 60 * 1000);

    const pass = await store.createPass({
      student: req.user?._id || 'guest_student',
      studentName: req.user?.name || 'Student Traveler',
      studentEmail: req.user?.email || 'student@gbu.ac.in',
      bus: bus._id,
      busNumber: bus.busNumber,
      plateNumber: bus.plateNumber || 'UP-16-CB-1012',
      route: route?._id || null,
      routeName: route?.name || 'Campus Express Line',
      fromStop: fromStop || 'Campus Main Station',
      toStop: toStop || 'Academic Hub',
      passCode,
      tokenHash,
      fareStatus: 'PAID (GNTA Student Pass Subsidized)',
      seatNumber: `Seat #${seatNum} (${seatPreference || 'Window/Standard'})`,
      validUntil
    });

    const passObj = pass.toObject ? pass.toObject() : pass;

    // Dispatches live Gmail notification with embedded QR code asynchronously
    const passRecipientEmail = (!isPlaceholderEmail(req.user?.email) ? req.user.email : null) ||
                               (!isPlaceholderEmail(pass.studentEmail) ? pass.studentEmail : null) ||
                               'rajchaturvedi215@gmail.com';

    console.log(`[Pass Service] Dispatching digital pass email with QR code to: ${passRecipientEmail}`);
    try {
      await Promise.race([
        sendPassIssuedEmail({
          toEmail: passRecipientEmail,
          userName: req.user?.name || req.user?.username || 'Student Traveler',
          pass: {
            ...passObj,
            plateNumber: bus.plateNumber || 'UP-16-CB-1012'
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Pass email SMTP timeout')), 3500))
      ]);
      console.log(`[Pass Service] Digital pass email dispatched successfully to: ${passRecipientEmail}`);
    } catch (err) {
      console.warn('[Pass Email Notice]:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Realistic digital transit QR boarding token issued successfully (Valid for 10 minutes).',
      pass: {
        ...passObj,
        tokenHash,
        plateNumber: bus.plateNumber || 'UP-16-CB-1012',
        fareStatus: 'PAID (GNTA Student Pass Subsidized)',
        authority: 'GREATER NOIDA TRANSIT AUTHORITY (GNTA)',
        validityMinutes: 10
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyPasses = async (req, res, next) => {
  try {
    const passes = await store.getPassesByStudent(req.user._id);
    res.status(200).json({
      success: true,
      count: passes.length,
      passes
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyPass = async (req, res, next) => {
  try {
    const { code } = req.params;
    const cleanCode = decodeURIComponent(code).trim();
    const pass = await store.getPassByCode(cleanCode);
    if (!pass) {
      return res.status(404).json({
        success: false,
        valid: false,
        status: 'INVALID',
        message: 'Invalid or unrecognized boarding token.'
      });
    }

    const isExpired = new Date() > new Date(pass.validUntil);
    const isUsed = pass.status === 'used';
    const isCancelled = pass.status === 'cancelled';

    let status = 'ACTIVE';
    let message = 'Pass is valid for immediate boarding.';

    if (isCancelled) {
      status = 'CANCELLED';
      message = 'This boarding pass has been cancelled.';
    } else if (isUsed) {
      status = 'USED';
      message = 'This pass has already been scanned and boarded.';
    } else if (isExpired) {
      status = 'EXPIRED';
      message = 'This boarding pass has expired.';
    }

    const isValid = status === 'ACTIVE';

    res.status(200).json({
      success: true,
      valid: isValid,
      status,
      message,
      pass: {
        ...(pass.toObject ? pass.toObject() : pass),
        status,
        valid: isValid,
        statusMessage: message
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.consumePass = async (req, res, next) => {
  try {
    const { code } = req.params;
    const cleanCode = decodeURIComponent(code).trim();
    const pass = await store.getPassByCode(cleanCode);

    if (!pass) {
      return res.status(404).json({
        success: false,
        valid: false,
        status: 'INVALID',
        message: 'Boarding token not found in registry.'
      });
    }

    if (pass.status === 'used') {
      return res.status(400).json({
        success: false,
        valid: false,
        status: 'USED',
        message: 'This pass has already been used and boarded.',
        usedAt: pass.usedAt
      });
    }

    if (new Date() > new Date(pass.validUntil)) {
      return res.status(400).json({
        success: false,
        valid: false,
        status: 'EXPIRED',
        message: 'Cannot board with an expired pass.',
        validUntil: pass.validUntil
      });
    }

    const updated = await store.updatePassStatus(pass.passCode, 'used', {
      usedAt: new Date(),
      verifiedBy: req.user?.name || 'Conductor / Gate Scanner'
    });

    res.status(200).json({
      success: true,
      valid: true,
      status: 'USED',
      message: 'Pass verified! Marked as USED.',
      pass: updated
    });
  } catch (error) {
    next(error);
  }
};

// 3. Dynamic Traffic & Incident Reporting
exports.reportIncident = async (req, res, next) => {
  try {
    const { title, description, type, busId, routeId, stopId, severity, delayAddedMinutes, location } = req.body;

    // A. Validate required fields
    if ((!title || !title.trim()) && (!description || !description.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Please provide an incident title or description.'
      });
    }

    const incidentTitle = (title && title.trim()) || (type ? `${type.replace(/_/g, ' ').toUpperCase()} Incident` : 'Campus Transit Alert');
    const incidentDesc = (description && description.trim()) || `Reported ${type || 'incident'} near ${location || 'campus corridors'}.`;

    let busNumber = '';
    let routeName = '';
    if (busId) {
      const bus = await store.getBusById(busId);
      if (bus) {
        busNumber = bus.busNumber;
        routeName = bus.route?.name || '';
        // Dynamically add delay to the bus
        const delayToAdd = delayAddedMinutes ? Number(delayAddedMinutes) : (severity === 'high' ? 6 : 3);
        await store.updateBus(bus._id, {
          delayMinutes: (bus.delayMinutes || 0) + delayToAdd,
          status: severity === 'critical' ? 'delayed' : bus.status
        });
      }
    }

    if (!routeName && routeId) {
      const route = await store.getRouteById(routeId);
      if (route) routeName = route.name;
    }

    // B. Save to Database
    const incident = await store.createIncident({
      reportedBy: req.user ? req.user._id : null,
      reporterName: req.user ? req.user.name : 'Campus Commuter',
      type: type || 'traffic_jam',
      title: incidentTitle,
      description: incidentDesc,
      bus: busId || null,
      busNumber,
      route: routeId || null,
      stop: stopId || null,
      severity: severity || 'medium',
      delayAddedMinutes: delayAddedMinutes ? Number(delayAddedMinutes) : 3
    });

    // C. Dispatch Admin Email Notification (Safe minimal failure handling)
    const reporterName = req.user ? req.user.name : 'Campus Commuter';
    const reporterEmail = req.user ? req.user.email : null;
    const emailResult = await sendIssueReportEmail({
      incident,
      reporterName,
      reporterEmail,
      busNumber,
      routeName
    });

    res.status(201).json({
      success: true,
      message: emailResult.success
        ? 'Issue reported successfully! Transit dispatch alerted and notification email delivered.'
        : 'Issue reported and recorded in transit dispatch. Email notification could not be delivered.',
      incident,
      emailDelivered: emailResult.success,
      emailError: emailResult.error || null
    });
  } catch (error) {
    next(error);
  }
};

exports.getIncidents = async (req, res, next) => {
  try {
    const incidents = await store.getAllIncidents();
    res.status(200).json({
      success: true,
      count: incidents.length,
      incidents
    });
  } catch (error) {
    next(error);
  }
};
