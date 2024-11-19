// Open and close modal
function openModal(switchName, ipAddress) {
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    modalTitle.textContent = `${switchName} (${ipAddress}) Details`;
    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("modal");
    modal.style.display = "none";
}

// Dropdown toggle for multiple dropdowns
document.addEventListener("DOMContentLoaded", () => {
    const dropdowns = document.querySelectorAll(".dropdown-check-list");
    dropdowns.forEach((dropdown) => {
        const anchor = dropdown.querySelector(".anchor");
        const dropdownList = dropdown.querySelector("ul.items");
        const checkboxes = dropdownList.querySelectorAll("input[type='checkbox']");

        // Update label to show selected items
        const updateLabel = () => {
            const selected = Array.from(checkboxes)
                .filter((checkbox) => checkbox.checked)
                .map((checkbox) => checkbox.parentElement.textContent.trim());
            anchor.textContent = selected.length
                ? selected.join(", ")
                : "Select Interface Ports";
        };

        // Toggle dropdown visibility
        anchor.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownList.style.display =
                dropdownList.style.display === "block" ? "none" : "block";
        });

        // Update label when checkboxes are toggled
        checkboxes.forEach((checkbox) =>
            checkbox.addEventListener("change", updateLabel)
        );
    });

    // Close all dropdowns when clicking outside
    document.addEventListener("click", () => {
        document.querySelectorAll(".dropdown-check-list ul.items").forEach((list) => {
            list.style.display = "none";
        });
    });
});

// Show or hide dropdown based on checkbox
function toggleDropdown(dropdownId, checkbox) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.style.display = checkbox.checked ? "block" : "none";
}
