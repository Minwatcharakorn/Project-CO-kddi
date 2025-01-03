document.addEventListener("DOMContentLoaded", () => {
    const saveButtonVLAN = document.getElementById("save-vlan-config");
    const cancelButtonVLAN = document.getElementById("cancel-vlan-config");
    const vlanForm = document.getElementById("vlan-multiple-form");
    const addVLANButton = document.getElementById("add-vlan-row");
    const vlanRowsContainer = document.getElementById("vlan-rows");

    // Regular Expression for IPv4 Address Validation
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // Save VLAN Configuration
    saveButtonVLAN.addEventListener("click", () => {
        const vlanRows = document.querySelectorAll(".vlan-row");
        let allValid = true;

        vlanRows.forEach(row => {
            const vlanID = row.querySelector('input[name="vlan-id[]"]');
            const vlanIP = row.querySelector('input[name="vlan-IP[]"]');

            // Validate VLAN ID
            if (vlanID.value < 1 || vlanID.value > 4094) {
                alert(`Invalid VLAN ID: ${vlanID.value}. VLAN ID must be between 1 and 4094.`);
                allValid = false;
                return;
            }

            // Validate IPv4 Address
            if (!ipv4Regex.test(vlanIP.value)) {
                alert(`Invalid IPv4 Address: ${vlanIP.value}. Please enter a valid IPv4 address.`);
                allValid = false;
                return;
            }
        });

        if (!allValid) return;

        // Lock all fields
        vlanRows.forEach(row => {
            const inputs = row.querySelectorAll("input");
            inputs.forEach(input => {
                input.disabled = true;
            });
        });

        saveButtonVLAN.style.display = "none";
        cancelButtonVLAN.style.display = "inline-block";
        addVLANButton.disabled = true; // Disable "Add VLAN" button
    });

    // Cancel VLAN Configuration
    cancelButtonVLAN.addEventListener("click", () => {
        const vlanRows = document.querySelectorAll(".vlan-row");

        // Unlock all fields
        vlanRows.forEach(row => {
            const inputs = row.querySelectorAll("input");
            inputs.forEach(input => {
                input.disabled = false;
            });
        });

        saveButtonVLAN.style.display = "inline-block";
        cancelButtonVLAN.style.display = "none";
        addVLANButton.disabled = false; // Enable "Add VLAN" button
    });

    // Add VLAN Row
    addVLANButton.addEventListener("click", () => {
        const vlanCounter = document.querySelectorAll(".vlan-row").length + 1;
        const newVLANRow = document.createElement("div");
        newVLANRow.className = "vlan-row form-group";
        newVLANRow.innerHTML = `
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
        vlanRowsContainer.appendChild(newVLANRow);
    });

    // Event Delegation for Removing VLAN Rows
    vlanRowsContainer.addEventListener("click", (event) => {
        if (event.target.classList.contains("remove-vlan-row") || event.target.closest(".remove-vlan-row")) {
            const vlanRow = event.target.closest(".vlan-row");
            if (vlanRow) {
                vlanRow.remove();
            }
        }
    });
});

let interfaceCounter = 1;

// Add New Interface Configuration
document.getElementById("add-interface-config").addEventListener("click", function () {
    const interfaceConfigs = document.getElementById("interface-configs");
    const newConfig = document.createElement("div");
    newConfig.className = "interface-config";
    newConfig.innerHTML = `
        <form class="config-form">
            <!-- Dropdown for Port Selection -->    
            <label for="interface-port-select-${interfaceCounter}" style="font-weight: bold;">Select Ports</label>
            <select id="interface-port-select-${interfaceCounter}" class="interface-port-select" multiple="multiple" style="width: 100%;"></select>
            <br><br>

            <!-- Description -->
            <div class="Description-IP">
                <label for="description-${interfaceCounter}" style="font-weight: bold;">Description</label>
                <input type="text" id="description-${interfaceCounter}" name="description" placeholder="Enter Description">
            </div>

            <!-- Switch Mode -->
            <div class="switch-mode-section">
                <label for="switch-mode-${interfaceCounter}" style="font-weight: bold;">Switch Mode</label>
                <select id="switch-mode-${interfaceCounter}" name="switch-mode">
                    <option value="access">Access</option>
                    <option value="trunk">Trunk</option>
                </select>
            </div>

            <!-- VLAN ID Section -->
            <div class="vlan-id-section" id="vlan-id-section-${interfaceCounter}">
                <label for="vlan-id-input-${interfaceCounter}" style="font-weight: bold;">VLAN ID</label>
                <input type="number" id="vlan-id-input-${interfaceCounter}" name="vlan-id" placeholder="Enter VLAN ID" min="1" max="4094">
            </div>

            <!-- Trunk Allowed VLANs Section -->
            <div class="vlan-trunk-section" id="vlan-trunk-section-${interfaceCounter}" style="display: none;">
                <label for="trunk-allowed-vlan-${interfaceCounter}" style="font-weight: bold;">Allowed VLANs</label>
                <input type="text" id="trunk-allowed-vlan-${interfaceCounter}" name="trunk-allowed-vlan" placeholder="e.g., 20,30,40 or all">
            </div>

            <!-- Remove Button -->
            <button type="button" class="remove-interface-config styled-button" style="background-color: #dc3545; color: white;">Remove Configuration</button>
        </form>
        <hr style="margin-top: 20px; border: none; border-top: 1px solid #ccc;">
    `;
    interfaceConfigs.appendChild(newConfig);

    // Initialize Dropdown and Switch Mode
    initializeDropdown(interfaceCounter);
    initializeSwitchModeToggle(interfaceCounter);

    // Remove Configuration Button
    initializeRemoveButton(newConfig);
    
    document.body.style.overflow = "hidden";

    const container = document.querySelector(".content");
    container.style.overflowY = "scroll";

    interfaceCounter++;
});

let selectedPortsGlobal = []; // เก็บพอร์ตที่ถูกเลือกไว้ในทุก config


// Initialize Select2 Dropdown for Ports
// Initialize Select2 Dropdown for Ports
function initializeDropdown(counter) {
    const selectElement = document.getElementById(`interface-port-select-${counter}`);
    $(selectElement).select2({
        placeholder: "Select Ports",
        allowClear: true
    });

    // Define port groups
    const portGroups = [
        { name: "Fixed Chassis", range: generatePorts("GigabitEthernet0/", 48) },
        { name: "Modular Chassis", range: generatePorts("GigabitEthernet1/0/", 48) },
        { name: "TenGigabitEthernet", range: generatePorts("TenGigabitEthernet0/", 8) }
    ];

    // Populate ports in dropdown
    portGroups.forEach(group => {
        const groupOption = new Option(group.name, '', false, false);
        $(groupOption).attr('disabled', 'disabled');
        $(selectElement).append(groupOption);

        group.range.forEach(port => {
            const isDisabled = selectedPortsGlobal.includes(port); // Check if port is already selected
            const portOption = new Option(port, port, false, false);
            if (isDisabled) {
                $(portOption).attr('disabled', 'disabled'); // Disable if already selected
            }
            $(selectElement).append(portOption);
        });
    });

    // Update global ports list when selection changes
    $(selectElement).on("select2:select", function (e) {
        const selectedPort = e.params.data.id;
        if (!selectedPortsGlobal.includes(selectedPort)) {
            selectedPortsGlobal.push(selectedPort);
        }
        refreshPortAvailability(); // Refresh other dropdowns
    });

    $(selectElement).on("select2:unselect", function (e) {
        const unselectedPort = e.params.data.id;
        const index = selectedPortsGlobal.indexOf(unselectedPort);
        if (index > -1) {
            selectedPortsGlobal.splice(index, 1);
        }
        refreshPortAvailability(); // Refresh other dropdowns
    });
}


// Generate port ranges dynamically
function generatePorts(prefix, count) {
    return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
}

function refreshPortAvailability() {
    document.querySelectorAll(".interface-port-select").forEach(select => {
        const selectElement = $(select);
        const selectedValues = selectElement.val() || []; // Get currently selected values
        selectElement.find("option").each(function () {
            const port = $(this).val();
            if (port && selectedPortsGlobal.includes(port) && !selectedValues.includes(port)) {
                $(this).attr("disabled", "disabled"); // Disable if already selected globally
            } else {
                $(this).removeAttr("disabled"); // Enable if not globally selected
            }
        });
        selectElement.trigger("change.select2"); // Refresh Select2 UI
    });
}

// Handle Switch Mode Toggle
function initializeSwitchModeToggle(counter) {
    const switchMode = document.getElementById(`switch-mode-${counter}`);
    const vlanSection = document.getElementById(`vlan-id-section-${counter}`);
    const trunkSection = document.getElementById(`vlan-trunk-section-${counter}`);

    switchMode.addEventListener("change", function () {
        if (this.value === "access") {
            vlanSection.style.display = "block";
            trunkSection.style.display = "none";
        } else {
            vlanSection.style.display = "none";
            trunkSection.style.display = "block";
        }
    });
}

// Remove Configuration
function initializeRemoveButton(newConfig) {
    const removeButton = newConfig.querySelector(".remove-interface-config");
    removeButton.addEventListener("click", function () {
        // Remove selected ports from global list
        const selectElement = newConfig.querySelector(".interface-port-select");
        const selectedPorts = $(selectElement).val(); // Get selected ports
        if (selectedPorts) {
            selectedPorts.forEach(port => {
                const index = selectedPortsGlobal.indexOf(port);
                if (index > -1) {
                    selectedPortsGlobal.splice(index, 1); // Remove port from global list
                }
            });
        }

        // Remove configuration element
        newConfig.remove();

        // Refresh dropdown availability for all remaining configurations
        refreshPortAvailability();
    });
}

// Save All Configurations
document.getElementById("save-interface-configs").addEventListener("click", function () {
    const configs = [];
    document.querySelectorAll(".config-form").forEach(form => {
        const selectedPorts = $(form.querySelector(".interface-port-select")).val();
        const description = form.querySelector("input[name='description']").value;
        const switchMode = form.querySelector("select[name='switch-mode']").value;

        configs.push({
            ports: selectedPorts,
            description: description,
            mode: switchMode
        });
    });

    console.log("Saved Configurations:", configs);
    alert("Configurations Saved Successfully!");
});

// Handle NTP Form Submission
document.querySelector("#ntp-config form").addEventListener("submit", function (e) {
    e.preventDefault();

    const ntpServer = document.getElementById("ntp-server").value;
    const clockTimezone = document.getElementById("clock-timezone").value;

    const ntpConfig = {
        server: ntpServer,
        timezone: clockTimezone,
    };

    console.log("Submitted NTP Configuration:", ntpConfig);

    // Optional: Add logic to send configuration to the server or apply to switch
    alert(`NTP Server: ${ntpServer}\nClock Timezone: ${clockTimezone}\nConfiguration Saved!`);
});

document.addEventListener("DOMContentLoaded", () => {
    const saveButton = document.getElementById("save-template");
    const cancelButton = document.getElementById("cancel-template");
    const templateName = document.getElementById("template-name");
    const templateDescription = document.getElementById("template-description");

    saveButton.addEventListener("click", () => {
        if (templateName.value.trim() === "" || templateDescription.value.trim() === "") {
            alert("Please fill out all fields!");
            return;
        }
        templateName.disabled = true;
        templateDescription.disabled = true;
        saveButton.style.display = "none";
        cancelButton.style.display = "inline-block";
    });

    cancelButton.addEventListener("click", () => {
        templateName.disabled = false;
        templateDescription.disabled = false;
        templateName.value = ""; // Optional: clear the input
        templateDescription.value = ""; // Optional: clear the input
        cancelButton.style.display = "none";
        saveButton.style.display = "inline-block";
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const saveButtonHostname = document.getElementById("save-hostname");
    const cancelButtonHostname = document.getElementById("cancel-hostname");
    const hostnameInput = document.getElementById("hostname-input");

    saveButtonHostname.addEventListener("click", () => {
        if (hostnameInput.value.trim() === "") {
            alert("Please enter a hostname!");
            return;
        }
        hostnameInput.disabled = true;
        saveButtonHostname.style.display = "none";
        cancelButtonHostname.style.display = "inline-block";
    });

    cancelButtonHostname.addEventListener("click", () => {
        hostnameInput.disabled = false;
        hostnameInput.value = ""; // Optional: Clear the input if needed
        cancelButtonHostname.style.display = "none";
        saveButtonHostname.style.display = "inline-block";
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const saveButtonVTP = document.getElementById("save-vtp-config");
    const cancelButtonVTP = document.getElementById("cancel-vtp-config");
    const vtpForm = document.getElementById("vtp-form");

    // Save VTP Configuration
    saveButtonVTP.addEventListener("click", () => {
        const vtpDomain = document.getElementById("vtp-domain");
        const vtpPassword = document.getElementById("vtp-password");

        // Validate VTP Domain Name and Password
        if (vtpDomain.value.trim() === "") {
            alert("VTP Domain Name cannot be empty!");
            return;
        }

        if (vtpPassword.value.trim() === "") {
            alert("VTP Password cannot be empty!");
            return;
        }

        // Lock all fields
        const inputs = vtpForm.querySelectorAll("input, select");
        inputs.forEach(input => {
            input.disabled = true;
        });

        saveButtonVTP.style.display = "none";
        cancelButtonVTP.style.display = "inline-block";
    });

    // Cancel VTP Configuration
    cancelButtonVTP.addEventListener("click", () => {
        const inputs = vtpForm.querySelectorAll("input, select");
        inputs.forEach(input => {
            input.disabled = false;
        });

        saveButtonVTP.style.display = "inline-block";
        cancelButtonVTP.style.display = "none";
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const saveButton = document.getElementById("save-gateway-config");
    const cancelButton = document.getElementById("cancel-gateway-config");
    const gatewayForm = document.getElementById("gateway-form");

    // Save Gateway Configuration
    saveButton.addEventListener("click", () => {
        const gatewayInput = document.getElementById("default-gateway");
        const gatewayValue = gatewayInput.value.trim();

        // Regular Expression for IPv4 validation
        const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/;

        if (!ipv4Regex.test(gatewayValue)) {
            alert("Please enter a valid IPv4 address (e.g., 192.168.1.1).");
            return;
        }

        // Lock all fields
        const inputs = gatewayForm.querySelectorAll("input, select");
        inputs.forEach(input => {
            input.disabled = true;
        });

        saveButton.style.display = "none";
        cancelButton.style.display = "inline-block";
    });

    // Cancel Gateway Configuration
    cancelButton.addEventListener("click", () => {
        const inputs = gatewayForm.querySelectorAll("input, select");
        inputs.forEach(input => {
            input.disabled = false;
        });

        saveButton.style.display = "inline-block";
        cancelButton.style.display = "none";
    });
});
