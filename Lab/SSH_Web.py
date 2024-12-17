import asyncio
import asyncssh
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import eventlet

eventlet.monkey_patch()  # ให้ SocketIO ทำงานได้กับ asyncio

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='eventlet')

SSH_SESSIONS = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect_ssh')
async def connect_ssh(data):
    """
    Connect to SSH Server using AsyncSSH
    """
    hostname = data['hostname']
    port = int(data.get('port', 22))
    username = data['username']
    password = data['password']
    session_id = asyncio.current_task().get_name()

    try:
        conn = await asyncssh.connect(hostname, port=port, username=username, password=password)
        SSH_SESSIONS[session_id] = conn
        emit('output', {'data': f'Connected to {hostname}\n'})
    except Exception as e:
        emit('output', {'data': f'Error: {str(e)}\n'})

@socketio.on('send_command')
async def send_command(data):
    """
    Execute a command in real-time on SSH Server
    """
    session_id = asyncio.current_task().get_name()
    command = data['command']

    if session_id in SSH_SESSIONS:
        conn = SSH_SESSIONS[session_id]
        try:
            async with conn.create_process() as process:
                await process.stdin.write(command + '\n')  # ส่งคำสั่ง
                output = await process.stdout.read()  # อ่านทั้งหมด
                emit('output', {'data': output})  # ส่งผลลัพธ์กลับไป
        except Exception as e:
            emit('output', {'data': f'Command Error: {str(e)}\n'})
    else:
        emit('output', {'data': 'Error: SSH session not active.\n'})

@socketio.on('disconnect')
def disconnect_ssh():
    """
    Disconnect the SSH session
    """
    session_id = asyncio.current_task().get_name()
    if session_id in SSH_SESSIONS:
        SSH_SESSIONS[session_id].close()
        del SSH_SESSIONS[session_id]
        emit('output', {'data': 'Disconnected\n'})

if __name__ == '__main__':
    socketio.run(app, debug=True)
