const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.classList.toggle('fa-eye-slash');
    togglePassword.classList.toggle('fa-eye');
});

// Handle IP and Subnet Mask Combination
const form = document.getElementById('login-form');
const ipInput = document.getElementById('ip-address');
const subnetSelect = document.getElementById('subnet-mask');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ip = ipInput.value;
    const subnet = subnetSelect.value;

    if (!ip || !subnet) {
        alert('Please fill out the IP address and select a subnet mask.');
        return;
    }

    const fullAddress = `${ip}${subnet}`;
    console.log('Full Address:', fullAddress);
    // Add form submission or further processing here
});
