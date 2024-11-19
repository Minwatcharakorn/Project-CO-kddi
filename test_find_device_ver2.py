import asyncio
import asyncssh
import sys
import platform
from flask import Flask, render_template, request
import os

###### หาอุปกรณ์ในวงและ config ได้ ######
# ฟังก์ชันสำหรับสแกนหาอุปกรณ์ในวงเครือข่ายโดยใช้ ping
def scan_network(ip_range):
    ip_base = '.'.join(ip_range.split('.')[:3])
    devices = []
    for i in range(1, 255):
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

def update_switches():
    devices = scan_network("192.168.100.1/24")
    for device in devices:
        switches.append({"host": device['ip'], "username": "admin", "password": "password123"})

# คำสั่งที่ต้องการรันบน switch
config_commands = [
    "vlan 800",
    "name VLAN800",
    "exit"
]

show_command = "show vlan brief"

app = Flask(__name__)

async def run_command_on_switch(host, username, password, config_commands, show_command):
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
                print(f"Output from {host} for command '{show_command}':\n{result.stdout}")
                return result.stdout
            else:
                print(f"Error on {host} for command '{show_command}': {result.stderr}")
                return result.stderr
    except (OSError, asyncssh.Error, asyncio.TimeoutError) as exc:
        print(f"Failed to connect to {host}: {exc}")
        return str(exc)

@app.route('/')
def index():
    switches.clear()
    update_switches()
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
    ''' % ''.join([f'<input type="checkbox" name="switches" value="{switch["host"]}"> {switch["host"]}<br>' for switch in switches])

@app.route('/run', methods=['POST'])
def run():
    selected_hosts = request.form.getlist('switches')
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    tasks = [
        run_command_on_switch(switch["host"], switch["username"], switch["password"], config_commands, show_command)
        for switch in switches if switch["host"] in selected_hosts
    ]
    results = loop.run_until_complete(asyncio.gather(*tasks))
    result_html = ''.join([f'<h3>Results for {host}:</h3><pre>{output}</pre>' for host, output in zip(selected_hosts, results)])
    return f'''
    <html>
        <body>
            <h2>Command Results</h2>
            {result_html}
            <a href="/">Back</a>
        </body>
    </html>
    '''

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')


