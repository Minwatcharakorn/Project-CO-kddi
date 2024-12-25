import paramiko
import time
import sys
import re

hostname = "192.168.100.114"
port = 22
user = "admin"
passwd = "password123"

def send_command_real_time(shell, command, timeout=10):
    """ ส่งคำสั่งและอ่าน Output แบบ Real-Time พร้อม Timeout """
    shell.send(command + "\n")
    shell.settimeout(timeout)  # Extended timeout for long commands
    buffer = ""

    while True:
        try:
            chunk = shell.recv(65535).decode("utf-8")
            sys.stdout.write(chunk)
            sys.stdout.flush()
            buffer += chunk

            # จับ prompt ที่ลงท้ายด้วย #
            if re.search(r".+#", buffer):
                break
        except Exception:
            break  # Stop reading on timeout or no data
    return buffer
try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, port=port, username=user, password=passwd)

    shell = client.invoke_shell()
    # time.sleep(0.1)  # รอให้ Shell พร้อมใช้งาน

    # ส่งคำสั่งปิดการแบ่งหน้า ก่อนเข้าสู่ลูปหลัก
    send_command_real_time(shell, "terminal length 0")

    while True:
        cmd = input("")
        if cmd.lower() == "quit":
            print("Exiting...")
            break

        send_command_real_time(shell, cmd)

    shell.close()
    client.close()
except Exception as e:
    print(f"Error: {e}")
