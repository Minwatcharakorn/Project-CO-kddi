from socket import *
import time
from ipaddress import ip_network

def ping_ip(target_ip):
    try:
        s = socket(AF_INET, SOCK_STREAM)
        s.settimeout(0.5)  # ตั้ง timeout สั้นๆ เพื่อเร่งความเร็ว
        conn = s.connect_ex((target_ip, 80))  # ใช้ port 80 เพื่อตรวจสอบการตอบสนอง
        if conn == 0:
            print(f"IP {target_ip} is active")
        s.close()
    except Exception as e:
        pass

if __name__ == "__main__":
    network = input('Enter subnet (e.g., 192.168.1.0/24): ')
    start_time = time.time()

    try:
        # สร้าง subnet และวนลูปค้นหา IP ทั้งหมดใน subnet
        subnet = ip_network(network, strict=False)
        print(f"Scanning all IPs in subnet {subnet}...")

        for ip in subnet.hosts():
            ping_ip(str(ip))

    except ValueError as e:
        print(f"Invalid subnet: {e}")

    print("Time taken:", time.time() - start_time)
