$(document).ready(function () {
    // Global variables to store last selected devices and commands for download
    let lastSelectedDevices = [];
    let lastSelectedCommands = [];

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

        // Disable scrolling
        document.body.classList.add('no-scroll');

        // Add event listener to close the modal
        const closeErrorModal = document.getElementById('closeErrorModal');
        closeErrorModal.onclick = () => {
            errorModal.style.display = 'none';
            document.body.classList.remove('no-scroll'); // Restore scrolling
        };
    }

    // Open Modal with Animation
    function openModalWithAnimation() {
        const modal = document.getElementById('previewModal');
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        document.body.classList.add('no-scroll'); // Disable scrolling

        // Animate modal fade-in
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 100);
    }

    // Close Modal with Overlay (make this globally accessible)
    window.closeModal = function () {
        const previewModal = document.getElementById('previewModal');
        const errorModal = document.getElementById('errorModal');
        previewModal.style.display = 'none';
        errorModal.style.display = 'none';
        document.body.classList.remove('no-scroll'); // Enable scrolling
    };

    // Initialize Select2 for the dropdown
    $('#command-select').select2({
        placeholder: "Select Commands",
        allowClear: true,
        width: 'resolve' // Ensure proper width handling
    });

    // "Select All" functionality for checkboxes
    $('#select-all').on('change', function () {
        $('.device-checkbox').prop('checked', $(this).is(':checked'));
    });

    // Apply button event (for Preview)
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

        // Store selections globally (used later in Download)
        lastSelectedDevices = selectedDevices;
        lastSelectedCommands = selectedCommands;

        // Show loading modal
        const loadingModal = document.getElementById('loadingModal');
        loadingModal.style.display = 'flex';
        document.body.classList.add('no-scroll'); // Disable scrolling

        // AJAX call for Preview mode (no mode parameter)
        $.ajax({
            url: '/api/save_send_command_save',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ devices: selectedDevices, commands: selectedCommands }),
            success: function (response) {
                loadingModal.style.display = 'none'; // Hide loading modal
                document.body.classList.remove('no-scroll'); // Enable scrolling

                // Expected response is JSON with property "output"
                document.getElementById('outputPreview').textContent = response.output;
                openModalWithAnimation(); // Show modal with animation
            },
            error: function (xhr) {
                loadingModal.style.display = 'none';
                document.body.classList.remove('no-scroll'); // Enable scrolling
                const errorMessage = xhr.responseJSON?.error || "An unexpected error occurred.";
                showErrorModal("Error Sending Commands", errorMessage);
            }
        });
    });

    // Download button event (for Download mode)
    document.getElementById('downloadOutput').addEventListener('click', function () {
        // Show loading modal during download request
        const loadingModal = document.getElementById('loadingModal');
        loadingModal.style.display = 'flex';
        document.body.classList.add('no-scroll');

        $.ajax({
            url: '/api/save_send_command_save?mode=download',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ devices: lastSelectedDevices, commands: lastSelectedCommands }),
            xhrFields: { responseType: 'blob' },
            success: function (response, status, xhr) {
                loadingModal.style.display = 'none'; // Hide loading modal after response
                document.body.classList.remove('no-scroll');
                // response is a Blob (ZIP file)
                const blob = response;
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                // Get filename from Content-Disposition header if available, else use default
                link.download = xhr.getResponseHeader('Content-Disposition')?.split('filename=')[1] || 'output.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },
            error: function (xhr) {
                loadingModal.style.display = 'none';
                document.body.classList.remove('no-scroll');
                const errorMessage = xhr.responseJSON?.error || "An unexpected error occurred.";
                showErrorModal("Error Downloading File", errorMessage);
            }
        });
    });

    // Ensure modals are hidden initially
    document.getElementById('loadingModal').style.display = 'none';
    document.getElementById('previewModal').style.display = 'none';

    // Initialize Custom Dropdown
    function initializeCustomDropdown() {
        const dropdown = document.querySelector('#custom-command-select');
        const selected = dropdown.querySelector('.dropdown-selected');
        const options = dropdown.querySelector('.dropdown-options');
        let selectedValues = [];

        // Toggle dropdown visibility
        selected.addEventListener('click', () => {
            dropdown.classList.toggle('active');
        });

        // Handle item selection
        options.addEventListener('click', (event) => {
            const item = event.target.closest('.dropdown-item');
            if (!item) return;

            const value = item.getAttribute('data-value');
            const text = item.textContent;

            if (selectedValues.includes(value)) {
                // Deselect
                selectedValues = selectedValues.filter((v) => v !== value);
                item.style.backgroundColor = '';
                item.style.color = '';
            } else {
                // Select
                selectedValues.push(value);
                item.style.backgroundColor = '#007bff';
                item.style.color = '#fff';
            }

            // Update selected text
            selected.textContent = selectedValues.length > 0 ? selectedValues.join(', ') : 'Select Commands';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    // Initialize the custom dropdown
    initializeCustomDropdown();
});
