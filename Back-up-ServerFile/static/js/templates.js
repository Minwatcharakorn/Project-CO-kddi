function showErrorModal(message) {
    const modal = document.getElementById("errorModal");
    const errorMessage = document.getElementById("errorMessage");

    if (modal && errorMessage) {
        errorMessage.textContent = message;
        modal.style.display = "flex";
    }
}

function closeErrorModal() {
    const modal = document.getElementById("errorModal");
    if (modal) {
        modal.style.display = "none";
    }
}

function showSuccessModal(message) {
    const modal = document.getElementById("successModal");
    const successMessage = document.getElementById("successMessage");

    if (modal && successMessage) {
        successMessage.textContent = message;
        modal.style.display = "flex";
    }
}

function closeSuccessModal() {
    const modal = document.getElementById("successModal");
    if (modal) {
        modal.style.display = "none";
    }
}

function closeConfirmationModal() {
    const confirmationModal = document.getElementById("confirmationModal");
    if (confirmationModal) {
        confirmationModal.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const closeModalButton = document.getElementById("closeErrorModal");
    if (closeModalButton) {
        closeModalButton.addEventListener("click", closeErrorModal);
    }
});

// ฟังก์ชันเปิด modal สำหรับดูหรือแก้ไข template
function openModal(templateId, action) {
    console.log("openModal called for templateId:", templateId);

    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const commandOutput = document.getElementById("command-output");
    const editArea = document.getElementById("edit-area");
    const saveButton = document.querySelector(".btn-save");

    // ตรวจสอบว่าองค์ประกอบมีอยู่จริงใน DOM หรือไม่
    if (!modal || !modalTitle || !commandOutput || !editArea) {
        console.error("One or more elements not found!");
        return;
    }

    // ดึงข้อมูลจาก API `/viewtemplate/${templateId}`
    fetch(`/viewtemplate/${templateId}`)
    .then(response => response.json())
    .then(data => {
        if (data.template_name) {
            modalTitle.textContent = `${data.template_name} Details`; // Use the actual template name
        } else {
            modalTitle.textContent = `Template Details`; // Fallback if no name exists
        }

        if (action === "Visit") {
            commandOutput.style.display = "block";
            editArea.style.display = "none";
            saveButton.style.display = "none";

            document.getElementById("template-details").textContent = data.content || "No content available.";
        } else if (action === "Edit") {
            commandOutput.style.display = "none";
            editArea.style.display = "block";
            saveButton.style.display = "block";

            document.getElementById("edit-textarea").value = data.content || "";

            saveButton.onclick = function () {
                const updatedContent = document.getElementById("edit-textarea").value;

                fetch(`/updatetemplate/${templateId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content: updatedContent }),
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error("Failed to update template.");
                        }
                        return response.json();
                    })
                    .then(() => {
                        showSuccessModal("Template Updated Successfully!");
                        closeModal();
                    })
                    .catch(error => {
                        console.error("Error updating template:", error);
                        showErrorModal("Failed to update template.");
                    });
            };
        }

        modal.style.display = "flex";
    })
    .catch(error => {
        console.error("Error fetching template details:", error);
        showErrorModal("Failed to load template details.");
    });
}



let templateToDelete = null; // Variable to store the template ID temporarily

function deleteTemplate(templateId, templateName) {
    console.log("Template ID:", templateId);
    console.log("Template Name:", templateName); // Debugging

    // Store the template ID to be used later when confirmed
    templateToDelete = templateId;

    // Display the custom confirmation modal
    const confirmationModal = document.getElementById("confirmationModal");
    const confirmationMessage = document.getElementById("confirmationMessage");

    if (confirmationModal && confirmationMessage) {
        confirmationMessage.textContent = `Are you sure you want to delete the template \n " ${templateName} " ?`;
        confirmationModal.style.display = "flex";
    }
}

function confirmDelete() {
    if (!templateToDelete) return; // Ensure the template ID is available

    // Send delete request to the server
    fetch(`/deletetemplate/${templateToDelete}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            showSuccessModal("Template deleted successfully!"); // Show success modal
            refreshTemplateList(); // Refresh the table
        } else {
            response.json().then(data => {
                const errorMessage = data.error || "Failed to delete template.";
                showErrorModal(errorMessage); // Show error modal
            }).catch(() => {
                showErrorModal("Failed to delete template."); // Fallback error modal
            });
        }
    })
    .catch(error => {
        console.error("Error deleting template:", error);
        showErrorModal("Failed to delete template."); // Show error modal on fetch error
    })
    .finally(() => {
        closeConfirmationModal(); // Close the confirmation modal
        templateToDelete = null; // Reset the stored template ID
    });
}



function refreshTemplateList() {
    const templateTableBody = document.getElementById("template-table-body");

    if (!templateTableBody) {
        console.error("Table body element not found!");
        return; // หยุดการทำงานหากไม่พบ element
    }

    fetch('/api/templates')  // สมมติว่า API คืนค่า JSON
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetched updated templates:", data);
            templateTableBody.innerHTML = ''; // ล้างข้อมูลเก่าออกจากตาราง

            data.templates.forEach(template => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td style="display: none;">${template.id}</td>
                    <td>${template.template_name}</td>
                    <td>${template.description}</td>
                    <td>${template.type}</td>
                    <td>${template.last_updated}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-view" onclick="openModal('${template.id}', 'Visit')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-edit" onclick="openModal('${template.id}', 'Edit')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" onclick="deleteTemplate('${template.id}', '${template.template_name.replace(/'/g, "\\'")}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                templateTableBody.appendChild(row);
            });

            // บังคับ Font Awesome ให้ render ไอคอนใหม่
            if (window.FontAwesome) {
                window.FontAwesome.dom.i2svg();
            }
        })
        .catch(error => {
            console.error("Error refreshing template list:", error);
            showErrorModal(`Failed to refresh template list. Error: ${error}`);
        });
}



// ฟังก์ชันสำหรับปิด modal
function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) {
        modal.style.display = "none";  // ซ่อน modal
    }
}

// ฟังก์ชันนี้จะทำให้ปุ่มปิดใน modal ทำงานได้
document.addEventListener("DOMContentLoaded", function() {
    const closeButton = document.querySelector(".close");
    if (closeButton) {
        closeButton.addEventListener("click", closeModal);  // เมื่อคลิกปุ่มปิดให้ซ่อน modal
    }
    console.log("DOM fully loaded and parsed.");
});
