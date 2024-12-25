from flask import Flask
import paramiko

app = Flask(__name__)

def get_vlan_data(host, username, password):
    """Connect to the Cisco switch and retrieve VLAN data."""
    try:
        # Initialize SSH client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname=host, username=username, password=password)

        # Send the command
        stdin, stdout, stderr = ssh.exec_command('show vlan brief')
        output = stdout.read().decode('utf-8')

        # Process the output
        vlan_data = []
        for line in output.splitlines():
            if line and line[0].isdigit():  # Filter VLAN lines
                vlan_info = line.split()
                vlan_data.append({
                    'id': vlan_info[0],
                    'name': vlan_info[1],
                    'status': vlan_info[2],
                    'ports': ' '.join(vlan_info[3:]),
                })

        ssh.close()
        return vlan_data
    except Exception as e:
        print(f"Error: {e}")
        return []

@app.route('/')
def vlan_table():
    # Replace with your Cisco switch credentials
    host = "192.168.100.114"
    username = "admin"
    password = "password123"

    vlan_data = get_vlan_data(host, username, password)

    # HTML content
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VLAN Table</title>
        <style>
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                border: 1px solid black;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
            }
        </style>
    </head>
    <body>
        <h1>VLAN Table</h1>
        <table>
            <thead>
                <tr>
                    <th>VLAN ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Ports</th>
                </tr>
            </thead>
            <tbody>
    """
    # Append VLAN data to the HTML
    for vlan in vlan_data:
        html_content += f"""
                <tr>
                    <td>{vlan['id']}</td>
                    <td>{vlan['name']}</td>
                    <td>{vlan['status']}</td>
                    <td>{vlan['ports']}</td>
                </tr>
        """

    # Close the HTML tags
    html_content += """
            </tbody>
        </table>
    </body>
    </html>
    """
    return html_content

if __name__ == '__main__':
    app.run(debug=True)
