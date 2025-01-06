document.addEventListener("DOMContentLoaded", () => {
    const saveButtonVLAN = document.getElementById("save-vlan-config");
    const cancelButtonVLAN = document.getElementById("cancel-vlan-config");
    const vlanForm = document.getElementById("vlan-multiple-form");
    const addVLANButton = document.getElementById("add-vlan-row");
    const vlanRowsContainer = document.getElementById("vlan-rows");

    // Regular Expression for IPv4 Address Validation
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

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

    // Populate Subnet Masks for Existing Rows
    document.querySelectorAll(".vlan-row").forEach((row, index) => {
        const subnetMaskDropdown = generateSubnetMaskDropdown(index + 1);
        row.querySelector("select[name='subnet-mask[]']").append(...subnetMaskDropdown.children);
    });
        

    // Add VLAN Row
    addVLANButton.addEventListener("click", () => {
        const vlanCounter = document.querySelectorAll(".vlan-row").length + 1;
        const newVLANRow = document.createElement("div");
        newVLANRow.className = "vlan-row form-group";
        newVLANRow.innerHTML = `
            <div class="inline-fields">
                <div>
                    <label for="vlan-id-${vlanCounter}">VLAN ID</label>
                    <input type="number" id="vlan-id-${vlanCounter}" name="vlan-id[]" placeholder="Enter VLAN ID" min="1" max="4094" required>
                </div>
                <div>
                    <label for="vlan-name-${vlanCounter}">VLAN Name</label>
                    <input type="text" id="vlan-name-${vlanCounter}" name="vlan-name[]" placeholder="Enter VLAN Name" required>
                </div>
            </div>
    
            <label for="vlan-IP-${vlanCounter}">IP Address VLAN</label>
            <div class="ip-address-container">
                <input type="text" id="vlan-IP-${vlanCounter}" name="vlan-IP[]" placeholder="Enter IP Address VLAN" required>
                <select id="subnet-mask-${vlanCounter}" name="subnet-mask[]" required></select>
                <button type="button" class="remove-vlan-row">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    
        // Generate and append subnet mask options
        const subnetMaskDropdown = generateSubnetMaskDropdown(vlanCounter);
        newVLANRow.querySelector("select").append(...subnetMaskDropdown.children);
    
        vlanRowsContainer.appendChild(newVLANRow);
    });

    // Event Delegation for Removing VLAN Rows
    vlanRowsContainer.addEventListener("click", (event) => {
        if (
            event.target.classList.contains("remove-vlan-row") ||
            event.target.closest(".remove-vlan-row")
        ) {
            const vlanRow = event.target.closest(".vlan-row");
            if (vlanRow) {
                vlanRow.remove();
    
                // Check if all rows are removed
                if (vlanRowsContainer.querySelectorAll(".vlan-row").length === 0) {
                    // Reset Save/Cancel Buttons
                    saveButtonVLAN.style.display = "inline-block";
                    cancelButtonVLAN.style.display = "none";
    
                    // Enable Add VLAN button
                    addVLANButton.disabled = false;
                }
            }
        }
    });
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
        { name: "Fixed Chassis", range: generatePorts("GigabitEthernet0/", 48) },
        { name: "Modular Chassis", range: generatePorts("GigabitEthernet1/0/", 48) },
        { name: "TenGigabitEthernet", range: generatePorts("TenGigabitEthernet0/", 8) },
    ];

    portGroups.forEach((group) => {
        const groupOption = new Option(group.name, "", false, false);
        $(groupOption).attr("disabled", "disabled");
        $(selectElement).append(groupOption);

        group.range.forEach((port) => {
            const isDisabled = selectedPortsGlobal.includes(port);
            const portOption = new Option(port, port, false, false);
            if (isDisabled) {
                $(portOption).attr("disabled", "disabled");
            }
            $(selectElement).append(portOption);
        });
    });

    $(selectElement).on("select2:select", function (e) {
        const selectedPort = e.params.data.id;
        if (!selectedPortsGlobal.includes(selectedPort)) {
            selectedPortsGlobal.push(selectedPort);
        }
        refreshPortAvailability();
    });

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


// Function to validate Description
function validateDescription(description) {
    const descriptionRegex = /^[a-zA-Z0-9!@#$%^&*(),.?":{}|<>_\-\s]*$/; // Allow letters, numbers, special characters, and spaces
    return descriptionRegex.test(description);
}

// Function to validate VLAN ID
function validateVlanId(vlanId) {
    return vlanId >= 1 && vlanId <= 4094; // Ensure VLAN ID is within range
}

// Function to validate Allowed VLANs (Trunk Mode)
function validateAllowedVlans(allowedVlans) {
    const vlanSyntaxRegex = /^(all|(\d{1,4})(,\d{1,4})*)$/; // Match 'all' or comma-separated numbers
    return vlanSyntaxRegex.test(allowedVlans);
}

const timezones = [
    { value: "", label: "--- Select Timezone ---" }, // Default empty value
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
        <div class="error-message" id="error-${aggId}" style="display: none; color: red;">This Aggregation ID is already in use. Please enter a unique ID.</div>

        <!-- Select Ports -->
        <label for="aggregation-ports-${aggId}" style="font-weight: bold;">Select Ports</label>
        <select id="aggregation-ports-${aggId}" class="aggregation-ports-select" multiple="multiple" style="width: 100%;" required></select>

        <!-- Link Aggregation Mode -->
        <label for="aggregation-mode-${aggId}" style="font-weight: bold;">Link Aggregation Mode</label>
        <select id="aggregation-mode-${aggId}" name="aggregation-mode[]" required>
            <option value="" selected style="text-align: center;">Select Link Aggregation Mode</option>
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

        <!-- Hidden Configuration Fields -->
        <div id="aggregation-config-fields-${aggId}" style="display: none;">
            <!-- Switchport Mode -->
            <label for="switchport-mode-${aggId}" style="font-weight: bold;">Switchport Mode</label>
            <select id="switchport-mode-${aggId}" class="switchport-mode">
                <option value="" selected style="text-align: center;">Select Switchport Mode</option>
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
                    <span class="error-message" id="access-vlan-error-${aggId}" style="display: none; color: red;">VLAN ID must be between 1 and 4094.</span>
                </div>
            </div>

            <!-- Allowed VLANs (Trunk Mode) -->
            <div class="trunk-vlan-section" id="trunk-vlan-section-${aggId}" style="display: none;">
                <label for="trunk-allowed-vlans-${aggId}" style="font-weight: bold;">Allowed VLANs</label>
                <input 
                    type="text" 
                    id="trunk-allowed-vlans-${aggId}" 
                    name="trunk-allowed-vlans" 
                    placeholder="e.g., 20,30,40 or all"
                    style="margin-right: 10px;"
                >
                <span class="error-message" id="trunk-error-${aggId}" style="display: none; color: red;">Allowed VLANs must be valid numbers (1-4094) separated by commas or "all".</span>
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
            errorMessage.style.display = "block"; // Show error message
            errorMessage.textContent = "Aggregation ID must be between 1 and 64."; // Custom error message
            configFields.style.display = "none"; // Hide fields
        } else if (isDuplicate) {
            aggregationIdInput.style.borderColor = "red"; // Add red border
            errorMessage.style.display = "block"; // Show error message
            errorMessage.textContent = "This Aggregation ID is already in use. Please enter a unique ID."; // Custom error message
            configFields.style.display = "none"; // Hide fields
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
    const accessVlanInput = document.getElementById(`access-vlan-${aggId}`);
    const accessVlanError = document.getElementById(`access-vlan-error-${aggId}`); // Element สำหรับ error message
    
    accessVlanInput.addEventListener("input", function () {
        const value = this.value.trim();
        const numValue = parseInt(value, 10);
    
        if (value && (isNaN(numValue) || numValue < 1 || numValue > 4094)) {
            accessVlanInput.style.borderColor = "red"; // เพิ่มกรอบสีแดง
            accessVlanError.style.display = "block"; // แสดงข้อความแจ้งเตือน
        } else {
            accessVlanInput.style.borderColor = ""; // ลบกรอบสีแดง
            accessVlanError.style.display = "none"; // ซ่อนข้อความแจ้งเตือน
        }
    });
    
    // Allowed VLANs Validation
    const allowedVlansInput = document.getElementById(`trunk-allowed-vlans-${aggId}`);
    const allowedVlansError = document.getElementById(`trunk-error-${aggId}`); // Element สำหรับ error message
    
    allowedVlansInput.addEventListener("input", function () {
        const value = this.value.trim();
        const vlanSyntaxRegex = /^(all|(\d{1,4})(,\d{1,4})*)$/; // รูปแบบ 'all' หรือ เลขคั่นด้วย ','
    
        if (value && !vlanSyntaxRegex.test(value)) {
            allowedVlansInput.style.borderColor = "red"; // เพิ่มกรอบสีแดง
            allowedVlansError.style.display = "block"; // แสดงข้อความแจ้งเตือน
        } else {
            allowedVlansInput.style.borderColor = ""; // ลบกรอบสีแดง
            allowedVlansError.style.display = "none"; // ซ่อนข้อความแจ้งเตือน
        }
    });

    // Initialize Switchport Mode Toggle
    initializeSwitchportModeToggle(aggId);

    newAggregationConfig.querySelector(".remove-aggregation-config").addEventListener("click", function () {
        // ดึงข้อมูลพอร์ตที่ถูกเลือกในคอนฟิกนี้
        const selectElement = newAggregationConfig.querySelector(".aggregation-ports-select");
        const selectedPorts = $(selectElement).val(); // Get selected ports

        if (selectedPorts) {
            // ลบพอร์ตเหล่านั้นออกจาก aggregationConfigsList
            selectedPorts.forEach((port) => {
                const index = aggregationConfigsList.indexOf(port);
                if (index > -1) {
                    aggregationConfigsList.splice(index, 1);
                }
            });
        }

    // ลบคอนฟิกนี้ออกจาก DOM
    newAggregationConfig.remove();

    // รีเฟรชการตั้งค่าพอร์ตใหม่
    refreshPortAvailability_agg();
});

    aggregationCounter++;
});

// Toggle Switchport Mode (Access/Trunk)
function initializeSwitchportModeToggle(counter) {
    const switchMode = document.getElementById(`switchport-mode-${counter}`);
    const accessSection = document.getElementById(`access-vlan-section-${counter}`);
    const trunkSection = document.getElementById(`trunk-vlan-section-${counter}`);

    switchMode.addEventListener("change", function () {
        if (this.value === "access") {
            accessSection.style.display = "block";
            trunkSection.style.display = "none";
        } else if (this.value === "trunk") {
            accessSection.style.display = "none";
            trunkSection.style.display = "block";
        } else if (this.value === "") {
            // Reset: Hide both sections when returning to default option
            accessSection.style.display = "none";
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
    if (hostnameInput && hostnameInput.value.trim() !== '') {
        configData += `hostname ${hostnameInput.value.trim()}\n`;
    }

    // VLAN Configuration
    const vlanRows = document.querySelectorAll('.vlan-row');
    vlanRows.forEach(row => {
        const vlanId = row.querySelector('input[name="vlan-id[]"]');
        const vlanName = row.querySelector('input[name="vlan-name[]"]');
        const vlanIp = row.querySelector('input[name="vlan-IP[]"]');
        const subnetMask = row.querySelector('select[name="subnet-mask[]"]');

        if (vlanId && vlanId.value.trim() !== '') {
            configData += `vlan ${vlanId.value.trim()}\n`;

            if (vlanName && vlanName.value.trim() !== '') {
                configData += ` name ${vlanName.value.trim()}\n`;
            }

            if (vlanIp && vlanIp.value.trim() !== '' && subnetMask) {
                configData += `interface vlan ${vlanId.value.trim()}\n`;
                configData += ` ip address ${vlanIp.value.trim()} ${subnetMask.value.trim()}\n exit\n`;
            }
        }
    });

    // Default Gateway Configuration
    const defaultGateway = document.getElementById('default-gateway');
    if (defaultGateway && defaultGateway.value.trim() !== '') {
        configData += `ip default-gateway ${defaultGateway.value.trim()}\n`;
    }

    // VTP Configuration
    const vtpMode = document.getElementById('vtp-mode')?.value;
    const vtpVersion = document.getElementById('vtp-version')?.value;
    const vtpDomain = document.getElementById('vtp-domain')?.value;
    const vtpPassword = document.getElementById('vtp-password')?.value;

    if (vtpMode && vtpVersion && vtpDomain) {
        configData += `vtp mode ${vtpMode}\n`;
        configData += `vtp version ${vtpVersion}\n`;
        configData += `vtp domain ${vtpDomain}\n`;
        if (vtpPassword) {
            configData += `vtp password ${vtpPassword}\n`;
        }
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
        const allowedVlansInput = form.querySelector('input[name="trunk-allowed-vlan"]');
        const allowedVlans = allowedVlansInput ? allowedVlansInput.value.trim() : '';

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
                if (switchMode.value === "trunk" && allowedVlans) {
                    configData += ` switchport trunk allowed vlan ${allowedVlans}\n`;
                }
                configData += ' exit\n';
            });
        }
    });

    // Link Aggregation Configuration
    const aggregationConfigs = document.querySelectorAll('.aggregation-config');
    aggregationConfigs.forEach(config => {
        const aggregationId = config.querySelector('input[name="aggregation-id[]"]')?.value.trim();
        const ports = config.querySelector('.aggregation-ports-select')?.selectedOptions;
        const aggregationMode = config.querySelector('select[name="aggregation-mode[]"]')?.value.trim();
        const switchportModeElement = config.querySelector('.switchport-mode');
        const switchportMode = switchportModeElement ? switchportModeElement.value.trim() : undefined;
        const accessVlan = config.querySelector('input[name="access-vlan"]')?.value.trim();
    
        // Debugging
        console.log(`Processing Aggregation: ID=${aggregationId}, Ports=${ports?.length}, Mode=${switchportMode}, VLAN=${accessVlan}`);
    
        if (aggregationId && ports && ports.length > 0 && aggregationMode) {
            configData += `interface port-channel ${aggregationId}\n`;
    
            if (switchportMode === 'access' && accessVlan) {
                configData += ` switchport mode access\n`;
                configData += ` switchport access vlan ${accessVlan}\n`;
            } else if (switchportMode === 'trunk') {
                configData += ` switchport mode trunk\n`;
    
                // Validate and Add Allowed VLANs
                const allowedVlans = config.querySelector('input[name="trunk-allowed-vlan"]')?.value.trim();
                console.log(`Allowed VLANs: ${allowedVlans}`);
    
                if (allowedVlans) {
                    const isValid = /^all$|^(\d{1,4})(,\d{1,4})*$/.test(allowedVlans);
                    if (isValid) {
                        const vlanNumbers = allowedVlans.split(',').map(vlan => parseInt(vlan, 10));
                        const isInRange = vlanNumbers.every(num => num >= 1 && num <= 4094);
    
                        if (allowedVlans === 'all' || isInRange) {
                            configData += ` switchport trunk allowed vlan ${allowedVlans}\n`;
                        } else {
                            console.error(`Error: VLANs in "Allowed VLANs" must be between 1 and 4094: ${allowedVlans}`);
                        }
                    } else {
                        console.error(`Error: Invalid Allowed VLANs format: ${allowedVlans}`);
                    }
                }
            }
            configData += ' exit\n';
    
            Array.from(ports).forEach(port => {
                configData += `interface ${port.value}\n`;
                configData += ` channel-group ${aggregationId} mode ${aggregationMode}\n`;
                configData += ' exit\n';
            });
        }
    });
    
    configData += 'end\nwrite memory\n';

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
