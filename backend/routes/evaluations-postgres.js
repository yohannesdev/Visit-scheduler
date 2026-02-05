const express = require('express');
const router = express.Router();

// Get database pool
const { getPool } = require('../db-postgres');

// GET all evaluations
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        e.*,
        TO_CHAR(e.evaluation_date, 'YYYY-MM-DD') as evaluation_date,
        TO_CHAR(e.submitted_at, 'YYYY-MM-DD HH24:MI:SS') as submitted_at,
        a.name as appointment_client_name,
        a.requestedDate as appointment_date
      FROM evaluations e
      LEFT JOIN appointments a ON e.appointment_id = a.id
      ORDER BY e.submitted_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

// GET evaluation by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        e.*,
        TO_CHAR(e.evaluation_date, 'YYYY-MM-DD') as evaluation_date,
        TO_CHAR(e.submitted_at, 'YYYY-MM-DD HH24:MI:SS') as submitted_at
      FROM evaluations e
      WHERE e.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({ error: 'Failed to fetch evaluation' });
  }
});

// POST new evaluation
router.post('/', async (req, res) => {
  try {
    const {
      evaluation_type,
      appointment_id,
      evaluator_name,
      evaluator_signature,
      client_name,
      service_provider_name,
      evaluation_date,
      service_types,
      responses
    } = req.body;

    const pool = getPool();
    const result = await pool.query(`
      INSERT INTO evaluations (
        evaluation_type,
        appointment_id,
        evaluator_name,
        evaluator_signature,
        client_name,
        service_provider_name,
        evaluation_date,
        service_types,
        responses
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      evaluation_type,
      appointment_id || null,
      evaluator_name,
      evaluator_signature,
      client_name,
      service_provider_name,
      evaluation_date,
      service_types,
      JSON.stringify(responses)
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating evaluation:', error);
    res.status(500).json({ error: 'Failed to create evaluation' });
  }
});

// DELETE evaluation
router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('DELETE FROM evaluations WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    
    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({ error: 'Failed to delete evaluation' });
  }
});

module.exports = router;
