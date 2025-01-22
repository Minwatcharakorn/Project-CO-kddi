document.addEventListener("DOMContentLoaded", function () {
    const uploadForm = document.getElementById("upload-form");
    const fileInput = document.getElementById("file");
    const fileContentPre = document.getElementById("file-content");
    const uploadStatus = document.getElementById("upload-status");

    // อ่านไฟล์และแสดงเนื้อหาเมื่อเลือกไฟล์
    fileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file && file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = function (e) {
                fileContentPre.textContent = e.target.result;
            };
            reader.readAsText(file);
        } else {
            alert("Please select a valid .txt file.");
            fileContentPre.textContent = "Uploaded file content will appear here...";
        }
    });

    // จัดการการอัปโหลดฟอร์ม
    uploadForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const formData = new FormData(uploadForm);
        uploadStatus.innerHTML = "Uploading template...";

        fetch("/uploadtemplate", {
            method: "POST",
            body: formData,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to upload template");
                }
                return response.json();
            })
            .then((data) => {
                if (data.error) {
                    uploadStatus.innerHTML = `<span class="error">Error: ${data.error}</span>`;
                } else {
                    uploadStatus.innerHTML = `<span class="success">${data.message}</span>`;
                    fileContentPre.textContent = "Uploaded file content will appear here...";
                    uploadForm.reset();
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                uploadStatus.innerHTML = `<span class="error">Unexpected error occurred. Please try again later.</span>`;
            });
    });
});
