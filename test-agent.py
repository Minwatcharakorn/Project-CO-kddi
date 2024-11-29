from flask import Flask, request, jsonify
import os
import platform

app = Flask(__name__)

# ฟังก์ชันสำหรับสแกนอุปกรณ์ในเครือข่าย
def scan_network(ip_range_start, ip_range_end):
    ip_base = '.'.join(ip_range_start.split('.')[:3])
    start = int(ip_range_start.split('.')[-1])
    end = int(ip_range_end.split('.')[-1])
    devices = []
    for i in range(start, end + 1):
        ip = f"{ip_base}.{i}"
        if platform.system().lower() == "windows":
            response = os.system(f"ping -n 1 -w 500 {ip} >nul 2>&1")
        else:
            response = os.system(f"ping -c 1 -W 1 {ip} > /dev/null 2>&1")
        
        if response == 0:
            devices.append({'ip': ip, 'status': 'online'})
    return devices

@app.route('/scan', methods=['POST'])
def scan():
    data = request.json
    ip_range_start = data.get('ip_range_start')
    ip_range_end = data.get('ip_range_end')
    devices = scan_network(ip_range_start, ip_range_end)
    return jsonify(devices)

@app.route('/run_command', methods=['POST'])
def run_command():
    data = request.json
    command = data.get('command')
    # รันคำสั่งในอุปกรณ์ที่ระบุ (สามารถเพิ่ม SSH เพื่อเชื่อมต่อกับ switch)
    # ตัวอย่างนี้จะรันคำสั่งในเครื่องที่ติดตั้ง agent เท่านั้น
    response = os.popen(command).read()
    return jsonify({"output": response})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
