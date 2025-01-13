document.getElementById("add-vlan-row").addEventListener("click", function () {
    const vlansConfigs = document.getElementById("vlans-configs");
    const vlanCounter = vlansConfigs.querySelectorAll(".vlan-config-form").length + 1;

    const newVLANForm = document.createElement("div");
    newVLANForm.className = "vlan-config-form";
    newVLANForm.innerHTML = `
        <form class="config-form">
            <div class="inline-fields">
                <div>
                    <label for="vlan-id-${vlanCounter}">VLAN ID</label>
                    <input type="number" id="vlan-id-${vlanCounter}" name="vlan-id[]" placeholder="Enter VLAN ID" min="1" max="4094" required>
                </div>
                <div style="margin-left: -3%;">
                    <label for="vlan-name-${vlanCounter}">VLAN Name</label>
                    <input type="text" id="vlan-name-${vlanCounter}" name="vlan-name[]" placeholder="Enter VLAN Name" required>
                </div>
            </div>

            <div class="alert-box error" id="vlan-id-error-${vlanCounter}" style="display: none;">
                <span>ERROR:</span> VLAN ID must be between 1 and 4094. No decimals or negative values allowed.
            </div>
            <div class="alert-box error" id="vlan-name-error-${vlanCounter}" style="display: none;">
                <span>ERROR:</span> VLAN Name for this entry contains invalid characters. 
            </div>


            <label for="vlan-IP-${vlanCounter}">IP Address VLAN</label>
            <div class="ip-address-container">
                <div class="inline-fields">

                    <input type="text" id="vlan-IP-${vlanCounter}" name="vlan-IP[]" placeholder="___.___.___.___ (e.g., 127.0.0.1)" required>
                    <select id="subnet-mask-${vlanCounter}" name="subnet-mask[]" required></select>
                </div>
                <button type="button" class="remove-vlan-row">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </form>
        <br>
    `;

    // Generate and append subnet mask options
    const subnetMaskDropdown = generateSubnetMaskDropdown(vlanCounter);
    newVLANForm.querySelector("select").append(...subnetMaskDropdown.children);

    vlansConfigs.appendChild(newVLANForm);
    validateVlanId(`vlan-id-${vlanCounter}`, `vlan-id-error-${vlanCounter}`);
    validateVlanNameInput(`vlan-name-${vlanCounter}`, `vlan-name-error-${vlanCounter}`);

    // Apply input mask to the newly added row
    applyIPInputMask();

    // Add event listener to remove VLAN
    newVLANForm.querySelector(".remove-vlan-row").addEventListener("click", function () {
        newVLANForm.remove();
    });
});

function validateVlanNameInput(vlanNameInputId, errorBoxId) {
    const vlanNameInput = document.getElementById(vlanNameInputId);
    const errorBox = document.getElementById(errorBoxId);

    if (!vlanNameInput || !errorBox) {
        console.warn(`Missing input or error box for ID: ${vlanNameInputId}`);
        return;
    }

    vlanNameInput.addEventListener("input", function () {
        const value = this.value.trim();

        const isValid = /^[a-zA-Z0-9!@#$%^&*(),.:{}|<>_-]*$/.test(value) && !value.includes("?");

        if (!isValid) {
            this.style.borderColor = "red"; 
            errorBox.style.display = "flex"; 
        } else {
            this.style.borderColor = ""; 
            errorBox.style.display = "none"; 
        }
    });
}

function validateVlanId(vlanIdInputId, errorBoxId) {
    const vlanIdInput = document.getElementById(vlanIdInputId);
    const errorBox = document.getElementById(errorBoxId);

    vlanIdInput.addEventListener("input", function () {
        const value = this.value.trim();

        // อนุญาตให้ฟิลด์ว่างโดยไม่แสดง Error
        if (value === "") {
            vlanIdInput.style.borderColor = ""; // รีเซ็ตเส้นขอบ
            errorBox.style.display = "none"; // ซ่อนข้อความแจ้งเตือน
            return;
        }

        // ตรวจสอบเงื่อนไข VLAN ID: เป็นตัวเลขเต็มระหว่าง 1-4094
        const isValid = /^\d+$/.test(value) && value >= 1 && value <= 4094;

        if (!isValid) {
            vlanIdInput.style.borderColor = "red"; // เปลี่ยนเส้นขอบเป็นสีแดง
            errorBox.style.display = "flex"; // แสดงข้อความแจ้งเตือน
        } else {
            vlanIdInput.style.borderColor = ""; // รีเซ็ตเส้นขอบ
            errorBox.style.display = "none"; // ซ่อนข้อความแจ้งเตือน
        }
    });
}


// Generate Subnet Mask Options
function generateSubnetMaskDropdown(id) {
    const subnetMaskDropdown = document.createElement("select");
    subnetMaskDropdown.id = `subnet-mask-${id}`;
    subnetMaskDropdown.name = "subnet-mask[]";
    subnetMaskDropdown.required = true;

    for (let i = 1; i <= 32; i++) {
        const value = (0xFFFFFFFF << (32 - i)) >>> 0;
        const subnetStr = [
            (value >>> 24) & 0xFF,
            (value >>> 16) & 0xFF,
            (value >>> 8) & 0xFF,
            value & 0xFF,
        ].join(".");
        const option = document.createElement("option");
        option.value = subnetStr;
        option.textContent = `${subnetStr} /${i}`;
        subnetMaskDropdown.appendChild(option);
    }

    return subnetMaskDropdown;
}

// Apply Input Mask to IP Address Fields
function applyIPInputMask() {
    $('input[name="vlan-IP[]"]').inputmask({
        alias: "ip",
        placeholder: "___.___.___.___", // Placeholder for IP address
        greedy: false, // Ensures only the valid mask is displayed
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Apply Input Mask to NTP Server Input
    const ntpServerInput = $('#ntp-server');
    ntpServerInput.inputmask({
        alias: "ip",
        placeholder: "___.___.___.___ (e.g., 202.44.204.114)", // Placeholder for IP address
        greedy: false // Ensures only the valid mask is displayed
    });

});

document.addEventListener("DOMContentLoaded", () => {
    // Populate Day Dropdown
    const dayDropdown = document.getElementById("clock-set-day");
    for (let day = 1; day <= 31; day++) {
        const option = document.createElement("option");
        option.value = day;
        option.textContent = day;
        dayDropdown.appendChild(option);
    }

    // Populate Year Dropdown
    const yearDropdown = document.getElementById("clock-set-year");
    for (let year = 1993; year <= 2070; year++) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearDropdown.appendChild(option);
    }
});

let interfaceCounter = 1; // Counter to keep track of interface configurations
let isLocked = false; // Global lock state tracker

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

            <!-- Description -->
            <label for="description-${interfaceCounter}" style="font-weight: bold;">Description</label>
            <input type="text" id="description-${interfaceCounter}" name="description" placeholder="Enter Description">
            <div class="alert-box error" id="description-error-${interfaceCounter}" style="display: none;">
                <span>ERROR: </span> Description can only contain English letters, numbers, special characters, and spaces, except "?".
            </div>

            <!-- Switch Mode -->
            <div class="switch-mode-section">
                <label for="switch-mode-${interfaceCounter}" style="font-weight: bold;">Switch Mode</label>
                <select id="switch-mode-${interfaceCounter}" name="switch-mode">
                    <option value="" selected style="text-align: center;">Select Switchport Mode ( Default )</option>
                    <option value="access">Access</option>
                    <option value="trunk">Trunk</option>
                </select>
            </div>

            <!-- VLAN ID Section -->
            <div class="vlan-id-section" id="vlan-id-section-${interfaceCounter}">
                <label for="vlan-id-input-${interfaceCounter}" style="font-weight: bold;">Access VLAN</label>
            <input 
                type="number" 
                id="vlan-id-input-${interfaceCounter}" 
                name="vlan-id" 
                placeholder="Enter VLAN ID" 
                min="1" 
                max="4094" 
                oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4)">
                <div class="alert-box error" id="vlan-id-error-${interfaceCounter}" style="display: none ; width: 50%;">
                    <span>ERROR:</span> VLAN ID must be a whole number between 1 and 4094.
                    Negative, decimal, or invalid numbers are not allowed.
                </div>
            </div>

            <!-- Trunk Allowed VLANs Section -->
            <div class="vlan-trunk-section" id="vlan-trunk-section-${interfaceCounter}" style="display: none;">
                <label for="trunk-allowed-vlan-${interfaceCounter}" style="font-weight: bold;">Allowed VLANs</label>
                <input type="text" id="trunk-allowed-vlan-${interfaceCounter}" name="trunk-allowed-vlan" placeholder="e.g., 20,30,40 or all">
                <div class="alert-box error" id="allowed-vlans-error-${interfaceCounter}" style="display: none; width: 50%; ">
                    <span>ERROR:</span> Allowed VLANs must be "all" or a comma-separated list of VLAN IDs (e.g., 10,20,30).
                </div>
            </div>  


            <!-- Remove Button -->
            <button type="button" class="remove-interface-config styled-button" style="background-color: #dc3545; color: white;">Remove Configuration</button>
        </form>
    `;
    interfaceConfigs.appendChild(newConfig);

    // Initialize Dropdown and Switch Mode
    initializeDropdown(interfaceCounter);
    initializeSwitchModeToggle(interfaceCounter);

    // Remove Configuration Button
    initializeRemoveButton(newConfig);

    // If configurations are locked, lock the new form
    if (isLocked) {
        const inputs = newConfig.querySelectorAll("input, select");
        inputs.forEach((input) => {
            input.disabled = true;
        });
    }

    validateDescriptionInput(
        `description-${interfaceCounter}`,
        `description-error-${interfaceCounter}`
    );

    validateVlanIdInput(
        `vlan-id-input-${interfaceCounter}`,
        `vlan-id-error-${interfaceCounter}`
    );
    validateAllowedVlansInput(
        `trunk-allowed-vlan-${interfaceCounter}`, 
        `allowed-vlans-error-${interfaceCounter}`
    );

    interfaceCounter++;
});

// Adjusted Overflow Management
document.body.style.overflow = "hidden";
const container = document.querySelector(".content");
container.style.overflowY = "scroll";

let selectedPortsGlobal = []; // Global list of selected ports

// Initialize Select2 Dropdown for Ports
function initializeDropdown(counter) {
    const selectElement = document.getElementById(`interface-port-select-${counter}`);
    $(selectElement).select2({
        placeholder: "Select Ports",
        allowClear: true,
    });

    const portGroups = [
        { name: "Fixed Chassis", range: generatePorts_agg("GigabitEthernet1/0/", 48) },
        { name: "Modular Chassis", range: generatePorts_agg("GigabitEthernet1/1/", 4) },
    ];

    // Create optgroup for each group
    portGroups.forEach((group) => {
        const optgroup = document.createElement("optgroup");
        optgroup.label = group.name; // Set the optgroup label

        group.range.forEach((port) => {
            const isDisabled = selectedPortsGlobal.includes(port); // Check if the port is already selected globally
            const portOption = document.createElement("option");
            portOption.value = port;
            portOption.textContent = port;

            if (isDisabled) {
                portOption.disabled = true; // Disable the option if it's already selected globally
            }

            optgroup.appendChild(portOption); // Add the option to the optgroup
        });

        selectElement.appendChild(optgroup); // Add the optgroup to the select element
    });

    // Handle select events
    $(selectElement).on("select2:select", function (e) {
        const selectedPort = e.params.data.id;
        if (!selectedPortsGlobal.includes(selectedPort)) {
            selectedPortsGlobal.push(selectedPort);
        }
        refreshPortAvailability();
    });

    // Handle unselect events
    $(selectElement).on("select2:unselect", function (e) {
        const unselectedPort = e.params.data.id;
        const index = selectedPortsGlobal.indexOf(unselectedPort);
        if (index > -1) {
            selectedPortsGlobal.splice(index, 1);
        }
        refreshPortAvailability();
    });
}

// Generate port ranges dynamically
function generatePorts(prefix, count) {
    return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
}


function refreshPortAvailability() {
    document.querySelectorAll(".interface-port-select").forEach((select) => {
        const selectElement = $(select);
        const selectedValues = selectElement.val() || [];
        selectElement.find("option").each(function () {
            const port = $(this).val();
            if (port && selectedPortsGlobal.includes(port) && !selectedValues.includes(port)) {
                $(this).attr("disabled", "disabled");
            } else {
                $(this).removeAttr("disabled");
            }
        });
        selectElement.trigger("change.select2");
    });
}

// Function to validate Description
function validateDescriptionInput(descriptionInputId, errorBoxId) {
    const descriptionInput = document.getElementById(descriptionInputId);
    const errorBox = document.getElementById(errorBoxId);

    if (!descriptionInput || !errorBox) {
        console.warn(`Missing input or error box for ID: ${descriptionInputId}`);
        return;
    }

    descriptionInput.addEventListener("input", function () {
        const value = this.value;
        const isValid = /^[a-zA-Z0-9!@#$%^&*(),.:{}|<>_\-\s]*$/.test(value) && !value.includes("?");

        if (!isValid) {
            this.style.borderColor = "red"; // Highlight the field with a red border
            errorBox.style.display = "flex"; // Show the error message
        } else {
            this.style.borderColor = ""; // Reset border color
            errorBox.style.display = "none"; // Hide the error message
        }
    });
}


// Function to validate VLAN ID
function validateVlanIdInput(vlanIdInputId, errorBoxId) {
    const vlanIdInput = document.getElementById(vlanIdInputId);
    const errorBox = document.getElementById(errorBoxId);

    if (!vlanIdInput || !errorBox) {
        console.warn(`Missing input or error box for VLAN ID: ${vlanIdInputId}`);
        return;
    }

    vlanIdInput.addEventListener("input", function () {
        const value = this.value.trim();

        if (value === "") {
            // Allow empty VLAN ID
            this.style.borderColor = ""; // Reset border color
            errorBox.style.display = "none"; // Hide the error message
            return;
        }

        // Regex to check for a valid integer between 1 and 4094
        const isValid = /^\d+$/.test(value) && value >= 1 && value <= 4094;

        if (!isValid) {
            this.style.borderColor = "red"; // Highlight the field with a red border
            errorBox.style.display = "block"; // Show the error message
        } else {
            this.style.borderColor = ""; // Reset border color
            errorBox.style.display = "none"; // Hide the error message
        }
    });
}

function validateAllowedVlansInput(inputId, errorBoxId) {
    const inputElement = document.getElementById(inputId);
    const errorBox = document.getElementById(errorBoxId);

    if (!inputElement || !errorBox) {
        console.warn(`Missing input or error box for Allowed VLANs: ${inputId}`);
        return;
    }

    inputElement.addEventListener("input", function () {
        const value = this.value.trim();

        if (value === "") {
            // Allow empty input
            this.style.borderColor = "";
            errorBox.style.display = "none";
            return;
        }

        const vlanSyntaxRegex = /^(all|(\d{1,4})(,\d{1,4})*)$/;
        const isValid = vlanSyntaxRegex.test(value);

        if (!isValid) {
            this.style.borderColor = "red"; // Highlight the field with a red border
            errorBox.style.display = "block"; // Show the error message
        } else {
            this.style.borderColor = ""; // Reset border color
            errorBox.style.display = "none"; // Hide the error message
        }
    });
}


// Handle Switch Mode Toggle
function initializeSwitchModeToggle(counter) {
    const switchMode = document.getElementById(`switch-mode-${counter}`);
    const vlanSection = document.getElementById(`vlan-id-section-${counter}`);
    const trunkSection = document.getElementById(`vlan-trunk-section-${counter}`);

    // เพิ่ม event listener เมื่อ switch mode เปลี่ยน
    switchMode.addEventListener("change", function () {
        if (this.value === "access") {
            vlanSection.style.display = "block"; // แสดง VLAN ID
            trunkSection.style.display = "none"; // ซ่อน Trunk Allowed VLANs
        } else if (this.value === "trunk") {
            vlanSection.style.display = "none"; // ซ่อน VLAN ID
            trunkSection.style.display = "block"; // แสดง Trunk Allowed VLANs
        } else {
            vlanSection.style.display = "none"; // ซ่อนทั้งสองเมื่อเลือก Default
            trunkSection.style.display = "none";
        }
    });
}

// Remove Configuration
function initializeRemoveButton(newConfig) {
    const removeButton = newConfig.querySelector(".remove-interface-config");
    removeButton.addEventListener("click", function () {
        const selectElement = newConfig.querySelector(".interface-port-select");
        const selectedPorts = $(selectElement).val();
        if (selectedPorts) {
            selectedPorts.forEach((port) => {
                const index = selectedPortsGlobal.indexOf(port);
                if (index > -1) {
                    selectedPortsGlobal.splice(index, 1);
                }
            });
        }

        newConfig.remove();
        refreshPortAvailability();
    });
}

// Remove Interface Configuration
document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('remove-interface-config')) {
        const configForm = e.target.closest('.interface-config');
        if (configForm) {
            configForm.remove(); // Remove the form
        }

        // Check if all forms are removed
        const interfaceForms = document.querySelectorAll('.interface-config');
        const saveButton = document.getElementById('save-interface-configs');
        const cancelButton = document.getElementById('cancel-interface-configs');
        const addInterfaceButton = document.getElementById('add-interface-config');

        if (interfaceForms.length === 0) {
            // Switch Cancel button back to Save
            cancelButton.style.display = 'none';
            saveButton.style.display = 'inline-block';

            // Enable Add Interface Configuration button
            addInterfaceButton.disabled = false;
        }
    }
});


// Function to validate Allowed VLANs (Trunk Mode)
function validateAllowedVlans(allowedVlans) {
    const vlanSyntaxRegex = /^(all|(\d{1,4})(,\d{1,4})*)$/; // Match 'all' or comma-separated numbers
    return vlanSyntaxRegex.test(allowedVlans);
}

const portModes = {};

// อัปเดตสถานะพอร์ตเมื่อมีการเปลี่ยนโหมดใน Interface Port Configuration
function updatePortModes(port, mode) {
    if (mode === "") {
        delete portModes[port]; // ลบพอร์ตที่ไม่มีโหมด
    } else {
        portModes[port] = mode; // บันทึกโหมดของพอร์ต
    }
    updatePortSecurityDropdowns();
}

// Function to refresh all Port-Security dropdowns with valid, non-duplicate ports
function updatePortSecurityDropdowns() {
    const usedPorts = new Set(); // To track used ports across all configurations
    const validPorts = []; // Ports eligible to be used in configurations

    // Collect valid ports from Interface Configuration
    document.querySelectorAll(".interface-config").forEach((config) => {
        const switchMode = config.querySelector('[name="switch-mode"]').value; // Access or Trunk
        const portSelect = $(config.querySelector(".interface-port-select")).val() || [];

        // Only add ports with Access or Trunk mode
        if (["access", "trunk"].includes(switchMode.toLowerCase())) {
            portSelect.forEach((port) => {
                const portDescription = `${port} (${switchMode})`; // Append switch mode to port name
                validPorts.push({ port, description: portDescription });
            });
        }
    });

    // Collect all currently selected ports in Port-Security Configuration
    document.querySelectorAll(".port-security-config .interface-port-select").forEach((dropdown) => {
        const selectedPorts = $(dropdown).val() || [];
        selectedPorts.forEach((port) => usedPorts.add(port)); // Add selected ports to used list
    });

    // Update each Port-Security dropdown
    document.querySelectorAll(".port-security-config .interface-port-select").forEach((dropdown) => {
        const currentSelected = $(dropdown).val() || [];
        $(dropdown).empty(); // Clear existing options

        // Add the valid ports that aren't already used (except for currently selected ones)
        validPorts.forEach(({ port, description }) => {
            const option = document.createElement("option");
            option.value = port;
            option.textContent = description; // Display port with its mode

            // If the port is not used or it's currently selected, add it to the dropdown
            if (!usedPorts.has(port) || currentSelected.includes(port)) {
                if (currentSelected.includes(port)) {
                    option.selected = true; // Restore previously selected ports
                }
                dropdown.appendChild(option);
            }
        });

        // Reinitialize the dropdown with Select2
        $(dropdown).trigger("change.select2");
    });
}

// Function to validate and handle duplicate port selection in real-time
function handlePortSelectionValidation() {
    document.querySelectorAll(".port-security-config .interface-port-select").forEach((dropdown) => {
        $(dropdown).on("change", () => {
            updatePortSecurityDropdowns(); // Refresh dropdowns to prevent duplicates
        });
    });
}

// Set up a MutationObserver for detecting DOM changes
const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
            updatePortSecurityDropdowns(); // Update dropdowns whenever child nodes are added/removed
            handlePortSelectionValidation(); // Reapply validation for new configurations
        }
    }
});

// Observe changes in the #interface-configs container
const interfaceConfigsContainer = document.getElementById("interface-configs");
if (interfaceConfigsContainer) {
    observer.observe(interfaceConfigsContainer, { childList: true, subtree: true });
}

// Event Listener for changes in Interface Configuration
if (interfaceConfigsContainer) {
    interfaceConfigsContainer.addEventListener("change", (event) => {
        if (event.target.name === "switch-mode" || event.target.classList.contains("interface-port-select")) {
            updatePortSecurityDropdowns(); // Trigger the dropdown update
        }
    });
}

// Initialize New Port-Security Configuration
const portSecurityAddButton = document.getElementById("add-port-security-config");
if (portSecurityAddButton) {
    portSecurityAddButton.addEventListener("click", function () {
        const portSecurityConfigs = document.getElementById("port-security-configs");
        const newConfigId = `port-security-${Date.now()}`;
        const newConfig = document.createElement("div");
        newConfig.className = "port-security-config";

        newConfig.innerHTML = `
        <form class="port-security-config-form">
            <!-- Interface Port Section -->
            <div class="port-security-form-group">
                <label for="port-security-interface-${newConfigId}">Interface Port</label>
                <select id="port-security-interface-${newConfigId}" class="interface-port-select" multiple="multiple" required></select>
            </div>
        
            <!-- Violation Mode -->
            <div class="port-security-form-group">
                <label for="port-security-violation-${newConfigId}">Violation Mode</label>
                <select id="port-security-violation-${newConfigId}" name="violation-mode" required>
                    <option value="" style="text-align: center;" selected>Select Violation Mode</option>
                    <option value="restrict">Restrict</option>
                    <option value="shutdown">Shutdown</option>
                    <option value="protect">Protect</option>
                </select>
            </div>
        
            <!-- MAC Address Management Section -->
            <div class="port-security-mac-management">
                <!-- Sticky MAC Address Toggle -->
                <div class="toggle-container">
                    <label for="toggle-switch-${newConfigId}" class="sticky-mac-label">Sticky MAC Address</label>
                    <input type="checkbox" id="toggle-switch-${newConfigId}" class="toggle-switch">
                    <label for="toggle-switch-${newConfigId}" class="toggle-label">
                        <span class="toggle-circle"></span>
                    </label>
                    <span id="toggle-status-${newConfigId}" class="toggle-status">Disabled</span>
                </div>
        
                <div class="port-security-form-group">
                    <label for="max-mac-count-${newConfigId}">Maximum MAC Count</label>
                    <input 
                        type="number" 
                        id="max-mac-count-${newConfigId}" 
                        class="port-security-input" 
                        placeholder="Enter Maximum Count (e.g., 1 to 4096)" 
                        min="1" 
                        max="4096"
                    >
                    <div 
                        class="alert-box error" 
                        id="max-mac-error-${newConfigId}" 
                        style="display: none;"
                    >
                        <span>ERROR:</span> Maximum MAC Count must be an integer between 1 and 4096.
                    </div>
                </div>
        
                <div class="port-security-form-group">
                    <label for="mac-address-input-${newConfigId}">Add MAC Address</label>
                    <div class="port-security-input-group">
                        <input 
                            type="text" 
                            id="mac-address-input-${newConfigId}" 
                            class="port-security-input" 
                            placeholder="Enter MAC Address (e.g., XX:XX:XX:XX:XX:XX)"
                        >
                        <button id="add-mac-btn-${newConfigId}" class="btn btn-primary" style="margin-top: -1.2%;">+</button>
                        <div 
                            class="alert-box error" 
                            id="mac-address-error-${newConfigId}" 
                            style="display: none;"
                        >
                            <span>ERROR:</span> Invalid MAC address format. Please use the format XX:XX:XX:XX:XX:XX.
                        </div>
                    </div>
                </div>
            </div>
        
            <!-- MAC Address Table -->
            <div class="port-security-form-group">
                <table class="mac-address-table">
                    <thead>
                        <tr>
                            <th>MAC Address</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="mac-table-body-${newConfigId}">
                        <!-- แถวใหม่จะถูกเพิ่มที่นี่ -->
                    </tbody>
                </table>
            </div>
        
            <!-- Remove Configuration Button -->
            <div class="port-security-form-group">
                <button type="button" class="remove-port-security-config styled-button" style="background-color: #dc3545; color: white;">Remove Configuration</button>
            </div>
        </form>
        `;

        portSecurityConfigs.appendChild(newConfig);

        // Initialize Select2 for the new dropdown
        $(`#port-security-interface-${newConfigId}`).select2({
            placeholder: "Select Ports",
            allowClear: true,
        });

        document.getElementById(`toggle-switch-${newConfigId}`).addEventListener("change", function () {
            console.log("Toggle switched");
            const status = document.getElementById(`toggle-status-${newConfigId}`);
            const addMacSection = document.getElementById(`mac-address-input-${newConfigId}`).closest(".port-security-form-group");
            const macTableSection = document.getElementById(`mac-table-body-${newConfigId}`).closest(".port-security-form-group");
        
            if (this.checked) {
                status.textContent = "Enabled";
                status.style.color = "#4caf50";
                addMacSection.style.display = "none"; // ซ่อน Add MAC Address
                macTableSection.style.display = "none"; // ซ่อน Table
            } else {
                status.textContent = "Disabled";
                status.style.color = "#333";
                addMacSection.style.display = "block"; // แสดง Add MAC Address
                macTableSection.style.display = "block"; // แสดง Table
            }
        });

        // Handle Adding and Removing MAC Addresses
        const addMacBtn = newConfig.querySelector(`#add-mac-btn-${newConfigId}`);
        const macInput = newConfig.querySelector(`#mac-address-input-${newConfigId}`);
        const macTableBody = newConfig.querySelector(`#mac-table-body-${newConfigId}`);
        const maxMacCountInput = newConfig.querySelector(`#max-mac-count-${newConfigId}`);
        const macError = newConfig.querySelector(`#mac-address-error-${newConfigId}`); // กล่องข้อความ Error

        // Handle MAC Address Validation on Input
        macInput.addEventListener("input", function () {
            const macValue = macInput.value.trim();
        
            // Regular Expression for MAC Address (e.g., XX:XX:XX:XX:XX:XX)
            const macPattern = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
            if (macValue === "") {
                macError.style.display = "none"; // ซ่อนข้อความ Error
                macInput.style.borderColor = ""; // รีเซ็ตเส้นขอบ
                return; // ออกจากฟังก์ชัน
            }
        
            if (macPattern.test(macValue)) {
                // Valid MAC Address
                macError.style.display = "none"; // Hide error message
                macInput.style.borderColor = ""; // Reset border color
            } else {
                // Invalid MAC Address
                macError.style.display = "block"; // Show error message
                macInput.style.borderColor = "red"; // Highlight input with red border
            }
        });

    
    // Add Event Listener for Add Button
    addMacBtn.addEventListener("click", function (event) {
        event.preventDefault(); // ป้องกันการรีเฟรชหน้า

        const macValue = macInput.value.trim();

        // Regular Expression for MAC Address (e.g., XX:XX:XX:XX:XX:XX)
        const macPattern = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

        // ตรวจสอบรูปแบบ MAC Address ก่อน
        if (!macPattern.test(macValue)) {
            macError.style.display = "block";
            macError.innerHTML = `<span>ERROR:</span> Invalid MAC address format. Please use the format XX:XX:XX:XX:XX:XX.`;
            macInput.style.borderColor = "red"; // ไฮไลต์ Input ด้วยสีแดง
            return; // หยุดการทำงาน
        }

        // ตรวจสอบจำนวน MAC Address ใน Table
        const macTableBody = document.querySelector(`#mac-table-body-${newConfigId}`);
        const currentMacCount = macTableBody.querySelectorAll("tr").length;

        // รับค่า Maximum MAC Count
        const maxMacCount = parseInt(maxMacCountInput.value, 10) || 1;

        // ตรวจสอบเงื่อนไขจำนวน MAC Address
        if (currentMacCount >= maxMacCount) {
            macError.style.display = "block";
            macError.innerHTML = `<span>ERROR:</span> You can only add up to ${maxMacCount} MAC Address(es).`;
            macInput.style.borderColor = "red"; // ไฮไลต์ Input ด้วยสีแดง
            return; // หยุดการทำงาน
        }

        // ตรวจสอบว่า MAC Address ซ้ำหรือไม่
        const existingMacs = Array.from(macTableBody.querySelectorAll("td:first-child")).map(
            (cell) => cell.textContent.trim()
        );
        if (existingMacs.includes(macValue)) {
            macError.style.display = "block";
            macError.innerHTML = `<span>ERROR:</span> This MAC address already exists.`;
            macInput.style.borderColor = "red"; // ไฮไลต์ Input ด้วยสีแดง
            return; // หยุดการทำงาน
        }

        // ถ้าไม่มีข้อผิดพลาดใดๆ
        macError.style.display = "none"; // ซ่อนข้อความ Error
        macInput.style.borderColor = ""; // รีเซ็ตเส้นขอบ

        // เพิ่ม MAC Address ลงใน Table
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td>${macValue}</td>
            <td>
                <button class="remove-mac-btn btn btn-danger">Remove</button>
            </td>
        `;
        macTableBody.appendChild(newRow);

        // ล้างช่อง Input
        macInput.value = "";

        // ผูก Event Listener สำหรับปุ่ม Remove
        newRow.querySelector(".remove-mac-btn").addEventListener("click", function () {
            newRow.remove(); // ลบแถวออก
        });
    });
        
        maxMacCountInput.addEventListener("input", function () {
            const value = this.value.trim();
            const errorBox = document.getElementById(`max-mac-error-${newConfigId}`);
        
            // ถ้าฟิลด์ว่างเปล่า ให้ซ่อนข้อความแจ้งเตือนและไม่แสดงข้อผิดพลาด
            if (value === "") {
                this.style.borderColor = ""; // รีเซ็ตเส้นขอบ
                errorBox.style.display = "none"; // ซ่อนข้อความแจ้งข้อผิดพลาด
                return; // จบการตรวจสอบ
            }
        
            // ตรวจสอบว่าค่าเป็นตัวเลขเต็มระหว่าง 1-4096
            const isValid = /^\d+$/.test(value) && value >= 1 && value <= 4096;
        
            if (!isValid) {
                this.style.borderColor = "red"; // เปลี่ยนเส้นขอบเป็นสีแดง
                errorBox.style.display = "block"; // แสดงข้อความแจ้งข้อผิดพลาด
            } else {
                this.style.borderColor = ""; // รีเซ็ตเส้นขอบ
                errorBox.style.display = "none"; // ซ่อนข้อความแจ้งข้อผิดพลาด
            }
        });

        // Refresh dropdown with the latest ports and handle validation
        updatePortSecurityDropdowns();
        handlePortSelectionValidation();

        // Remove the configuration
        newConfig.querySelector(".remove-port-security-config").addEventListener("click", function () {
            newConfig.remove();
            updatePortSecurityDropdowns(); // Refresh remaining dropdowns
        });
    });
}

// Trigger real-time updates for existing configurations
document.addEventListener("DOMContentLoaded", () => {
    updatePortSecurityDropdowns(); // Ensure dropdowns are updated on page load
    handlePortSelectionValidation(); // Apply validation for existing dropdowns
});

document.addEventListener("DOMContentLoaded", function () {
    const stpModeDropdown = document.getElementById("stp-mode");
    const mstConfigContainer = document.getElementById("mst-config-container");

    // Add MST configuration area when MST is selected
    stpModeDropdown.addEventListener("change", function () {
        const selectedMode = this.value;

        if (selectedMode === "mst") {
            renderMSTConfiguration();
        } else {
            // Clear MST Configuration if not MST mode
            mstConfigContainer.innerHTML = ""; // Reset content if it's not MST
        }
    });

    function renderMSTConfiguration() {
        // Add MST Configuration Header
        mstConfigContainer.innerHTML = `
            <button id="add-mst-instance" class="add-button">Add</button>
            <div id="mst-instance-list"></div>
        `;

        const addButton = document.getElementById("add-mst-instance");
        const instanceList = document.getElementById("mst-instance-list");

        // Add functionality to "Add" button
        addButton.addEventListener("click", function () {
            const instanceForm = document.createElement("div");
            instanceForm.className = "mst-instance";

            instanceForm.innerHTML = `
                <div class="stp-input-form-group">
                    <label for="mst-instance">MST Instance</label>
                    <input type="text" class="mst-instance-input" placeholder="0 - 4094" required>
                    <div class="alert-box error mst-instance-error" style="display: none;">
                        <span>ERROR: </span> MST Instance must be a whole number between 0-4094 without leading zeros.
                    </div>
                </div>
                <div class="stp-input-form-group">
                    <label for="vlans-mapped">Vlans Mapped</label>
                    <input type="text" class="vlans-mapped-input" placeholder="1-4094 (Ex: 20,30,40)" required>
                    <div class="alert-box error vlans-mapped-error" style="display: none;">
                        <span>ERROR: </span> Allowed VLANs must be between (1-4094) or a comma-separated list.
                    </div>
                </div>
                <br>
                <button type="button" class="remove-button styled-button">Remove</button>
                <hr>
            `;

            // Add validation and remove functionality
            const mstInstanceInput = instanceForm.querySelector('.mst-instance-input');
            const vlansMappedInput = instanceForm.querySelector('.vlans-mapped-input');
            const mstInstanceError = instanceForm.querySelector('.mst-instance-error');
            const vlansMappedError = instanceForm.querySelector('.vlans-mapped-error');

            // Validate MST Instance
            mstInstanceInput.addEventListener('input', () => {
                const value = mstInstanceInput.value.trim();
                if (value === '') {
                    mstInstanceError.style.display = 'none';
                    mstInstanceInput.style.borderColor = '';
                } else if (!/^[1-9]\d*$|^0$/.test(value) || parseInt(value, 10) < 0 || parseInt(value, 10) > 4094) {
                    mstInstanceError.style.display = 'block';
                    mstInstanceInput.style.borderColor = 'red';
                } else {
                    mstInstanceError.style.display = 'none';
                    mstInstanceInput.style.borderColor = '';
                }
            });

            // Validate Vlans Mapped
            vlansMappedInput.addEventListener('input', () => {
                const value = vlansMappedInput.value.trim();
                if (value === '') {
                    vlansMappedError.style.display = 'none';
                    vlansMappedInput.style.borderColor = '';
                } else if (!/^(\d{1,4})(,\d{1,4})*$/.test(value)) {
                    vlansMappedError.style.display = 'block';
                    vlansMappedInput.style.borderColor = 'red';
                } else {
                    const vlanIds = value.split(',').map(Number);
                    const isValid = vlanIds.every(vlan => vlan >= 1 && vlan <= 4094);
                    if (!isValid) {
                        vlansMappedError.style.display = 'block';
                        vlansMappedInput.style.borderColor = 'red';
                    } else {
                        vlansMappedError.style.display = 'none';
                        vlansMappedInput.style.borderColor = '';
                    }
                }
            });

            // Remove button functionality
            instanceForm.querySelector(".remove-button").addEventListener("click", function () {
                instanceForm.remove();
            });

            instanceList.appendChild(instanceForm);
        });
    }
});

const timezones = [
    { value: "", label: "Select Timezone ( Default )" }, // Default empty value
    { value: "GMT -12", label: "(GMT-12:00) International Date Line West" },
    { value: "GMT -11", label: "(GMT-11:00) Midway Island, Samoa" },
    { value: "GMT -10", label: "(GMT-10:00) Hawaii" },
    { value: "GMT -9", label: "(GMT-09:00) Alaska" },
    { value: "GMT -8", label: "(GMT-08:00) Pacific Time (US & Canada)" },
    { value: "GMT -7", label: "(GMT-07:00) Mountain Time (US & Canada)" },
    { value: "GMT -6", label: "(GMT-06:00) Central Time (US & Canada)" },
    { value: "GMT -5", label: "(GMT-05:00) Eastern Time (US & Canada)" },
    { value: "GMT -4", label: "(GMT-04:00) Atlantic Time (Canada)" },
    { value: "GMT -3", label: "(GMT-03:00) Buenos Aires, Georgetown" },
    { value: "GMT 0", label: "(GMT+00:00) Greenwich Mean Time : Dublin, London" },
    { value: "GMT 1", label: "(GMT+01:00) Amsterdam, Berlin, Rome" },
    { value: "GMT 2", label: "(GMT+02:00) Cairo, Helsinki, Athens" },
    { value: "GMT 3", label: "(GMT+03:00) Moscow, Riyadh" },
    { value: "GMT 4", label: "(GMT+04:00) Abu Dhabi, Muscat" },
    { value: "GMT 5", label: "(GMT+05:00) Islamabad, Karachi" },
    { value: "GMT 6", label: "(GMT+06:00) Astana, Dhaka" },
    { value: "BKK 7", label: "(GMT+07:00) Bangkok, Hanoi, Jakarta" },
    { value: "GMT 8", label: "(GMT+08:00) Beijing, Singapore" },
    { value: "GMT 9", label: "(GMT+09:00) Tokyo, Seoul" },
    { value: "GMT 10", label: "(GMT+10:00) Sydney, Brisbane" },
    { value: "GMT 11", label: "(GMT+11:00) Solomon Is., New Caledonia" },
    { value: "GMT 12", label: "(GMT+12:00) Auckland, Wellington" }
];

const timezoneSelect = document.getElementById('clock-timezone');

timezones.forEach(timezone => {
    const option = document.createElement('option');
    option.value = timezone.value;
    option.textContent = timezone.label;
    timezoneSelect.appendChild(option);
});

// Initialize Counter
let aggregationCounter = 1;

let aggregationConfigsList = []; // Global list of selected ports

// Add New Aggregation Configuration
document.getElementById("add-aggregation-config").addEventListener("click", function () {
    const aggregationConfigs = document.getElementById("aggregation-configs");
    const aggId = aggregationCounter; // Unique ID for the Aggregation

    const newAggregationConfig = document.createElement("div");
    newAggregationConfig.className = "aggregation-config";
    newAggregationConfig.innerHTML = `
    <form class="config-form">
        <!-- Aggregation ID -->
        <label for="aggregation-id-${aggId}" style="font-weight: bold;">Aggregation ID</label>
        <input type="number" id="aggregation-id-${aggId}" name="aggregation-id[]" placeholder="Enter Aggregation ID" min="1" max="64" required>
        <div class="alert-box error" id="error-${aggId}" style="display: none;">
            <span>ERROR: </span> Aggregation ID must be between 1 and 64.
        </div>

        <!-- Select Ports -->
        <label for="aggregation-ports-${aggId}" style="font-weight: bold;">Select Ports</label>
        <select id="aggregation-ports-${aggId}" class="aggregation-ports-select" multiple="multiple" style="width: 100%;" required></select>

        <!-- Link Aggregation Mode -->
        <label for="aggregation-mode-${aggId}" style="font-weight: bold;">Link Aggregation Mode</label>
        <select id="aggregation-mode-${aggId}" name="aggregation-mode[]" required>
            <option value="" selected style="text-align: center;">Select Link Aggregation Mode ( Default )</option>
            <optgroup label="LACP">
                <option value="active">Active</option>
                <option value="passive">Passive</option>
            </optgroup>
            <optgroup label="PAgP">
                <option value="desirable">Desirable</option>
                <option value="auto">Auto</option>
            </optgroup>
            <optgroup label="Manual">
                <option value="on">On</option>
            </optgroup>
        </select>

        <div id="aggregation-config-fields-${aggId}">
            <!-- Switchport Mode -->
            <label for="switchport-mode-${aggId}" style="font-weight: bold;">Switchport Mode</label>
            <select id="switchport-mode-${aggId}" class="switchport-mode">
                <option value="" selected style="text-align: center;">Select Switchport Mode ( Default )</option>
                <option value="access">Access</option>
                <option value="trunk">Trunk</option>
            </select>

            <!-- Access VLAN -->
            <div class="access-vlan-section" id="access-vlan-section-${aggId}" style="display: none;">
                <label for="access-vlan-${aggId}" style="font-weight: bold;">Access VLAN</label>
                <div style="display: flex; align-items: center;">
                    <input 
                        type="number" 
                        id="access-vlan-${aggId}" 
                        name="access-vlan" 
                        placeholder="Enter VLAN ID" 
                        min="1" 
                        max="4094" 
                        step="1"
                        style="margin-right: 10px;"
                    >
                    <div class="alert-box error" id="access-vlan-error-${aggId}" style="display: none;">
                        <span>ERROR: </span> VLAN ID must be between 1 and 4094.
                    </div>
                </div>
            </div>

            <!-- Allowed VLANs (Trunk Mode) -->
            <div class="trunk-vlan-section" id="trunk-vlan-section-${aggId}" style="display: none;">
                <label for="trunk-allowed-vlans-${aggId}" style="font-weight: bold;">Allowed VLANs</label>
                <div style="display: flex; align-items: center;">
                    <input 
                        type="text" 
                        id="trunk-allowed-vlans-${aggId}" 
                        name="trunk-allowed-vlans" 
                        placeholder="e.g., 20,30,40 or all"
                        style="margin-right: 10px;"
                    >
                    <div class="alert-box error" id="trunk-error-${aggId}" style="display: none;">
                        <span>ERROR: </span> Allowed VLANs must be between (1-4094) or all.
                    </div>
                </div>
            </div>
        </div>

        <!-- Remove Button -->
        <button type="button" class="remove-aggregation-config styled-button" style="background-color: #dc3545; color: white;">Remove Configuration</button>
    </form>
    `;

    aggregationConfigs.appendChild(newAggregationConfig);

    initializeAggregationDropdown(aggId);

    // Add Validation for Duplicate Aggregation ID
    const aggregationIdInput = document.getElementById(`aggregation-id-${aggId}`);
    const configFields = document.getElementById(`aggregation-config-fields-${aggId}`);
    const errorMessage = document.getElementById(`error-${aggId}`);

    aggregationIdInput.addEventListener("input", function () {
        // Remove non-numeric and decimal characters
        this.value = this.value.replace(/[^0-9]/g, "");
        
        // Convert value to a number for validation
        const aggregationIdValue = parseInt(this.value, 10);
        let isOutOfRange = false;
        let isDuplicate = false;
        
        // Check for out-of-range values (less than 1 or greater than 64)
        if (aggregationIdValue < 1 || aggregationIdValue > 64) {
            isOutOfRange = true;
        }
        
        // Check for duplicate IDs
        const allAggregationIds = document.querySelectorAll('input[name="aggregation-id[]"]');
        allAggregationIds.forEach((input) => {
            if (input !== aggregationIdInput && input.value === this.value) {
                isDuplicate = true;
            }
        });
        
        // Handle errors
        if (isOutOfRange) {
            aggregationIdInput.style.borderColor = "red"; // Add red border
            errorMessage.style.display = "flex"; // Show error message
            errorMessage.innerHTML = '<span>ERROR: </span> Aggregation ID must be between 1 and 64.'; // Custom error message
            configFields.style.display = "block"; // Always show Switchport Mode dropdown
        } else if (isDuplicate) {
            aggregationIdInput.style.borderColor = "red"; // Add red border
            errorMessage.style.display = "flex"; // Show error message
            errorMessage.innerHTML = '<span>ERROR: </span> This Aggregation ID is already in use. Please enter a unique ID.'; // Custom error message
            configFields.style.display = "block"; // Always show Switchport Mode dropdown
        } else {
            aggregationIdInput.style.borderColor = ""; // Reset border
            errorMessage.style.display = "none"; // Hide error message
            if (aggregationIdInput.value.trim() !== "") {
                configFields.style.display = "block"; // Show fields if valid
            } else {
                configFields.style.display = "none"; // Hide fields if empty
            }
        }
    });

    // Add Validation for Access VLAN
    const linkAggregationAllowedVlans1 = document.getElementById(`access-vlan-${aggId}`);
    const allowedVlansError1 = document.getElementById(`access-vlan-error-${aggId}`); // Element สำหรับ error message
    
    linkAggregationAllowedVlans1.addEventListener("input", function () {
        const value = this.value.trim();
        const numValue = parseInt(value, 10);
    
        if (value && (isNaN(numValue) || numValue < 1 || numValue > 4094)) {
            linkAggregationAllowedVlans1.style.borderColor = "red"; // เพิ่มกรอบสีแดง
            allowedVlansError1.style.display = "block"; // แสดงข้อความแจ้งเตือน
        } else {
            linkAggregationAllowedVlans1.style.borderColor = ""; // ลบกรอบสีแดง
            allowedVlansError1.style.display = "none"; // ซ่อนข้อความแจ้งเตือน
        }
    });
    
    // Allowed VLANs Validation
    const linkAggregationAllowedVlans2 = document.getElementById(`trunk-allowed-vlans-${aggId}`);
    const allowedVlansError2 = document.getElementById(`trunk-error-${aggId}`); // Element สำหรับ error message
    
    linkAggregationAllowedVlans2.addEventListener("input", function () {
        const value = this.value.trim();
        const vlanSyntaxRegex = /^(all|(\d{1,4})(,\d{1,4})*)$/;
    
        if (value === "") {
            // หากฟิลด์ว่าง ให้ถือว่าผ่านและไม่มี Error
            linkAggregationAllowedVlans2.style.borderColor = "";
            allowedVlansError2.style.display = "none";
        } else if (value === "all") {
            // หากใส่ "all" ให้ผ่าน
            linkAggregationAllowedVlans2.style.borderColor = "";
            allowedVlansError2.style.display = "none";
        } else if (vlanSyntaxRegex.test(value)) {
            const vlans = value.split(",").map(Number);
            const isValid = vlans.every(vlan => vlan >= 1 && vlan <= 4094);
    
            if (isValid) {
                linkAggregationAllowedVlans2.style.borderColor = "";
                allowedVlansError2.style.display = "none";
            } else {
                linkAggregationAllowedVlans2.style.borderColor = "red";
                allowedVlansError2.style.display = "block";
                allowedVlansError2.textContent = "ERROR: VLANs must be between 1-4094.";
            }
        } else {
            linkAggregationAllowedVlans2.style.borderColor = "red";
            allowedVlansError2.style.display = "block";
            allowedVlansError2.textContent = "ERROR: Invalid format. Use numbers separated by commas or 'all'.";
        }
    });

    function refreshAggregationIDValidation() {
        const allAggregationIds = document.querySelectorAll('input[name="aggregation-id[]"]');
        allAggregationIds.forEach((input) => {
            const aggregationIdValue = input.value.trim();
            let isDuplicate = false;
    
            // ข้ามการตรวจสอบค่าซ้ำถ้าไม่มีค่า
            if (aggregationIdValue === "") {
                input.style.borderColor = ""; // รีเซ็ตสีกรอบ
                const errorMessage = input.nextElementSibling; // สมมติว่า error message อยู่ถัดจาก input
                if (errorMessage) {
                    errorMessage.style.display = "none"; // ซ่อนข้อความแจ้งเตือน
                }
                return;
            }
    
            // ตรวจสอบค่าซ้ำ
            allAggregationIds.forEach((otherInput) => {
                if (input !== otherInput && otherInput.value.trim() === aggregationIdValue) {
                    isDuplicate = true;
                }
            });
    
            // แสดงหรือซ่อนข้อความ error
            const errorMessage = input.nextElementSibling; // สมมติว่า error message อยู่ติดกับ input
            if (isDuplicate) {
                input.style.borderColor = "red";
                if (errorMessage) {
                    errorMessage.style.display = "flex";
                    errorMessage.innerHTML = '<span>ERROR: </span> This Aggregation ID is already in use. Please enter a unique ID.';
                }
            } else {
                input.style.borderColor = "";
                if (errorMessage) {
                    errorMessage.style.display = "none";
                }
            }
        });
    }

    // Initialize Switchport Mode Toggle
    initializeSwitchportModeToggle(aggId);

    newAggregationConfig.querySelector(".remove-aggregation-config").addEventListener("click", function () {
        const aggregationIdInput = newAggregationConfig.querySelector('input[name="aggregation-id[]"]');
        const selectElement = newAggregationConfig.querySelector(".aggregation-ports-select");
        const selectedPorts = $(selectElement).val(); // Get selected ports
    
        // ลบ Aggregation ID จาก list
        if (aggregationIdInput) {
            const aggregationIdValue = aggregationIdInput.value.trim();
            const index = aggregationConfigsList.indexOf(aggregationIdValue);
            if (index > -1) {
                aggregationConfigsList.splice(index, 1);
            }
        }
    
        // ลบพอร์ตที่เกี่ยวข้องออกจาก aggregationConfigsList
        if (selectedPorts) {
            selectedPorts.forEach((port) => {
                const index = aggregationConfigsList.indexOf(port);
                if (index > -1) {
                    aggregationConfigsList.splice(index, 1);
                }
            });
        }
    
        // ลบ config ออกจาก DOM
        newAggregationConfig.remove();
    
        // หากไม่มี Aggregation Configuration เหลือ
        const remainingConfigs = document.querySelectorAll(".aggregation-config");
        if (remainingConfigs.length === 0) {
            aggregationConfigsList = [];
            aggregationCounter = 1;
            return;
        }
    
        // รีเฟรช ID และ Initialize ใหม่
        remainingConfigs.forEach((config, index) => {
            const switchMode = config.querySelector(".switchport-mode");
            const accessSection = config.querySelector(".access-vlan-section");
            const trunkSection = config.querySelector(".trunk-vlan-section");
    
            console.log(`Refreshing config #${index + 1}`);
    
            // ตั้งค่า ID ใหม่สำหรับ Switch Mode และ Sections
            if (switchMode) {
                switchMode.id = `switchport-mode-${index + 1}`;
            }
            if (accessSection) {
                accessSection.id = `access-vlan-section-${index + 1}`;
            }
            if (trunkSection) {
                trunkSection.id = `trunk-vlan-section-${index + 1}`;
            }
    
            // เรียกฟังก์ชัน Initialize ใหม่
            initializeSwitchportModeToggle(index + 1);
        });
    
        // รีเฟรชการตรวจสอบ Aggregation ID
        refreshAggregationIDValidation();
    
        // รีเฟรชการตั้งค่าพอร์ต
        refreshPortAvailability_agg();
    });

    aggregationCounter++;
});

// Toggle Switchport Mode (Access/Trunk)
function initializeSwitchportModeToggle(counter) {
    const switchMode = document.getElementById(`switchport-mode-${counter}`);
    const accessSection = document.getElementById(`access-vlan-section-${counter}`);
    const trunkSection = document.getElementById(`trunk-vlan-section-${counter}`);
    const allowedVlansInput = document.getElementById(`trunk-allowed-vlans-${counter}`);
    const allowedVlansError = document.getElementById(`trunk-error-${counter}`);

    if (!switchMode || !accessSection || !trunkSection) {
        console.warn(`Missing elements for counter ${counter}`);
        return;
    }

    // Reset sections to be hidden by default
    accessSection.style.display = "none";
    trunkSection.style.display = "none";

    // Remove old event listener to prevent duplication
    const clone = switchMode.cloneNode(true);
    switchMode.parentNode.replaceChild(clone, switchMode);

    // Add new event listener
    clone.addEventListener("change", function () {
        if (this.value === "access") {
            accessSection.style.display = "block"; // Show Access VLAN
            trunkSection.style.display = "none"; // Hide Trunk Allowed VLANs
        } else if (this.value === "trunk") {
            accessSection.style.display = "none"; // Hide Access VLAN
            trunkSection.style.display = "block"; // Show Trunk Allowed VLANs

            // Clear errors and make input optional
            if (allowedVlansInput) {
                allowedVlansInput.style.borderColor = ""; // Reset input border
                if (allowedVlansError) {
                    allowedVlansError.style.display = "none"; // Hide error message
                }
            }
        } else {
            accessSection.style.display = "none"; // Hide both sections
            trunkSection.style.display = "none";
        }
    });

    // Reset dropdown functionality to allow re-selecting "Select Switchport Mode"
    const resetOption = document.createElement("option");
    resetOption.value = "";
    resetOption.textContent = "Select Switchport Mode";
    resetOption.selected = true;

    // Ensure resetOption is always at the top
    switchMode.addEventListener("focus", function () {
        if (!switchMode.querySelector('option[value=""]')) {
            switchMode.insertAdjacentElement("afterbegin", resetOption);
        }
    });
}

// Initialize Dropdown for Aggregation Ports
function initializeAggregationDropdown(counter) {
    const selectElement = document.getElementById(`aggregation-ports-${counter}`);
    $(selectElement).select2({
        placeholder: "Select Ports",
        allowClear: true,
    });

    // Generate Port Groups
    const portGroups = [
        { name: "Fixed Chassis", range: generatePorts_agg("GigabitEthernet1/0/", 48) },
        { name: "Modular Chassis", range: generatePorts_agg("GigabitEthernet1/1/", 4) },
    ];

    // Add Port Groups
    portGroups.forEach((group) => {
        const groupElement = document.createElement("optgroup");
        groupElement.label = group.name;

        group.range.forEach((port) => {
            const portOption = new Option(port, port, false, false);
            groupElement.appendChild(portOption);
        });

        $(selectElement).append(groupElement);
    });



    // Handle port selection and unselection
    $(selectElement).on("select2:select", function (e) {
        const selectedPort = e.params.data.id;
        if (!aggregationConfigsList.includes(selectedPort)) {
            aggregationConfigsList.push(selectedPort);
        }
        refreshPortAvailability_agg();
    });

    $(selectElement).on("select2:unselect", function (e) {
        const unselectedPort = e.params.data.id;
        const index = aggregationConfigsList.indexOf(unselectedPort);
        if (index > -1) {
            aggregationConfigsList.splice(index, 1);
        }
        refreshPortAvailability_agg();
    });

    // Trigger refresh to update availability on initialization
    refreshPortAvailability_agg();
}

// Refresh Port Availability
function refreshPortAvailability_agg() {
    document.querySelectorAll(".aggregation-ports-select").forEach((select) => {
        const selectElement = $(select);
        const selectedValues = selectElement.val() || [];
        selectElement.find("option").each(function () {
            const port = $(this).val();
            if (port && aggregationConfigsList.includes(port) && !selectedValues.includes(port)) {
                $(this).attr("disabled", "disabled");
            } else {
                $(this).removeAttr("disabled");
            }
        });
        selectElement.trigger("change.select2");
    });
}

// Generate Port Ranges Dynamically
function generatePorts_agg(prefix, count) {
    return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
}

// Real-time validation
document.getElementById('hostname-input').addEventListener('input', function () {
    const hostnameInput = document.getElementById('hostname-input');
    const hostnameError = document.getElementById('hostname-error');

    // Check if the input field is empty
    if (hostnameInput.value.trim() === '') {
        hostnameError.style.display = 'none'; // Hide the error message
        hostnameInput.style.borderColor = ''; // Reset input field border color
        hostnameInput.dataset.valid = ''; // Clear validity status
        return; // Exit function
    }

    // Regular expression to allow only English letters, numbers, and special characters except "?"
    if (!/^[a-zA-Z0-9!@#$%^&*()_+=\-{}\[\]:;"'<>,./\\|~`]+$/.test(hostnameInput.value)) {
        hostnameError.style.display = 'flex'; // Show the error message
        hostnameInput.style.borderColor = 'red'; // Highlight the input field
        hostnameInput.dataset.valid = 'false'; // Mark as invalid
    } else if (/\?/.test(hostnameInput.value)) {
        hostnameError.style.display = 'flex'; // Show the error message
        hostnameInput.style.borderColor = 'red'; // Highlight the input field
        hostnameInput.dataset.valid = 'false'; // Mark as invalid
    } else {
        hostnameError.style.display = 'none'; // Hide the error message
        hostnameInput.style.borderColor = ''; // Reset input field border color
        hostnameInput.dataset.valid = 'true'; // Mark as valid
    }
});

// Pre-submission validation
document.getElementById('save-config-templates').addEventListener('click', function () {
    const hostnameInput = document.getElementById('hostname-input');
    const hostnameError = document.getElementById('hostname-error');

    // Check hostname validity before adding to configData
    if (hostnameInput.dataset.valid === 'true' && hostnameInput.value.trim() !== '') {
        configData += `hostname ${hostnameInput.value.trim()}\n`;
    } else if (hostnameInput.dataset.valid === 'false') {
        hostnameError.style.display = 'flex'; // Ensure error message is visible
        hostnameInput.style.borderColor = 'red'; // Highlight the field
    }
});



// Open Modal ห้ามวาง code ต่ำกว่าตรงนี้
// Function to open the modal and inject configuration
function openModalPreview(configData) {
    const modal = document.getElementById('preview-configuration-template');
    const content = document.getElementById('preview-configuration-content');

    // Inject configuration data
    content.textContent = configData;

    // Display the modal
    modal.style.display = 'flex';

    // Add download functionality
    document.getElementById('download-config').addEventListener('click', () => {
        downloadConfiguration(configData);
    });
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById('preview-configuration-template');
    modal.style.display = 'none';
}

// Function to download the configuration as a .txt file
function downloadConfiguration(configData) {
    const blob = new Blob([configData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'configuration.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Generate and Open Modal Content
document.getElementById('save-config-templates').addEventListener('click', () => {
    let configData = '';

    // Clock Set (EXEC Mode)
    const clockSetTime = document.getElementById('clock-set-time')?.value.trim();
    const clockSetDay = document.getElementById('clock-set-day')?.value.trim();
    const clockSetMonth = document.getElementById('clock-set-month')?.value.trim();
    const clockSetYear = document.getElementById('clock-set-year')?.value.trim();

    if (clockSetTime && clockSetDay && clockSetMonth && clockSetYear) {
        configData += `clock set ${clockSetTime} ${clockSetDay} ${clockSetMonth} ${clockSetYear}\n`;
    }

    // Start Global Configuration
    configData += 'enable\nconfigure terminal\n';

    // Hostname Configuration
    const hostnameInput = document.getElementById('hostname-input');
    const hostnameError = document.getElementById('hostname-error');

    // Check hostname validity before adding to configData
    if (hostnameInput.dataset.valid === 'true' && hostnameInput.value.trim() !== '') {
        configData += `hostname ${hostnameInput.value.trim()}\n`;
    } else if (hostnameInput.dataset.valid === 'false') {
        hostnameError.style.display = 'inline'; // Ensure error message is visible
        hostnameInput.style.borderColor = 'red'; // Highlight the field
    }

    // VLAN Configuration
    const vlanRows = document.querySelectorAll('.vlan-config-form');
    vlanRows.forEach(row => {
        const vlanId = row.querySelector('input[name="vlan-id[]"]');
        const vlanName = row.querySelector('input[name="vlan-name[]"]');
        const vlanIp = row.querySelector('input[name="vlan-IP[]"]');
        const subnetMask = row.querySelector('select[name="subnet-mask[]"]');
        const errorBox = row.querySelector('.alert-box.error');
    
        if (vlanId && vlanId.value.trim() !== '') {
            const value = vlanId.value.trim();
    
            // ตรวจสอบ VLAN ID
            const isValidId = /^\d+$/.test(value) && value >= 1 && value <= 4094;
    
            if (!isValidId) {
                vlanId.style.borderColor = "red"; // แสดง Error ที่ Input
                errorBox.style.display = "flex"; // แสดงข้อความแจ้งเตือน
                return; // หยุดการทำงานของฟังก์ชันทันทีสำหรับ VLAN นี้
            } else {
                vlanId.style.borderColor = ""; // รีเซ็ต Error ที่ Input
                errorBox.style.display = "none"; // ซ่อนข้อความแจ้งเตือน
    
                // ตรวจสอบ VLAN Name
                const vlanNameValue = vlanName?.value.trim();
                const isValidName = /^[a-zA-Z0-9!@#$%^&*(),.:{}|<>_-]*$/.test(vlanNameValue) && !vlanNameValue.includes("?");
    
                if (!isValidName) {
                    vlanName.style.borderColor = "red"; // แสดง Error ที่ Input VLAN Name
                    alert(`Invalid VLAN Name: "${vlanNameValue}". Please fix the error (no spaces allowed).`);
                    return; // หยุดการทำงานสำหรับ VLAN นี้
                } else {
                    vlanName.style.borderColor = ""; // รีเซ็ต Error ที่ Input
                }
    
                // เพิ่ม VLAN Configuration ใน configData
                configData += `vlan ${value}\n`;
                if (vlanName && vlanNameValue) {
                    configData += ` name ${vlanNameValue}\n`;
                }
                if (vlanIp && vlanIp.value.trim() !== '' && subnetMask) {
                    configData += `interface vlan ${value}\n`;
                    configData += ` ip address ${vlanIp.value.trim()} ${subnetMask.value.trim()}\n exit\n`;
                }
            }
        }
    });

    // Default Gateway Configuration
    const defaultGateway = document.getElementById('default-gateway');
    if (defaultGateway && defaultGateway.value.trim() !== '') {
        configData += `ip default-gateway ${defaultGateway.value.trim()}\n`;
    }


    // Add Spanning-Tree Configuration
    const stpMode = document.getElementById('stp-mode')?.value;
    if (stpMode) {
        configData += `spanning-tree mode ${stpMode.toLowerCase()}\n`;

        if (stpMode === 'mst') {
            // Add MST Instance Configurations
            const mstInstances = document.querySelectorAll('.mst-instance');
            mstInstances.forEach(instance => {
                const instanceNumber = instance.querySelector('.mst-instance-input')?.value.trim();
                const vlanMapped = instance.querySelector('.vlans-mapped-input')?.value.trim();

                // Validation
                const isInstanceNumberValid = /^\d+$/.test(instanceNumber) && instanceNumber >= 0 && instanceNumber <= 4094;
                const isVlansMappedValid = /^(all|(\d{1,4})(,\d{1,4})*)$/.test(vlanMapped);

                if (isInstanceNumberValid && isVlansMappedValid) {
                    configData += `spanning-tree mst configuration\n`;
                    configData += ` instance ${instanceNumber} vlan ${vlanMapped}\n`;
                } else {
                    // Log or handle invalid input
                    console.warn(`Invalid input: MST Instance (${instanceNumber}), VLANs Mapped (${vlanMapped})`);
                }
            });
        }
    }

    // Add Spanning-Tree Feature Toggles
    const bpduGuardToggle = document.getElementById('bpdu-guard-toggle');
    const bpduFilteringToggle = document.getElementById('bpdu-filtering-toggle');
    const loopGuardToggle = document.getElementById('loop-guard-toggle');
    const portfastToggle = document.getElementById('portfast-default-toggle');

    if (bpduGuardToggle && bpduGuardToggle.checked) {
        configData += 'spanning-tree bpduguard enable\n';
    }

    if (bpduFilteringToggle && bpduFilteringToggle.checked) {
        configData += 'spanning-tree bpdufilter enable\n';
    }

    if (loopGuardToggle && loopGuardToggle.checked) {
        configData += 'spanning-tree loopguard default\n';
    }

    if (portfastToggle && portfastToggle.checked) {
        configData += 'spanning-tree portfast default\n';
    }

    // VTP Configuration
    const vtpMode = document.getElementById('vtp-mode')?.value.trim();
    const vtpVersion = document.getElementById('vtp-version')?.value.trim();
    const vtpDomain = document.getElementById('vtp-domain')?.value.trim();
    const vtpPassword = document.getElementById('vtp-password')?.value.trim();
    
    // Check and Add VTP Configuration
    if (vtpMode) {
        configData += `vtp mode ${vtpMode}\n`;
    }
    if (vtpVersion) {
        configData += `vtp version ${vtpVersion}\n`;
    }
    if (vtpDomain) {
        configData += `vtp domain ${vtpDomain}\n`;
    }
    if (vtpPassword) {
        configData += `vtp password ${vtpPassword}\n`;
    }
    
    // NTP Configuration
    const ntpServerInput = document.getElementById('ntp-server');
    const clockTimezoneSelect = document.getElementById('clock-timezone');

    if (ntpServerInput && ntpServerInput.value.trim() !== '') {
        configData += `ntp server ${ntpServerInput.value.trim()}\n`;
    }

    if (clockTimezoneSelect && clockTimezoneSelect.value.trim() !== '') {
        configData += `clock timezone ${clockTimezoneSelect.value.trim()}\n`;
    }

    // Interface Port Configuration
    const interfaceForms = document.querySelectorAll('.interface-config');
    interfaceForms.forEach(form => {
        const portSelect = form.querySelector('.interface-port-select');
        const descriptionInput = form.querySelector('input[name="description"]');
        const switchMode = form.querySelector('select[name="switch-mode"]');
        const vlanIdInput = form.querySelector('input[name="vlan-id"]');
    
        if (portSelect && portSelect.selectedOptions.length > 0) {
            const selectedPorts = Array.from(portSelect.selectedOptions).map(option => option.value);
            selectedPorts.forEach(port => {
                configData += `interface ${port}\n`;
    
                if (descriptionInput && descriptionInput.value.trim() !== '') {
                    configData += ` description ${descriptionInput.value.trim()}\n`;
                }
    
                if (switchMode && switchMode.value.trim() !== '') {
                    configData += ` switchport mode ${switchMode.value.trim()}\n`;
                }
    
                if (switchMode.value === 'access' && vlanIdInput && vlanIdInput.value.trim() !== '') {
                    configData += ` switchport access vlan ${vlanIdInput.value.trim()}\n`;
                }
    
                // Add port-security configuration
                const portSecurityForms = document.querySelectorAll('.port-security-config');
                portSecurityForms.forEach(securityForm => {
                    const securityPortSelect = securityForm.querySelector('.interface-port-select');
                    const maxMacCount = securityForm.querySelector('input[name="max-mac-count"]')?.value.trim();
                    const stickyMacEnabled = securityForm.querySelector('input[type="checkbox"]').checked;
                    const violationMode = securityForm.querySelector('select[name="violation-mode"]')?.value.trim();
                    const macTableRows = securityForm.querySelectorAll('.mac-address-table tbody tr');
                    console.log("Maximum MAC Count:", maxMacCount); // ตรวจสอบค่าที่ดึงมา

                    const maxMacCountInput = securityForm.querySelector('input[name="max-mac-count"]');
                    const maxMacCountValue = maxMacCountInput ? maxMacCountInput.value.trim() : null;
                
                    if (maxMacCountValue && parseInt(maxMacCountValue, 10) >= 1 && parseInt(maxMacCountValue, 10) <= 4096) {
                        console.log("Maximum MAC Count:", maxMacCountValue); // ตรวจสอบค่าที่ดึงได้
                        configData += ` switchport port-security maximum ${maxMacCountValue}\n`;
                    } else {
                        console.error("Maximum MAC Count is invalid or not defined");
                    }

                    // ตรวจสอบว่าพอร์ตตรงกับที่เลือกในฟอร์ม port-security
                    if (securityPortSelect && Array.from(securityPortSelect.selectedOptions).some(opt => opt.value === port)) {
                        configData += ` switchport port-security\n`;
                
                        // เพิ่ม maximum MAC count หากมีการกำหนดค่า
                        if (maxMacCount && parseInt(maxMacCount) > 0) {
                            configData += ` switchport port-security maximum ${maxMacCount}\n`;
                            console.log("Added Maximum MAC Count to configData");

                        }
                
                        // เพิ่ม sticky MAC configuration หากเปิดใช้งาน
                        if (stickyMacEnabled) {
                            configData += ` switchport port-security mac-address sticky\n`;
                        }
                
                        // เพิ่ม violation mode หากมีการกำหนดค่า
                        if (violationMode) {
                            configData += ` switchport port-security violation ${violationMode}\n`;
                        }
                
                        // เพิ่ม MAC address จากตาราง
                        macTableRows.forEach(row => {
                            const macAddress = row.querySelector('td:first-child').textContent.trim();
                            if (macAddress) {
                                const formattedMac = macAddress.replace(/[:-]/g, "").replace(/(.{4})/g, "$1.").slice(0, -1);
                                configData += ` switchport port-security mac-address ${formattedMac}\n`;
                            }
                        });
                    }
                });
    
                configData += ' exit\n';
            });
        }
    });

    // Link Aggregation Configuration
    const aggregationConfigs = document.querySelectorAll('.aggregation-config');
    aggregationConfigs.forEach(config => {
        const aggregationIdInput = config.querySelector('input[name="aggregation-id[]"]');
        const aggregationIdError = config.querySelector('.alert-box.error');
        const ports = config.querySelector('.aggregation-ports-select')?.selectedOptions;
        const aggregationMode = config.querySelector('select[name="aggregation-mode[]"]')?.value.trim();
        const switchportMode = config.querySelector('.switchport-mode')?.value.trim();
    
        // Skip this configuration if there's an error in Aggregation ID
        if (aggregationIdError && aggregationIdError.style.display === 'flex') {
            console.warn(`Skipping configuration due to Aggregation ID error: ${aggregationIdInput.value}`);
            return;
        }
    
        // Skip if Aggregation ID is missing or invalid
        if (!aggregationIdInput || !aggregationIdInput.value.trim() || isNaN(aggregationIdInput.value.trim())) {
            console.warn(`Invalid or missing Aggregation ID: ${aggregationIdInput ? aggregationIdInput.value : 'undefined'}`);
            return;
        }
    
        const aggregationId = aggregationIdInput.value.trim();
    
        // Skip if no ports or aggregation mode selected
        if (!ports || ports.length === 0 || !aggregationMode) {
            console.warn(`Missing required fields for Aggregation ID: ${aggregationId}`);
            return;
        }
    
        // Generate configuration for each port
        Array.from(ports).forEach(port => {
            configData += `interface ${port.value}\n`;
            configData += ` channel-group ${aggregationId} mode ${aggregationMode}\n`;
            configData += ' exit\n';
        });
    
        // Port-channel configuration
        configData += `interface port-channel ${aggregationId}\n`;
    
        if (switchportMode === 'access') {
            configData += ` switchport mode access\n`;
        
            const accessVlan = config.querySelector('input[name="access-vlan"]')?.value.trim();
            if (accessVlan && parseInt(accessVlan, 10) >= 1 && parseInt(accessVlan, 10) <= 4094) {
                configData += ` switchport access vlan ${accessVlan}\n`;
            } 
        } else if (switchportMode === 'trunk') {
            configData += ` switchport mode trunk\n`;
        
            const allowedVlans = config.querySelector('input[name="trunk-allowed-vlans"]')?.value.trim();
            if (allowedVlans === "all") {
                configData += ` switchport trunk allowed vlan all\n`;
            } else if (allowedVlans) {
                const vlanRegex = /^(\d{1,4})(,\d{1,4})*$/; // เฉพาะหมายเลข VLAN หรือรายการคั่นด้วย comma
                if (vlanRegex.test(allowedVlans)) {
                    configData += ` switchport trunk allowed vlan ${allowedVlans}\n`;
                } else {
                    console.warn(`Invalid Allowed VLANs: ${allowedVlans}`);
                }
            }
        }
    
        configData += ' exit\n';
    });

    configData += 'end\ncopy running-config startup-config\n';

    // Inject data into modal and show it
    openModalPreview(configData);
});


// Download Configuration as .txt File
document.getElementById('download-config').addEventListener('click', () => {
    const configData = document.getElementById('preview-configuration-content').textContent; // ตรวจสอบว่าใช้ ID "preview-configuration-content" จริงหรือไม่

    fetch('/save-and-download-config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configData }) // ส่ง configData ไปยัง Flask
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to download file');
        return response.blob();
    })
    .then(blob => {
        // สร้างชื่อไฟล์พร้อมวันที่และเวลา
        const now = new Date();
        const timestamp = now.toISOString().replace('T', '-').replace(/:/g, '-').split('.')[0];
        const filename = `configuration_${timestamp}.txt`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error:', error));
});


// Ensure that the modal closes when clicking the close button
document.getElementById('modal-preview').addEventListener('click', event => {
    if (event.target.id === 'modal-preview') {
        closeModal();
    }
});