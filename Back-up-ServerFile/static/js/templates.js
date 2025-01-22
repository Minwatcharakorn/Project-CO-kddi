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

document.addEventListener("DOMContentLoaded", function () {
    const closeModalButton = document.getElementById("closeErrorModal");
    if (closeModalButton) {
        closeModalButton.addEventListener("click", closeErrorModal);
    }
});
// ฟังก์ชันเปิด modal สำหรับดูหรือแก้ไข template
function openModal(templateId, action) {
    console.log("openModal called for templateId:", templateId);  // ตรวจสอบการเรียกใช้ฟังก์ชัน

    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const commandOutput = document.getElementById("command-output");
    const editArea = document.getElementById("edit-area");
    const saveButton = document.querySelector(".btn-save");

    // ตรวจสอบว่าองค์ประกอบมีอยู่จริงใน DOM หรือไม่
    if (!modal || !modalTitle || !commandOutput || !editArea) {
        console.error("One or more elements not found!");
        return;  // ออกจากฟังก์ชันหากไม่พบองค์ประกอบ
    }

    modalTitle.textContent = `${templateId} Details`;

    // แสดง modal
    modal.style.display = "flex";

    if (action === "Visit") {
        // เมื่อเป็นการดูข้อมูล
        commandOutput.style.display = "block";  // แสดง command output
        editArea.style.display = "none";  // ซ่อน edit area
        saveButton.style.display = "none";  // ซ่อนปุ่ม Save

        // ดึงข้อมูลจากเซิร์ฟเวอร์เมื่อเป็นการดู
        fetch(`/viewtemplate/${templateId}`)
            .then(response => response.json())
            .then(data => {
                console.log("Fetched data:", data);  // ตรวจสอบข้อมูลที่ได้จากเซิร์ฟเวอร์
                if (data.content) {
                    commandOutput.style.display = "block";  // แสดงพื้นที่สำหรับแสดงข้อมูล
                    document.getElementById("template-details").textContent = data.content;  // แสดงข้อมูลในเทมเพลต
                } else {
                    console.error("Content not found!");
                    document.getElementById("template-details").textContent = "No content available.";
                }
            })
            .catch(error => {
                console.error("Error fetching template content:", error);
                showErrorModal("Failed to load template content.");
            });
    } else if (action === "Edit") {
        // เมื่อเป็นการแก้ไขข้อมูล
        commandOutput.style.display = "none";  // ซ่อน command output
        editArea.style.display = "block";  // แสดง edit area
        saveButton.style.display = "block";  // แสดงปุ่ม Save

        // ดึงข้อมูลจากเซิร์ฟเวอร์เมื่อเป็นการแก้ไข
        fetch(`/viewtemplate/${templateId}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById("edit-textarea").value = data.content;  // เติมเนื้อหาใน textarea
            })
            .catch(error => {
                console.error("Error fetching template content:", error);
                showErrorModal("Failed to load template content.");
            });

        // การบันทึกข้อมูลเมื่อคลิกปุ่ม Save
        saveButton.onclick = function () {
            const updatedContent = document.getElementById("edit-textarea").value;
            console.log("Updated Content:", updatedContent); // คุณสามารถแทนที่ด้วย logic การบันทึกที่แท้จริง

            // ส่งข้อมูลไปบันทึกในฐานข้อมูล
            fetch(`/updatetemplate/${templateId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: updatedContent })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to update template.");
                }
                return response.json();
            })
            .then(data => {
                showErrorModal("Template Updated Successfully!");
                closeModal();  // ปิด modal หลังจากบันทึก
            })
            .catch(error => {
                console.error("Error updating template:", error);
                showErrorModal("Failed to update template.");
            });
        };
    }
}


function deleteTemplate(templateId) {
    const confirmation = confirm(`Are you sure you want to delete template ID ${templateId}?`);

    if (confirmation) {
        // ส่งคำขอลบไปยังเซิร์ฟเวอร์
        fetch(`/deletetemplate/${templateId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                showErrorModal("Template deleted successfully!");
                refreshTemplateList();  // รีเฟรชตารางหลังจากลบ
            } else {
                throw new Error("Failed to delete template.");
            }
        })
        .catch(error => {
            console.error("Error deleting template:", error);
            showErrorModal("Failed to delete template.");
        });
    }
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
                    <td>${template.id}</td>
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
                            <button class="btn-delete" onclick="deleteTemplate('${template.id}')">
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
