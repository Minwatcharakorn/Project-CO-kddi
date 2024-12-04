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

// Function to Show Error Modal
function showErrorModal(message, description = '') {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const errorDescription = document.querySelector('#errorModal p:nth-of-type(2)'); // Select the second <p> tag

    // Set the main error message
    errorMessage.textContent = message;

    // Set the secondary description or hide it if not provided
    if (description) {
        errorDescription.textContent = description;
        errorDescription.style.display = 'block'; // Ensure it's visible
    } else {
        errorDescription.style.display = 'none'; // Hide if no description
    }

    // Show the modal
    errorModal.style.display = 'flex';

    // Add event listener to close the modal
    const closeErrorModal = document.getElementById('closeErrorModal');
    closeErrorModal.onclick = () => {
        errorModal.style.display = 'none';
    };
}

// Function to Validate IPv4 Address
function isValidIPv4(ip) {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
}

// Validate Inputs
function validateInputs(ipStart, ipEnd, username, password) {
    if (!ipStart && !ipEnd && !username && !password) {
        showErrorModal(
            'Missing Inputs',
            'Please provide all required fields: Start IP, End IP, Username, and Password.'
        );
        return false;
    }

    if (!isValidIPv4(ipStart)) {
        showErrorModal('Invalid Start IP Address', 'Please enter a valid IPv4 address for Start IP.');
        return false;
    }

    if (!isValidIPv4(ipEnd)) {
        showErrorModal('Invalid End IP Address', 'Please enter a valid IPv4 address for End IP.');
        return false;
    }

    if (!username) {
        showErrorModal('Missing Username', 'Please provide your username to proceed.');
        return false;
    }

    if (!password) {
        showErrorModal('Missing Password', 'Please provide your password to proceed.');
        return false;
    }

    return true; // All inputs are valid
}
// Handle Apply Button Click Event
document.getElementById('scan-button').addEventListener('click', async () => {
    const ipStart = document.getElementById('ip-start').value.trim();
    const ipEnd = document.getElementById('ip-end').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validate inputs before sending the request
    if (!validateInputs(ipStart, ipEnd, username, password)) {
        return; // Stop execution if validation fails
    }

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
            console.log('Server response:', result); // Debugging
            throw new Error(result.error || 'Login failed.');
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        showErrorModal('Login Failed', error.message); // Trigger error modal with dynamic message
    } finally {
        // Hide the loading modal once processing is complete
        loadingModal.style.display = 'none';
    }
});
