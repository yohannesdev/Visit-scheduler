const { google } = require('googleapis');
const path = require('path');

// Set up Google Calendar API
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/oauth2callback'
);

// Set credentials if refresh token is available
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
}

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Create a calendar event for an appointment
 */
async function createCalendarEvent(appointment) {
  try {
    console.log('📅 Inside createCalendarEvent function');
    console.log('   Appointment:', appointment);
    
    // Parse the date and time
    const appointmentDate = new Date(appointment.requestedDate);
    console.log('   Parsed date:', appointmentDate);
    
    // Handle requestedTime - it could be a Date object or a string
    let hours, minutes;
    if (typeof appointment.requestedTime === 'string') {
      const timeParts = appointment.requestedTime.split(':');
      hours = parseInt(timeParts[0]);
      minutes = parseInt(timeParts[1]);
    } else {
      // It's a Date object from SQL Server TIME type
      const timeDate = new Date(appointment.requestedTime);
      hours = timeDate.getUTCHours();
      minutes = timeDate.getUTCMinutes();
    }
    console.log('   Time:', `${hours}:${minutes}`);
    
    // Create start datetime
    const startDateTime = new Date(appointmentDate);
    startDateTime.setHours(hours, minutes, 0);
    console.log('   Start datetime:', startDateTime.toISOString());
    
    // Create end datetime (1 hour later)
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + 1);
    console.log('   End datetime:', endDateTime.toISOString());
    
    const event = {
      summary: `Home Visit - ${appointment.name}`,
      location: appointment.address,
      description: `
Home Visit Appointment

Client: ${appointment.name}
Phone: ${appointment.phone}
Email: ${appointment.email}
Address: ${appointment.address}
${appointment.notes ? `\nNotes: ${appointment.notes}` : ''}

Status: ${appointment.status}
Submitted: ${new Date(appointment.submittedAt).toLocaleString()}
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/New_York', // Change to your timezone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: [
        { email: 'Forallhomecare@gmail.com', responseStatus: 'accepted' }, // Your business email
        { email: appointment.email } // Client email
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day (24 hours) before - EMAIL
          { method: 'email', minutes: 60 }, // 1 hour before - EMAIL
          { method: 'popup', minutes: 30 }, // 30 minutes before - POPUP
        ],
      },
      sendNotifications: true,
      sendUpdates: 'all'
    };

    console.log('   Calling calendar.events.insert...');
    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      resource: event,
      sendUpdates: 'all', // Send email notifications to attendees
    });

    console.log('✅ Calendar event created:', response.data.htmlLink);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating calendar event:');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Full error:', error);
    if (error.code === 401) {
      console.error('🔐 Authentication error. Please refresh your Google Calendar credentials.');
    }
    throw error;
  }
}

/**
 * Update a calendar event
 */
async function updateCalendarEvent(eventId, appointment) {
  try {
    const appointmentDate = new Date(appointment.requestedDate);
    const timeParts = appointment.requestedTime.split(':');
    
    const startDateTime = new Date(appointmentDate);
    startDateTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + 1);
    
    const event = {
      summary: `Home Visit - ${appointment.name} [${appointment.status.toUpperCase()}]`,
      location: appointment.address,
      description: `
Home Visit Appointment

Client: ${appointment.name}
Phone: ${appointment.phone}
Email: ${appointment.email}
Address: ${appointment.address}
${appointment.notes ? `\nNotes: ${appointment.notes}` : ''}

Status: ${appointment.status}
Updated: ${new Date().toLocaleString()}
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
    };

    const response = await calendar.events.update({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
      resource: event,
      sendUpdates: 'all',
    });

    console.log('✅ Calendar event updated');
    return response.data;
  } catch (error) {
    console.error('❌ Error updating calendar event:', error.message);
    throw error;
  }
}

/**
 * Delete a calendar event
 */
async function deleteCalendarEvent(eventId) {
  try {
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
      sendUpdates: 'all',
    });

    console.log('✅ Calendar event deleted');
    return true;
  } catch (error) {
    console.error('❌ Error deleting calendar event:', error.message);
    throw error;
  }
}

/**
 * Generate OAuth URL for getting refresh token
 */
function getAuthUrl() {
  const scopes = ['https://www.googleapis.com/auth/calendar'];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

/**
 * Get tokens from authorization code
 */
async function getTokensFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

module.exports = {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getAuthUrl,
  getTokensFromCode,
  oauth2Client
};
