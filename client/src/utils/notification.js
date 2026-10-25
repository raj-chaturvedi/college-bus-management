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
  if (playSound) {
    try {
      transitAudio.playPassChime();
    } catch {}
  }

  // 1. Native Mobile / Desktop Push Notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
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

  // 2. In-App Global Toast Event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:notification-toast', {
      detail: { title, body, timestamp: new Date() }
    }));
  }
}
