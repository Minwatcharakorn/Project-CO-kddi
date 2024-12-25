from flask import Flask, request, render_template_string
from socket import *
import time
from ipaddress import ip_network

app = Flask(__name__)

def ping_ip(target_ip):
    try:
        start_time = time.time()
        s = socket(AF_INET, SOCK_STREAM)
        s.settimeout(0.5)
        conn = s.connect_ex((target_ip, 80))
        status = "Active" if conn == 0 else "Inactive"
        s.close()
        duration = time.time() - start_time
        if status == "Active":
            return {"ip": target_ip, "time": f"{duration:.4f}s"}
        return None
    except Exception:
        return None

@app.route("/", methods=["GET", "POST"])
def index():
    results = []
    error = None
    subnet = None
    total_time = None

    if request.method == "POST":
        subnet = request.form.get("subnet")
        try:
            start_time = time.time()
            network = ip_network(subnet, strict=False)
            for ip in network.hosts():
                result = ping_ip(str(ip))
                if result:  # เก็บเฉพาะ IP ที่ Active
                    results.append(result)
            total_time = f"{time.time() - start_time:.2f}s"
        except ValueError as e:
            error = f"Invalid subnet: {e}"

    html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Active IP Scanner</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    </head>
    <body>
        <div class="container mt-5">
            <h1 class="text-center">Active IP Scanner</h1>
            <form method="POST" class="mt-4">
                <div class="mb-3">
                    <label for="subnet" class="form-label">Enter Subnet (e.g., 192.168.1.0/24):</label>
                    <input type="text" name="subnet" id="subnet" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary">Scan</button>
            </form>

            {% if error %}
            <div class="alert alert-danger mt-4">{{ error }}</div>
            {% endif %}

            {% if results %}
            <h2 class="mt-4">Active IPs in subnet: {{ subnet }}</h2>
            <p>Total scan time: {{ total_time }}</p>
            <table class="table table-striped mt-3">
                <thead>
                    <tr>
                        <th>IP Address</th>
                        <th>Time Taken</th>
                    </tr>
                </thead>
                <tbody>
                    {% for result in results %}
                    <tr>
                        <td>{{ result.ip }}</td>
                        <td>{{ result.time }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
            {% elif not error and subnet %}
            <div class="alert alert-info mt-4">No active IPs found in subnet: {{ subnet }}</div>
            {% endif %}
        </div>
    </body>
    </html>
    """
    return render_template_string(html, results=results, error=error, subnet=subnet, total_time=total_time)

if __name__ == "__main__":
    app.run(debug=True)
