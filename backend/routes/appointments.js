const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');
const { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = require('../googleCalendar');
const { sendNewAppointmentNotification } = require('../emailService');

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT id, name, email, phone, address, CONVERT(VARCHAR(10), requestedDate, 23) as requestedDate, requestedTime, notes, status, submittedAt FROM Appointments ORDER BY submittedAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET single appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id, name, email, phone, address, CONVERT(VARCHAR(10), requestedDate, 23) as requestedDate, requestedTime, notes, status, submittedAt FROM Appointments WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching appointment:', err);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// POST new appointment
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, requestedDate, requestedTime, notes } = req.body;
    
    console.log('Received appointment request:', { name, email, phone, address, requestedDate, requestedTime, notes });
    
    // Validation
    if (!name || !email || !phone || !address || !requestedDate || !requestedTime) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Format time to HH:MM:SS format
    let formattedTime = requestedTime;
    if (requestedTime && !requestedTime.includes(':00')) {
      const parts = requestedTime.split(':');
      if (parts.length === 2) {
        formattedTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
      }
    }
    
    console.log('Formatted time:', formattedTime);
    
    const pool = getPool();
    console.log('Attempting to insert into database...');
    
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .input('address', sql.NVarChar, address)
      .input('requestedDate', sql.Date, requestedDate)
      .input('requestedTime', sql.VarChar, formattedTime)
      .input('notes', sql.NVarChar, notes || '')
      .input('status', sql.NVarChar, 'pending')
      .query(`
        INSERT INTO Appointments (name, email, phone, address, requestedDate, requestedTime, notes, status, submittedAt)
        OUTPUT INSERTED.*
        VALUES (@name, @email, @phone, @address, @requestedDate, CAST(@requestedTime AS TIME), @notes, @status, GETDATE())
      `);
    
    console.log('Insert successful:', result.recordset[0]);
    const newAppointment = result.recordset[0];
    
    // Send email notification to business
    if (process.env.EMAIL_APP_PASSWORD) {
      console.log('📧 Sending email notification...');
      await sendNewAppointmentNotification(newAppointment);
    } else {
      console.log('⚠️  Email notifications not configured (missing EMAIL_APP_PASSWORD)');
    }
    
    res.status(201).json(newAppointment);
  } catch (err) {
    console.error('Error creating appointment:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to create appointment', message: err.message });
  }
});

// PUT update appointment status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'confirmed', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE Appointments 
        SET status = @status 
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const appointment = result.recordset[0];
    
    // Create Google Calendar event when status changes to "confirmed"
    console.log('🔍 Checking calendar creation conditions...');
    console.log('   Status:', status);
    console.log('   Has refresh token:', !!process.env.GOOGLE_REFRESH_TOKEN);
    
    if (status === 'confirmed' && process.env.GOOGLE_REFRESH_TOKEN) {
      try {
        console.log('📅 Creating Google Calendar event for appointment:', appointment.id);
        console.log('   Appointment data:', JSON.stringify(appointment, null, 2));
        const result = await createCalendarEvent(appointment);
        console.log('✅ Google Calendar event created successfully!');
        console.log('   Event link:', result.htmlLink);
      } catch (calendarError) {
        console.error('❌ ERROR creating calendar event:');
        console.error('   Message:', calendarError.message);
        console.error('   Full error:', calendarError);
        // Don't fail the request if calendar creation fails
      }
    } else {
      console.log('⏭️  Skipping calendar creation - conditions not met');
    }
    
    res.json(appointment);
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// DELETE appointment
router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Appointments WHERE id = @id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

module.exports = router;
