// frontend/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Grab the forms and buttons from the DOM
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Base URL for your backend API
    const API_URL = 'http://localhost:5000/api/auth';

    // 2. Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Account created successfully! Please log in.');
                    window.location.href = 'login.html'; 
                } else {
                    throw new Error(data.error || 'Registration failed');
                }
            } catch (error) {
                alert(error.message);
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // 3. Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    // Use replace so they can't click 'back' to the login screen
                    window.location.replace('dashboard.html');
                } else {
                    throw new Error(data.error || 'Login failed');
                }
            } catch (error) {
                alert(error.message);
                submitBtn.textContent = 'Login';
                submitBtn.disabled = false;
            }
        });
    }

    // 4. Handle Logout (SECURED)
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Clear token
            localStorage.removeItem('token');
            // 'replace' wipes the current session from the browser's back-button memory
            window.location.replace('index.html');
        });
    }

    // 5. Initial UI Check on Page Load
    updateAuthUI();
});

/**
 * Security & UI Helper
 * Toggles visibility of elements and prevents guests from viewing private pages.
 */
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const guestOnlyElements = document.querySelectorAll('.guest-only');
    const authOnlyElements = document.querySelectorAll('.auth-only');
    const currentPage = window.location.pathname;

    if (token) {
        // --- USER IS LOGGED IN ---
        guestOnlyElements.forEach(el => el.style.display = 'none');
        
        authOnlyElements.forEach(el => {
            if (el.tagName === 'LI') {
                el.style.display = 'block';
            } else {
                el.style.display = 'flex'; 
            }
        });
    } else {
        // --- USER IS A GUEST ---
        guestOnlyElements.forEach(el => el.style.display = 'block');
        authOnlyElements.forEach(el => el.style.display = 'none');

        // SECURITY REDIRECT: Kick guests out of private pages
        const restrictedPages = ['dashboard.html', 'hardware.html'];
        const isOnRestrictedPage = restrictedPages.some(page => currentPage.includes(page));

        if (isOnRestrictedPage) {
            window.location.replace('login.html');
        }
    }
}