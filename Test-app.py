from flask import Flask, render_template, request, jsonify
import paramiko
from ipaddress import ip_address
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def dashboard():
    return render_template('dashboardtest.html')

@app.route('/ssh', methods=['POST'])
def ssh_connect():
    data = request.json
    start_ip = data.get('start_ip')
    end_ip = data.get('end_ip')
    username = data.get('username')
    password = data.get('password')
    command = data.get('command', 'show version')  # Default SSH command

    if not start_ip or not end_ip or not username or not password:
        return jsonify({"error": "start_ip, end_ip, username, and password are required"}), 400

    try:
        # Validate IP range
        start = ip_address(start_ip)
        end = ip_address(end_ip)
        if start > end:
            return jsonify({"error": "start_ip must be less than or equal to end_ip"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    results = {}
    current_ip = start
    while current_ip <= end:
        ip = str(current_ip)
        try:
            # Connect to switch via SSH
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(ip, username=username, password=password, timeout=5)

            # Execute command
            stdin, stdout, stderr = ssh.exec_command(command)
            output = stdout.read().decode().strip()
            error = stderr.read().decode().strip()

            # Save output with timestamp
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            results[ip] = {
                "status": "Connected",
                "output": output if output else None,
                "error": error if error else None,
                "timestamp": timestamp,
            }

            ssh.close()
        except Exception as e:
            results[ip] = {"status": "Error", "message": str(e)}

        current_ip += 1

    return jsonify({"status": "success", "results": results})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
