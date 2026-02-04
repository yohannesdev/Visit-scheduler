const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT * FROM Appointments ORDER BY submittedAt DESC');
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
      .query('SELECT * FROM Appointments WHERE id = @id');
    
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
    
    // Validation
    if (!name || !email || !phone || !address || !requestedDate || !requestedTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const pool = getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .input('address', sql.NVarChar, address)
      .input('requestedDate', sql.Date, requestedDate)
      .input('requestedTime', sql.Time, requestedTime)
      .input('notes', sql.NVarChar, notes || '')
      .input('status', sql.NVarChar, 'pending')
      .query(`
        INSERT INTO Appointments (name, email, phone, address, requestedDate, requestedTime, notes, status, submittedAt)
        OUTPUT INSERTED.*
        VALUES (@name, @email, @phone, @address, @requestedDate, @requestedTime, @notes, @status, GETDATE())
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
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
    
    res.json(result.recordset[0]);
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
