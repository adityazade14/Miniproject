const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(bodyParser.json());
app.use(cors());

// Provide your PostgreSQL connection details here:
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'miniproject',
  password: 'aditya.#zade',
  port: 5432,
});

// ----------------------
// Student Registration
// ----------------------
app.post('/register', async (req, res) => {
  const { name, email, password, department_id, semester } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO students (name, email, password, department_id, semester) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, password, department_id, semester]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// ----------------------
// Login (for both roles)
// ----------------------
app.post('/login', async (req, res) => {
  const { email, password, type } = req.body;
  try {
    let query, params;
    if (type === 'admin') {
      query = 'SELECT * FROM faculty WHERE email=$1 AND password=$2';
      params = [email, password];
    } else {
      query = 'SELECT * FROM students WHERE email=$1 AND password=$2';
      params = [email, password];
    }
    const result = await pool.query(query, params);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(401).json({ error: 'Invalid credentials.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ----------------------
// Get all courses
// ----------------------
app.get('/courses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch courses.' });
  }
});

// ----------------------
// Add a new course (Admin only)
// ----------------------
app.post('/courses', async (req, res) => {
  const { course_name, credits, department_id, faculty_id, capacity } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO courses (course_name, credits, department_id, faculty_id, capacity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [course_name, credits, department_id, faculty_id, capacity]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to add course.' });
  }
});

// ----------------------
// Enroll in a course (Student)
// ----------------------
app.post('/enroll', async (req, res) => {
  const { student_id, course_id, semester } = req.body;
  try {
    // Check if course exists and its capacity
    const courseResult = await pool.query('SELECT capacity FROM courses WHERE course_id = $1', [course_id]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    // Count current enrollments
    const countResult = await pool.query('SELECT COUNT(*) FROM enrollments WHERE course_id=$1', [course_id]);
    if (parseInt(countResult.rows[0].count) >= courseResult.rows[0].capacity) {
      return res.status(400).json({ error: 'Course is full.' });
    }
    const result = await pool.query(
      'INSERT INTO enrollments (student_id, course_id, semester) VALUES ($1, $2, $3) RETURNING *',
      [student_id, course_id, semester]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Enrollment failed.' });
  }
});

// Optionally, add more endpoints (for fetching enrollments, etc.)

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
