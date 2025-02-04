document.addEventListener('DOMContentLoaded', () => {
    let port = null;

    // ดึง element ต่าง ๆ จาก DOM
    const serialPortSelect = document.getElementById('serial-port');
    const uploadFileButton = document.getElementById('upload-file');
    const fileInput = document.getElementById('file-input');
    const commandArea = document.getElementById('command-area');
    const deployButton = document.getElementById('deploy-button');
    const speedSelect = document.getElementById('speed');
    const clearSessionButton = document.getElementById('clear-session'); // ✅ เพิ่มปุ่ม Clear Session

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

    // กำหนดค่าเริ่มต้นให้กับ command area
    if (commandArea) {
        commandArea.value = predefinedCommands;
    }

    // ----------------------------------------------------------------------------
    // ฟังก์ชันแสดง / ซ่อน Loading Modal
    // ----------------------------------------------------------------------------
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
            existingModal.style.display = 'flex';
        }
    }

    function hideLoading() {
        let modal = document.getElementById('loading-modal');
        if (modal) modal.remove();
    }

    // ----------------------------------------------------------------------------
    // ฟังก์ชันแสดง Error Modal
    // ----------------------------------------------------------------------------
    function showErrorModal(message) {
        const modal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        const closeErrorButton = document.getElementById('closeErrorModal');

        if (!modal || !errorMessage || !closeErrorButton) {
            console.error('Error modal elements not found in the DOM.');
            return;
        }

        errorMessage.textContent = message;
        modal.style.display = 'flex';

        closeErrorButton.removeEventListener("click", closeModal);
        closeErrorButton.addEventListener("click", closeModal);

        function closeModal() {
            modal.style.display = "none";
        }
    }

    // ----------------------------------------------------------------------------
    // ฟังก์ชันแสดง Modal สำหรับผลลัพธ์ Output
    // ----------------------------------------------------------------------------
    function showModal(output) {
        hideLoading(); // ซ่อน Loading Modal ก่อนแสดง Output Modal

        // หากมี modal output อยู่แล้ว ให้นำออกก่อน
        const existingModal = document.querySelector('.modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalContent = `
            <div class="modal" id="commandModal" style="
                display: flex;
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.5);
                align-items: center; justify-content: center;
                overflow: hidden;
                z-index: 10000;">

                <div class="modal-content" style="
                    background: white;
                    padding: 20px;
                    border-radius: 5px;
                    text-align: center;
                    position: relative;">

                    <span class="close-button" id="closeCommandModal" style="
                        position: absolute;
                        top: 10px;
                        right: 15px;
                        cursor: pointer;
                        font-size: 20px;">&times;</span>

                    <h2 style="font-weight: bold;">Command Output</h2>
                    <pre style="text-align: left;">${output}</pre>
                </div>
            </div>
        `;

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

    // ----------------------------------------------------------------------------
    // ปุ่ม Clear Session
    // ----------------------------------------------------------------------------
    clearSessionButton.addEventListener('click', async () => {
        if (port) {
            try {
                await port.close();
                // เพิ่ม delay เล็กน้อยเพื่อให้แน่ใจว่า port ปิดสมบูรณ์
                await new Promise(resolve => setTimeout(resolve, 100));
                console.log("Port closed successfully.");
                port = null; // ล้างค่า session
            } catch (err) {
                console.error('Error clearing session:', err);
            }
        }
        // รีเซ็ตค่าใน Dropdown ให้กลับเป็นค่าเริ่มต้น
        serialPortSelect.innerHTML = `<option value="" disabled selected>Choose a port</option>`;
        // [เพิ่ม] รีเซ็ตสี background ให้เป็นค่าสี Default
        serialPortSelect.style.backgroundColor = '';

        alert("Session Cleared! Please reconnect.");
    });

    // ----------------------------------------------------------------------------
    // เชื่อมต่อ/ตัดการเชื่อมต่อ Serial Port
    // ----------------------------------------------------------------------------
    serialPortSelect.addEventListener('click', async () => {
        // หากมีการเชื่อมต่ออยู่แล้ว -> disconnect
        if (port) {
            try {
                await port.close();
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (err) {
                console.error('Error closing port:', err);
            }
            port = null;
            serialPortSelect.innerHTML = `<option value="" disabled selected>Choose a port</option>`;
            // [เพิ่ม] เปลี่ยนสี background กลับเป็น Default
            serialPortSelect.style.backgroundColor = '';
            alert("Disconnected from port.");
            return;
        }

        // หากยังไม่เชื่อมต่อ -> requestPort
        try {
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: parseInt(speedSelect.value) });

            // เมื่อเชื่อมต่อสำเร็จ -> อัปเดตสถานะ
            serialPortSelect.innerHTML = '';
            let option = document.createElement("option");
            option.value = "connected";
            option.textContent = "Connected";
            option.selected = true;
            serialPortSelect.appendChild(option);

            // [เพิ่ม] เปลี่ยนสี background เป็นสีเขียว (ปรับ shade ตามต้องการ)
            serialPortSelect.style.backgroundColor = '#009933';

            alert("Connected to port.");
        } catch (err) {
            if (err.name === 'NotFoundError' || err.name === 'AbortError') {
                console.warn("Serial port selection cancelled or not found.");
                return;
            }
            showErrorModal(`Failed to connect to the serial port: ${err.message}`);
        }
    });

    // ----------------------------------------------------------------------------
    // Upload File -> อ่านไฟล์คำสั่งขึ้นมาใส่ใน commandArea
    // ----------------------------------------------------------------------------
    uploadFileButton.addEventListener('click', () => {
        fileInput.click();
    });

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

    // ----------------------------------------------------------------------------
    // Deploy Commands (ผสานโค้ดใหม่ + อ่าน Output แบบโค้ดเก่า)
    // ----------------------------------------------------------------------------
    deployButton.addEventListener('click', async () => {
        if (!port) {
            showErrorModal('Please select a serial port first.');
            return;
        }

        // --- Re-initialize port ตามโค้ดใหม่ ---
        try {
            // ถ้ามีพอร์ตเปิดอยู่ ให้ปิดก่อน
            if (port.readable || port.writable) {
                await port.close();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            // เปิดใหม่
            await port.open({ baudRate: parseInt(speedSelect.value) });
            serialPortSelect.textContent = "Connected";
            serialPortSelect.innerHTML = `<option value="connected" selected>Connected</option>`;

            // [เพิ่ม] เปลี่ยนสี background เป็นสีเขียว หลัง re-init
            serialPortSelect.style.backgroundColor = '#b3ffa3'; 
        } catch (err) {
            if (err.name === 'NotFoundError' || err.name === 'AbortError') {
                console.warn("Reinitialization cancelled or port not found.");
                deployButton.disabled = false;
                return;
            }
            showErrorModal(`Failed to reinitialize serial port: ${err.message}`);
            deployButton.disabled = false;
            return;
        }

        // ป้องกันการกดปุ่ม Deploy ซ้ำ
        deployButton.disabled = true;

        // ตั้ง Timeout 30 วินาที (AbortController)
        const TIMEOUT = 30000;
        const controller = new AbortController();
        const { signal } = controller;
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, TIMEOUT);

        // สร้าง Promise สำหรับ Deploy
        const deployPromise = (async () => {
            showLoading(); // แสดง Loading Modal

            // แยกคำสั่งเป็น Array
            const commands = commandArea.value
                .split('\n')
                .map(cmd => cmd.trim())
                .filter(cmd => cmd);

            if (commands.length === 0) {
                throw new Error('No commands to send.');
            }

            const writer = port.writable.getWriter();
            const encoder = new TextEncoder();
            const reader = port.readable.getReader();
            let output = '';

            try {
                // --- ส่ง \r\n ครั้งแรก เพื่อเคลียร์/ปลุกอุปกรณ์ ---
                await writer.write(encoder.encode('\r\n'));
                await new Promise(resolve => setTimeout(resolve, 100));

                // --- วนส่งแต่ละคำสั่ง (แบบโค้ดเก่า) ---
                for (const command of commands) {
                    if (signal.aborted) {
                        throw new Error('Operation aborted due to timeout.');
                    }

                    // ส่งคำสั่ง
                    await writer.write(encoder.encode(command + '\r\n'));

                    // ดีเลย์เล็กน้อย รอ Echo จากอุปกรณ์
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // อ่าน output ครั้งเดียว (แบบโค้ดเก่า)
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (value) {
                        output += new TextDecoder().decode(value);
                    }
                }
            } finally {
                // ปิด writer/reader เพื่อปล่อย lock
                try {
                    await writer.close();
                } catch (err) {
                    console.error('Error closing writer:', err);
                }
                try {
                    await reader.cancel();
                } catch (err) {
                    console.error('Error cancelling reader:', err);
                }
                writer.releaseLock();
                reader.releaseLock();
            }

            return output;
        })();

        try {
            // รอผลลัพธ์ (race กับ Abort)
            const output = await Promise.race([
                deployPromise,
                new Promise((_, reject) => {
                    signal.addEventListener('abort', () => {
                        reject(new Error('Operation timed out. Please try again.'));
                    });
                })
            ]);

            clearTimeout(timeoutId);
            hideLoading();
            showModal(output);
        } catch (err) {
            hideLoading();
            showErrorModal(`Failed to send commands: ${err.message}`);
        } finally {
            clearTimeout(timeoutId);
            if (port) {
                try {
                    await port.close();
                    // รีเซ็ต dropdown กลับเป็น Choose a port
                    serialPortSelect.innerHTML = `<option value="" disabled selected>Choose a port</option>`;
                    // [เพิ่ม] รีเซ็ตสีเป็น Default เมื่อปิด port
                    serialPortSelect.style.backgroundColor = '';
                } catch (closeErr) {
                    console.error('Error closing port:', closeErr);
                }
                port = null;
            }
            deployButton.disabled = false;
        }
    });
});
