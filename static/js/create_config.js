let vlanCounter = 1; // Counter for VLAN rows

// Add New VLAN Row
document.getElementById("add-vlan-row").addEventListener("click", function () {
    vlanCounter++;
    const vlanRows = document.getElementById("vlan-rows");

    const newVlanRow = document.createElement("div");
    newVlanRow.className = "vlan-row";
    newVlanRow.innerHTML = `
        <label for="vlan-id-${vlanCounter}">VLAN ID</label>
        <input type="number" id="vlan-id-${vlanCounter}" name="vlan-id[]" placeholder="Enter VLAN ID" min="1" max="4094" required>

        <label for="vlan-name-${vlanCounter}">VLAN Name</label>
        <input type="text" id="vlan-name-${vlanCounter}" name="vlan-name[]" placeholder="Enter VLAN Name" required>

        <label for="vlan-IP-${vlanCounter}">IP Address VLAN</label>
        <input type="text" id="vlan-IP-${vlanCounter}" name="vlan-IP[]" placeholder="Enter IP Address VLAN" required>

        <button type="button" class="remove-vlan-row" style="width: auto;">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;

    // Add event listener to the remove button
    newVlanRow.querySelector(".remove-vlan-row").addEventListener("click", function () {
        handleRemoveVlanRow(this);
    });

    vlanRows.appendChild(newVlanRow);
});

// Handle Remove VLAN Row
function handleRemoveVlanRow(button) {
    button.closest(".vlan-row").remove(); // Remove VLAN row immediately
}

// Add Event Listeners to Existing Remove Buttons (On Page Load)
document.addEventListener("DOMContentLoaded", () => {
    const defaultRemoveButtons = document.querySelectorAll(".remove-vlan-row");
    defaultRemoveButtons.forEach(button => {
        button.addEventListener("click", function () {
            handleRemoveVlanRow(this);
        });
    });
});



let interfaceCounter = 1;

// Add Event Listeners to Existing Remove Buttons (On Page Load)
document.addEventListener("DOMContentLoaded", () => {
    const defaultRemoveButtons = document.querySelectorAll(".remove-interface-config");
    defaultRemoveButtons.forEach(button => {
        button.addEventListener("click", function () {
            handleRemoveInterfaceConfig(this);
        });
    });

    // Initialize "No Switchmode" checkboxes
    const noSwitchCheckboxes = document.querySelectorAll("input[id^='no-switch-']");
    noSwitchCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", function () {
            toggleSwitchMode(this);
        });
        toggleSwitchMode(checkbox); // Set initial visibility
    });
});

// Add New Interface Configuration
document.getElementById("add-interface-config").addEventListener("click", function () {
    const interfaceCounter = document.querySelectorAll(".interface-config").length + 1;
    const interfaceConfigs = document.getElementById("interface-configs");

    const newConfig = document.createElement("div");
    newConfig.className = "interface-config";
    newConfig.innerHTML = `
        <form class="interface-config-form">
            <label>
                <input type="checkbox" id="no-switch-${interfaceCounter}" onchange="toggleSwitchMode(this)"> No Switchmode
            </label>
            <label for="interface-port-${interfaceCounter}">Interface Port:</label>
            <select id="interface-port-${interfaceCounter}" name="interface-port">
                <option value="">--Select Port--</option>
                <option value="GigabitEthernet0/1">GigabitEthernet0/1</option>
                <option value="GigabitEthernet0/2">GigabitEthernet0/2</option>
            </select>

            <span>to</span>
            <select id="interface-port-range-${interfaceCounter}" name="interface-port-range">
                <option value="">--Select Port (Optional)--</option>
                <option value="GigabitEthernet0/1">GigabitEthernet0/1</option>
                <option value="GigabitEthernet0/2">GigabitEthernet0/2</option>
            </select>

            <div class="Description IP" id="ip-single-${interfaceCounter}" style="display: none;">
                <label for="interface-ip-${interfaceCounter}">IP Address:</label>
                <input type="text" id="interface-ip-${interfaceCounter}" name="interface-ip" placeholder="Enter IP Address">
            </div>

            <div class="Description IP" id="Description_ip-${interfaceCounter}">
                <label for="Description-ip-${interfaceCounter}">Description</label>
                <input type="text" id="Description-ip-${interfaceCounter}" name="Description-IP ADD" placeholder="Enter Description Port">
            </div>

            <div class="switch-mode-section" id="switch-mode-section-${interfaceCounter}">
                <label for="switch-mode-${interfaceCounter}">Switch Mode:</label>
                <select id="switch-mode-${interfaceCounter}" name="switch-mode">
                    <option value="access">Access</option>
                    <option value="trunk">Trunk</option>
                </select>
            </div>
            <br>
            <button type="button" class="remove-interface-config">Remove Configuration</button>
        </form>
    `;

    // Attach event listener for "Remove Configuration" button
    newConfig.querySelector(".remove-interface-config").addEventListener("click", function () {
        newConfig.remove();
    });

    // Attach toggleSwitchMode functionality for the "No Switchmode" checkbox
    const noSwitchCheckbox = newConfig.querySelector(`#no-switch-${interfaceCounter}`);
    noSwitchCheckbox.addEventListener("change", function () {
        toggleSwitchMode(this);
    });

    interfaceConfigs.appendChild(newConfig);
});

// Save All Configurations
document.getElementById("save-interface-configs").addEventListener("click", function () {
    const configs = [];
    document.querySelectorAll(".interface-config-form").forEach(form => {
        const formData = new FormData(form);
        const config = {
            interfacePort: formData.get("interface-port"),
            interfacePortRange: formData.get("interface-port-range"),
            ip: formData.get("interface-ip"),
            description: formData.get("Description-IP ADD"),
            switchMode: formData.get("no-switch") ? "No SW" : formData.get("switch-mode")
        };
        configs.push(config);
    });
    console.log("Saved Configurations:", configs);
    alert("Configurations Saved!");
});

// Function to toggle visibility of IP Address and Description based on "No Switchmode" checkbox
function toggleSwitchMode(checkbox) {
    const form = checkbox.closest(".interface-config-form");
    const switchModeSection = form.querySelector(".switch-mode-section");
    const ipAddressField = form.querySelector("input[name='interface-ip']").closest("div");
    const descriptionField = form.querySelector("input[name='Description-IP ADD']").closest("div");

    if (checkbox.checked) {
        // Hide the "Switch Mode" dropdown
        switchModeSection.style.display = "none";

        // Show the "IP Address" and "Description" fields
        ipAddressField.style.display = "block";
        descriptionField.style.display = "block";
    } else {
        // Show the "Switch Mode" dropdown
        switchModeSection.style.display = "block";

        // Hide the "IP Address" field but show the "Description" field
        ipAddressField.style.display = "none";
        descriptionField.style.display = "block";
    }
}

// Add Event Listeners to the "No Switchmode" checkboxes
document.addEventListener("DOMContentLoaded", () => {
    const noSwitchCheckboxes = document.querySelectorAll("input[id^='no-switch-']");
    noSwitchCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", function () {
            toggleSwitchMode(this);
        });

        // Initialize the state based on the current checkbox value
        toggleSwitchMode(checkbox);
    });
});


