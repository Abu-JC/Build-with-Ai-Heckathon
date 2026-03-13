const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
    user_id: { type: Number, default: null }, 
    temperature: Number,
    humidity: Number,
    soilMoisture: Number,
    timestamp: { type: Date, default: Date.now }
});

const detectionSchema = new mongoose.Schema({
    user_id: { type: Number, default: null },
    crop: String,
    disease: String,
    status: String,
    treatments: [String],
    timestamp: { type: Date, default: Date.now }
});

module.exports = {
    SensorLog: mongoose.model('SensorLog', sensorSchema),
    Detection: mongoose.model('Detection', detectionSchema)
};