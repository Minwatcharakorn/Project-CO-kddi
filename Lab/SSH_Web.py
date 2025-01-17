from flask import Flask, render_template, request, jsonify
import paramiko

app = Flask(__name__)
clients = {}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/connect", methods=["POST"])
def connect_to_device():
    """Connect to the device via SSH."""
    data = request.json
    hostname = data.get("hostname")
    port = int(data.get("port", 22))
    username = data.get("username")
    password = data.get("password")

    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname, port=port, username=username, password=password)

        shell = client.invoke_shell()
        session_id = request.remote_addr
        clients[session_id] = {"client": client, "shell": shell}

        # Disable pagination
        send_command(shell, "terminal length 0")

        return jsonify({"message": "Connected to device."}), 200
    except Exception as e:
        return jsonify({"message": f"Error: {e}"}), 500

@app.route("/command", methods=["POST"])
def send_command_to_device():
    """Send a command to the device and return the output."""
    data = request.json
    command = data.get("command")
    session_id = request.remote_addr
    session = clients.get(session_id)

    if session:
        shell = session["shell"]
        output = send_command(shell, command)
        return jsonify({"output": output}), 200
    else:
        return jsonify({"message": "Session not found. Please reconnect."}), 404

@app.route("/disconnect", methods=["POST"])
def disconnect():
    """Clean up SSH session on disconnect."""
    session_id = request.remote_addr
    session = clients.pop(session_id, None)
    if session:
        session["shell"].close()
        session["client"].close()
        return jsonify({"message": "Disconnected."}), 200
    return jsonify({"message": "Session not found."}), 404

def send_command(shell, command, timeout=10):
    """Send a command and return the output."""
    shell.send(command + "\n")
    buffer = ""
    shell.settimeout(timeout)
    try:
        while True:
            if shell.recv_ready():
                chunk = shell.recv(104857600).decode("utf-8")
                buffer += chunk

                # Stop when the prompt is reached
                if buffer.strip().endswith("#"):
                    break
    except Exception as e:
        buffer += f"Error: {e}"
    return buffer

if __name__ == "__main__":
    app.run(debug=True)