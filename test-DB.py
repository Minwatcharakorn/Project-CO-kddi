import psycopg2

# เชื่อมต่อกับฐานข้อมูล
try:
    conn = psycopg2.connect(
        dbname="logdb",  # ชื่อฐานข้อมูล
        user="logdb",    # ชื่อผู้ใช้
        password="kddiadmin",  # รหัสผ่าน
        host="192.168.99.13",  # ที่อยู่ IP ของเซิร์ฟเวอร์ PostgreSQL
        port="5432"        # พอร์ตที่ใช้สำหรับเชื่อมต่อ (พอร์ตเริ่มต้นของ PostgreSQL)
    )
    
    # สร้าง cursor เพื่อดำเนินการกับฐานข้อมูล
    cursor = conn.cursor()

    # เขียนคำสั่ง SQL สำหรับดึงข้อมูล
    cursor.execute("""
        SELECT id, template_name, description, type, last_updated 
        FROM templates
        ORDER BY last_updated DESC;
    """)

    # ดึงผลลัพธ์จากคำสั่ง SQL
    rows = cursor.fetchall()

    # แสดงผลข้อมูลที่ดึงออกมา
    print("ID | Template Name | Description | Type | Last Updated")
    print("--------------------------------------------------------")
    for row in rows:
        print(f"{row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]}")

except Exception as e:
    print(f"Error: {e}")

finally:
    # ปิดการเชื่อมต่อกับฐานข้อมูล
    if cursor:
        cursor.close()
    if conn:
        conn.close()
