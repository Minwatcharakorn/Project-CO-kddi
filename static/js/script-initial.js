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

// ฟังก์ชันตรวจสอบ IPv4 Address
function isValidIPv4(ip) {
    const ipv4Regex = /^(25[0-5]|2[0-4]\d|[0-1]?\d?\d)\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)$/;
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

/**
 * ฟังก์ชัน Validate Inputs
 *   - ถ้าโหมด range → ต้องตรวจทั้ง Start IP และ End IP
 *   - ถ้าโหมด single → ตรวจเฉพาะ IP Start
 */
function validateInputs(ipStart, ipEnd, username, password, mode) {
    // ตรวจ Username
    if (!username) {
        showErrorModal('Missing Username', 'Please provide your username to proceed.');
        return false;
    }
    // ตรวจ Password
    if (!password) {
        showErrorModal('Missing Password', 'Please provide your password to proceed.');
        return false;
    }

    // ตรวจสอบโหมด
    if (mode === 'range') {
        // ตรวจสอบว่ามี Start/End IP ครบไหม
        if (!ipStart || !ipEnd) {
            showErrorModal(
                'Missing IP Address',
                'Please provide both Start IP and End IP addresses.'
            );
            return false;
        }
        // ตรวจสอบรูปแบบ IP
        if (!isValidIPv4(ipStart)) {
            showErrorModal('Invalid Start IP Address', 'Please enter a valid IPv4 address for Start IP.');
            return false;
        }
        if (!isValidIPv4(ipEnd)) {
            showErrorModal('Invalid End IP Address', 'Please enter a valid IPv4 address for End IP.');
            return false;
        }
    } else if (mode === 'single') {
        // ตรวจเฉพาะ ipStart (จะใส่ในตัวเดียวกัน)
        if (!ipStart) {
            showErrorModal('Missing IP Address', 'Please provide an IP address.');
            return false;
        }
        if (!isValidIPv4(ipStart)) {
            showErrorModal('Invalid IP Address', 'Please enter a valid IPv4 address.');
            return false;
        }
    }

    return true; // ถ้าผ่านทุกเงื่อนไข
}

// ดัก event เมื่อกดปุ่ม Scan
document.getElementById('scan-button').addEventListener('click', async () => {
    // อ่านค่าโหมดจาก radio
    const mode = document.querySelector('input[name="scanMode"]:checked').value;

    // ถ้าโหมด single → ใช้ ip-single เป็น ipStart
    // ถ้าโหมด range → ใช้ ip-start และ ip-end
    const ipStart = (mode === 'single')
        ? document.getElementById('ip-single').value.trim()
        : document.getElementById('ip-start').value.trim();
    // end IP ถ้าเป็น range → ใช้ ip-end
    // ถ้า single → ipEnd = ipStart (ส่งไปเป็นค่าเดียวกันก็ได้ หรือจะส่ง '' ก็ได้)
    const ipEnd = (mode === 'range')
        ? document.getElementById('ip-end').value.trim()
        : ipStart;

    // Username, Password
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validate
    if (!validateInputs(ipStart, ipEnd, username, password, mode)) {
        return; // ถ้าผิดพลาด ไม่ทำต่อ
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
            // ถ้าสำเร็จให้ redirect ไปหน้า dashboard
            window.location.href = "/dashboard";
        } else {
            // ถ้า error แสดง modal
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

// === Toggle Scan Mode by Radio (range/single) ===
const scanModeRadios = document.querySelectorAll('input[name="scanMode"]');
scanModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        toggleScanMode(radio.value);
    });
});

function toggleScanMode(mode) {
    const rangeContainer = document.querySelector('.range-container');
    const singleIpContainer = document.querySelector('.single-ip-container');

    if (mode === 'range') {
        rangeContainer.style.display = 'flex';
        singleIpContainer.style.display = 'none';
    } else if (mode === 'single') {
        rangeContainer.style.display = 'none';
        singleIpContainer.style.display = 'flex';
    }
}

let enterPressed = false;

document.getElementById('scan-form').addEventListener('keydown', function(event) {
    // ตรวจสอบว่ากด Enter หรือไม่
    if (event.key === "Enter") {
        event.preventDefault();  // ป้องกันการ submit form โดยอัตโนมัติ

        // หากยังไม่ได้กด Enter มาก่อน ให้ทำการคลิกปุ่ม Scan
        if (!enterPressed) {
            enterPressed = true;
            document.getElementById('scan-button').click();
        }
        // ถ้ากด Enter ซ้ำหลังจาก flag ถูกเซ็ตแล้ว จะไม่เกิดอะไรขึ้น
    }
});