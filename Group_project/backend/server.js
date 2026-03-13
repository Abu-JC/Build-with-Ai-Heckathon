const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDBs } = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();

// --- SECURITY: PREVENT BROWSER CACHING ---
// This ensures that when a user logs out, they can't click "Back" 
// and see a cached version of their private dashboard.
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Serve the entire frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Mount all API routes under /api
app.use('/api', apiRoutes);

// 2. Route Handling
// Redirect root to the Landing Page (index.html)
app.get('/', (req, res) => {
    res.redirect('/pages/index.html');
});

const PORT = process.env.PORT || 5000;

// Connect to databases, then start listening
connectDBs().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Backend running on http://localhost:${PORT}`);
        console.log(`🌍 Frontend available at http://localhost:${PORT}`);
        console.log(`🛡️  Cache-control security active`);
    });
});