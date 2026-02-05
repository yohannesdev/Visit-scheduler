const express = require('express');
const router = express.Router();
const { getPool } = require('../db-postgres');
const { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = require('../googleCalendar');
const { sendNewAppointmentNotification } = require('../emailService');

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, name, email, phone, address, 
       TO_CHAR("requestedDate", 'YYYY-MM-DD') as "requestedDate", 
       "requestedTime", notes, status, "submittedAt" 
       FROM appointments 
       ORDER BY "submittedAt" DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET single appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, name, email, phone, address, 
       TO_CHAR("requestedDate", 'YYYY-MM-DD') as "requestedDate", 
       "requestedTime", notes, status, "submittedAt" 
       FROM appointments 
       WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(result.rows[0]);
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
    
    const result = await pool.query(
      `INSERT INTO appointments (name, email, phone, address, "requestedDate", "requestedTime", notes, status, "submittedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       RETURNING *`,
      [name, email, phone, address, requestedDate, formattedTime, notes || '', 'pending']
    );
    
    console.log('Insert successful:', result.rows[0]);
    const newAppointment = result.rows[0];
    
    // Send email notification to business (don't wait for it - fire and forget)
    if (process.env.EMAIL_APP_PASSWORD) {
      console.log('📧 Sending email notification in background...');
      sendNewAppointmentNotification(newAppointment).catch(err => 
        console.error('Email notification failed:', err)
      );
    } else {
      console.log('⚠️  Email notifications not configured (missing EMAIL_APP_PASSWORD)');
    }
    
    // Respond immediately to client without waiting for email
    res.status(201).json(newAppointment);
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// PUT update appointment status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    console.log(`Updating appointment ${id} status to:`, status);
    
    if (!status || !['pending', 'confirmed', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const pool = getPool();
    const result = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const updatedAppointment = result.rows[0];
    console.log('Status updated successfully:', updatedAppointment);
    
    // If status is confirmed, create calendar event
    if (status === 'confirmed') {
      try {
        console.log('📅 Creating calendar event for confirmed appointment...');
        const calendarEvent = await createCalendarEvent(updatedAppointment);
        console.log('✅ Calendar event created:', calendarEvent);
      } catch (calendarError) {
        console.error('❌ Failed to create calendar event:', calendarError);
        // Don't fail the status update if calendar creation fails
      }
    }
    
    res.json(updatedAppointment);
  } catch (err) {
    console.error('Error updating appointment status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE appointment
router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM appointments WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

module.exports = router;
