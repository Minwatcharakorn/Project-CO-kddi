from flask import Flask, Response, render_template_string, request
import paramiko
import time
import re

app = Flask(__name__)

hostname = "192.168.100.114"
port = 22
user = "admin"
passwd = "password123"

shell = None
client = None

def connect_to_device():
    """ Establish SSH connection and return the shell object. """
    global client, shell
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname, port=port, username=user, password=passwd)
        shell = client.invoke_shell()
        shell.send("terminal length 0\n")
        time.sleep(1)
    except Exception as e:
        print(f"Error: {e}")
        shell = None
        client = None

def stream_shell_output():
    """ Stream real-time output from the shell. """
    try:
        buffer = ""
        while True:
            if shell and shell.recv_ready():
                chunk = shell.recv(104857600).decode("utf-8")
                buffer += chunk
                yield chunk.replace("\n", "<br>")
            time.sleep(0.1)
    except Exception as e:
        yield f"Error: {e}"

@app.route('/')
def index():
    """ Home route to display the real-time terminal interface. """
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Real-time SSH Terminal</title>
        <script>
            document.addEventListener("DOMContentLoaded", function() {
                let outputDiv = document.getElementById("output");
                let inputBuffer = "";

                document.addEventListener("keydown", function(event) {
                    let key = event.key;

                    if (key === "Enter") {
                        fetch("/send", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ command: inputBuffer })
                        }).then(() => inputBuffer = "");
                        outputDiv.innerHTML += `\n> ${inputBuffer}`;
                    } else if (key === "Backspace") {
                        inputBuffer = inputBuffer.slice(0, -1);
                    } else if (key.length === 1) {
                        inputBuffer += key;
                    }
                    document.getElementById("current-input").textContent = inputBuffer;
                });

                function fetchOutput() {
                    fetch("/stream")
                        .then(response => response.text())
                        .then(data => {
                            outputDiv.innerHTML += data;
                            outputDiv.scrollTop = outputDiv.scrollHeight;
                        });
                }

                setInterval(fetchOutput, 500);
            });
        </script>
    </head>
    <body style="background: black; color: white; font-family: monospace;">
        <div id="output" style="white-space: pre-wrap; height: 90vh; overflow-y: scroll; border: 1px solid white; padding: 10px;"></div>
        <div id="current-input" style="display: none;"></div>
    </body>
    </html>
    ''')

@app.route('/send', methods=['POST'])
def send_command():
    """ Endpoint to send a command to the shell. """
    global shell
    command = request.json.get("command", "")
    if shell:
        shell.send(command + "\n")
    return "", 204

@app.route('/stream')
def stream():
    """ Route to stream the real-time output. """
    if not shell:
        connect_to_device()
    if not shell:
        return "Error connecting to device"

    output = ""
    while shell.recv_ready():
        output += shell.recv(104857600).decode("utf-8").replace("\n", "<br>")
    return output

if __name__ == '__main__':
    connect_to_device()
    app.run(debug=True, host="0.0.0.0", port=5000)
