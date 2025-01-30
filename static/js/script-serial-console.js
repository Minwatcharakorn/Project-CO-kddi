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
            const reader = port.readable.getReader(); // อ่านข้อมูลที่ส่งกลับจาก Serial Port
            let output = '';
    
            for (const command of commands) {
                await writer.write(encoder.encode(command + '\r\n')); // เพิ่ม \r\n เพื่อรองรับ Cisco
                await new Promise(resolve => setTimeout(resolve, 500)); // รอให้ Switch ตอบสนอง
    
                // อ่าน output จาก serial
                const { value, done } = await reader.read();
                if (done) break;
                output += new TextDecoder().decode(value);
            }
    
            writer.releaseLock();
            reader.releaseLock();
    
            showModal(output); // แสดงผล output จริงที่ได้จากอุปกรณ์
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
        // Remove any existing modal before adding a new one
        const existingModal = document.querySelector('.modal');
        if (existingModal) {
            existingModal.remove();
        }
    
        const modalContent = `
            <div class="modal" id="commandModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); align-items: center; justify-content: center; overflow: hidden;">
                <div class="modal-content" style="background: white; padding: 20px; border-radius: 5px; text-align: center; position: relative;">
                    <span class="close-button" id="closeCommandModal" style="position: absolute; top: 10px; right: 15px; cursor: pointer; font-size: 20px;">&times;</span>
                    <h2>Command Output</h2>
                    <pre style="text-align: left;">${output}</pre>
                </div>
            </div>`;
    
        // Add the modal to the document
        document.body.insertAdjacentHTML('beforeend', modalContent);
    
        // Get the modal and close button
        const modal = document.getElementById('commandModal');
        const closeButton = document.getElementById('closeCommandModal');
    
        // Close modal when clicking the close button
        closeButton.addEventListener('click', () => {
            modal.remove();
        });
    
        // Close modal when clicking outside the modal content
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    }

});
