// services/calendarSyncService.js
import { DateTime } from 'luxon';
import { updateDocument } from './firestoreService';

/**
 * Sync a calendar with its remote source
 */
export const syncCalendar = async (calendarDoc, retryCount = 0) => {
  const maxRetries = 2;
  
  try {
    console.log(`🔄 Syncing calendar: ${calendarDoc.name}`);
    
    // Set sync status to "syncing"
    await updateSyncStatus(calendarDoc.calendarId, 'syncing');
    
    // Fetch iCal data
    const icalData = await fetchCalendarData(calendarDoc.source.calendarAddress);
    
    // Parse events within date range
    const events = parseICalData(icalData, calendarDoc.calendarId);
    
    // Update calendar with events and success status
    await updateDocument('calendars', calendarDoc.calendarId, {
      events,
      'sync.syncStatus': 'success',
      'sync.lastSyncedAt': DateTime.now().toISO(),
      updatedAt: DateTime.now().toISO()
    });

    console.log(`✅ Calendar synced: ${calendarDoc.name} (${Object.keys(events).length} events)`);
    return { success: true, eventCount: Object.keys(events).length };

  } catch (error) {
    console.error(`❌ Sync failed for ${calendarDoc.name}:`, error);
    
    const isRetryable = isRetryableError(error);
    
    // Retry if possible
    if (isRetryable && retryCount < maxRetries) {
      console.log(`🔄 Retrying sync (${retryCount + 1}/${maxRetries})...`);
      await delay(1000 * (retryCount + 1));
      return await syncCalendar(calendarDoc, retryCount + 1);
    }
    
    // Update with error status
    await updateSyncStatus(calendarDoc.calendarId, 'error', {
      errorMessage: error.message,
      errorType: isRetryable ? 'network' : 'parse',
      retryable: isRetryable,
    });

    return { 
      success: false, 
      error: error.message, 
      retryable: isRetryable 
    };
  }
};

/**
 * Fetch calendar data from remote source
 */
const fetchCalendarData = async (calendarAddress) => {
  // Convert webcal:// to https://
  let fetchUrl = calendarAddress;
  if (fetchUrl.startsWith('webcal://')) {
    fetchUrl = fetchUrl.replace('webcal://', 'https://');
  }

  const response = await fetch(fetchUrl, {
    timeout: 30000,
    headers: { 'User-Agent': 'Calendar App/1.0' }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.text();
};

/**
 * Parse iCal data into events
 */
const parseICalData = (icalData, calendarId) => {
  const events = {};
  const lines = icalData.split('\n');
  const dateRange = getDateRange();
  
  let currentEvent = null;
  let eventId = null;
  let eventCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
      eventId = null;
    } else if (line === 'END:VEVENT' && currentEvent && eventId) {
      const event = processEvent(currentEvent, calendarId);
      
      if (event && isEventInRange(event, dateRange)) {
        events[eventId] = event;
        eventCount++;
      }
      
      currentEvent = null;
      eventId = null;
    } else if (currentEvent && line.includes(':')) {
      const [property, ...valueParts] = line.split(':');
      const value = valueParts.join(':');
      
      processEventProperty(currentEvent, property, value);
      
      if (property === 'UID') {
        eventId = `event-${value}`;
      }
    }
  }

  console.log(`📅 Parsed ${eventCount} events from iCal data`);
  return events;
};

/**
 * Process individual event property
 */
const processEventProperty = (event, property, value) => {
  switch (property) {
    case 'SUMMARY':
      event.title = decodeICalText(value);
      break;
    case 'DESCRIPTION':
      event.description = decodeICalText(value);
      break;
    case 'LOCATION':
      event.location = decodeICalText(value);
      break;
    case 'DTSTART':
    case 'DTSTART;VALUE=DATE':
      event.startTime = value;
      event.isAllDay = property.includes('VALUE=DATE');
      break;
    case 'DTEND':
    case 'DTEND;VALUE=DATE':
      event.endTime = value;
      break;
    default:
      if (property.startsWith('DTSTART')) {
        event.startTime = value;
        event.isAllDay = property.includes('VALUE=DATE');
      } else if (property.startsWith('DTEND')) {
        event.endTime = value;
      }
      break;
  }
};

/**
 * Process and validate event
 */
const processEvent = (rawEvent, calendarId) => {
  if (!rawEvent.startTime || !rawEvent.endTime) {
    return null;
  }

  const startTime = parseICalDate(rawEvent.startTime);
  const endTime = parseICalDate(rawEvent.endTime);

  if (!startTime || !endTime) {
    return null;
  }

  return {
    title: rawEvent.title || 'Untitled Event',
    description: rawEvent.description || '',
    location: rawEvent.location || '',
    startTime,
    endTime,
    isAllDay: rawEvent.isAllDay || false,
    calendarId,
    source: 'ical_feed'
  };
};

/**
 * Parse iCal date string to ISO format
 */
const parseICalDate = (icalDate) => {
  try {
    // UTC format: 20250710T080000Z
    if (icalDate.endsWith('Z')) {
      return DateTime.fromFormat(icalDate, 'yyyyMMddTHHmmssZ').toISO();
    }
    
    // Local format: 20250710T080000
    if (icalDate.match(/^\d{8}T\d{6}$/)) {
      const year = icalDate.substring(0, 4);
      const month = icalDate.substring(4, 6);
      const day = icalDate.substring(6, 8);
      const hour = icalDate.substring(9, 11);
      const minute = icalDate.substring(11, 13);
      const second = icalDate.substring(13, 15);
      
      return DateTime.fromISO(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toISO();
    }
    
    // All-day format: 20250710
    if (icalDate.match(/^\d{8}$/)) {
      return DateTime.fromFormat(icalDate, 'yyyyMMdd').toISO();
    }
    
    // Try direct ISO parsing
    const parsed = DateTime.fromISO(icalDate);
    if (parsed.isValid) {
      return parsed.toISO();
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to parse iCal date:', icalDate, error);
    return null;
  }
};

/**
 * Check if event falls within sync date range
 */
const isEventInRange = (event, dateRange) => {
  const eventStart = DateTime.fromISO(event.startTime);
  const eventEnd = DateTime.fromISO(event.endTime);
  const rangeStart = DateTime.fromISO(dateRange.startDate);
  const rangeEnd = DateTime.fromISO(dateRange.endDate);
  
  return eventEnd >= rangeStart && eventStart <= rangeEnd;
};

/**
 * Get default sync date range (6 months back, 1 year forward)
 */
const getDateRange = () => ({
  startDate: DateTime.now().minus({ months: 6 }).startOf('day').toISO(),
  endDate: DateTime.now().plus({ years: 1 }).endOf('day').toISO(),
});

/**
 * Update calendar sync status
 */
const updateSyncStatus = async (calendarId, status, additionalData = {}) => {
  const syncData = {
    'sync.syncStatus': status,
    'sync.lastSyncedAt': DateTime.now().toISO(),
    updatedAt: DateTime.now().toISO(),
    ...Object.fromEntries(
      Object.entries(additionalData).map(([key, value]) => [`sync.${key}`, value])
    )
  };
  
  await updateDocument('calendars', calendarId, syncData);
};

/**
 * Decode iCal escaped text
 */
const decodeICalText = (text) => {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
};

/**
 * Check if error is retryable
 */
const isRetryableError = (error) => {
  const retryablePatterns = [
    /fetch/i,
    /timeout/i,
    /network/i,
    /ENOTFOUND/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i
  ];
  
  return retryablePatterns.some(pattern => 
    pattern.test(error.message) || error.name === 'TypeError'
  );
};

/**
 * Simple delay utility
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));