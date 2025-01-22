from flask import Flask, request, render_template, jsonify
import os
import paramiko
import time
import logging

app = Flask(__name__)

# ตั้งค่าโฟลเดอร์ที่เก็บไฟล์ firmware บน TFTP
UPLOAD_FOLDER = '/var/lib/tftpboot'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

##################################################
# ฟังก์ชันช่วยอ่าน output จาก Shell (Paramiko)
##################################################
def read_output(shell, timeout=5):
    """
    อ่าน output จาก channel (shell) ภายในเวลา timeout วินาที
    ในขณะเดียวกันก็ sleep(.1) เป็นระยะ เพื่อไม่ให้ loop แน่นเกินไป
    """
    output = ""
    start_time = time.time()
    while time.time() - start_time < timeout:
        while shell.recv_ready():
            output += shell.recv(2048).decode('utf-8', errors='ignore')
        time.sleep(0.1)
    return output


##################################################
# ฟังก์ชันที่ใช้ SSH/Paramiko เพื่อสั่งอัปเดต firmware
##################################################
def update_switch_firmware(ip, username, password, tftp_server_ip, filename):
    """
    1) SSH ไปยัง Switch (ip)
    2) copy tftp://{tftp_server_ip}/{filename} bootflash:
    3) ตั้ง boot system flash: <filename>
    4) write memory
    5) reload
    """
    try:
        logging.info(f"Connecting to {ip}")

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        # ต่อ SSH
        ssh.connect(ip, username=username, password=password, look_for_keys=False)

        shell = ssh.invoke_shell()
        shell.send("terminal length 0\n")
        time.sleep(1)

        # 1) Copy firmware (.bin) จาก TFTP มายัง bootflash:
        shell.send(f"copy tftp://{tftp_server_ip}/{filename} bootflash:\n")
        time.sleep(2)
        output = read_output(shell)
        logging.info(output)

        # 2) Handle prompts ระหว่าง copy
        while True:
            # ถ้าเจอ destination filename?
            if "Destination filename" in output:
                # Enter เพื่อเลือกชื่อเดิม
                shell.send("\n")
            elif "over write?" in output.lower():
                # ถ้ามีถาม overwrite ไหม
                shell.send("yes\n")
            elif "confirm" in output.lower():
                # บาง prompt เป็น confirm
                shell.send("yes\n")
            elif "#" in output:
                # เจอ prompt "#" แสดงว่า copy เสร็จ
                break

            time.sleep(1)
            output = read_output(shell)
            logging.info(output)

        # 3) ตั้งค่า boot system
        shell.send("configure terminal\n")
        time.sleep(1)
        output = read_output(shell)
        logging.info(output)

        # ลบค่าบูตเดิม
        shell.send("no boot system\n")
        time.sleep(1)

        # ตั้งบูตใหม่
        shell.send(f"boot system flash:{filename}\n")
        time.sleep(1)

        # ออกจาก config
        shell.send("exit\n")
        time.sleep(1)
        output = read_output(shell)
        logging.info(output)

        # 4) Save Config
        shell.send("write memory\n")
        time.sleep(2)
        output = read_output(shell)
        logging.info(output)

        # 5) Reload Device
        shell.send("reload\n")
        time.sleep(1)
        output = read_output(shell)
        logging.info(output)

        # ตอบ confirm reload
        if "confirm" in output.lower() or "reload proceed" in output.lower():
            shell.send("yes\n")
            time.sleep(2)
            output = read_output(shell)
            logging.info(output)

        shell.close()
        ssh.close()

        return "Firmware updated and device reloaded successfully."

    except Exception as e:
        logging.error(f"Error updating firmware on {ip}: {e}")
        return f"Error: {str(e)}"


##################################################
# Routing หลักของ Flask
##################################################

@app.route('/')
def index():
    """
    แสดงหน้าเว็บหลัก พร้อมรายการไฟล์ใน /var/lib/tftpboot
    """
    files = os.listdir(UPLOAD_FOLDER)
    return render_template('update_firmware.html', files=files)

@app.route('/automate_update', methods=['POST'])
def automate_update():
    """
    รับข้อมูลจาก form: tftp_server_ip, filename, devices, username, password
    แล้วสั่ง update_switch_firmware() ให้ทีละ device
    """
    tftp_server_ip = request.form.get('tftp_server_ip')
    filename = request.form.get('filename')
    devices = request.form.get('devices', '').split(',')
    username = request.form.get('username')
    password = request.form.get('password')

    # ตรวจสอบว่าไฟล์ TFTP มีจริงหรือไม่
    if not os.path.exists(os.path.join(UPLOAD_FOLDER, filename)):
        return jsonify({'error': f'File {filename} does not exist on TFTP server.'}), 400

    logs = {}
    for device_ip in devices:
        device_ip = device_ip.strip()
        device_logs = []
        try:
            device_logs.append(f"Connecting to {device_ip}...")
            result = update_switch_firmware(device_ip, username, password, tftp_server_ip, filename)
            device_logs.append(result)
        except Exception as e:
            device_logs.append(f"Error: {str(e)}")
        logs[device_ip] = device_logs

    return jsonify({'results': logs})


@app.route('/delete_firmware', methods=['POST'])
def delete_firmware():
    """
    ลบไฟล์บน TFTP
    """
    filename = request.form.get('filename')
    if not filename:
        return jsonify({'error': 'No file specified'}), 400

    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return jsonify({'message': f'Firmware {filename} deleted successfully.'})
    else:
        return jsonify({'error': f'File {filename} does not exist.'}), 404


@app.route('/upload_firmware', methods=['POST'])
def upload_firmware():
    """
    อัปโหลดไฟล์ firmware เข้า /var/lib/tftpboot
    """
    if 'firmware_file' not in request.files:
        return jsonify({'error': 'No firmware_file in request'}), 400

    file_obj = request.files['firmware_file']
    filename = file_obj.filename

    if not filename:
        return jsonify({'error': 'Empty filename'}), 400

    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file_obj.save(save_path)
    return jsonify({'message': f'File {filename} uploaded successfully.'})


if __name__ == '__main__':
    # สำหรับทดสอบแบบ Development
    # หากขึ้น production แนะนำรันผ่าน gunicorn/uwsgi + nginx
    app.run(host='0.0.0.0', port=5000, debug=True)
