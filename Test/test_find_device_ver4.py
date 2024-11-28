from flask import Flask, render_template, request
from ncclient import manager
from netaddr import IPNetwork, IPAddress
import os
import platform

app = Flask(__name__)

# คำสั่ง NETCONF
config_template = """
<config>
    <vlans xmlns="urn:ietf:params:xml:ns:yang:ietf-vlan">
        <vlan>
            <vlan-id>900</vlan-id>
            <name>VLAN900</name>
        </vlan>
    </vlans>
</config>
"""

show_vlan_rpc = """
<get>
    <filter>
        <vlans xmlns="urn:ietf:params:xml:ns:yang:ietf-vlan"/>
    </filter>
</get>
"""

# ฟังก์ชันสำหรับสแกนหา IP ที่ตอบสนอง
def scan_network(ip_range):
    devices = []
    for ip in IPNetwork(ip_range):
        ip_str = str(ip)
        if platform.system().lower() == "windows":
            response = os.system(f"ping -n 1 -w 500 {ip_str} >nul 2>&1")
        else:
            response = os.system(f"ping -c 1 -W 1 {ip_str} > /dev/null 2>&1")
        if response == 0:
            devices.append({'ip': ip_str})
    return devices

# ฟังก์ชันส่งคำสั่ง NETCONF
def configure_switch(host, username, password, config_template, show_vlan_rpc):
    try:
        with manager.connect(
            host=host,
            port=830,
            username=username,
            password=password,
            hostkey_verify=False,
            timeout=10
        ) as m:
            # ส่งคำสั่ง Configuration
            m.edit_config(target="running", config=config_template)
            # เรียกดู VLAN ที่ถูกตั้งค่า
            response = m.dispatch(show_vlan_rpc)
            return response.xml
    except Exception as e:
        return str(e)

@app.route('/')
def index():
    devices = scan_network("192.168.100.0/24")
    return '''
    <html>
        <body>
            <h2>Select switches to configure</h2>
            <form action="/run" method="post">
                %s
                <input type="submit" value="Run NETCONF Commands">
            </form>
        </body>
    </html>
    ''' % ''.join([f'<input type="checkbox" name="switches" value="{device["ip"]}"> {device["ip"]}<br>' for device in devices])

@app.route('/run', methods=['POST'])
def run():
    selected_hosts = request.form.getlist('switches')
    results = []
    for host in selected_hosts:
        result = configure_switch(host, "admin", "password123", config_template, show_vlan_rpc)
        results.append(f"<h3>Results for {host}:</h3><pre>{result}</pre>")
    return '''
    <html>
        <body>
            <h2>NETCONF Command Results</h2>
            %s
            <a href="/">Back</a>
        </body>
    </html>
    ''' % ''.join(results)

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')
