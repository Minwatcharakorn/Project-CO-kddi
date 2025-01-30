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
configure terminal
hostname SW-Lab_product
ip domain name example.com
crypto key generate rsa
1024
ip ssh version 2
username admin privilege 15 secret password123
line vty 0 15
login local
transport input ssh
exit
snmp-server community public RW
interface vlan 1
ip address 192.168.99.115 255.255.255.0
no shutdown
end
copy running-config startup-config`;

    if (commandArea) {
        commandArea.value = predefinedCommands;
    }

    // Event listener to connect to serial port
    serialPortSelect.addEventListener('click', async () => {
        try {
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: parseInt(speedSelect.value) });
            alert(`Connected to port: ${port.getInfo().usbVendorId || 'Unknown Vendor'}, ${port.getInfo().usbProductId || 'Unknown Product'}`);
        } catch (err) {
            showErrorModal(`Failed to connect to the serial port: No serial port detected or connection issue encountered.`);
        }
    });

    // Event listener for uploading a file
    uploadFileButton.addEventListener('click', () => {
        fileInput.click();
    });

    // Event listener for file input
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

    // Event listener for deploying commands
    deployButton.addEventListener('click', async () => {
        if (!port) {
            showErrorModal('Please select a serial port first.');
            return;
        }

        try {
            const commands = commandArea.value.split('\n').map(cmd => cmd.trim()).filter(cmd => cmd);
            if (commands.length === 0) {
                showErrorModal('No commands to send.');
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
            showErrorModal(`Failed to send commands: ${err.message}`);
        } finally {
            if (port) {
                await port.close();
            }
        }
    });

    // Function to close the success modal
    function closeSuccessModal() {
        document.getElementById('successModal').style.display = 'none';
    }

    // Function to show an error modal
    function showErrorModal(message) {
        const modal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        modal.style.display = 'flex';
    }

    // Function to close the error modal
    function closeErrorModal() {
        document.getElementById('errorModal').style.display = 'none';
    }

    // เพิ่ม Event Listener สำหรับปุ่มปิดโมดัล
    document.getElementById('closeErrorModal').addEventListener('click', closeErrorModal);

    // Function to show a command output modal
    function showModal(output) {
        const modalContent = `
            <div class="modal">
                <div class="modal-content">
                    <span class="close-button">&times;</span>
                    <h2>Command Output</h2>
                    <pre>${output}</pre>
                </div>
            </div>`;
        
        // Add the modal to the document
        document.body.insertAdjacentHTML('beforeend', modalContent);

        const modal = document.querySelector('.modal');
        const closeButton = modal.querySelector('.close-button');

        // Add click event listener to close the modal
        closeButton.addEventListener('click', () => {
            modal.remove();
        });

        // Optional: Close the modal when clicking outside of the modal content
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    }
});
