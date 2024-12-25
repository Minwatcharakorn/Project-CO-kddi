import asyncio
import asyncssh
import sys

# รายละเอียดอุปกรณ์ที่ต้องการเชื่อมต่อ
switches = [
    {"host": "192.168.100.112", "username": "admin", "password": "password123"},
    {"host": "192.168.100.113", "username": "admin", "password": "password123"},
    {"host": "192.168.100.114", "username": "admin", "password": "password123"},
    {"host": "192.168.100.115", "username": "admin", "password": "password123"},
    # สามารถเพิ่ม switch อื่นๆ ได้ที่นี่
]

# คำสั่งที่ต้องการรันบน switch
commands = [
    "vlan 99",
    "name VLAN99",
    "end",
    "show vlan brief"
]

async def run_command_on_switch(host, username, password, commands):
    try:
        async with asyncssh.connect(host, username=username, password=password, known_hosts=None) as conn:
            # ใช้ session เดียวในการรันคำสั่งทั้งหมด
            async with conn.create_process() as process:
                process.stdin.write('configure terminal\n')
                for command in commands:
                    process.stdin.write(command + '\n')
                process.stdin.write('end\n')
                process.stdin.write('exit\n')
                await process.stdin.drain()
                output = await process.stdout.read()
                print(f"Output from {host} for configuration commands:\n{output}")
    except (OSError, asyncssh.Error) as exc:
        print(f"Failed to connect to {host}: {exc}")

async def main():
    # สร้าง tasks สำหรับการเชื่อมต่อกับ switches ทุกตัวพร้อมกัน
    tasks = [
        run_command_on_switch(switch["host"], switch["username"], switch["password"], commands)
        for switch in switches
    ]
    # รัน tasks ทั้งหมดพร้อมกัน
    await asyncio.gather(*tasks)

# เรียกใช้งาน main function
if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (OSError, asyncssh.Error) as exc:
        print(f"Error: {exc}")
        sys.exit(1)
