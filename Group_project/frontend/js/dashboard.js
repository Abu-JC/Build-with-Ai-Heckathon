// Dashboard JavaScript (Connected to Backend API)

// API Base URL (Update if hosting online)
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
let sidebar = document.querySelector('.sidebar');
let menuToggle = document.querySelector('.menu-toggle');
let themeToggle = document.querySelector('.theme-toggle');
let uploadArea = document.getElementById('uploadArea');
let previewContainer = document.getElementById('previewContainer');
let imagePreview = document.getElementById('imagePreview');
let analysisResult = document.getElementById('analysisResult');
let analysisModal = document.getElementById('analysisModal');
let imageInput = document.getElementById('imageInput');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    startRealSensorPolling(); // Changed to fetch real data
    loadAlerts();
});

// --- UI Logic (Kept Intact) ---

function initializeDashboard() {
    if (menuToggle) menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    
    // Setup file input listener for the AI scanner
    if(imageInput) {
        imageInput.addEventListener('change', function(e) {
            previewImage(this);
        });
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    let icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-theme')) {
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    if (themeToggle) themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
}

function openUploadModal() {
    if(imageInput) imageInput.click();
}

function previewImage(input) {
    if (input.files && input.files[0]) {
        let reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            uploadArea.style.display = 'none';
            previewContainer.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function resetUpload() {
    if(imageInput) imageInput.value = '';
    previewContainer.style.display = 'none';
    uploadArea.style.display = 'block';
    analysisResult.style.display = 'none';
}

function closeModal() {
    analysisModal.classList.remove('active');
}


// --- 1. REAL AI INTEGRATION (GEMINI API) ---

async function analyzeImage() {
    if (!imageInput.files[0]) {
        alert("Please select an image first.");
        return;
    }

    // Show loading modal
    analysisModal.classList.add('active');
    
    // Create form data to send file
    const formData = new FormData();
    formData.append('image', imageInput.files[0]);

    // Get Auth Token if logged in
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        // Send to our Node.js Backend
        const response = await fetch(`${API_BASE_URL}/ai/detect`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Failed to analyze image');

        // Hide modal and show results
        analysisModal.classList.remove('active');
        showAnalysisResult(result.data);

    } catch (error) {
        console.error("AI Error:", error);
        analysisModal.classList.remove('active');
        alert("Error connecting to AI: " + error.message);
    }
}

function showAnalysisResult(aiData) {
    analysisResult.style.display = 'block';
    
    // Map Gemini JSON data to your beautiful UI
    document.getElementById('diseaseName').textContent = aiData.disease === "None" ? "Healthy Plant" : aiData.disease;
    document.getElementById('confidence').textContent = "AI Analysis Complete"; // Gemini doesn't always return standard confidence
    document.getElementById('symptoms').textContent = `Detected Crop: ${aiData.crop}`;
    
    // Format treatments array into a string
    const treatmentsHtml = aiData.treatments ? aiData.treatments.map(t => `• ${t}`).join('<br>') : "No treatment needed.";
    document.getElementById('treatment').innerHTML = treatmentsHtml;
    
    // Determine severity based on status
    let severityClass = aiData.status === 'Healthy' ? 'low' : 'high';
    let severityElement = document.querySelector('.severity');
    
    if(severityElement) {
        severityElement.className = `severity ${severityClass}`;
        severityElement.textContent = aiData.status;
    }
}


// --- 2. REAL IoT SENSOR INTEGRATION ---

// Fetch data from Node.js backend instead of Math.random()
async function fetchLiveSensorData() {
    try {
        const response = await fetch(`${API_BASE_URL}/iot/sensors/latest`);
        if(!response.ok) return;

        const data = await response.json();

        if (data.temperature) {
            updateSensorValue('temperatureValue', `${data.temperature}°C`);
            updateProgressBar('temperatureValue', ((data.temperature - 15) / 25) * 100);
            
            updateSensorValue('humidityValue', `${data.humidity}%`);
            updateProgressBar('humidityValue', data.humidity);
            
            updateSensorValue('moistureValue', `${data.soilMoisture}%`);
            updateProgressBar('moistureValue', data.soilMoisture);

            // Dynamic logic for UI alerts
            if(data.soilMoisture < 30) {
                 document.getElementById('moistureValue').style.color = 'var(--danger-color)';
            } else {
                 document.getElementById('moistureValue').style.color = ''; // reset
            }
        }
    } catch (error) {
        console.error("Failed to fetch live sensor data", error);
    }
}

function startRealSensorPolling() {
    // Fetch immediately, then every 5 seconds
    fetchLiveSensorData();
    setInterval(fetchLiveSensorData, 5000);
}

function updateSensorValue(elementId, value) {
    let element = document.getElementById(elementId);
    if (element) element.textContent = value;
}

function updateProgressBar(elementId, percentage) {
    // Ensure percentage is between 0 and 100
    const safePercent = Math.max(0, Math.min(100, percentage));
    
    // Traverse DOM to find the specific progress bar for this sensor
    const sensorContainer = document.getElementById(elementId)?.closest('.sensor-card');
    if (sensorContainer) {
        const bar = sensorContainer.querySelector('.progress');
        if (bar) bar.style.width = `${safePercent}%`;
    }
}

// --- Minor Utilities ---
function loadAlerts() {
    // Keeping your static mock alerts for the UI demo purposes
    let mockAlerts = [
        { title: 'AI System Online', message: 'Gemini Vision Model connected and ready.', time: 'Just now', severity: 'low', icon: 'check-circle' },
        { title: 'Live Sensors Active', message: 'Receiving data from IoT devices.', time: '2 mins ago', severity: 'low', icon: 'wifi' }
    ];
    displayAlerts(mockAlerts);
}

function displayAlerts(alerts) {
    let alertsList = document.getElementById('alertsList');
    if (!alertsList) return;
    alertsList.innerHTML = '';
    alerts.forEach(alert => {
        let alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alert.severity}`;
        alertElement.innerHTML = `
            <div class="alert-icon"><i class="fas fa-${alert.icon}"></i></div>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.message}</p>
                <span class="alert-time"><i class="fas fa-clock"></i> ${alert.time}</span>
            </div>
        `;
        alertsList.appendChild(alertElement);
    });
}