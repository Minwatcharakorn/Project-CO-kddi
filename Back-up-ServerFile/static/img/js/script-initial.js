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

// ฟังก์ชันตรวจสอบ IPv4 Address
function isValidIPv4(ip) {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
}

// ฟังก์ชันแสดง Modal Error
function showErrorModal(message, description = '') {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const errorDescription = document.querySelector('#errorModal p:nth-of-type(2)'); // Select the second <p> tag

    // ตั้งค่าข้อความใน Modal
    errorMessage.textContent = message;
    errorDescription.textContent = description;

    // แสดง Modal
    errorModal.style.display = 'flex';

    // ปิด Modal เมื่อกดปุ่ม OK
    const closeErrorModal = document.getElementById('closeErrorModal');
    closeErrorModal.onclick = () => {
        errorModal.style.display = 'none';
    };
}

// ฟังก์ชัน Validate Inputs
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

    // เงื่อนไขใหม่: ตรวจสอบว่ากรอก End IP หรือไม่
    if (!ipEnd) {
        showErrorModal('Missing End IP Address', 'Please provide a valid IPv4 address for End IP.');
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

    // เงื่อนไขใหม่: ตรวจสอบว่ากรอก Password หรือไม่
    if (!password) {
        showErrorModal('Missing Password', 'Please provide your password to proceed.');
        return false;
    }

    return true; // ข้อมูลทั้งหมดถูกต้อง
}

document.getElementById('scan-button').addEventListener('click', async () => {
    const mode = document.querySelector('input[name="scanMode"]:checked').value;
    const ipStart = mode === 'single'
        ? document.getElementById('ip-single').value.trim()
        : document.getElementById('ip-start').value.trim();
    const ipEnd = mode === 'range'
        ? document.getElementById('ip-end').value.trim()
        : ipStart;
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // เรียกฟังก์ชัน Validate Inputs
    if (!validateInputs(ipStart, ipEnd, username, password)) {
        return; // หยุดการทำงานหาก Validation ไม่ผ่าน
    }

    // แสดง Loading Modal
    const loadingModal = document.getElementById('loadingModal');
    loadingModal.style.display = 'flex';

    try {
        const response = await fetch('/api/login_ssh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode, ip_start: ipStart, ip_end: ipEnd, username, password }),
        });

        if (response.ok) {
            window.location.href = "/dashboard"; // เปลี่ยนหน้าเมื่อสำเร็จ
        } else {
            const result = await response.json();
            showErrorModal('Error', result.error || 'An unknown error occurred.');
        }
    } catch (error) {
        console.error('Error:', error.message);
        showErrorModal('Error', error.message || 'An unexpected error occurred.');
    } finally {
        // ซ่อน Loading Modal
        loadingModal.style.display = 'none';
    }
});

// ตรวจจับการเปลี่ยนโหมด (ใช้ร่วมได้ทั้ง Radio และ Dropdown)
const scanModeInput = document.querySelectorAll('input[name="scanMode"]'); // สำหรับ Radio Button
const scanModeSelect = document.getElementById('scanMode'); // สำหรับ Dropdown

// สำหรับ Radio Button
scanModeInput.forEach(radio => {
    radio.addEventListener('change', () => {
        toggleScanMode(radio.value);
    });
});

// สำหรับ Dropdown
scanModeSelect.addEventListener('change', () => {
    toggleScanMode(scanModeSelect.value);
});

function toggleScanMode(mode) {
    const rangeContainer = document.querySelector('.range-container');
    const singleIpContainer = document.querySelector('.single-ip-container');

    if (mode === 'range') {
        rangeContainer.style.display = 'flex';
        singleIpContainer.style.display = 'none';
    } else if (mode === 'single') {
        rangeContainer.style.display = 'none';
        singleIpContainer.style.display = 'block';
    }
}