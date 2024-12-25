// Get modal elements
const modal = document.getElementById('configModal');
const modalContent = document.getElementById('configDetails');
const closeModal = document.querySelector('.close');

// Sample configuration details
const sampleConfig = `
Building configuration...

Current configuration : 2814 bytes
!
! Last configuration change at 02:26:19 UTC Mon Nov 18 2024
!
version 15.2
service timestamps debug datetime msec
service timestamps log datetime msec
no service password-encryption
service compress-config
!
hostname Switch
!
boot-start-marker
boot-end-marker
!
no aaa new-model
!
`;

// Add click event to "eye" icons
document.querySelectorAll('.info-icon span').forEach(icon => {
    icon.addEventListener('click', () => {
        modal.style.display = 'block';
        modalContent.textContent = sampleConfig;
    });
});

// Close modal on clicking the 'X' icon
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Close modal on clicking outside the modal content
window.addEventListener('click', event => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});