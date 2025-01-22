document.addEventListener('DOMContentLoaded', () => {
    let port = null;

    const serialPortSelect = document.getElementById('serial-port');
    const uploadFileButton = document.getElementById('upload-file');
    const fileInput = document.getElementById('file-input');
    const commandArea = document.getElementById('command-area');
    const deployButton = document.getElementById('deploy-button');
    const speedSelect = document.getElementById('speed');

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

    // Pre-fill the textarea with the predefined commands on page load
    if (commandArea) {
        commandArea.value = predefinedCommands;
    }

    // Handle the Select Port button click
    serialPortSelect.addEventListener('click', async () => {
        try {
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: parseInt(speedSelect.value) });
            alert(`Connected to port: ${port.getInfo().usbVendorId || 'Unknown Vendor'}, ${port.getInfo().usbProductId || 'Unknown Product'}`);
        } catch (err) {
            console.error('Error connecting to port:', err);
            alert('Failed to connect to port: ' + err.message);
        }
    });

    // Upload File button functionality
    uploadFileButton.addEventListener('click', () => {
        fileInput.click();
    });

    // Load file content into the command area
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                commandArea.value = e.target.result;
            };
            reader.readAsText(file);
        }
    });

    // Deploy commands
    deployButton.addEventListener('click', async () => {
        if (!port) {
            alert('Please select a serial port first.');
            return;
        }

        try {
            const commands = commandArea.value.split('\n').map(cmd => cmd.trim()).filter(cmd => cmd);
            if (commands.length === 0) {
                alert('No commands to send.');
                return;
            }

            const writer = port.writable.getWriter();
            const encoder = new TextEncoder();

            for (const command of commands) {
                await writer.write(encoder.encode(command + '\n'));
            }

            writer.releaseLock();
            showModal('Commands sent successfully:\n' + commands.join('\n'));
        } catch (err) {
            console.error('Error sending commands:', err);
            alert('Failed to send commands: ' + err.message);
        } finally {
            if (port) {
                await port.close();
                alert('Port closed.');
            }
        }
    });

    // Function to show modal
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
});
