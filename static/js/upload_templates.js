document.addEventListener("DOMContentLoaded", function () {
    const uploadForm = document.getElementById("upload-form");
    const fileInput = document.getElementById("file");
    const fileContentPre = document.getElementById("file-content");

    const successModal = document.getElementById("successModal");
    const successMessage = document.getElementById("successMessage");
    const errorModal = document.getElementById("errorModal");
    const errorMessage = document.getElementById("errorMessage");
    const closeSuccessButton = document.querySelector(".success-button");

    // Function to show the success modal and redirect
    function showSuccessModal(message) {
        successMessage.textContent = message;
        successModal.style.display = "flex";
    }

    // Function to show the error modal
    function showErrorModal(message) {
        errorMessage.textContent = message;
        errorModal.style.display = "flex";
    }

    // Function to close the success modal and redirect to /listtemplate
    closeSuccessButton.addEventListener("click", function () {
        successModal.style.display = "none";
        window.location.href = "/listtemplate"; // Redirect to List Templates page
    });

    // Function to close the error modal
    document.getElementById("closeErrorModal").addEventListener("click", function () {
        errorModal.style.display = "none";
    });

    // Read file and display content when a file is selected
    fileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file && file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = function (e) {
                fileContentPre.textContent = e.target.result;
            };
            reader.readAsText(file);
        } else {
            showErrorModal("Please select a valid .txt file.");
            fileContentPre.textContent = "Uploaded file content will appear here...";
        }
    });

    // Handle form submission
    uploadForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const formData = new FormData(uploadForm);

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
                    showErrorModal(`Error: ${data.error}`);
                } else {
                    showSuccessModal(data.message);
                    fileContentPre.textContent = "Uploaded file content will appear here...";
                    uploadForm.reset();
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                showErrorModal("Unexpected error occurred. Please try again later.");
            });
    });
});
