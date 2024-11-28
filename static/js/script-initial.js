document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const ipStart = document.getElementById('ip-start').value.trim();
    const ipEnd = document.getElementById('ip-end').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const subnet = document.getElementById('subnet-mask').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ipStart, ipEnd, username, password, subnet }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('SSH Login successful!');
            console.log(data.message);
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
});
