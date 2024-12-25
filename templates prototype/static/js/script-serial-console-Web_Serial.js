let port; // Global variable for the selected port
let writer;
let isConnected = false;

// Predefined commands
const predefinedCommands = `enable
conf t
    hostname Switch4
    ip domain-name example.com
    crypto key generate rsa
    1024
    ip ssh version 2
    username admin privilege 15 secret password123
    line vty 0 15
        login local
        transport input ssh
        exit
    interface vlan 1
        ip address 192.168.100.115 255.255.255.0
        no shutdown
end
write memory`;

// Pre-fill the textarea with predefined commands on page load
document.addEventListener('DOMContentLoaded', () => {
    const commandArea = document.getElementById('command-area');
    if (commandArea) {
        commandArea.value = predefinedCommands;
    }
    loadSerialPorts(); // Load ports on page load
});

// Load available serial ports into the dropdown
async function loadSerialPorts() {
    const portSelect = document.getElementById('serial-port');
    portSelect.innerHTML = '<option value="" disabled selected>Choose a port</option>';

    try {
        const ports = await navigator.serial.getPorts();

        if (ports.length === 0) {
            alert('No available ports found. Please connect a device.');
            return;
        }

        ports.forEach((p, index) => {
            const option = document.createElement('option');
            option.value = index; // Assign index to identify the port
            option.textContent = `Port ${index + 1}`;
            portSelect.appendChild(option);
        });
    } catch (err) {
        alert(`Error loading ports: ${err.message}`);
    }
}

// Monitor for port connection or disconnection events
navigator.serial.addEventListener('connect', loadSerialPorts);
navigator.serial.addEventListener('disconnect', loadSerialPorts);

// Handle the Deploy button click
document.getElementById('deploy-button').addEventListener('click', async () => {
    if (!isConnected) {
        const portSelect = document.getElementById('serial-port');
        const selectedPortIndex = portSelect.value;

        if (!selectedPortIndex) {
            alert('Please select a port.');
            return;
        }

        const ports = await navigator.serial.getPorts();
        port = ports[selectedPortIndex];

        const speed = parseInt(document.getElementById('speed').value);
        await port.open({ baudRate: speed });
        writer = port.writable.getWriter();
        isConnected = true;
    }

    const commands = document.getElementById('command-area').value
        .split('\n')
        .map(command => command.trim())
        .filter(command => command) // Remove empty commands
        .join('\n');

    try {
        for (const command of commands.split('\n')) {
            await writer.write(new TextEncoder().encode(command + '\r')); // Write command to the serial port
        }
        alert('Commands deployed successfully!');
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
});

// ฟังก์ชันสำหรับแสดง Modal
function showModal(output) {
    const modalContent = `
        <div class="modal">
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>Command Output</h2>
                <pre>${output}</pre>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalContent);

    const modal = document.querySelector('.modal');
    const closeButton = modal.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        modal.remove();
    });
}
