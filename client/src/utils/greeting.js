/**
 * Time of Day Greeting Utility
 * Dynamically computes greetings based on current time:
 * - 04:00 to 11:59 -> "Good morning"
 * - 12:00 to 16:59 -> "Good afternoon"
 * - 17:00 to 03:59 -> "Good evening" (STRICTLY NO NIGHT!)
 */

export function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 || hour < 4) {
    // Strictly evening, never night
    return 'Good evening';
  } else {
    return 'Good morning';
  }
}

export function getTimeOfDayGreeting(fullName) {
  const greeting = getTimeGreeting();
  if (!fullName) return greeting;

  // Extract first name and ensure proper capitalization
  const firstName = fullName.trim().split(' ')[0];
  const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  return `${greeting} ${capitalized}`;
}
