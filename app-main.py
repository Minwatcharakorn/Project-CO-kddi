from flask import Flask, request, jsonify, render_template, session, redirect, url_for, flash , send_file
from flask_session import Session
import platform
import os
from pysnmp.hlapi.v3arch.asyncio import *
import asyncio
import paramiko
from datetime import datetime, timedelta
import re
import psycopg2
import time
from datetime import datetime, timedelta
import pytz
import io


app = Flask(__name__)
app.secret_key = 'your_secret_key'
app.config['SECRET_KEY'] = 'yoursecretkey'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)
Session(app)

UPLOAD_FOLDER = 'uploaded_templates'
ALLOWED_EXTENSIONS = {'txt'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global serial connection
serial_connection = None

switches = []  # List to store scanned devices

# -------------------------------------------------------------------------------
# แก้ 17/1/2025
# เชื่อมต่อกับฐานข้อมูล
def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname="logdb",
            user="logdb",
            password="kddiadmin",
            host="192.168.99.13",
            port="5432"
        )
        print("Database connected successfully!")
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise

# -------------------------------------------------------------------------------


# def get_available_ports():
#     """Get a list of available serial ports."""
#     ports = serial.tools.list_ports.comports()
#     return [port.device for port in ports]

# ฟังก์ชันตรวจสอบชนิดไฟล์
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# แก้ ---------------------------
async def get_snmp_info(ip, community='public'):
    """Retrieve SNMP information from the device using asyncio."""
    oid_hostname = '.1.3.6.1.4.1.9.2.1.3.0'  # OID for Hostname
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

# --------------------------------


# แก้ ----------------------------
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
        "hostname": ".1.3.6.1.4.1.9.2.1.3.0",  # sysName
        "uptime": ".1.3.6.1.2.1.1.3.0",  # sysUpTime
        "device_type": ".1.3.6.1.2.1.1.1.0",  # sysDescr
        "cpu_usage": "1.3.6.1.4.1.9.2.1.58.0",  # Example CPU OID
        "memory_usage": "1.3.6.1.4.1.9.2.1.58.0",  # Example Memory OID
        "temperature": ".1.3.6.1.4.1.9.9.13.1.3.1.3.1011",  # Replace with actual OID for temperature
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

        # Extract only the hostname (before the first dot) if available
        full_hostname = snmp_results.get("hostname", "N/A")
        short_hostname = full_hostname.split('.')[0] if "." in full_hostname else full_hostname

        # Construct the response
        switch_data = {
            "hostname": short_hostname,
            "uptime": snmp_results.get("uptime", "N/A"),
            "device_type": snmp_results.get("device_type", "N/A"),
            "cpu_usage": snmp_results.get("cpu_usage", "N/A"),
            "memory_usage": snmp_results.get("memory_usage", "N/A"),
            "temperature": snmp_results.get("temperature", "N/A"),
        }
        return jsonify(switch_data)

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve SNMP data: {str(e)}"}), 500

# --------------------------------

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
    switches = session.get('switches', [])
    return render_template('Dashboard.html', switches=switches)

@app.route('/configuration')
def configuration_page():
    """Serve the Configuration page."""
    return render_template('configuration.html')

@app.route('/logout')
def logout():
    """Clear session except switches and redirect to Initial page."""
    session.clear()  # ล้างข้อมูลทั้งหมดใน session
    return redirect('/initial')  # เปลี่ยนเส้นทางไปที่หน้า Initial

@app.route('/saveconfig')
def saveconfig_page():
    """Serve the Remote Config page with switch data."""
    switches_from_session = session.get('switches', [])  # Get switches from session
    print("Switches in session:", switches_from_session)  # Debug ดูข้อมูลใน Session

    return render_template('saveconfig.html', switches=switches_from_session)

# -------------------------------------------------------------------------------
# แก้ 17/1/2025
@app.route('/listtemplate', methods=['GET'])
def listtemplate_page():
    """Serve the List Template page as HTML."""
    try:
        conn = psycopg2.connect(
            dbname="logdb",
            user="logdb",
            password="kddiadmin",
            host="192.168.99.13",
            port="5432"
        )
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, template_name, description, type, last_updated
            FROM templates
            ORDER BY last_updated DESC;
        """)
        templates = cursor.fetchall()

        return render_template('templates-list.html', templates=templates)
    except Exception as e:
        return f"Error: {e}"
    finally:
        cursor.close()
        conn.close()

@app.route('/api/templates', methods=['GET'])
def get_templates_json():
    """Return templates as JSON for AJAX."""
    try:
        conn = psycopg2.connect(
            dbname="logdb",
            user="logdb",
            password="kddiadmin",
            host="192.168.99.13",
            port="5432"
        )
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, template_name, description, type, last_updated
            FROM templates
            ORDER BY last_updated DESC;
        """)
        templates = cursor.fetchall()

        # แปลงข้อมูลเป็น JSON
        template_list = [{"id": row[0], "template_name": row[1], "description": row[2], "type": row[3], "last_updated": str(row[4])} for row in templates]

        return jsonify({"templates": template_list})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/viewtemplate/<int:template_id>', methods=['GET'])
def view_template(template_id):
    """View the content of a specific template."""
    try:
        conn = psycopg2.connect(
            dbname="logdb",
            user="logdb",
            password="kddiadmin",
            host="192.168.99.13",
            port="5432"
        )
        cursor = conn.cursor()

        cursor.execute("""
        SELECT file_data FROM templates WHERE id = %s;
        """, (template_id,))
        result = cursor.fetchone()

        if result and result[0]:
            # แปลงข้อมูลจาก BYTEA เป็นข้อความ
            file_content = result[0].tobytes().decode('utf-8', errors='ignore')
            return jsonify({"content": file_content})  # ส่งข้อมูลเป็น JSON
        else:
            return jsonify({"content": "No content found for this template"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


@app.route('/updatetemplate/<int:template_id>', methods=['POST'])
def update_template(template_id):
    try:
        data = request.get_json()
        updated_content = data.get('content')

        # เชื่อมต่อกับฐานข้อมูล
        conn = psycopg2.connect(
            dbname="logdb",
            user="logdb",
            password="kddiadmin",
            host="192.168.99.13",
            port="5432"
        )
        cursor = conn.cursor()

        # อัปเดตข้อมูลในฐานข้อมูล
        cursor.execute("""
            UPDATE templates
            SET file_data = decode(%s, 'escape')
            WHERE id = %s
        """, (updated_content.encode('utf-8').decode('utf-8'), template_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Template updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/deletetemplate/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    """Delete a template from the database."""
    try:
        # เชื่อมต่อกับฐานข้อมูล
        conn = psycopg2.connect(
            dbname="logdb",
            user="logdb",
            password="kddiadmin",
            host="192.168.99.13",
            port="5432"
        )
        cursor = conn.cursor()

        # ลบข้อมูลในฐานข้อมูล
        cursor.execute("DELETE FROM templates WHERE id = %s", (template_id,))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Template deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------------------------------------

@app.route('/uploadtemplate', methods=['GET', 'POST'])
def upload_template():
    """Handle the upload of a new template."""
    if request.method == 'POST':
        try:
            # รับข้อมูลจากฟอร์ม
            template_name = request.form.get('template_name')
            description = request.form.get('description')
            file = request.files.get('file')

            if not template_name or not description or not file:
                return jsonify({"error": "Missing required fields"}), 400

            if not allowed_file(file.filename):
                return jsonify({"error": "Invalid file type. Only .txt files are allowed."}), 400

            # อ่านเนื้อหาไฟล์
            file_content = file.read().decode('utf-8')

            # บันทึกลงฐานข้อมูล
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO templates (template_name, description, type, file_data, last_updated)
                VALUES (%s, %s, %s, %s, NOW())
            """, (template_name, description, 'txt', file_content))
            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({"message": f"Template '{template_name}' uploaded successfully!"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return render_template('upload_Templates.html')

# -----------------------------------------------------------

#                          แก้ 17/1/2025

# -----------------------------------------------------------

@app.route('/apply_configuration', methods=['POST'])
def apply_configuration():
    data = request.get_json()
    template_name = data.get('template_name')
    description = data.get('description')
    config_content = data.get('config_content')

    if not template_name or not description or not config_content:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # สร้างไฟล์ .txt ชั่วคราว
        file_name = f"{template_name}.txt"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name)
        with open(file_path, 'w') as file:
            file.write(config_content)

        # อ่านไฟล์เพื่อเตรียม insert
        with open(file_path, 'r') as file:
            file_content = file.read()

        # Insert ลงฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO templates (template_name, description, type, file_data, last_updated)
            VALUES (%s, %s, %s, %s, NOW())
        """, (template_name, description, 'txt', file_content))
        conn.commit()
        cursor.close()
        conn.close()

        # ลบไฟล์ชั่วคราว
        os.remove(file_path)

        return jsonify({"message": "Configuration applied successfully!"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "An error occurred while applying the configuration."}), 500

# -----------------------------------------------------------

#                          แก้ 17/1/2025

# -----------------------------------------------------------

@app.route('/deploy')
def deploy_page():
    """Serve the Deploy page."""
    switches_from_session = session.get('switches', [])
    return render_template('Deploy.html', switches=switches_from_session)

@app.route('/api/deploy', methods=['POST'])
def deploy_api():
    """API สำหรับการส่งคำสั่งไปยังอุปกรณ์ที่เลือก."""
    selected_devices = session.get('selected_devices', [])
    selected_template_id = session.get('selected_template', None)

    if not selected_devices or not selected_template_id:
        return jsonify({"error": "Missing devices or template selection"}), 400

    deployment_logs = []

    # ดึงคำสั่งจากฐานข้อมูล
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT file_data, template_name, description FROM templates WHERE id = %s", (selected_template_id,))
        template = cursor.fetchone()

        if not template or not template[0]:
            return jsonify({"error": "Template data is missing or invalid."}), 404

        # แปลง Binary หรือ MemoryView เป็น String และแยกคำสั่ง
        if isinstance(template[0], memoryview):
            template_commands = template[0].tobytes().decode('utf-8').strip().splitlines()
        elif isinstance(template[0], bytes):
            template_commands = template[0].decode('utf-8').strip().splitlines()
        else:
            return jsonify({"error": "Template data is not in the expected format."}), 500

        if not template_commands:
            return jsonify({"error": "Template commands are empty or cannot be parsed."}), 500

        template_name = template[1]
        template_description = template[2] or "No description"
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

    # ส่งคำสั่งไปยังอุปกรณ์แต่ละตัว
    for device in session.get('switches', []):
        if device['ip'] in selected_devices:
            try:
                hostname = device.get('hostname', 'Unknown')  # ดึง hostname จาก device
                ssh = paramiko.SSHClient()
                ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                ssh.connect(device['ip'], username=session.get('username'), password=session.get('password'), timeout=10)

                # ใช้ interactive shell สำหรับคำสั่งที่ต้องการโหมด session
                shell = ssh.invoke_shell()
                output_log = []

                for command in template_commands:
                    try:
                        shell.send(command + '\n')
                        time.sleep(1)  # รอการประมวลผลคำสั่ง
                        while not shell.recv_ready():
                            time.sleep(0.5)
                        output = shell.recv(314572800).decode('utf-8').strip()

                        if 'Error' in output:
                            output_log.append(f"Error in '{command}': {output}")
                            break
                        output_log.append(output)
                    except Exception as cmd_error:
                        output_log.append(f"Error executing command '{command}': {str(cmd_error)}")
                        break

                # บันทึก log ลงฐานข้อมูล
                save_deployment_log(
                    device={"ip": device['ip'], "hostname": hostname},
                    template_name=template_name,
                    status="Success" if not any("Error" in log for log in output_log) else "Failure",
                    details="\n".join(output_log),
                    description=template_description
                )

                deployment_logs.append({
                    "hostname": hostname,
                    "ip": device['ip'],
                    "template_name": template_name,
                    "status": "Success" if not any("Error" in log for log in output_log) else "Failure",
                    "details": "\n".join(output_log)
                })

                ssh.close()
            except Exception as e:
                deployment_logs.append({
                    "hostname": hostname,
                    "ip": device['ip'],
                    "template_name": template_name,
                    "status": "Failure",
                    "details": f"SSH connection error: {str(e)}"
                })

                save_deployment_log(
                    device={"ip": device['ip'], "hostname": hostname},
                    template_name=template_name,
                    status="Failure",
                    details=str(e),
                    description=template_description
                )

    session['deployment_logs'] = deployment_logs
    return jsonify({"message": "Deployment completed", "logs": deployment_logs}), 200


def save_deployment_log(device, template_name, status, details, description):
    """บันทึก log ลงฐานข้อมูล."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO deployment_logs (device_ip, hostname, template_name, status, details, description, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """, (device['ip'], device['hostname'], template_name, status, details, description))
        conn.commit()
    except Exception as log_error:
        print(f"Error saving deployment log: {log_error}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


def convert_to_bangkok_time(utc_time):
    bangkok_offset = timedelta(hours=7)  # UTC+7
    bangkok_time = utc_time + bangkok_offset
    return bangkok_time.strftime('%Y-%m-%d %H:%M:%S')

@app.route('/api/logging', methods=['GET'])
def get_logging():
    """API สำหรับดึงข้อมูล log การ deploy."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT hostname, device_ip, template_name, status, details, description, timestamp
            FROM deployment_logs
            ORDER BY timestamp DESC
        """)
        logs = cursor.fetchall()

        log_list = []
        for log in logs:
            # ตรวจสอบ timestamp และแปลงเวลา
            timestamp_utc = log[6]
            if timestamp_utc:
                timestamp_bangkok = convert_to_bangkok_time(timestamp_utc)
            else:
                timestamp_bangkok = "N/A"

            log_list.append({
                "hostname": log[0],
                "ip": log[1],
                "template_name": log[2],
                "status": log[3],
                "details": log[4],
                "description": log[5] or "No description",  # จัดการกรณี description ว่าง
                "timestamp": timestamp_bangkok
            })

        return jsonify({"logs": log_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/select_devices', methods=['POST'])
def select_devices():
    selected_devices = request.form.getlist('devices')  # Get selected devices from form
    if not selected_devices:
        flash("Please select at least one device.")
        return redirect('/deploy')

    # Save selected devices in session
    session['selected_devices'] = selected_devices
    flash("Devices selected successfully!")
    return redirect('/select_templates')


@app.route('/api/select_devices', methods=['POST'])
def api_select_devices():
    data = request.json
    selected_devices = data.get('devices', [])

    if not selected_devices:
        return jsonify({"error": "No devices selected."}), 400

    session['selected_devices'] = selected_devices
    return jsonify({"message": "Devices selected successfully!"}), 200

@app.route('/select_templates', methods=['GET'])
def select_templates():
    """แสดงหน้าเลือก Templates โดยดึงข้อมูลจากฐานข้อมูล"""
    if not session.get('selected_devices'):
        return redirect('/deploy')  # หากไม่ได้เลือก Devices กลับไปหน้า Deploy

    try:
        # เชื่อมต่อกับฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query Templates จากตารางในฐานข้อมูล
        cursor.execute("""
            SELECT id, template_name, description, last_updated
            FROM templates
            ORDER BY last_updated DESC;
        """)
        templates = cursor.fetchall()

        # แปลงข้อมูลให้เป็น list ของ dictionary
        template_list = [
            {"id": row[0], "name": row[1], "description": row[2], "last_updated": row[3]}
            for row in templates
        ]

        return render_template('select_templates.html', templates=template_list)

    except Exception as e:
        print(f"Database error: {e}")
        flash("Unable to fetch templates from the database.")
        return redirect('/deploy')

    finally:
        cursor.close()
        conn.close()


@app.route('/api/select_template', methods=['POST'])
def api_select_template():
    data = request.json
    selected_template = data.get('template_id')

    if not selected_template:
        return jsonify({"error": "No template selected."}), 400

    session['selected_template'] = selected_template
    return jsonify({"message": "Template selected successfully!"}), 200


@app.route('/pre_deployment', methods=['GET'])
def pre_deployment():
    """แสดงหน้า Pre-Deployment"""
    selected_devices = session.get('selected_devices', [])
    selected_template = session.get('selected_template')

    # Debug Logs
    print(f"Selected Devices (IPs): {selected_devices}")
    print(f"Switches in Session: {session.get('switches', [])}")
    print(f"Selected Template: {selected_template}")

    if not selected_devices or not selected_template:
        flash("Please complete the previous steps.")
        return redirect('/deploy')

    # ดึงข้อมูล Devices ที่เลือก (จับคู่ด้วย IP address)
    devices_data = session.get('switches', [])
    selected_devices_data = [device for device in devices_data if device['ip'] in selected_devices]

    # Debug Log: Selected Devices Data
    print(f"Selected Devices Data: {selected_devices_data}")

    # Query Template
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, template_name, description
            FROM templates
            WHERE id = %s
        """, (selected_template,))
        template = cursor.fetchone()

        if not template:
            flash("Selected template not found in the database.")
            return redirect('/select_templates')

        template_data = {"id": template[0], "name": template[1], "description": template[2]}

    except Exception as e:
        print(f"Database error: {e}")
        flash("An error occurred while fetching template details.")
        return redirect('/select_templates')

    finally:
        cursor.close()
        conn.close()

    return render_template('pre_deployment.html', devices=selected_devices_data, template=template_data)


@app.route('/deployment_log', methods=['GET'])
def deployment_log():
    """แสดงหน้า Deployment Log"""
    deployment_logs = session.get('deployment_logs', [])
    return render_template('deployment_log.html', deployment_logs=deployment_logs)


@app.route('/logging_page')
def logging_page():
    """Serve the Logging page."""
    return render_template('Logging.html')


@app.route('/info/<int:switch_id>')
def switch_info(switch_id):
    print(f"Accessing info for switch ID: {switch_id}")
    switch = next((s for s in switches if s.get('id') == switch_id), None)

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
async def get_switches():
    # เรียก get_snmp_info เพื่อดึงข้อมูลล่าสุด
    updated_switches = []
    for switch in switches:
        snmp_info = await get_snmp_info(switch['ip'])
        updated_switches.append({
            "id": switch['id'],
            "model": snmp_info.get("model", "Unknown"),
            "serial": snmp_info.get("serial", "Unknown"),
            "hostname": snmp_info.get("hostname", "Unknown"),
            "ip": switch['ip'],
            "status": switch['status']
        })
    session['switches'] = updated_switches

    return jsonify(updated_switches), 200



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


@app.route('/api/save_send_command_save', methods=['POST'])
def save_send_command_and_download():
    """Send selected commands to devices via SSH and download output as a text file."""
    data = request.json
    devices = data.get('devices', [])  
    commands = data.get('commands', [])  
    username = session.get('username')  
    password = session.get('password')  

    if not devices or not commands:
        return jsonify({"error": "Devices and commands are required"}), 400

    if not username or not password:
        return jsonify({"error": "Username or password not found in session"}), 400

    # Prepare a memory buffer for the output content
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")  # Generate a timestamp for the file
    memory_file = io.BytesIO()  # Use in-memory file for output storage
    content = ""  # Initialize content as an empty string

    for device in devices:
        ip = device.get('ip')  # Get the device IP
        hostname = device.get('hostname', ip)  # Use hostname or fallback to IP
        try:
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(ip, username=username, password=password, timeout=10)
            
            # Start an interactive SSH shell session
            channel = ssh.invoke_shell()
            time.sleep(1)  # Wait for the shell to initialize
            channel.recv(314572800)  # Clear initial output buffer
            
            # Append device header to the output content
            content += f"Device: {hostname} ({ip})\n{'='*90}\n"

            # Send each command sequentially
            for command in commands:
                # Disable CLI pagination for specific commands
                if command.strip().lower() == "show running-config":
                    channel.send("terminal length 0\n")
                    time.sleep(1)
                    channel.recv(5242880)  # Clear any extra output

                channel.send(f"{command}\n")
                time.sleep(1)  
                
                output = ""
                while True:
                    if channel.recv_ready():  # Check if there is data to read
                        chunk = channel.recv(314572800).decode('utf-8')  # Decode the received data
                        output += chunk
                        # Stop collecting output when the prompt or "end" is detected
                        if "#" in chunk or "end" in chunk:
                            break
                
                # Add the command header and output, with separators
                content += f"\n{'-'*20} Command: {command} {'-'*20}\n"
                content += f"{output.strip()}\n"

            # Append separator for clarity between devices
            content += f"\n{'='*90}\n\n"

            # Close the SSH session
            ssh.close()
        except Exception as e:
            # Add an error message to the output if SSH connection fails
            content += f"\n\n{'='*50}\nFailed to connect to {hostname} ({ip}): {str(e)}\n{'='*50}\n\n"

    memory_file.write(content.encode('utf-8'))  # Encode string to bytes
    memory_file.seek(0)  

    filename = f"output_{timestamp}.txt"

    return send_file(
        memory_file,
        as_attachment=True,  
        download_name=filename,  
        mimetype='text/plain'  
    )

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
    """Login and store IP range or single IP in session."""
    data = request.json
    mode = data.get('mode', 'range')  # Default mode is 'range'
    ip_start = data.get('ip_start')
    ip_end = data.get('ip_end') if mode == 'range' else ip_start  # Single IP uses the same start and end
    username = data.get('username')
    password = data.get('password')

    if not all([ip_start, username, password]):
        return jsonify({"error": "Missing required fields."}), 400

    successful_connections = []

    try:
        # Perform SSH connection
        if mode == 'range':
            ip_base = '.'.join(ip_start.split('.')[:3])
            start = int(ip_start.split('.')[-1])
            end = int(ip_end.split('.')[-1])

            for i in range(start, end + 1):
                ip = f"{ip_base}.{i}"
                if await connect_ssh(ip, username, password, successful_connections):
                    print(f"Successfully connected to {ip}")
        else:
            if await connect_ssh(ip_start, username, password, successful_connections):
                print(f"Successfully connected to {ip_start}")

        # Store session data
        if successful_connections:
            session['username'] = username
            session['password'] = password
            session['ip_start'] = ip_start
            session['ip_end'] = ip_end if mode == 'range' else None
            session.permanent = True

            # Update switches in session
            await update_switches(ip_start, ip_end)
            session['switches'] = switches

            return jsonify({
                "message": "SSH login successful",
                "connected_ips": successful_connections,
                "switches": switches
            }), 200

        return jsonify({"error": "SSH login failed for all devices"}), 500
    except Exception as e:
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

@app.route('/save-and-download-config', methods=['POST'])
def save_and_download_config():
    data = request.json  # รับข้อมูล JSON จาก JavaScript
    config_data = data.get('configData', '')  # ดึง configData จากคำขอ

    # ตรวจสอบว่ามีข้อมูลใน configData หรือไม่
    if not config_data:
        return jsonify({"error": "No configuration data provided"}), 400

    # สร้างชื่อไฟล์พร้อมวันที่
    timestamp = datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
    filename = f'configuration_{timestamp}.txt'

    # ส่งไฟล์กลับไปให้ JavaScript
    return send_file(
        io.BytesIO(config_data.encode('utf-8')),
        as_attachment=True,
        download_name=filename,
        mimetype='text/plain'
    )


if __name__ == "__main__":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy()) # ถ้าอยู่บน WebServer Ubuntu แล้วไม่ต้องใช้งานตัวนี้
    app.run(host="0.0.0.0", port=5000, debug=True)
