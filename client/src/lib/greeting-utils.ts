/**
 * Utility functions for generating dynamic greetings based on time and location
 */

interface User {
  firstName?: string | null;
  lastName?: string | null;
}

export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  } else if (hour >= 17 && hour < 22) {
    return "Good evening";
  } else {
    return "Good evening";
  }
}

export function getLocationBasedTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function getLocalTime(): string {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function getLocationFromTimeZone(timeZone: string): string {
  const locationMappings: Record<string, string> = {
    'Europe/London': 'London',
    'Europe/Dublin': 'Dublin',
    'Europe/Edinburgh': 'Edinburgh',
    'Europe/Belfast': 'Belfast',
    'Europe/Cardiff': 'Cardiff',
    'Europe/Manchester': 'Manchester',
    'Europe/Birmingham': 'Birmingham',
    'Europe/Liverpool': 'Liverpool',
    'Europe/Glasgow': 'Glasgow',
    'America/New_York': 'New York',
    'America/Los_Angeles': 'Los Angeles',
    'America/Chicago': 'Chicago',
    'Asia/Dubai': 'Dubai',
    'Asia/Hong_Kong': 'Hong Kong',
    'Asia/Singapore': 'Singapore',
    'Asia/Manila': 'Manila',
    'Asia/Kolkata': 'India',
    'Australia/Sydney': 'Sydney',
    'Australia/Melbourne': 'Melbourne'
  };

  // Check for exact match first
  if (locationMappings[timeZone]) {
    return locationMappings[timeZone];
  }

  // Extract general location from timezone
  const parts = timeZone.split('/');
  if (parts.length >= 2) {
    const region = parts[0];
    const city = parts[1].replace(/_/g, ' ');
    
    switch (region) {
      case 'Europe':
        return city;
      case 'America':
        return city;
      case 'Asia':
        return city;
      case 'Australia':
        return city;
      case 'Africa':
        return city;
      default:
        return city;
    }
  }

  return '';
}

export function getPersonalizedGreeting(user?: User): string {
  const timeGreeting = getTimeBasedGreeting();
  const timeZone = getLocationBasedTimeZone();
  const location = getLocationFromTimeZone(timeZone);
  const localTime = getLocalTime();
  
  // Get user's first name
  const firstName = user?.firstName || 'there';
  
  // Create personalized greeting
  let greeting = `${timeGreeting}, ${firstName}!`;
  
  // Add location-based context if available and not generic
  if (location && location !== 'UTC') {
    // Check if it's a work day (Monday-Friday)
    const dayOfWeek = new Date().getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    if (isWeekday) {
      greeting += ` Ready to advance your NHS career today?`;
    } else {
      greeting += ` Hope you're having a great weekend!`;
    }
  } else {
    greeting += ` Ready to take the next step in your healthcare career?`;
  }
  
  return greeting;
}

export function getGreetingSubtext(): string {
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekend) {
    if (hour >= 9 && hour < 18) {
      return "Perfect time to work on your career development";
    } else {
      return "Take a moment to plan your next career move";
    }
  } else {
    if (hour >= 6 && hour < 9) {
      return "Start your day by checking new NHS opportunities";
    } else if (hour >= 9 && hour < 17) {
      return "Great time to apply for jobs and update your profile";
    } else if (hour >= 17 && hour < 22) {
      return "Wind down by reviewing your applications and progress";
    } else {
      return "Take a look at your career progress";
    }
  }
}