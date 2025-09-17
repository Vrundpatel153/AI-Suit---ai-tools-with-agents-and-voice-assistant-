// ICS (iCalendar) file generation utility for AiSuite

export const generateICS = (eventData) => {
  const {
    title,
    date,
    time,
    duration_minutes,
    attendees = [],
    description = '',
    recurrence = 'none',
    timezone = 'UTC'
  } = eventData;

  // Format date and time for ICS
  const formatDateTime = (date, time, timezone) => {
    const datetime = new Date(`${date}T${time}:00`);
    return datetime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDateTime = formatDateTime(date, time, timezone);
  
  // Calculate end time
  const startDate = new Date(`${date}T${time}:00`);
  const endDate = new Date(startDate.getTime() + (duration_minutes * 60000));
  const endDateTime = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Generate unique ID
  const uid = `aisuite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@aisuite.demo`;

  // Current timestamp for DTSTAMP
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Build attendees string
  const attendeesString = attendees
    .map(email => `ATTENDEE:mailto:${email}`)
    .join('\r\n');

  // Handle recurrence
  const recurrenceString = recurrence !== 'none' && recurrence !== undefined ? 
    `RRULE:FREQ=${recurrence.toUpperCase()}` : '';

  // Build ICS content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AiSuite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDateTime}`,
    `DTEND:${endDateTime}`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, '\\n')}` : '',
    attendeesString,
    recurrenceString,
    `CREATED:${now}`,
    `LAST-MODIFIED:${now}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line.trim() !== '').join('\r\n');

  return icsContent;
};

export const downloadICS = (eventData) => {
  const icsContent = generateICS(eventData);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${eventData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const generateGoogleCalendarURL = (eventData) => {
  const {
    title,
    date,
    time,
    duration_minutes,
    attendees = [],
    description = ''
  } = eventData;

  // Format date and time for Google Calendar
  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + (duration_minutes * 60000));
  
  const formatForGoogle = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatForGoogle(startDateTime)}/${formatForGoogle(endDateTime)}`,
    details: description,
    add: attendees.join(',')
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};