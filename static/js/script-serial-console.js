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

// Populate the serial port dropdown
fetch('/api/ports')
    .then(response => response.json())
    .then(ports => {
        const portSelect = document.getElementById('serial-port');
        ports.forEach(port => {
            const option = document.createElement('option');
            option.value = port;
            option.textContent = port;
            portSelect.appendChild(option);
        });
    })
    .catch(err => console.error(err));

// Pre-fill the textarea with the predefined commands on page load
document.addEventListener('DOMContentLoaded', () => {
    const commandArea = document.getElementById('command-area');
    if (commandArea) {
        commandArea.value = predefinedCommands;
    }
});

// Handle the Upload File button click
document.getElementById('upload-file').addEventListener('click', () => {
    document.getElementById('file-input').click();
});

// Read the uploaded file and display its content in the command area
document.getElementById('file-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const commandArea = document.getElementById('command-area');
        if (commandArea) {
            commandArea.value = e.target.result;
        }
    };

    if (file) {
        reader.readAsText(file);
    }
});

// Handle the Deploy button click
document.getElementById('deploy-button').addEventListener('click', () => {
    const deployButton = document.getElementById('deploy-button');
    deployButton.disabled = true; // ปิดการกดปุ่มซ้ำชั่วคราว

    const port = document.getElementById('serial-port').value;
    const speed = document.getElementById('speed').value;

    // จัดการคำสั่งให้สะอาด
    const commands = document.getElementById('command-area').value
        .split('\n')
        .map(command => command.trim())
        .filter(command => command) // ตัดคำสั่งที่ว่างออก
        .join('\n');

    fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: port, baudrate: parseInt(speed) })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) throw new Error(data.error);

        return fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commands: commands })
        });
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        showModal(data.output.join('\n')); // แสดงผล Output
    })
    .finally(() => {
        deployButton.disabled = false; // เปิดการกดปุ่มอีกครั้งหลังดำเนินการเสร็จ
        return fetch('/api/disconnect', { method: 'POST' });
    })
    .catch(err => alert(`Error: ${err.message}`));
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
