document.getElementById("deploy-btn").addEventListener("click", function () {
    fetch("/api/deploy", {
        method: "POST"
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error); // แสดงข้อความ Error
        } else {
            window.location.href = "/deploy"; // Redirect ไปหน้าผลลัพธ์
        }
    })
    .catch(error => {
        alert("Deployment failed: " + error);
    });
});
