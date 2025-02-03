document.addEventListener('DOMContentLoaded', () => {
    let port = null;

    // ดึง element ต่าง ๆ จาก DOM
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

    // กำหนดค่าเริ่มต้นให้กับ command area
    if (commandArea) {
        commandArea.value = predefinedCommands;
    }

    // ฟังก์ชันแสดง Loading Modal (จะสร้างขึ้นแบบไดนามิก หากยังไม่มีใน DOM)
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

    // ฟังก์ชันซ่อน Loading Modal
    function hideLoading() {
        let modal = document.getElementById('loading-modal');
        if (modal) modal.remove();
    }

    // Event listener สำหรับการเชื่อมต่อ/ตัดการเชื่อมต่อ Serial Port
    serialPortSelect.addEventListener('click', async () => {
        // หากมีการเชื่อมต่ออยู่แล้ว ให้ทำการ disconnect
        if (port) {
            try {
                await port.close();
            } catch (err) {
                console.error('Error closing port:', err);
            }
            port = null; // clear session
            serialPortSelect.innerHTML = `<option value="" disabled selected>Choose a port</option>`; // ✅ อัปเดต dropdown ให้กลับเป็นค่าเดิม
            alert("Disconnected from port.");
            return;
        }

        // กรณียังไม่ได้เชื่อมต่อ ให้เลือกและเชื่อมต่อ Serial Port
        try {
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: parseInt(speedSelect.value) });

            // เมื่อเชื่อมต่อสำเร็จ ให้แสดงสถานะ "Connected"
            serialPortSelect.innerHTML = '';

            // ✅ เพิ่มตัวเลือกใหม่เป็น "Connected"
            let option = document.createElement("option");
            option.value = "connected";
            option.textContent = "Connected";
            option.selected = true;
            serialPortSelect.appendChild(option);


            alert("Connected to port.");
        } catch (err) {
            showErrorModal(`Failed to connect to the serial port: No serial port detected or connection issue encountered.`);
        }
    });

    // Event listener สำหรับการอัปโหลดไฟล์คำสั่ง
    uploadFileButton.addEventListener('click', () => {
        fileInput.click();
    });

    // อ่านไฟล์ที่ถูกอัปโหลดและแสดงใน command area
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

    // Event listener สำหรับ Deploy คำสั่ง (รวม timeout และ abort handling)
    deployButton.addEventListener('click', async () => {
        if (!port) {
            showErrorModal('Please select a serial port first.');
            return;
        }
        
        // ***** เพิ่มส่วน re‑initialize serial port โดยไม่ตัดโค้ดส่วนใดออก *****
        try {
            await port.close();  // ปิด port ที่มีอยู่เพื่อเคลียร์ session เก่า
            await port.open({ baudRate: parseInt(speedSelect.value) });  // เปิด port ใหม่
            serialPortSelect.textContent = "Connected"; // อัปเดตสถานะใน dropdown
            serialPortSelect.innerHTML = `<option value="connected" selected>Connected</option>`;
        } catch (err) {
            showErrorModal(`Failed to reinitialize serial port: ${err.message}`);
            deployButton.disabled = false;
            return;
        }
        // ***** สิ้นสุดส่วน re‑initialize serial port *****

        // ป้องกันการกดปุ่ม Deploy หลายครั้ง
        deployButton.disabled = true;

        // กำหนดเวลา timeout (30 วินาที)
        const TIMEOUT = 30000; // 30,000 มิลลิวินาที = 30 วินาที

        // สร้าง AbortController เพื่อจัดการการยกเลิกเมื่อ timeout เกิดขึ้น
        const controller = new AbortController();
        const { signal } = controller;

        // ตั้ง timeout ให้ abort operation เมื่อเกินเวลา
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, TIMEOUT);

        // Promise สำหรับ deploy คำสั่ง
        const deployPromise = (async () => {
            showLoading(); // แสดง Loading Modal เมื่อเริ่ม deploy

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
                for (const command of commands) {
                    if (signal.aborted) {
                        throw new Error('Operation aborted due to timeout.');
                    }

                    // ส่งคำสั่งผ่าน serial port
                    await writer.write(encoder.encode(command + '\r\n'));
                    // รอเล็กน้อยเพื่อให้คำสั่งถูกส่งออกไป
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // อ่าน output ที่ตอบกลับมาจากอุปกรณ์ (ถ้ามี)
                    const { value, done } = await reader.read();
                    if (done) break;
                    output += new TextDecoder().decode(value);
                }
            } finally {
                // ปิด writer และ reader เพื่อปล่อย lock
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
            // รอผลลัพธ์จาก deployPromise หรือ timeout
            const output = await Promise.race([
                deployPromise,
                new Promise((_, reject) => {
                    signal.addEventListener('abort', () => {
                        reject(new Error('Operation timed out. Please try again.'));
                    });
                })
            ]);

            clearTimeout(timeoutId); // ล้าง timeout หาก deploy สำเร็จ
            hideLoading(); // ซ่อน Loading Modal
            showModal(output); // แสดงผลลัพธ์ของคำสั่งใน Modal
        } catch (err) {
            hideLoading(); // ซ่อน Loading Modal ในกรณีเกิดข้อผิดพลาด
            showErrorModal(`Failed to send commands: ${err.message}`);
        } finally {
            clearTimeout(timeoutId);
            if (port) {
                try {
                    await port.close(); // ปิด serial port เมื่อสิ้นสุด operation
                } catch (closeErr) {
                    console.error('Error closing port:', closeErr);
                }
                port = null;
            }
            deployButton.disabled = false; // เปิดใช้งานปุ่ม Deploy อีกครั้ง
        }
    });

    // ฟังก์ชันแสดง Error Modal
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

        // ตรวจสอบและเพิ่ม event listener สำหรับปุ่มปิด modal
        closeErrorButton.removeEventListener("click", closeModal);
        closeErrorButton.addEventListener("click", closeModal);

        function closeModal() {
            modal.style.display = "none";
        }
    }

    // ฟังก์ชันแสดง Modal สำหรับแสดงผล Output ของคำสั่ง
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
});
