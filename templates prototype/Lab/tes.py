from flask import Flask, render_template, request, jsonify
from pysnmp.hlapi.v3arch.asyncio import *

app = Flask(__name__)

# OIDs สำหรับดึงข้อมูล SNMP
OID_HOSTNAME = '1.3.6.1.2.1.1.5.0'  # Hostname
OID_MODEL = '1.3.6.1.2.1.1.1.0'     # Model (sysDescr)
OID_SERIAL = '1.3.6.1.2.1.47.1.1.1.1.11.1'  # Serial Number

async def get_snmp_info(ip, community='public'):
    """ดึงข้อมูล SNMP แบบ asynchronous"""
    info = {"hostname": "N/A", "model": "N/A", "serial": "N/A"}
    oids = {
        "hostname": OID_HOSTNAME,
        "model": OID_MODEL,
        "serial": OID_SERIAL
    }

    try:
        for key, oid in oids.items():
            result = await get_cmd(
                SnmpEngine(),
                CommunityData(community),  # ใช้ community string
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

            # ดึงค่าจาก SNMP Response
            for varBind in varBinds:
                info[key] = str(varBind[1])
    except Exception as e:
        print(f"SNMP error for {ip}: {e}")

    return info


@app.route('/')
def index():
    """แสดงหน้าเว็บหลัก"""
    return render_template('index.html')


@app.route('/api/snmp', methods=['POST'])
async def snmp_api():
    """API สำหรับดึงข้อมูล SNMP"""
    data = request.json
    ip = data.get('ip')
    community = data.get('community', 'public')

    if not ip:
        return jsonify({"error": "IP address is required"}), 400

    try:
        snmp_data = await get_snmp_info(ip, community)  # เรียกฟังก์ชัน async
        return jsonify({"ip": ip, "snmp_data": snmp_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
