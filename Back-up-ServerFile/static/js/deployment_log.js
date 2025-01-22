document.addEventListener("DOMContentLoaded", function () {
    fetch("/api/deploy", { method: "POST" })
        .then(response => response.json())
        .then(data => {
            const resultElement = document.getElementById("result");

            if (data.error) {
                // แสดงข้อผิดพลาด
                resultElement.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
            } else {
                // สร้างตารางสำหรับแสดงผล
                let html = `<table border="1" cellspacing="0" cellpadding="5">
                                <tr>
                                    <th>Device ID</th>
                                    <th>Status</th>
                                </tr>`;
                for (let deviceId in data.results) {
                    html += `<tr>
                                <td>${deviceId}</td>
                                <td>${data.results[deviceId]}</td>
                             </tr>`;
                }
                html += `</table>`;
                resultElement.innerHTML = html;
            }
        })
        .catch(error => {
            // แสดงข้อผิดพลาดของการ fetch
            document.getElementById("result").innerHTML = `<p style="color: red;">Error fetching deployment data: ${error}</p>`;
        });
});
