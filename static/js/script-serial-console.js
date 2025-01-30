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

    // ฟังก์ชันแสดง Loading Modal
    function showLoading() {
        let existingModal = document.getElementById('loading-modal');
        if (!existingModal) {
            const modal = document.createElement('div');
            modal.id = 'loading-modal';
            modal.innerHTML = `
                <div class="loading-overlay" style="
                    position: fixed; 
                    top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0, 0, 0, 0.5);
                    display: flex; align-items: center; justify-content: center; 
                    z-index: 9999;">
                    
                    <div class="loading-box" style="
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        text-align: center;
                        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        width: 50%;
                        max-width: 200px;
                        min-height: 170px;">
                        
                        <div class="loading-spinner" style="
                            width: 100px;
                            height: 100px;
                            border: 6px solid #f3f3f3;
                            border-top: 6px solid #3498db;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;"></div>
                        
                        <p style="
                            color: black;
                            margin-top: 15px;
                            font-size: 18px;
                            ">Loading</p>
                    </div>
                </div>
    
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(modal);
        } else {
            existingModal.style.display = 'flex'; // ทำให้ modal ปรากฏถ้ามีอยู่แล้ว
        }
    }

    // ฟังก์ชันซ่อน Loading Modal
    function hideLoading() {
        let modal = document.getElementById('loading-modal');
        if (modal) modal.remove();
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
            showLoading(); // ✅ แสดง Loading Modal ทันทีหลังจากกด Deploy

            const commands = commandArea.value.split('\n').map(cmd => cmd.trim()).filter(cmd => cmd);
            if (commands.length === 0) {
                showErrorModal('No commands to send.');
                return;
            }
    
            const writer = port.writable.getWriter();
            const encoder = new TextEncoder();
            const reader = port.readable.getReader();
            let output = '';
    
            for (const command of commands) {
                await writer.write(encoder.encode(command + '\r\n'));
                await new Promise(resolve => setTimeout(resolve, 500));

                const { value, done } = await reader.read();
                if (done) break;
                output += new TextDecoder().decode(value);
            }
    
            writer.releaseLock();
            reader.releaseLock();

            hideLoading(); // ✅ ปิด Loading Modal ก่อนแสดง Output
            showModal(output); // ✅ แสดงผล output จริงที่ได้จากอุปกรณ์

        } catch (err) {
            hideLoading(); // ✅ ปิด Loading Modal ถ้ามีข้อผิดพลาด
            showErrorModal(`Failed to send commands: ${err.message}`);
        } finally {
            if (port) {
                await port.close();
            }
        }
    });

    // Function to show an error modal
    function showErrorModal(message) {
        const modal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        const closeErrorButton = document.getElementById('closeErrorModal');
    
        errorMessage.textContent = message;
        modal.style.display = 'flex';
    
        // ตรวจสอบว่ามี Event Listener แล้วหรือยัง ถ้าไม่มีให้เพิ่ม
        if (closeErrorButton) {
            closeErrorButton.removeEventListener("click", closeModal);
            closeErrorButton.addEventListener("click", closeModal);
        }
    
        function closeModal() {
            modal.style.display = "none";
        }
    }

    // Function to show a command output modal
    function showModal(output) {
        hideLoading(); // ✅ ปิด Loading Modal ก่อนแสดง Output Modal

        const existingModal = document.querySelector('.modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalContent = `
            <div class="modal" id="commandModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); align-items: center; justify-content: center; overflow: hidden; z-index: 10000;">
                <div class="modal-content" style="background: white; padding: 20px; border-radius: 5px; text-align: center; position: relative;">
                    <span class="close-button" id="closeCommandModal" style="position: absolute; top: 10px; right: 15px; cursor: pointer; font-size: 20px;">&times;</span>
                    <h2 style="font-weight: bold;">Command Output</h2>
                    <pre style="text-align: left;">${output}</pre>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', modalContent);

        const modal = document.getElementById('commandModal');
        const closeButton = document.getElementById('closeCommandModal');

        closeButton.addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    }
});
