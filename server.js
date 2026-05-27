require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Initialize Database
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("Error connecting to MySQL database:", err.message);
    } else {
        console.log("Connected to the MySQL database.");
        connection.query(`CREATE TABLE IF NOT EXISTS submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fullName VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            institution VARCHAR(255) NOT NULL,
            state VARCHAR(100) NOT NULL,
            cityArea VARCHAR(255) NOT NULL,
            serviceRequested TEXT,
            submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
            }
            connection.release();
        });
    }
});

// API Route to submit form
app.post('/api/submit', (req, res) => {
    const { fullName, email, phone, institution, state, cityArea, serviceRequested } = req.body;

    if (!fullName || !email || !phone || !institution || !state || !cityArea) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `INSERT INTO submissions (fullName, email, phone, institution, state, cityArea, serviceRequested) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [fullName, email, phone, institution, state, cityArea, serviceRequested];

    db.query(sql, params, function (err, result) {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ error: "Failed to save submission" });
        }
        res.status(201).json({ message: "Submission successful", id: result.insertId });
    });
});



// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
