import serial.tools.list_ports

# ฟังก์ชันตรวจสอบ Serial Ports
def check_serial_ports():
    ports = serial.tools.list_ports.comports()
    if not ports:
        print("ไม่พบ Serial Port ใด ๆ ในระบบ")
    else:
        print("พบ Serial Ports ดังนี้:")
        for port in ports:
            print("")
            print(f"- port Serial Ports : {port.device}")
            print("")

# เรียกใช้ฟังก์ชัน
check_serial_ports()
