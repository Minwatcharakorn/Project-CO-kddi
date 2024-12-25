import asyncio
import asyncssh
import sys
import platform
from flask import Flask, render_template, request

import os
import time

###### หาอุปกรณ์ในวงและ config ได้ ######
# ฟังก์ชันสำหรับสแกนหาอุปกรณ์ในช่วง IP ที่กำหนดโดยใช้ ping
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
            devices.append({'ip': ip, 'mac': 'N/A'})  # ไม่สามารถดึง MAC ได้ใน L3
    return devices

# รายละเอียดอุปกรณ์ที่ต้องการเชื่อมต่อ (จะค้นหาอุปกรณ์อัตโนมัติ)
switches = []

def update_switches(ip_range_start, ip_range_end):
    devices = scan_network(ip_range_start, ip_range_end)
    for device in devices:
        switches.append({"host": device['ip'], "username": "admin", "password": "password123", "status": "Not Connected"})

# คำสั่งที่ต้องการรันบน switch
config_commands = [
    "vlan 77",
    "name VLAN77",
    "exit"
]

show_command = "show vlan brief"
show_ports_command = "show interfaces status"

app = Flask(__name__)

async def run_command_on_switch(host, username, password, config_commands, show_command, show_ports_command):
    try:
        conn = await asyncio.wait_for(asyncssh.connect(host, username=username, password=password, known_hosts=None), timeout=10)
        async with conn:
            # ใช้ session เดียวในการรันคำสั่งการกำหนดค่าทั้งหมด
            async with conn.create_process() as process:
                process.stdin.write('configure terminal\n')
                for command in config_commands:
                    process.stdin.write(command + '\n')
                process.stdin.write('end\n')
                await process.stdin.drain()
                try:
                    config_output = await asyncio.wait_for(process.stdout.read(), timeout=10)
                    print(f"Output from {host} for configuration commands:\n{config_output}")
                except asyncio.TimeoutError:
                    print(f"Timeout while configuring {host}")
                    return f"Timeout while configuring {host}"

            # รันคำสั่ง show หลังจากออกจากโหมด configuration
            result = await asyncio.wait_for(conn.run(show_command), timeout=10)
            if result.exit_status == 0:
                vlan_output = result.stdout
                print(f"Output from {host} for command '{show_command}':\n{vlan_output}")
            else:
                vlan_output = result.stderr
                print(f"Error on {host} for command '{show_command}': {vlan_output}")

            # รันคำสั่ง show interfaces status เพื่อแสดงสถานะ port
            result_ports = await asyncio.wait_for(conn.run(show_ports_command), timeout=10)
            if result_ports.exit_status == 0:
                ports_output = result_ports.stdout
                print(f"Output from {host} for command '{show_ports_command}':\n{ports_output}")
            else:
                ports_output = result_ports.stderr
                print(f"Error on {host} for command '{show_ports_command}': {ports_output}")

            return vlan_output + "\n\n" + ports_output
    except (OSError, asyncssh.Error, asyncio.TimeoutError) as exc:
        print(f"Failed to connect to {host}: {exc}")
        return str(exc)

@app.route('/')
def index():
    return '''
    <html>
        <body>
            <h2>Select IP Range to Scan and Run Commands</h2>
            <form action="/scan" method="post">
                Start IP: <input type="text" name="ip_range_start" value="192.168.100.1"><br>
                End IP: <input type="text" name="ip_range_end" value="192.168.100.10"><br>
                <input type="submit" value="Scan">
            </form>
        </body>
    </html>
    '''

@app.route('/scan', methods=['POST'])
def scan():
    ip_range_start = request.form['ip_range_start']
    ip_range_end = request.form['ip_range_end']
    switches.clear()
    update_switches(ip_range_start, ip_range_end)
    return '''
    <html>
        <body>
            <h2>Select switches to run commands</h2>
            <form action="/run" method="post">
                %s
                <input type="submit" value="Run Commands">
            </form>
        </body>
    </html>
    ''' % ''.join([f'<input type="checkbox" name="switches" value="{switch["host"]}"> {switch["host"]} - Status: {switch["status"]}<br>' for switch in switches])

@app.route('/run', methods=['POST'])
def run():
    start_time = time.perf_counter()  # เริ่มจับเวลา
    selected_hosts = request.form.getlist('switches')
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    tasks = []
    for switch in switches:
        if switch["host"] in selected_hosts:
            switch["status"] = "Connecting"
            tasks.append(run_command_on_switch(switch["host"], switch["username"], switch["password"], config_commands, show_command, show_ports_command))
    
    results = loop.run_until_complete(asyncio.gather(*tasks))
    end_time = time.perf_counter()  # จบการจับเวลา
    total_time = end_time - start_time

    # อัพเดตสถานะของอุปกรณ์หลังจากรันคำสั่งเสร็จ
    for switch, result in zip(switches, results):
        if switch["host"] in selected_hosts:
            switch["status"] = "Success" if "Error" not in result else "Failed"
    
    result_html = ''.join([f'<h3>Results for {host}:</h3><pre>{output}</pre>' for host, output in zip(selected_hosts, results)])
    result_html += f'<h3>Total Time Taken: {total_time:.2f} seconds</h3>'
    
    return '''
    <html>
        <body>
            <h2>Command Results</h2>
            %s
            <a href="/">Back</a>
        </body>
    </html>
    ''' % result_html

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')
