from flask import Flask, request, jsonify, render_template, session
from flask_session import Session
import serial
import serial.tools.list_ports
import platform
import os
from pysnmp.hlapi.v3arch.asyncio import *
import asyncio
import paramiko
from ipaddress import ip_address
from datetime import datetime, timedelta


app = Flask(__name__)
app.config['SECRET_KEY'] = 'yoursecretkey'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)
Session(app)

# Global serial connection
serial_connection = None

switches = []  # List to store scanned devices


# Test Sidebar
# @app.context_processor
# def inject_sidebar_data():
#     return dict(switches=switches)


def get_available_ports():
    """Get a list of available serial ports."""
    ports = serial.tools.list_ports.comports()
    return [port.device for port in ports]


async def get_snmp_info(ip, community='public'):
    """Retrieve SNMP information from the device using asyncio."""
    oid_hostname = '.1.3.6.1.2.1.1.5.0'  # OID for Hostname
    oid_model = '.1.3.6.1.2.1.1.1.0'     # OID for Model (sysDescr)
    oid_serial_base = '.1.3.6.1.2.1.47.1.1.1.1.11'  # OID base for Serial Number (ENTITY-MIB)

    info = {"hostname": "N/A", "model": "N/A", "serial": "N/A"}

    try:
        for oid, key in [(oid_hostname, "hostname"), (oid_model, "model"), (oid_serial_base, "serial")]:
            result = await get_cmd(
                SnmpEngine(),
                CommunityData(community),
                await UdpTransportTarget.create((ip, 161), timeout=5, retries=3),
                ContextData(),
                ObjectType(ObjectIdentity(oid))
            )

            errorIndication, errorStatus, errorIndex, varBinds = result

            if errorIndication:
                print(f"Error Indication for {oid}: {errorIndication}")
                continue
            if errorStatus:
                print(f"Error Status for {oid}: {errorStatus.prettyPrint()} at {errorIndex}")
                continue

            for varBind in varBinds:
                info[key] = str(varBind[1])
                print(f"Received {key}: {varBind}")
    except Exception as e:
        print(f"SNMP error for {ip}: {e}")

    return info

@app.route('/api/switch/<int:switch_id>', methods=['GET'])
async def get_switch_data(switch_id):
    """API for fetching switch details and port statuses via SNMP."""
    switch = next((s for s in switches if s['id'] == switch_id), None)
    if not switch:
        return jsonify({"error": "Switch not found"}), 404

    ip = switch['ip']
    snmp_results = {}

    # OIDs for SNMP queries
    oids = {
        "hostname": ".1.3.6.1.2.1.1.5.0",  # sysName
        "uptime": ".1.3.6.1.2.1.1.3.0",  # sysUpTime
        "system_time": ".1.3.6.1.2.1.25.1.2.0",  # system date/time
        "device_type": ".1.3.6.1.2.1.1.1.0",  # sysDescr
        "cpu_usage": "1.3.6.1.4.1.9.2.1.58.0",  # Example CPU OID
        "memory_usage": "1.3.6.1.4.1.9.2.1.58.0",  # Example Memory OID
        "temperature": ".1.3.6.1.4.1.9.9.106.1.1.1.0",  # Replace with actual OID for temperature
        "num_ports": ".1.3.6.1.2.1.2.1.0",  # Number of interfaces (ifNumber)
        "port_status_base": ".1.3.6.1.2.1.2.2.1.8"  # Base OID for port status (ifOperStatus)
    }

    try:
        # SNMP query for general data
        for key, oid in oids.items():
            if key == "port_status_base":
                continue  # Skip the base port status OID for now
            result = await get_cmd(
                SnmpEngine(),
                CommunityData('public'),
                await UdpTransportTarget.create((ip, 161), timeout=5, retries=3),
                ContextData(),
                ObjectType(ObjectIdentity(oid))
            )

            errorIndication, errorStatus, errorIndex, varBinds = result
            if errorIndication or errorStatus:
                snmp_results[key] = "N/A"
            else:
                for varBind in varBinds:
                    snmp_results[key] = str(varBind[1])

        # Detect the number of ports
        num_ports = int(snmp_results.get("num_ports", 0))

        # Retrieve port statuses
        port_status = []
        for i in range(1, num_ports + 1):  # Iterate through each port
            port_oid = f"{oids['port_status_base']}.{i}"
            result = await get_cmd(
                SnmpEngine(),
                CommunityData('public'),
                await UdpTransportTarget.create((ip, 161), timeout=5, retries=3),
                ContextData(),
                ObjectType(ObjectIdentity(port_oid))
            )

            errorIndication, errorStatus, errorIndex, varBinds = result
            if errorIndication or errorStatus:
                port_status.append("N/A")
            else:
                for varBind in varBinds:
                    port_status.append(str(varBind[1]))  # 1 = UP, 2 = DOWN, etc.

        snmp_results["port_status"] = port_status

        switch_data = {
            "hostname": snmp_results.get("hostname", "N/A"),
            "uptime": snmp_results.get("uptime", "N/A"),
            "system_time": snmp_results.get("system_time", "N/A"),
            "device_type": snmp_results.get("device_type", "N/A"),
            "cpu_usage": snmp_results.get("cpu_usage", "N/A"),
            "memory_usage": snmp_results.get("memory_usage", "N/A"),
            "temperature": snmp_results.get("temperature", "N/A"),
            "num_ports": num_ports,
            "port_status": port_status
        }
        return jsonify(switch_data)

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve SNMP data: {str(e)}"}), 500


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

    for idx, device in enumerate(devices):
        ip = device['ip']
        snmp_info = await get_snmp_info(ip)

        switches.append({
            "id": idx + 1,  # เพิ่ม ID สำหรับแต่ละ Switch
            "model": snmp_info.get("model", "Unknown"),
            "serial": snmp_info.get("serial", "Unknown"),
            "hostname": snmp_info.get("hostname", "Unknown"),
            "ip": ip,
            "status": "Detected"
        })


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
    session['switches'] = switches  # Store switches in session
    session.permanent = True  # Ensure session persists
    return render_template('Dashboard.html', switches=switches)


@app.route('/deploy')
def deploy_page():
    """Serve the Deploy page."""
    switches_from_session = session.get('switches', [])
    return render_template('Deploy.html', switches=switches_from_session)

@app.route('/info/<int:switch_id>')
def switch_info(switch_id):
    print(f"Accessing info for switch ID: {switch_id}")
    switch = next((s for s in switches if s.get('id') == switch_id), None)
    if not switch:
        print("Switch not found!")
        return render_template('404.html'), 404
    print(f"Switch found: {switch}")
    # ส่ง switch_id ให้หน้า info.html
    return render_template('info.html', switch_id=switch_id, switches=switches)


@app.route('/api/switch/<switch_id>', methods=['GET'])
def get_switch(switch_id):
    switch = next((s for s in switches if s['id'] == switch_id), None)
    if not switch:
        return jsonify({"error": "Switch not found"}), 404

    return jsonify(switch)

@app.route('/api/get_switches', methods=['GET'])
def get_switches():
    """API to get the list of switches for the Deploy page."""
    return jsonify(switches), 200


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


@app.route('/api/login_ssh', methods=['POST'])
async def login_ssh():
    """API endpoint for SSH login."""
    data = request.json
    ip_start = data.get('ip_start')
    ip_end = data.get('ip_end')
    username = data.get('username')
    password = data.get('password')

    if not all([ip_start, ip_end, username, password]):
        return jsonify({"error": "Missing required fields."}), 400

    ip_base = '.'.join(ip_start.split('.')[:3])
    start = int(ip_start.split('.')[-1])
    end = int(ip_end.split('.')[-1])
    
    successful_connections = []

    for i in range(start, end + 1):
        ip = f"{ip_base}.{i}"
        try:
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(ip, username=username, password=password, timeout=5)
            successful_connections.append(ip)
            ssh.close()
            print(f"Successfully connected to {ip}")
        except Exception as e:
            print(f"Failed to connect to {ip}: {e}")

    if successful_connections:
        session['username'] = username
        session['password'] = password
        session.permanent = True
        await update_switches(ip_start, ip_end)  # อัปเดต switches หลังจาก login สำเร็จ
        session['switches'] = switches  # เก็บข้อมูล switches ใน session
        return jsonify({"message": "SSH login successful", "connected_ips": successful_connections, "switches": switches}), 200
    else:
        return jsonify({"error": "SSH login failed for all devices"}), 500


@app.route('/api/send_command', methods=['POST'])
def send_command():
    """API endpoint to send commands to selected devices via SSH."""
    data = request.json
    devices = data.get('devices', [])
    username = session.get('username')
    password = session.get('password')
    command = data.get('command', 'show running-config')

    if not devices:
        return jsonify({"error": "No devices selected."}), 400

    if not username or not password:
        return jsonify({"error": "Username or password not found in session."}), 400

    command_output = {}

    for device in devices:
        ip = device.get('ip')
        try:
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(ip, username=username, password=password, timeout=5)

            stdin, stdout, stderr = ssh.exec_command(command)
            output = stdout.read().decode('utf-8')
            command_output[ip] = output

            ssh.close()
            print(f"Command sent successfully to {ip}")
        except Exception as e:
            command_output[ip] = f"Failed to connect or execute command: {e}"
            print(f"Failed to connect to {ip}: {e}")

    return jsonify({"message": "Command execution completed.", "output": command_output}), 200


@app.route('/api/scan', methods=['POST'])
async def api_scan():
    """API endpoint for scanning the network."""
    data = request.json
    ip_start = data.get('ip_start')
    ip_end = data.get('ip_end')

    if not ip_start or not ip_end:
        return jsonify({"error": "Both start and end IP addresses are required."}), 400

    try:
        await update_switches(ip_start, ip_end)
        session['switches'] = switches
        session.permanent = True
        return jsonify({"message": "Scan completed successfully.", "switches": switches}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)