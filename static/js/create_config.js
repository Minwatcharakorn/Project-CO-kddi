let vlanCounter = 1;

// Add New VLAN Form
document.getElementById("add-vlan-row").addEventListener("click", function () {
    const vlanCounter = document.querySelectorAll(".vlan-row").length + 1; // นับจำนวน VLAN ปัจจุบัน
    const vlanRows = document.getElementById("vlan-rows");

    // Create a new VLAN form container
    const newVlanRow = document.createElement("div"); // ใช้ div สำหรับ container
    newVlanRow.className = "vlan-row form-group"; // เพิ่ม class สำหรับ styling
    newVlanRow.id = `vlan-row-${vlanCounter}`;

    // Add VLAN form content
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
        newVlanRow.remove(); // ลบ VLAN Form นี้
    });

    vlanRows.appendChild(newVlanRow); // เพิ่ม VLAN Form ใน container
});

// Remove VLAN Form (using delegation for all rows)
document.getElementById("vlan-rows").addEventListener("click", function (e) {
    if (e.target.classList.contains("remove-vlan-row") || e.target.closest(".remove-vlan-row")) {
        const vlanRow = e.target.closest(".vlan-row");
        if (vlanRow) {
            vlanRow.remove();
        }
    }
});

// Handle Form Submission
document.getElementById("vlan-multiple-form").addEventListener("submit", function (e) {
    e.preventDefault();

    // Collect VLAN data
    const vlanData = [];
    const vlanForms = document.querySelectorAll(".vlan-row");
    vlanForms.forEach(form => {
        const vlanId = form.querySelector('input[name="vlan-id[]"]').value;
        const vlanName = form.querySelector('input[name="vlan-name[]"]').value;
        const vlanIP = form.querySelector('input[name="vlan-IP[]"]').value;

        vlanData.push({ vlanId, vlanName, vlanIP });
    });

    console.log("Submitted VLAN Data:", vlanData);

    // Optional: Add logic to send this data to the server
    alert("VLAN Configuration Saved!");
});

function toggleVlanSections() {
    const switchMode = document.getElementById("switch-mode-1").value;
    const vlanSection = document.getElementById("vlan-id-section-1");
    const trunkSection = document.getElementById("vlan-trunk-section-1");

    if (switchMode === "access") {
        vlanSection.style.display = "block"; // Show VLAN ID input
        trunkSection.style.display = "none"; // Hide Allowed VLANs input
    } else if (switchMode === "trunk") {
        vlanSection.style.display = "none"; // Hide VLAN ID input
        trunkSection.style.display = "block"; // Show Allowed VLANs input
    }
}

// Set default visibility when the page loads
window.addEventListener("DOMContentLoaded", function () {
    toggleVlanSections(); // Apply initial visibility
});

// Event listener for Switch Mode selection
document.getElementById("switch-mode-1").addEventListener("change", toggleVlanSections);

// Validate VLAN ID input
document.getElementById("vlan-id-input-1").addEventListener("input", function () {
    const vlanError = document.getElementById("vlan-error-1");
    const minVlan = 1;
    const maxVlan = 4094;
    const value = parseInt(this.value, 10);

    if (isNaN(value) || value < minVlan || value > maxVlan) {
        vlanError.style.display = "block"; // Show error message
        this.setCustomValidity(`VLAN ID must be between ${minVlan} and ${maxVlan}.`);
        alert(
            `Invalid VLAN ID!\n` +
            `- VLAN ID must be a number between ${minVlan} and ${maxVlan}.`
        ); // Alert user about the error
    } else {
        vlanError.style.display = "none"; // Hide error message
        this.setCustomValidity(""); // Clear custom validity
    }
});

// Validate Allowed VLANs input
document.getElementById("trunk-allowed-vlan-1").addEventListener("input", function () {
    const trunkError = document.getElementById("vlan-trunk-error-1");
    const value = this.value.trim();
    const vlanPattern = /^(\d{1,4}(-\d{1,4})?,?)+$|^all$/;

    if (!vlanPattern.test(value)) {
        trunkError.style.display = "block"; // Show error message
        this.setCustomValidity("Invalid VLAN format. Use numbers separated by commas or 'all'.");
        alert(
            "Invalid VLAN input!\n" +
            "- Use numbers between 1 and 4094.\n" +
            "- Separate multiple VLANs with commas (e.g., 10,20,30).\n" +
            "- Use 'all' to allow all VLANs."
        ); // Alert user about the error
    } else {
        trunkError.style.display = "none"; // Hide error message
        this.setCustomValidity(""); // Clear custom validity
    }
});

let interfaceCounter = 1;

// Add New Interface Configuration
document.getElementById("add-interface-config").addEventListener("click", function () {
    interfaceCounter++;
    const interfaceConfigs = document.getElementById("interface-configs");

    const newConfig = document.createElement("div");
    newConfig.className = "interface-config";
    newConfig.innerHTML = `
        <form class="config-form">
            <!-- Dropdown with Checkbox -->
            <label for="interface-port-dropdown-${interfaceCounter}" style="font-weight: bold;">Select Interface Ports</label>
            
            <!-- Container to Display Selected Ports -->
            <div id="selected-ports-container-${interfaceCounter}">
                <h4>Selected Ports</h4>
                <div id="selected-ports-box-${interfaceCounter}">
                    <!-- Dynamically Added Selected Ports -->
                </div>
            </div>

            <!-- Dropdown for Interface Port Selection -->
            <div id="dropdown-container-${interfaceCounter}">
                <button type="button" id="dropdown-button-${interfaceCounter}" class="styled-button">
                    Select Ports
                </button>
                <div id="dropdown-content-${interfaceCounter}" class="dropdown-content">
                    <!-- Fixed Chassis Section -->
                    <div id="fixed-chassis-section-${interfaceCounter}">
                        <h4>Fixed Chassis</h4>
                        <label>
                            <input type="checkbox" id="select-all-fixed-chassis-${interfaceCounter}"> Select All Fixed Chassis
                        </label>
                        <div id="fixed-chassis-ports-${interfaceCounter}">
                            <!-- Dynamically Added Ports -->
                        </div>
                    </div>
                    
                    <!-- Modular Chassis Section -->
                    <div id="modular-chassis-section-${interfaceCounter}">
                        <h4>Modular/Stackable Chassis</h4>
                        <label>
                            <input type="checkbox" id="select-all-modular-chassis-${interfaceCounter}"> Select All Modular/Stackable Chassis
                        </label>
                        <div id="modular-chassis-ports-${interfaceCounter}">
                            <!-- Dynamically Added Ports -->
                        </div>
                    </div>
                    
                    <!-- TenGigabitEthernet -->
                    <div id="ten-gigabit-section-${interfaceCounter}">
                        <h4>TenGigabitEthernet</h4>
                        <label>
                            <input type="checkbox" id="select-all-ten-gigabit-${interfaceCounter}"> Select All TenGigabitEthernet
                        </label>
                        <div id="ten-gigabit-ports-${interfaceCounter}">
                            <!-- Dynamically Added Ports -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Description Input -->
            <div class="Description-IP">
                <label for="Description-ip-${interfaceCounter}" style="font-weight: bold;">Description</label>
                <input type="text" id="Description-ip-${interfaceCounter}" name="Description-IP ADD" placeholder="Enter Description Port">
            </div>

            <!-- Switch Mode Selection -->
            <div class="switch-mode-section">
                <label for="switch-mode-${interfaceCounter}" style="font-weight: bold;">Switch Mode</label>
                <select id="switch-mode-${interfaceCounter}" name="switch-mode">
                    <option value="access" selected>Access</option>
                    <option value="trunk">Trunk</option>
                </select>
            </div>

            <!-- VLAN ID Input -->
            <div class="vlan-id-section" id="vlan-id-section-${interfaceCounter}">
                <label for="vlan-id-input-${interfaceCounter}" style="font-weight: bold;">VLAN ID</label>
                <input type="number" id="vlan-id-input-${interfaceCounter}" name="vlan-id-input" placeholder="Enter VLAN ID" value="1" min="1" max="4094" required>
                <small id="vlan-error-${interfaceCounter}" style="color: red; display: none;">VLAN ID must be between 1 and 4094.</small>
            </div>

            <!-- Allowed VLANs Section -->
            <div class="vlan-trunk-section" id="vlan-trunk-section-${interfaceCounter}" style="display: none;">
                <label for="trunk-allowed-vlan-${interfaceCounter}" style="font-weight: bold;">Allowed VLANs</label>
                <input type="text" id="trunk-allowed-vlan-${interfaceCounter}" name="trunk-allowed-vlan" placeholder="e.g., 20,30,40 or all" value="1" required>
                <small id="vlan-trunk-error-${interfaceCounter}" style="color: red; display: none;">Invalid VLAN format. Use numbers separated by commas or "all".</small>
            </div>

            <!-- Remove Configuration Button -->
            <button type="button" class="remove-interface-config styled-button" style="margin-top: 10px; background-color: #dc3545; color: white;">Remove Configuration</button>
        </form>
        <hr style="margin-top: 10px; border: none; border-top: 1px solid #ccc;">
    `;

    // Append the new configuration to the container
    interfaceConfigs.appendChild(newConfig);

    // Add event listeners for dynamic elements
    const dropdownButton = document.getElementById(`dropdown-button-${interfaceCounter}`);
    const dropdownContent = document.getElementById(`dropdown-content-${interfaceCounter}`);

    dropdownButton.addEventListener("click", function () {
        dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
    });

    newConfig.querySelector(".remove-interface-config").addEventListener("click", function () {
        newConfig.remove();
    });
});
// Save All Configurations
document.getElementById("save-interface-configs").addEventListener("click", function () {
    const configs = [];
    document.querySelectorAll(".config-form").forEach(form => {
        const formData = new FormData(form);
        const config = {
            interfacePort: formData.get("interface-port"),
            description: formData.get("Description-IP ADD"),
            switchMode: formData.get("switch-mode")
        };
        configs.push(config);
    });
    console.log("Saved Configurations:", configs);
    alert("Configurations Saved!");
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

// Initialize ports for Fixed Chassis, Modular Chassis, and TenGigabitEthernet
const fixedChassisPorts = [];
const modularChassisPorts = [];
const TenGigabitEthernet = [];
const selectedPorts = new Set();

// Add Fixed Chassis ports (GigabitEthernet0/1 to GigabitEthernet0/48)
for (let i = 1; i <= 48; i++) {
    fixedChassisPorts.push(`GigabitEthernet0/${i}`);
}

// Add Modular Chassis ports (GigabitEthernet1/0/1 to GigabitEthernet1/0/48)
for (let i = 1; i <= 48; i++) {
    modularChassisPorts.push(`GigabitEthernet1/0/${i}`);
}

// Add FastEthernet ports (FastEthernet0/1 to FastEthernet0/48)
for (let i = 1; i <= 8; i++) {
    TenGigabitEthernet.push(`TenGigabitEthernet0/${i}`);
}

// Add additional Modular Chassis ranges (GigabitEthernet1/1/1 to GigabitEthernet1/1/48 and GigabitEthernet1/2/1 to GigabitEthernet1/2/48)
for (let i = 1; i <= 24; i++) {
    modularChassisPorts.push(`GigabitEthernet1/1/${i}`);
}

for (let i = 1; i <= 24; i++) {
    modularChassisPorts.push(`GigabitEthernet1/2/${i}`);

}

// Toggle dropdown visibility
document.getElementById("dropdown-button").addEventListener("click", function () {
    const dropdownContent = document.getElementById("dropdown-content");
    dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
});

// Add Fixed Chassis ports dynamically
const fixedChassisContainer = document.getElementById("fixed-chassis-ports");
fixedChassisPorts.forEach(port => {
    const label = document.createElement("label");
    label.innerHTML = `
        <input type="checkbox" value="${port}" class="fixed-chassis-checkbox"> ${port}
    `;
    fixedChassisContainer.appendChild(label);
});

// Add Modular Chassis ports dynamically
const modularChassisContainer = document.getElementById("modular-chassis-ports");
modularChassisPorts.forEach(port => {
    const label = document.createElement("label");
    label.innerHTML = `
        <input type="checkbox" value="${port}" class="modular-chassis-checkbox"> ${port}
    `;
    modularChassisContainer.appendChild(label);
});

// Add FastEthernet ports dynamically
const dropdownContent = document.getElementById("ten-gigabit-ports");
TenGigabitEthernet.forEach(port => {
    const label = document.createElement("label");
    label.innerHTML = `
        <input type="checkbox" value="${port}" class="ten-gigabitEthernet-checkbox"> ${port}
    `;
    dropdownContent.appendChild(label);
});

// "Select All" for Fixed Chassis
document.getElementById("select-all-fixed-chassis").addEventListener("change", function (e) {
    const checkboxes = document.querySelectorAll(".fixed-chassis-checkbox");
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
        if (e.target.checked) {
            selectedPorts.add(checkbox.value);
        } else {
            selectedPorts.delete(checkbox.value);
        }
    });
    updateSelectedPorts();
});

// "Select All" for Modular Chassis
document.getElementById("select-all-modular-chassis").addEventListener("change", function (e) {
    const checkboxes = document.querySelectorAll(".modular-chassis-checkbox");
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
        if (e.target.checked) {
            selectedPorts.add(checkbox.value);
        } else {
            selectedPorts.delete(checkbox.value);
        }
    });
    updateSelectedPorts();
});


// "Select All" for Modular Chassis
document.getElementById("select-all-ten-gigabit").addEventListener("change", function (e) {
    const checkboxes = document.querySelectorAll(".ten-gigabitEthernet-checkbox");
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
        if (e.target.checked) {
            selectedPorts.add(checkbox.value);
        } else {
            selectedPorts.delete(checkbox.value);
        }
    });
    updateSelectedPorts();
});

// Update selected ports display
function updateSelectedPorts() {
    const selectedPortsBox = document.getElementById("selected-ports-box");
    selectedPortsBox.innerHTML = "";

    const portsText = Array.from(selectedPorts).join(", ");
    selectedPortsBox.textContent = portsText;
}

// Handle individual checkbox selection
document.getElementById("dropdown-content").addEventListener("change", function (e) {
    if (e.target.type === "checkbox" && e.target.className.includes("checkbox")) {
        const port = e.target.value;
        if (e.target.checked) {
            selectedPorts.add(port);
        } else {
            selectedPorts.delete(port);
        }
        updateSelectedPorts();
    }
});