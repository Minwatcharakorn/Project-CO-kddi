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
from ipaddress import ip_address, AddressValueError
import re


app = Flask(__name__)
app.config['SECRET_KEY'] = 'yoursecretkey'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)
Session(app)

# Global serial connection
serial_connection = None

switches = []  # List to store scanned devices


def get_available_ports():
    """Get a list of available serial ports."""
    ports = serial.tools.list_ports.comports()
    return [port.device for port in ports]


async def get_snmp_info(ip, community='public'):
    """Retrieve SNMP information from the device using asyncio."""
    oid_hostname = '.1.3.6.1.2.1.1.5.0'  # OID for Hostname
    oid_model = '.1.3.6.1.2.1.1.1.0'     # OID for Model (sysDescr)
    oid_serial_base = '.1.3.6.1.2.1.47.1.1.1.1.11.1'  # OID base for Serial Number (ENTITY-MIB)

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
    """API for fetching switch details, port statuses, and VLAN information via SNMP."""
    switch = next((s for s in switches if s['id'] == switch_id), None)
    if not switch:
        return jsonify({"error": "Switch not found"}), 404

    ip = switch['ip']
    snmp_results = {}

    # OIDs for SNMP queries
    oids = {
        "hostname": ".1.3.6.1.2.1.1.5.0",  # sysName
        "uptime": ".1.3.6.1.2.1.1.3.0",  # sysUpTime
        "device_type": ".1.3.6.1.2.1.1.1.0",  # sysDescr
        "cpu_usage": "1.3.6.1.4.1.9.2.1.58.0",  # Example CPU OID
        "memory_usage": "1.3.6.1.4.1.9.2.1.58.0",  # Example Memory OID
        "temperature": ".1.3.6.1.4.1.9.9.106.1.1.1.0",  # Replace with actual OID for temperature
    }

    try:
        # Retrieve general SNMP data
        for key, oid in oids.items():
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


        # Construct the response
        switch_data = {
            "hostname": snmp_results.get("hostname", "N/A"),
            "uptime": snmp_results.get("uptime", "N/A"),
            "device_type": snmp_results.get("device_type", "N/A"),
            "cpu_usage": snmp_results.get("cpu_usage", "N/A"),
            "memory_usage": snmp_results.get("memory_usage", "N/A"),
            "temperature": snmp_results.get("temperature", "N/A"),
        }
        return jsonify(switch_data)

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve SNMP data: {str(e)}"}), 500

def abbreviate_interface_name(name):
    abbreviations = {
        "FastEthernet": "Fa",
        "GigabitEthernet": "Gig",
        "TenGigabitEthernet": "TenGig",
        "TwentyFiveGigE": "25Gig",
        "FortyGigabitEthernet": "40Gig",
        "HundredGigE": "100Gig",
        "Ethernet": "Eth"
    }

    for full, short in abbreviations.items():
        if name.startswith(full):
            return name.replace(full, short, 1)  # แทนที่ชื่อเต็มด้วยชื่อย่อ
    return name  # กรณีที่ไม่มีชื่อใน Mapping

@app.route('/api/interfaces/<int:switch_id>', methods=['GET'])
async def get_interfaces(switch_id):
    """API สำหรับดึงข้อมูล Physical Interface และย่อชื่อพอร์ต"""
    switch = next((s for s in switches if s['id'] == switch_id), None)
    if not switch:
        return jsonify({"error": "Switch not found"}), 404

    ip = switch['ip']
    interface_data = []

    try:
        # SNMP OIDs สำหรับดึงข้อมูลพอร์ต
        oid_ifDescr = '.1.3.6.1.2.1.2.2.1.2'  # Interface Description
        oid_ifOperStatus = '.1.3.6.1.2.1.2.2.1.8'  # Operational Status

        # ดึงข้อมูล Interface Description
        names_result = await bulk_cmd(
            SnmpEngine(),
            CommunityData('public'),
            await UdpTransportTarget.create((ip, 161), timeout=5, retries=3),
            ContextData(),
            0, 50,
            ObjectType(ObjectIdentity(oid_ifDescr))
        )

        # ดึงข้อมูล Interface Status
        status_result = await bulk_cmd(
            SnmpEngine(),
            CommunityData('public'),
            await UdpTransportTarget.create((ip, 161), timeout=5, retries=3),
            ContextData(),
            0, 50,
            ObjectType(ObjectIdentity(oid_ifOperStatus))
        )

        # ฟิลเตอร์เฉพาะ Physical Interface
        for name_var, status_var in zip(names_result[3], status_result[3]):
            name = str(name_var[1])  # ชื่อของพอร์ต เช่น GigabitEthernet1/0/1
            status = int(status_var[1])  # สถานะของพอร์ต เช่น 1 = Up, 2 = Down

            if re.match(r"^(Fast|Gigabit|TenGigabit|TwentyFiveGigE|FortyGigabit|HundredGigE|Ethernet)[a-zA-Z]*[0-9]+(/[\d]+)+$", name):
                short_name = abbreviate_interface_name(name)  # ย่อชื่อพอร์ต
                interface_data.append({
                    "name": short_name,
                    "status": "Up" if status == 1 else "Down"
                })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"interfaces": interface_data}), 200

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

@app.route('/configuration')
def configuration_page():
    """Serve the Configuration page."""
    return render_template('configuration.html')

@app.route('/listtemplate')
def listtemplate_page():
    """Serve the List Template page."""
    return render_template('templates-list.html')

@app.route('/uploadtemplate')
def uploadtemplate_page():
    """Serve the Upload Template page."""
    return render_template('upload_Templates.html')


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

@app.route('/api/vlan/<int:switch_id>', methods=['GET'])
def get_vlan_info(switch_id):
    switch = next((s for s in switches if s['id'] == switch_id), None)
    if not switch:
        return jsonify({"error": "Switch not found"}), 404

    ip = switch['ip']
    username = session.get('username')
    password = session.get('password')

    if not username or not password:
        return jsonify({"error": "Authentication details missing"}), 400

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password, timeout=5)

        stdin, stdout, stderr = ssh.exec_command("show vlan brief")
        output = stdout.read().decode('utf-8')
        ssh.close()

        vlan_data = []
        lines = output.splitlines()
        current_vlan = None

        for line in lines[2:]:
            parts = line.split()
            if len(parts) >= 3 and parts[0].isdigit():  # Detect new VLAN
                vlan_id = parts[0]
                vlan_name = ' '.join(parts[1:parts.index('active') if 'active' in parts else len(parts)])
                status = 'active' if 'active' in parts else 'act/unsup'
                ports = ' '.join(parts[parts.index(status) + 1:]) if len(parts) > parts.index(status) + 1 else "N/A"

                # Add current VLAN if any
                if current_vlan:
                    vlan_data.append(current_vlan)

                current_vlan = {
                    "id": vlan_id,
                    "name": vlan_name.strip(),
                    "status": status.strip(),
                    "ports": ports.strip()
                }
            elif current_vlan:  # Continuation of previous VLAN
                current_vlan["ports"] += ' ' + ' '.join(parts)

        # Add the last VLAN
        if current_vlan:
            vlan_data.append(current_vlan)

        return jsonify({"vlan_data": vlan_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get_switches', methods=['GET'])
def get_switches():
    """API to get the list of switches for the Deploy page."""
    return jsonify(switches), 200


@app.route('/api/license/<int:switch_id>', methods=['GET'])
def get_license_info(switch_id):
    switch = next((s for s in switches if s['id'] == switch_id), None)
    if not switch:
        return jsonify({"error": "Switch not found"}), 404

    ip = switch['ip']
    username = session.get('username')
    password = session.get('password')

    if not username or not password:
        return jsonify({"error": "Authentication details missing"}), 400

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password, timeout=5)

        # Execute `show license all` command
        stdin, stdout, stderr = ssh.exec_command("show license all")
        output = stdout.read().decode('utf-8')
        ssh.close()

        # Parse the license information
        license_info = {"licenses": []}
        lines = output.splitlines()
        current_license = None

        for line in lines:
            line = line.strip()
            if line.startswith("Description:"):
                if current_license:
                    license_info["licenses"].append(current_license)
                current_license = {"description": line.replace("Description:", "").strip()}
            elif line.startswith("Status:"):
                if current_license:
                    current_license["status"] = line.replace("Status:", "").strip()
            elif line.startswith("License type:"):
                if current_license:
                    current_license["type"] = line.replace("License type:", "").strip()
            elif line.startswith("Feature Name:"):
                if current_license:
                    current_license["feature"] = line.replace("Feature Name:", "").strip()

        if current_license:
            license_info["licenses"].append(current_license)

        return jsonify(license_info), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ----------------------------------------------------------------------------------
# ติดปัญหา CLI Terminal
# ----------------------------------------------------------------------------------

# Global dictionary to store SSH sessions
ssh_sessions = {}

@app.route('/api/cli', methods=['POST'])
def cli_terminal():
    """Maintain a single SSH session and wait for prompt before sending commands."""
    data = request.json
    ip = data.get('ip')
    command = data.get('command')
    username = session.get('username')
    password = session.get('password')

    if not ip or not command:
        print("Error: Missing IP or command")  # Debug missing input
        return jsonify({"error": "IP address and command are required"}), 400

    try:
        # ตรวจสอบและสร้าง SSH Session ใหม่ถ้าไม่มี
        if ip not in ssh_sessions or not ssh_sessions[ip]['channel'].get_transport().is_active():
            print(f"Creating new SSH session for {ip}")  # Debug SSH creation
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(ip, username=username, password=password, timeout=5)

            channel = ssh.invoke_shell()
            ssh_sessions[ip] = {'ssh': ssh, 'channel': channel}

            # รอให้ prompt พร้อมก่อนส่งคำสั่ง
            while not channel.recv_ready():
                pass
            output = channel.recv(1024).decode('utf-8')
            print(f"Initial prompt: {output}")  # Debug initial prompt output

        # ใช้ Session เดิม ส่งคำสั่งไปยังอุปกรณ์
        channel = ssh_sessions[ip]['channel']
        print(f"Sending command: {command}")  # Debug คำสั่งที่ถูกส่ง
        channel.send(f"{command}\n")

        # อ่านผลลัพธ์คำสั่ง
        output = ""
        while not channel.recv_ready():
            pass
        while channel.recv_ready():
            response = channel.recv(1024).decode('utf-8')
            output += response
        print(f"Command output: {output}")  # Debug ผลลัพธ์ที่ส่งกลับมาจากอุปกรณ์

        return jsonify({"output": output.strip()}), 200

    except Exception as e:
        print(f"Error occurred: {str(e)}")  # Debug ข้อผิดพลาด
        return jsonify({"error": str(e)}), 500
    
    
@app.route('/api/cli/terminate', methods=['POST'])
def terminate_ssh_session():
    data = request.json
    ip = data.get('ip')

    if ip in ssh_sessions:
        ssh_sessions[ip]['ssh'].close()
        del ssh_sessions[ip]
        return jsonify({"message": f"SSH session for {ip} terminated."}), 200

    return jsonify({"error": "No active session for this IP."}), 404


@app.route('/api/get_hostname', methods=['GET'])
def get_hostname():
    ip = request.args.get('ip')
    if not ip:
        return jsonify({"error": "IP is required"}), 400

    try:
        # Run the asynchronous SNMP function in a synchronous context
        snmp_info = asyncio.run(get_snmp_info(ip))
        hostname = snmp_info.get("hostname", "Unknown")
        return jsonify({"hostname": hostname}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------------------------------------------------------------------
# ติดปัญหา CLI Terminal 
# ----------------------------------------------------------------------------------

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

async def connect_ssh(ip, username, password, successful_connections):
    """ฟังก์ชันย่อยสำหรับการเชื่อมต่อ SSH"""
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password, timeout=5)
        successful_connections.append(ip)
        ssh.close()
        return True
    except Exception as e:
        print(f"Failed to connect to {ip}: {e}")
        return False

@app.route('/api/login_ssh', methods=['POST'])
async def login_ssh():
    """API endpoint for SSH login."""
    data = request.json
    mode = data.get('mode', 'range')  # Default mode is 'range'
    ip_start = data.get('ip_start')
    ip_end = data.get('ip_end') if mode == 'range' else ip_start  # Single IP mode uses the same IP for start and end
    username = data.get('username')
    password = data.get('password')

    if not all([ip_start, username, password]):
        return jsonify({"error": "Missing required fields."}), 400

    successful_connections = []

    try:
        # กำหนดช่วง IP สำหรับโหมด Range
        if mode == 'range':
            ip_base = '.'.join(ip_start.split('.')[:3])
            start = int(ip_start.split('.')[-1])
            end = int(ip_end.split('.')[-1])

            for i in range(start, end + 1):
                ip = f"{ip_base}.{i}"
                if await connect_ssh(ip, username, password, successful_connections):
                    print(f"Successfully connected to {ip}")
        else:
            # สำหรับ Single IP
            if await connect_ssh(ip_start, username, password, successful_connections):
                print(f"Successfully connected to {ip_start}")

        # อัปเดต Switch หลังการ Login สำเร็จ
        if successful_connections:
            session['username'] = username
            session['password'] = password
            session.permanent = True
            await update_switches(ip_start, ip_end)  # อัปเดต switch ในช่วง IP
            session['switches'] = switches
            return jsonify({
                "message": "SSH login successful",
                "connected_ips": successful_connections,
                "switches": switches
            }), 200

        return jsonify({"error": "SSH login failed for all devices"}), 500

    except Exception as e:
        print(f"Error in SSH login: {e}")
        return jsonify({"error": str(e)}), 500


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
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy()) # ถ้าอยู่บน WebServer Ubuntu แล้วไม่ต้องใช้งานตัวนี้
    app.run(host="0.0.0.0", port=5000, debug=True)