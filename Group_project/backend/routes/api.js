const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const { pgPool } = require('../config/db');
const { SensorLog } = require('../models/mongoModels');
const optionalAuth = require('../middleware/optionalAuth');

// Import the new AI Controller logic
const { analyzeCropImage } = require('../controllers/aiController');

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// --- 1. AUTHENTICATION (PostgreSQL) ---
router.post('/auth/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const newUser = await pgPool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, hash]
        );
        res.status(201).json({ message: "Account created", user: newUser.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Email may already exist." });
    }
});

router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userQuery = await pgPool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userQuery.rows.length === 0) return res.status(400).json({ error: "User not found" });
        
        const user = userQuery.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: "Login successful", token });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// --- 2. IOT SENSOR DATA ---
router.post('/iot/sensors', optionalAuth, async (req, res) => {
    const { temperature, humidity, soilMoisture } = req.body;
    const userId = req.user ? req.user.id : null;

    try {
        const newLog = await SensorLog.create({
            user_id: userId,
            temperature,
            humidity,
            soilMoisture
        });

        let alert = soilMoisture < 30 ? "CRITICAL: Soil moisture low. Irrigate soon." : "Optimal";
        res.status(201).json({ message: "Data received", alert, data: newLog });
    } catch (err) {
        res.status(500).json({ error: "Failed to log sensor data" });
    }
});

router.get('/iot/sensors/latest', async (req, res) => {
    try {
        const latestData = await SensorLog.findOne().sort({ timestamp: -1 });
        if (!latestData) return res.json({ temperature: '--', humidity: '--', soilMoisture: '--' });
        res.json(latestData);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch sensor data" });
    }
});

// --- 3. AI DETECTION (Now handled by aiController) ---

// Authenticated Detect (Saves to user dashboard)
router.post('/ai/detect', optionalAuth, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    try {
        const userId = req.user ? req.user.id : null;
        // Pass the heavy lifting to the controller
        const result = await analyzeCropImage(req.file.path, req.file.mimetype, userId);
        
        res.json({ 
            message: userId ? "Saved to your dashboard." : "Analysis complete.", 
            data: result 
        });
    } catch (err) {
        res.status(500).json({ error: "AI analysis failed.", details: err.message });
    }
});

// Public Detect (No login, user_id is null)
router.post('/ai/public-detect', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    try {
        const result = await analyzeCropImage(req.file.path, req.file.mimetype, null);
        res.json({ 
            message: "Guest analysis complete.", 
            data: result 
        });
    } catch (err) {
        res.status(500).json({ error: "Public AI analysis failed.", details: err.message });
    }
});

module.exports = router;