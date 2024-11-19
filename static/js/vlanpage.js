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
