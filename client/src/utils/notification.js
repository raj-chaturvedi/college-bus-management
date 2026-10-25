import { transitAudio } from './audio';

export async function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.warn('[Notification API]:', e.message);
      }
    }
    return Notification.permission;
  }
  return 'unsupported';
}

export function notifyUser({ title, body, icon = '/favicon.ico', playSound = true }) {
  // 1. Audio Confirmation Chime
  if (playSound) {
    try {
      transitAudio.playPassChime();
    } catch {}
  }

  // 2. Mobile Haptic Vibration
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch {}
  }

  // 3. Native Android Service Worker & Desktop Notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon,
          badge: icon,
          vibrate: [200, 100, 200],
          tag: 'transit-token-alert'
        });
      }).catch(() => {
        try {
          new Notification(title, { body, icon });
        } catch {}
      });
    } else {
      try {
        new Notification(title, {
          body,
          icon,
          badge: icon,
          vibrate: [200, 100, 200]
        });
      } catch (e) {
        console.warn('[Push Notification Error]:', e.message);
      }
    }
  }

  // 4. In-App Global Elevated Toast Event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:notification-toast', {
      detail: { title, body, timestamp: new Date() }
    }));
  }
}
