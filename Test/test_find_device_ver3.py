import threading
import asyncssh
from flask import Flask, render_template, request
import os
import platform

###### หาอุปกรณ์ในวงและ config ได้ ######
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
            devices.append({'ip': ip, 'mac': 'N/A'})
    return devices

switches = []

def update_switches():
    devices = scan_network("192.168.100.1/24")
    for device in devices:
        switches.append({"host": device['ip'], "username": "admin", "password": "password123"})

config_commands = [
    "vlan 20",
    "name VLAN20",
    "exit"
]

show_command = "show vlan brief"

app = Flask(__name__)

def run_command_on_switch(host, username, password, config_commands, show_command):
    try:
        # Connect to the switch
        with asyncssh.connect(host, username=username, password=password, known_hosts=None) as conn:
            process = conn.create_process()
            process.stdin.write('configure terminal\n')
            for command in config_commands:
                process.stdin.write(command + '\n')
            process.stdin.write('end\n')
            process.stdin.drain()
            config_output = process.stdout.read()
            print(f"Output from {host} for configuration commands:\n{config_output}")
            result = conn.run(show_command)
            if result.exit_status == 0:
                print(f"Output from {host} for command '{show_command}':\n{result.stdout}")
                return result.stdout
            else:
                print(f"Error on {host} for command '{show_command}': {result.stderr}")
                return result.stderr
    except Exception as exc:
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
    threads = []
    results = {}

    # Wrapper function for thread execution
    def thread_wrapper(host):
        results[host] = run_command_on_switch(
            host,
            next(switch["username"] for switch in switches if switch["host"] == host),
            next(switch["password"] for switch in switches if switch["host"] == host),
            config_commands,
            show_command
        )

    # Start threads for each selected host
    for host in selected_hosts:
        thread = threading.Thread(target=thread_wrapper, args=(host,))
        threads.append(thread)
        thread.start()

    # Wait for all threads to complete
    for thread in threads:
        thread.join()

    result_html = ''.join([f'<h3>Results for {host}:</h3><pre>{results[host]}</pre>' for host in selected_hosts])
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
