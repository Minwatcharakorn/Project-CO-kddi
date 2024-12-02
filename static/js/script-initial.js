// Toggle Password Visibility
const togglePassword = document.getElementById('togglePassword');
const passwordField = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    // Toggle the type attribute
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);

    // Toggle the eye icon
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
});

// Handle Apply Button Click Event
document.getElementById('scan-button').addEventListener('click', async () => {
    const ipStart = document.getElementById('ip-start').value.trim();
    const ipEnd = document.getElementById('ip-end').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Show the loading modal
    const loadingModal = document.getElementById('loadingModal');
    loadingModal.style.display = 'flex';

    try {
        const response = await fetch('/api/login_ssh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip_start: ipStart, ip_end: ipEnd, username, password }),
        });

        if (response.ok) {
            window.location.href = "/dashboard";
        } else {
            const result = await response.json();
            throw new Error(result.error || 'Login failed.');
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        
        // Show Modal Error instead of alert
        showErrorModal(error.message);
    } finally {
        // Hide the loading modal once processing is complete
        loadingModal.style.display = 'none';
    }
});


