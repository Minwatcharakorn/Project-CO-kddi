import paramiko
import sys
import msvcrt
import re

hostname = "192.168.100.114"
port = 22
user = "admin"
passwd = "password123"

def send_command_real_time(shell, command, timeout=10):
    """ ส่งคำสั่งและอ่าน Output แบบ Real-Time พร้อม Timeout """
    shell.send(command)
    buffer = ""
    shell.settimeout(timeout)
    while True:
        try:
            chunk = shell.recv(104857600).decode("utf-8")
            sys.stdout.write(chunk)
            sys.stdout.flush()
            buffer += chunk

            # จับ prompt ที่ลงท้ายด้วย #
            if re.search(r".+#", buffer):
                break
        except Exception:
            break
    return buffer

def interactive_shell(shell):
    """ เปิดใช้งาน Interactive Shell สำหรับ Windows """
    print("Interactive Shell (Press Ctrl+C to exit)")
    try:
        while True:
            if shell.recv_ready():
                sys.stdout.write(shell.recv(104857600).decode("utf-8"))
                sys.stdout.flush()

            if msvcrt.kbhit():  # ตรวจสอบว่ามีการกดปุ่มหรือไม่
                key = msvcrt.getch().decode("utf-8")
                if key == "\r":  # แปลง Enter ให้ส่งเป็น "\n"
                    shell.send("\n")
                elif key == "\x03":  # กด Ctrl+C เพื่อออก
                    print("\nExiting...")
                    break
                elif key == "\t":  # กด Tab
                    shell.send("\t")
                else:
                    shell.send(key)  # ส่งคีย์ปกติไปยัง CLI
    except Exception as e:
        print(f"Error: {e}")

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, port=port, username=user, password=passwd)

    shell = client.invoke_shell()

    # ส่งคำสั่งปิดการแบ่งหน้า
    send_command_real_time(shell, "terminal length 0")
    print("Connected to device. Press Ctrl+C to exit.\n")

    # เปิดใช้งาน Interactive Shell
    interactive_shell(shell)

    shell.close()
    client.close()
except Exception as e:
    print(f"Error: {e}")
