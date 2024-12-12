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

let interfaceCounter = 1;

// Add New Interface Configuration
document.getElementById("add-interface-config").addEventListener("click", function () {
    const interfaceCounter = document.querySelectorAll(".interface-config").length + 1;
    const interfaceConfigs = document.getElementById("interface-configs");

    const newConfig = document.createElement("div");
    newConfig.className = "interface-config";
    newConfig.innerHTML = `
        <form class="config-form">
            <label for="interface-port-${interfaceCounter}">Interface Port</label>
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

            <div class="Description IP" id="Description_ip-${interfaceCounter}">
                <label for="Description-ip-${interfaceCounter}">Description</label>
                <input type="text" id="Description-ip-${interfaceCounter}" name="Description-IP ADD" placeholder="Enter Description Port">
            </div>

            <div class="switch-mode-section" id="switch-mode-section-${interfaceCounter}">
                <label for="switch-mode-${interfaceCounter}">Switch Mode</label>
                <select id="switch-mode-${interfaceCounter}" name="switch-mode">
                    <option value="access">Access</option>
                    <option value="trunk">Trunk</option>
                </select>
            </div>
            <button type="button" class="remove-interface-config" style="width: auto;">
                Remove Configuration
            </button>
        </form>
    `;

    // Add event listener for remove button
    newConfig.querySelector(".remove-interface-config").addEventListener("click", function () {
        newConfig.remove();
    });

    interfaceConfigs.appendChild(newConfig);
});

// Remove Interface Configuration (using delegation for all rows)
document.getElementById("interface-configs").addEventListener("click", function (e) {
    if (e.target.classList.contains("remove-interface-config") || e.target.closest(".remove-interface-config")) {
        const interfaceConfig = e.target.closest(".interface-config");
        if (interfaceConfig) {
            interfaceConfig.remove();
        }
    }
});

// Save All Configurations
document.getElementById("save-interface-configs").addEventListener("click", function () {
    const configs = [];
    document.querySelectorAll(".config-form").forEach(form => {
        const formData = new FormData(form);
        const config = {
            interfacePort: formData.get("interface-port"),
            interfacePortRange: formData.get("interface-port-range"),
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