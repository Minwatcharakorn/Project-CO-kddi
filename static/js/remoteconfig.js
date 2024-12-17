document.getElementById('apply-button').addEventListener('click', async function() {
    const selectedDevices = [];
    const checkboxes = document.querySelectorAll('.device-checkbox:checked');
    const command = document.getElementById('command-select').value;

    checkboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        const ip = row.cells[4].innerText; // Retrieve IP column
        selectedDevices.push({ ip: ip });
    });

    if (selectedDevices.length > 0) {
        try {
            const response = await fetch('/api/remote_send_command', { // New Endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ devices: selectedDevices, command: command })
            });

            const result = await response.json();
            console.log(result);
            alert('Command applied successfully! Check console for details.');
        } catch (error) {
            console.error('Error applying command:', error);
            alert('Error applying command.');
        }
    } else {
        alert('Please select at least one device.');
    }
});