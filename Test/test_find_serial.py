# ติดตั้งไลบรารีที่จำเป็นก่อน: `pip install flask pyserial`

from flask import Flask, request, jsonify
import serial
import threading

# กำหนดการเชื่อมต่อ Serial Port
SERIAL_PORT = 'COM3'  # เปลี่ยนตามพอร์ตที่ใช้งานจริง (เช่น COM3 ใน Windows)
BAUD_RATE = 9600

# สร้างแอป Flask
app = Flask(__name__)

# เปิดการเชื่อมต่อ Serial
ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)

# ตัวแปรสำหรับเก็บข้อมูลที่อ่านได้จาก Serial Port
serial_data = ""

# ฟังก์ชันอ่านข้อมูลจาก Serial Port ใน Thread แยก
def read_from_serial():
    global serial_data
    while True:
        if ser.in_waiting > 0:
            line = ser.readline().decode('utf-8').strip()
            serial_data = line

# สร้าง Thread สำหรับอ่านข้อมูลจาก Serial Port
thread = threading.Thread(target=read_from_serial)
thread.daemon = True
thread.start()

# สร้าง API Endpoint สำหรับรับข้อมูลจาก Serial Port
@app.route('/api/get_serial_data', methods=['GET'])
def get_serial_data():
    return jsonify({"serial_data": serial_data})

# สร้าง API Endpoint สำหรับส่งคำสั่งไปยัง Switch ผ่าน Serial Port
@app.route('/api/send_command', methods=['POST'])
def send_command():
    command = request.json.get('command')
    if command:
        ser.write((command + "\r\n").encode('utf-8'))
        return jsonify({"status": "Command sent"})
    else:
        return jsonify({"status": "No command received"}), 400

# เริ่มต้น Flask Server
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
