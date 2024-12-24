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

    // Save VLAN Configuration
    saveButtonVLAN.addEventListener("click", () => {
        const vlanRows = document.querySelectorAll(".vlan-row");
        let allValid = true;

        vlanRows.forEach((row) => {
            const vlanID = row.querySelector('input[name="vlan-id[]"]');
            const vlanName = row.querySelector('input[name="vlan-name[]"]');
            const vlanIP = row.querySelector('input[name="vlan-IP[]"]');
            const subnetMask = row.querySelector('select[name="subnet-mask[]"]');

            // Reset error states
            vlanID.classList.remove("input-error");
            vlanName.classList.remove("input-error");
            vlanIP.classList.remove("input-error");

            // Validate VLAN ID (required and within range)
            if (vlanID.value.trim() === '' || isNaN(vlanID.value) || vlanID.value < 1 || vlanID.value > 4094) {
                vlanID.classList.add("input-error");
                alert(`Invalid VLAN ID: ${vlanID.value}. VLAN ID is required and must be between 1 and 4094.`);
                allValid = false;
                return;
            }

            // Validate VLAN Name (English letters only, no spaces allowed)
            if (vlanName.value.trim() !== '') {
                const vlanNameRegex = /^[a-zA-Z0-9-_]+$/; // Allow English letters, numbers, dashes, and underscores
                if (!vlanNameRegex.test(vlanName.value)) {
                    vlanName.classList.add("input-error");
                    alert(`Invalid VLAN Name: ${vlanName.value}. VLAN Name must contain only English letters, numbers, dashes, or underscores.`);
                    allValid = false;
                    return;
                }
            }

            // Optional: Validate IPv4 Address (if provided)
            if (vlanIP.value.trim() !== '') {
                const octets = vlanIP.value.split('.');
                if (
                    octets.length !== 4 ||
                    !octets.every(octet => {
                        const num = parseInt(octet, 10);
                        return num >= 0 && num <= 255;
                    })
                ) {
                    vlanIP.classList.add("input-error");
                    alert(`Invalid IPv4 Address: ${vlanIP.value}. Please enter a valid IPv4 address.`);
                    allValid = false;
                    return;
                }
            }
        });

        if (!allValid) return;

        // Lock all fields
        vlanRows.forEach((row) => {
            const inputs = row.querySelectorAll("input, select");
            inputs.forEach((input) => {
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
        vlanRows.forEach((row) => {
            const inputs = row.querySelectorAll("input, select");
            inputs.forEach((input) => {
                input.disabled = false;
            });
        });
    
        saveButtonVLAN.style.display = "inline-block";
        cancelButtonVLAN.style.display = "none";
        addVLANButton.disabled = false; // Enable "Add VLAN" button
    });

    // Cancel VLAN Configuration
    cancelButtonVLAN.addEventListener("click", () => {
        const vlanRows = document.querySelectorAll(".vlan-row");

        // Unlock all fields
        vlanRows.forEach((row) => {
            const inputs = row.querySelectorAll("input, select");
            inputs.forEach((input) => {
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

// Save All Configurations
document.getElementById("save-interface-configs").addEventListener("click", function () {
    const interfaceForms = document.querySelectorAll(".config-form");

    // Lock all inputs and selects, but keep Remove Configuration buttons enabled
    interfaceForms.forEach((form) => {
        const inputs = form.querySelectorAll("input, select");
        const removeButton = form.querySelector(".remove-interface-config");

        // Lock inputs and selects
        inputs.forEach((input) => {
            input.disabled = true;
        });

        // Keep Remove Configuration button enabled
        if (removeButton) {
            removeButton.disabled = false;
        }
    });

    isLocked = true; // Update lock state

    // Hide the Save All button and show the Cancel button
    const saveButton = document.getElementById("save-interface-configs");
    const cancelButton = document.getElementById("cancel-interface-configs");
    saveButton.style.display = "none";
    cancelButton.style.display = "inline-block";
});

// Cancel All Configurations
document.getElementById("cancel-interface-configs").addEventListener("click", function () {
    const interfaceForms = document.querySelectorAll(".config-form");

    // Unlock all inputs, selects, and buttons
    interfaceForms.forEach((form) => {
        const inputs = form.querySelectorAll("input, select, button");

        inputs.forEach((input) => {
            input.disabled = false;
        });
    });

    isLocked = false; // Update lock state

    // Hide the Cancel button and show the Save All button
    const saveButton = document.getElementById("save-interface-configs");
    const cancelButton = document.getElementById("cancel-interface-configs");
    saveButton.style.display = "inline-block";
    cancelButton.style.display = "none";
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


// Open Modal
function openModalPreview(data) {
    const modal = document.getElementById('preview-configuration-template');
    const modalContent = document.getElementById('preview-configuration-content');
    modalContent.textContent = data; // Populate modal content with the provided data
    modal.style.display = 'flex'; // Display the modal
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('preview-configuration-template');
    modal.style.display = 'none'; // Hide the modal
}

// Generate and Open Modal Content
document.getElementById('save-config-templates').addEventListener('click', () => {
    let configData = 'enable\nconfigure terminal\n'; // Start with initial commands

    // Hostname Configuration
    const hostnameInput = document.getElementById('hostname-input');
    if (hostnameInput && hostnameInput.disabled) {
        configData += `hostname ${hostnameInput.value}\n`;
    }

    // VLAN Configuration
    const vlanRows = document.querySelectorAll('.vlan-row');
    vlanRows.forEach(row => {
        const vlanId = row.querySelector('input[name="vlan-id[]"]');
        const vlanName = row.querySelector('input[name="vlan-name[]"]');
        const vlanIp = row.querySelector('input[name="vlan-IP[]"]');
        const subnetMask = row.querySelector('select[name="subnet-mask[]"]');

        // Add VLAN ID
        if (vlanId && vlanId.value.trim() !== '') {
            configData += `vlan ${vlanId.value}\n`;

            // Add VLAN Name if provided
            if (vlanName && vlanName.value.trim() !== '') {
                configData += ` name ${vlanName.value}\n`;
            }

            // Add interface and IP Address if IP is provided
            if (vlanIp && vlanIp.value.trim() !== '') {
                configData += `interface vlan ${vlanId.value}\n`;
                configData += ` ip address ${vlanIp.value} ${subnetMask.value}\n exit\n`;
            }
        }
    });

    // Default Gateway Configuration
    const defaultGateway = document.getElementById('default-gateway');
    if (defaultGateway && defaultGateway.disabled && defaultGateway.value.trim() !== '') {
        configData += `ip default-gateway ${defaultGateway.value}\n`;
    }

    // VTP Configuration
    const vtpForm = document.getElementById('vtp-form');
    const vtpInputs = vtpForm.querySelectorAll('input, select');
    let vtpConfigured = true;
    vtpInputs.forEach(input => {
        if (!input.disabled) {
            vtpConfigured = false;
        }
    });
    if (vtpConfigured) {
        const vtpMode = document.getElementById('vtp-mode').value;
        const vtpVersion = document.getElementById('vtp-version').value;
        const vtpDomain = document.getElementById('vtp-domain').value;
        const vtpPassword = document.getElementById('vtp-password').value;

        configData += `vtp mode ${vtpMode}\n`;
        configData += `vtp version ${vtpVersion}\n`;
        configData += `vtp domain ${vtpDomain}\n`;
        configData += `vtp password ${vtpPassword}\n`;
    }

    configData += 'end\nwrite memory\n'; // Add closing commands

    // Inject Data into Modal and Show
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