$(document).ready(function () {
    // Function to Show Error Modal
    function showErrorModal(message, description = '') {
        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        const errorDescription = document.querySelector('#errorModal p:nth-of-type(2)');

        // Set the main error message
        errorMessage.textContent = message;

        // Set the secondary description or hide it if not provided
        if (description) {
            errorDescription.textContent = description;
            errorDescription.style.display = 'block';
        } else {
            errorDescription.style.display = 'none';
        }

        // Show the modal
        errorModal.style.display = 'flex';

        // Add event listener to close the modal
        const closeErrorModal = document.getElementById('closeErrorModal');
        closeErrorModal.onclick = () => {
            errorModal.style.display = 'none';
        };
    }

    // Open Modal with Overlay
    function openModal() {
        $('#modalOverlay').fadeIn();
        $('#previewModal').fadeIn();
    }

    // Close Modal with Overlay
    function closeModal() {
        $('#modalOverlay').fadeOut();
        $('#previewModal').fadeOut();
        $('#errorModal').fadeOut();
    }

    $('#command-select').select2({ placeholder: "Select Commands", allowClear: true });

    // "Select All" functionality for checkboxes
    $('#select-all').on('change', function () {
        $('.device-checkbox').prop('checked', $(this).is(':checked'));
    });

    // Apply button event
    $('#apply-button').on('click', function () {
        const selectedCommands = $('#command-select').val();
        const selectedDevices = [];

        $('.device-checkbox:checked').each(function () {
            const row = $(this).closest('tr');
            selectedDevices.push({
                ip: row.find('td').eq(4).text(),
                hostname: row.find('td').eq(3).text()
            });
        });

        if (!selectedCommands || !selectedCommands.length || !selectedDevices.length) {
            showErrorModal("Validation Error", "Please select at least one command and one device.");
            return;
        }

        // Show loading modal and overlay
        $('#modalOverlay').fadeIn();
        $('#loadingModal').fadeIn();

        // Send the data to backend
        $.ajax({
            url: '/api/save_send_command_save',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ devices: selectedDevices, commands: selectedCommands }),
            xhrFields: { responseType: 'blob' },
            success: function (response, status, xhr) {
                $('#loadingModal').fadeOut(); // Hide loading modal
                const blob = new Blob([response], { type: 'text/plain' });
                const reader = new FileReader();

                reader.onload = function () {
                    $('#outputPreview').text(reader.result); // Populate output
                    openModal(); // Show output modal with overlay
                };
                reader.readAsText(blob);

                // Download button handler
                $('#downloadOutput').off('click').on('click', function () {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = xhr.getResponseHeader('Content-Disposition')?.split('filename=')[1] || 'output.txt';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            },
            error: function (xhr) {
                $('#loadingModal').fadeOut();
                $('#modalOverlay').fadeOut();
                const errorMessage = xhr.responseJSON?.error || "An unexpected error occurred.";
                showErrorModal("Error Sending Commands", errorMessage);
            }
        });
    });

    // Close modal and overlay on outside click
    $('#modalOverlay, .close-btn').on('click', closeModal);

    // Ensure modals are hidden initially
    $('#modalOverlay, #loadingModal, #previewModal').hide();
});
