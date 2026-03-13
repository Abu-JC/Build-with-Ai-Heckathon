// frontend/js/public-scanner.js

const fileInput = document.getElementById('publicFile');
const uploadArea = document.getElementById('publicUploadArea');
const preview = document.getElementById('publicPreview');
const imgDisplay = document.getElementById('imgDisplay');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultDiv = document.getElementById('publicResult');
const spinner = document.getElementById('spinner');

// Handle Image Selection
fileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imgDisplay.src = e.target.result;
            uploadArea.style.display = 'none';
            preview.style.display = 'block';
        };
        reader.readAsDataURL(this.files[0]);
    }
});

// Handle AI Analysis
analyzeBtn.addEventListener('click', async () => {
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    // UI state
    preview.style.display = 'none';
    spinner.style.display = 'block';

    try {
        const response = await fetch('http://localhost:5000/api/ai/public-detect', {
            method: 'POST',
            body: formData // No headers/token needed for public scan
        });

        const result = await response.json();

        if (response.ok) {
            spinner.style.display = 'none';
            resultDiv.style.display = 'block';
            
            // Populate results
            document.getElementById('diseaseHeader').textContent = result.data.disease;
            document.getElementById('cropType').textContent = result.data.crop;
            document.getElementById('cropStatus').textContent = result.data.status;
            document.getElementById('cropTreatment').textContent = result.data.treatments.join(', ');
        } else {
            throw new Error(result.error);
        }
    } catch (err) {
        alert("Error: " + err.message);
        location.reload();
    }
});