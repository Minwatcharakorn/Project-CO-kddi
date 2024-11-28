const switches = [
    { name: "ASW-B409", ip: "192.168.1.19", model: "C9200-24PB", status: "Active" },
    { name: "ASW-B402_IT-A", ip: "192.168.1.150", model: "C9200-24PXG", status: "Inactive" },
    { name: "ASW-B402_IT-B", ip: "192.168.1.254", model: "C9200-48PB", status: "Active" }
];

// Handle firmware checkbox selection
document.querySelectorAll('.firmware-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const firmwareName = checkbox.dataset.firmware;

        if (checkbox.checked) {
            // Create a card for firmware details
            const card = document.createElement('div');
            card.classList.add('card');
            card.id = `card-${firmwareName}`;

            card.innerHTML = `
                <h3>${firmwareName} Details</h3>
                <p>${firmwareName} - Comprehensive information about this firmware version.</p>
                <table>
                    <thead>
                        <tr>
                            <th>Select</th>
                            <th>Hostname</th>
                            <th>IP Address</th>
                            <th>Model</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${switches
                            .map(
                                switchData => `
                        <tr>
                            <td><input type="checkbox" class="switch-checkbox" data-switch="${switchData.name}" data-firmware="${firmwareName}"></td>
                            <td>${switchData.name}</td>
                            <td>${switchData.ip}</td>
                            <td>${switchData.model}</td>
                            <td>${switchData.status}</td>
                        </tr>`
                            )
                            .join('')}
                    </tbody>
                </table>
            `;

            document.getElementById('switch-section').appendChild(card);
        } else {
            // Remove card when firmware is deselected
            const card = document.getElementById(`card-${firmwareName}`);
            if (card) card.remove();
        }
    });
});

// Select All functionality
const selectAllCheckbox = document.getElementById('select-all-checkbox');
const firmwareCheckboxes = document.querySelectorAll('.firmware-checkbox');

selectAllCheckbox.addEventListener('change', () => {
    firmwareCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;

        // Trigger the change event for each checkbox to show/hide the corresponding tables
        checkbox.dispatchEvent(new Event('change'));
    });
});

// Ensure a switch cannot be selected in multiple firmware tables simultaneously
document.addEventListener('change', (event) => {
    if (event.target.classList.contains('switch-checkbox')) {
        const selectedSwitch = event.target.dataset.switch;
        const currentFirmware = event.target.dataset.firmware;

        if (event.target.checked) {
            // Disable the same switch from other firmware tables
            document.querySelectorAll(`.switch-checkbox[data-switch="${selectedSwitch}"]`).forEach(otherCheckbox => {
                if (otherCheckbox.dataset.firmware !== currentFirmware) {
                    otherCheckbox.disabled = true; // Disable
                }
            });
        } else {
            // Enable the same switch in other firmware tables when unchecked
            document.querySelectorAll(`.switch-checkbox[data-switch="${selectedSwitch}"]`).forEach(otherCheckbox => {
                if (otherCheckbox.dataset.firmware !== currentFirmware) {
                    otherCheckbox.disabled = false; // Enable
                }
            });
        }
    }
});

// Apply button functionality
document.querySelector('.apply-button').addEventListener('click', () => {
    const selectedSwitches = [];

    document.querySelectorAll('.firmware-checkbox:checked').forEach(firmwareCheckbox => {
        const firmwareName = firmwareCheckbox.dataset.firmware;
        const firmwareRow = firmwareCheckbox.closest('tr');
        const firmwareVersion = firmwareRow.querySelector('td:nth-child(3)').textContent;

        // Collect switches related to the selected firmware
        document.querySelectorAll(`.switch-checkbox[data-firmware="${firmwareName}"]:checked`).forEach(switchCheckbox => {
            const switchRow = switchCheckbox.closest('tr');
            const switchData = {
                name: switchRow.querySelector('td:nth-child(2)').textContent,
                ip: switchRow.querySelector('td:nth-child(3)').textContent,
                model: switchRow.querySelector('td:nth-child(4)').textContent,
                firmware: firmwareName,
                version: firmwareVersion,
            };
            selectedSwitches.push(switchData);
        });
    });

    // Store selections in localStorage
    localStorage.setItem('selectedSwitches', JSON.stringify(selectedSwitches));

    // Redirect to result page
    window.location.href = 'Update_firmware-Pre-deploy.html';
});
