from flask import Flask, request, jsonify, render_template
import serial
import serial.tools.list_ports
import platform
import os
from pysnmp.hlapi.v3arch.asyncio import *
import asyncio

app = Flask(__name__)

# Global serial connection
serial_connection = None

switches = []  # List to store scanned devices

def get_available_ports():
    """Get a list of available serial ports."""
    ports = serial.tools.list_ports.comports()
    return [port.device for port in ports]

async def get_snmp_info(ip, community='public'):
    """Retrieve SNMP information from the device using asyncio."""
    oid_hostname = '1.3.6.1.2.1.1.5.0'  # OID for Hostname
    oid_model = '1.3.6.1.2.1.1.1.0'     # OID for Model (sysDescr)
    oid_serial = '1.3.6.1.2.1.47.1.1.1.1.11.1'  # OID for Serial Number

    info = {"hostname": "N/A", "model": "N/A", "serial": "N/A"}

    try:
        for oid, key in [(oid_hostname, "hostname"), (oid_model, "model"), (oid_serial, "serial")]:
            # ใช้ get แบบ asynchronous
            result = await get_cmd(
                SnmpEngine(),
                CommunityData(community),
                await UdpTransportTarget.create((ip, 161)),  # Asynchronous Transport Target
                ContextData(),
                ObjectType(ObjectIdentity(oid))  # OID สำหรับข้อมูลที่ต้องการ
            )

            errorIndication, errorStatus, errorIndex, varBinds = result

            if errorIndication:
                print(f"Error Indication for {oid}: {errorIndication}")
                continue
            if errorStatus:
                print(f"Error Status for {oid}: {errorStatus.prettyPrint()} at {errorIndex}")
                continue

            # ดึงค่าจาก SNMP Response
            for varBind in varBinds:
                info[key] = str(varBind[1])
                print(f"Received {key}: {varBind}")
    except Exception as e:
        print(f"SNMP error for {ip}: {e}")

    return info
    

# Function to scan for devices in the given IP range
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
            devices.append({'ip': ip, 'mac': 'N/A'})
            print(f"Device found: {ip}")
        else:
            print(f"No response from {ip}")
    return devices


async def update_switches(ip_range_start, ip_range_end):
    """Update the global list of switches based on scan and SNMP results."""
    devices = scan_network(ip_range_start, ip_range_end)
    switches.clear()

    for device in devices:
        ip = device['ip']
        # เรียกใช้ get_snmp_info เพื่อดึงข้อมูล SNMP
        snmp_info = await get_snmp_info(ip)

        switches.append({
            "model": snmp_info.get("model", "Unknown"),
            "serial": snmp_info.get("serial", "Unknown"),
            "hostname": snmp_info.get("hostname", "Unknown"),
            "ip": ip,
            "status": "Detected"
        })

def get_available_ports():
    """Get a list of available serial ports."""
    ports = serial.tools.list_ports.comports()
    return [port.device for port in ports]

@app.route('/')
def index():
    """Serve the Serial Console page."""
    return render_template('serial-console.html')

@app.route('/initial')
def initial_page():
    """Serve the SSH Login page."""
    return render_template('Initial.html')

@app.route('/dashboard')
def dashboard_page():
    """Serve the Dashboard page."""
    return render_template('Dashboard.html',switches=switches)

@app.route('/api/ports', methods=['GET'])
def list_ports():
    """API to list available serial ports."""
    try:
        ports = get_available_ports()
        return jsonify(ports), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/connect', methods=['POST'])
def connect_serial():
    """API to connect to a serial port."""
    global serial_connection
    data = request.json
    port = data.get('port')
    baudrate = data.get('baudrate', 9600)

    if not port:
        return jsonify({"error": "Serial port is required"}), 400

    try:
        serial_connection = serial.Serial(port, baudrate, timeout=1)
        return jsonify({"message": f"Connected to {port} at {baudrate} baud."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/send', methods=['POST'])
def send_commands():
    """API to send commands to the serial device."""
    global serial_connection
    data = request.json
    commands = data.get('commands', '')

    if serial_connection and serial_connection.is_open:
        try:
            output = []
            for command in commands.split('\n'):
                command = command.strip()
                if command:
                    serial_connection.write(command.encode('utf-8') + b'\n')
                    response = serial_connection.read_until(b'#').decode('utf-8')
                    output.append(response)
            return jsonify({"message": "Commands sent successfully.", "output": output}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Serial connection is not established."}), 400

@app.route('/api/disconnect', methods=['POST'])
def disconnect_serial():
    """API to disconnect the serial connection."""
    global serial_connection
    if serial_connection and serial_connection.is_open:
        serial_connection.close()
        serial_connection = None
        return jsonify({"message": "Disconnected successfully."}), 200
    return jsonify({"error": "No active serial connection."}), 400

# @app.route('/api/login', methods=['POST'])
# def login_ssh():
#     """API to handle SSH login."""
#     data = request.json
#     ip_start = data.get('ipStart')
#     ip_end = data.get('ipEnd')
#     username = data.get('username')
#     password = data.get('password')
#     subnet = data.get('subnet')

#     if not all([ip_start, ip_end, username, password, subnet]):
#         return jsonify({"error": "Missing required fields."}), 400

#     # Debugging logs
#     print(f"Login attempt: IP Range: {ip_start} - {ip_end}, Subnet: {subnet}, Username: {username}")

#     # Placeholder for validation:
#     if username == "kddi" and password == "Kddi@min!":
#         return jsonify({"message": "SSH login successful."}), 200
#     else:
#         return jsonify({"error": "Invalid credentials."}), 401

@app.route('/api/scan', methods=['POST'])
async def api_scan():
    """API endpoint for scanning the network."""
    data = request.json
    ip_start = data.get('ip_start')
    ip_end = data.get('ip_end')

    if not ip_start or not ip_end:
        return jsonify({"error": "Both start and end IP addresses are required."}), 400

    try:
        await update_switches(ip_start, ip_end)  # เรียกใช้ update_switches แบบ async
        return jsonify({"message": "Scan completed successfully.", "switches": switches}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
