// backend/iot_simulator.js
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api/iot/sensors';
const INTERVAL_MS = 5000; // Send data every 5 seconds

// Baseline values for a tropical farm (e.g., Kakamega/Western Kenya)
let currentTemp = 24.0;
let currentHumidity = 70.0;
let currentMoisture = 55.0;

/**
 * Generates realistic, fluctuating values
 * @param {number} val - Current value
 * @param {number} min - Minimum allowed
 * @param {number} max - Maximum allowed
 * @param {number} step - Max change per tick
 */
const fluctuate = (val, min, max, step) => {
    const change = (Math.random() * step * 2) - step;
    let newVal = val + change;
    return Math.min(Math.max(newVal, min), max).toFixed(1);
};

const injectData = async () => {
    // 1. Generate new "sensed" values
    currentTemp = parseFloat(fluctuate(currentTemp, 18, 32, 0.3));
    currentHumidity = parseFloat(fluctuate(currentHumidity, 40, 95, 1.5));
    currentMoisture = parseFloat(fluctuate(currentMoisture, 10, 90, 2.0));

    const payload = {
        temperature: currentTemp,
        humidity: currentHumidity,
        soilMoisture: currentMoisture
    };

    try {
        // 2. Send the data to your backend
        // Note: This acts as a 'Guest' unless you add a Bearer token in headers
        const response = await axios.post(API_URL, payload);
        
        console.log(`📡 [IoT Node 01] Sent -> Temp: ${payload.temperature}°C | Moisture: ${payload.soilMoisture}%`);
        
        if (response.data.alert !== "Optimal") {
            console.log(`⚠️  BACKEND ALERT: ${response.data.alert}`);
        }
    } catch (error) {
        console.error('❌ Injection failed. Ensure server.js is running at', API_URL);
    }
};

console.log('🌱 Starting CropAI Virtual Sensor Node...');
console.log('-----------------------------------------');

// Start the loop
setInterval(injectData, INTERVAL_MS);
injectData(); // Run immediately on start