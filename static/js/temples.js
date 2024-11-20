function openModal(templateName, action) {
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const commandOutput = document.getElementById("command-output");
    const editArea = document.getElementById("edit-area");
    const saveButton = document.querySelector(".btn-save");

    modalTitle.textContent = `${templateName} Details`;

    if (action === "Visit") {
        commandOutput.style.display = "block";
        editArea.style.display = "none";
    } else if (action === "Edit") {
        commandOutput.style.display = "none";
        editArea.style.display = "block";

        saveButton.onclick = function () {
            const updatedContent = document.getElementById("edit-textarea").value;
            console.log("Updated Content:", updatedContent); // Replace with save logic
            alert("Template Saved!");
            closeModal();
        };
    }

    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("modal");
    modal.style.display = "none";
}

function deleteTemplate(templateName) {
    const confirmation = confirm(`Are you sure you want to delete the template "${templateName}"?`);
    if (confirmation) {
        console.log(`Template "${templateName}" has been deleted.`);
        alert(`Template "${templateName}" has been successfully deleted.`);
    }
}