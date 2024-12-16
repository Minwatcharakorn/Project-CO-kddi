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
    interfaceCounter++;
    const interfaceConfigs = document.getElementById("interface-configs");
    const newConfig = document.createElement("div");
    newConfig.className = "interface-config";
    newConfig.innerHTML = `
        <form class="config-form">
            <!-- Dropdown เลือกพอร์ต -->
            <label for="interface-port-dropdown-${interfaceCounter}" style="font-weight: bold;">Select Interface Ports</label>
            <div id="selected-ports-container-${interfaceCounter}">
                <h4>Selected Ports</h4>
                <div id="selected-ports-box-${interfaceCounter}"></div>
            </div>
            <div id="dropdown-container-${interfaceCounter}">
                <button type="button" id="dropdown-button-${interfaceCounter}">
                    Select Ports
                </button>
                <div id="dropdown-content-${interfaceCounter}" class="dropdown-content"></div>
            </div>

            <!-- Description -->
            <div class="Description-IP">
                <label for="Description-ip-${interfaceCounter}" style="font-weight: bold;">Description</label>
                <input type="text" id="Description-ip-${interfaceCounter}" name="Description-IP" placeholder="Enter Description Port">
            </div>

            <!-- Switch Mode -->
            <div class="switch-mode-section">
                <label for="switch-mode-${interfaceCounter}" style="font-weight: bold;">Switch Mode</label>
                <select id="switch-mode-${interfaceCounter}" name="switch-mode">
                    <option value="access" selected>Access</option>
                    <option value="trunk">Trunk</option>
                </select>
            </div>

            <!-- VLAN ID -->
            <div class="vlan-id-section" id="vlan-id-section-${interfaceCounter}">
                <label for="vlan-id-input-${interfaceCounter}" style="font-weight: bold;">VLAN ID</label>
                <input type="number" id="vlan-id-input-${interfaceCounter}" name="vlan-id-input" placeholder="Enter VLAN ID" value="1" min="1" max="4094" required>
            </div>

            <!-- Allowed VLANs -->
            <div class="vlan-trunk-section" id="vlan-trunk-section-${interfaceCounter}" style="display: none;">
                <label for="trunk-allowed-vlan-${interfaceCounter}" style="font-weight: bold;">Allowed VLANs</label>
                <input type="text" id="trunk-allowed-vlan-${interfaceCounter}" name="trunk-allowed-vlan" placeholder="e.g., 20,30,40 or all" required>
            </div>

            <!-- ปุ่มลบ -->
            <button type="button" class="remove-interface-config styled-button" style="background-color: #dc3545; color: white;">Remove Configuration</button>
        </form>
        <hr style="margin-top: 20px; border: none; border-top: 1px solid #ccc;">
    `;

    // เพิ่ม Config ใหม่ในหน้า
    interfaceConfigs.appendChild(newConfig);

    // เรียกใช้ฟังก์ชันสำหรับ Config ใหม่
    initializeDropdown(interfaceCounter);
    initializeSwitchModeToggle(interfaceCounter);
    initializeRemoveButton(newConfig);
});


// ฟังก์ชันจัดการ Dropdown
let selectedPortsGlobal = []; // เก็บ ports ที่ถูกเลือกไว้ทั้งหมด

function initializeDropdown(interfaceCounter) {
    const dropdownButton = document.getElementById(`dropdown-button-${interfaceCounter}`);
    const dropdownContent = document.getElementById(`dropdown-content-${interfaceCounter}`);
    const selectedPortsBox = document.getElementById(`selected-ports-box-${interfaceCounter}`);
    
    // Toggle Dropdown Visibility
    dropdownButton.addEventListener("click", () => {
        dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
    });

    // Define port groups
    const portGroups = [
        { name: "Fixed Chassis", id: "fixed-chassis", range: generatePorts("GigabitEthernet0/", 48) },
        { name: "Modular/Stackable Chassis", id: "modular-chassis", range: [...generatePorts("GigabitEthernet1/0/", 48), ...generatePorts("GigabitEthernet1/1/", 24), ...generatePorts("GigabitEthernet1/2/", 24)] },
        { name: "TenGigabitEthernet", id: "ten-gigabit", range: generatePorts("TenGigabitEthernet0/", 8) },
    ];

    // Create port sections
    dropdownContent.innerHTML = ""; // Clear previous content
    portGroups.forEach(({ name, id, range }) => {
        const section = document.createElement("div");
        section.innerHTML = `
            <h4>${name}</h4>
            <label><input type="checkbox" id="select-all-${id}-${interfaceCounter}"> Select All ${name}</label>
        `;
        const container = document.createElement("div");

        range.forEach(port => {
            const isChecked = selectedPortsGlobal.includes(port) ? "disabled" : "";
            container.innerHTML += `
                <label>
                    <input type="checkbox" value="${port}" class="${id}-checkbox-${interfaceCounter}" ${isChecked}> ${port}
                </label>`;
        });
        section.appendChild(container);
        dropdownContent.appendChild(section);

        // Add "Select All" functionality
        document.getElementById(`select-all-${id}-${interfaceCounter}`).addEventListener("change", e => {
            container.querySelectorAll(`.${id}-checkbox-${interfaceCounter}`).forEach(checkbox => {
                if (!checkbox.disabled) {
                    checkbox.checked = e.target.checked;
                }
            });
            updateSelectedPortsAdd(selectedPortsBox, dropdownContent);
        });
    });

    // Update selected ports on change
    dropdownContent.addEventListener("change", () => {
        updateSelectedPortsAdd(selectedPortsBox, dropdownContent);
    });
}
// Generate port ranges
function generatePorts(prefix, count) {
    return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
}

// Update selected ports display
function updateSelectedPortsAdd(selectedPortsBox, dropdownContent) {
    const checkboxes = dropdownContent.querySelectorAll("input[type='checkbox']:checked");
    const selectedPorts = Array.from(checkboxes)
        .filter(checkbox => checkbox.value !== "on") // ตัดคำว่า "on" ออก
        .filter(checkbox => !checkbox.disabled)      // ข้าม checkbox ที่ disabled
        .map(checkbox => checkbox.value);

    selectedPortsBox.textContent = selectedPorts.length > 0 ? selectedPorts.join(", ") : "No ports selected";

    // Update global selected ports list
    updateGlobalSelectedPorts();
}

function updateGlobalSelectedPorts() {
    selectedPortsGlobal = [];
    document.querySelectorAll(".config-form").forEach(form => {
        const portsBox = form.querySelector("[id^='selected-ports-box']");
        if (portsBox) {
            const ports = portsBox.textContent.split(", ").filter(p => p.trim());
            selectedPortsGlobal.push(...ports);
        }
    });
    // Reinitialize all dropdowns to reflect disabled ports
    reinitializeDropdowns();
}

function reinitializeDropdowns() {
    document.querySelectorAll(".dropdown-content").forEach((dropdown, index) => {
        initializeDropdown(index + 1);
    });
}

// ฟังก์ชันจัดการ Switch Mode
function initializeSwitchModeToggle(interfaceCounter) {
    const switchMode = document.getElementById(`switch-mode-${interfaceCounter}`);
    const vlanSection = document.getElementById(`vlan-id-section-${interfaceCounter}`);
    const trunkSection = document.getElementById(`vlan-trunk-section-${interfaceCounter}`);

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

// ฟังก์ชันลบ Config
function initializeRemoveButton(newConfig) {
    const removeButton = newConfig.querySelector(".remove-interface-config");
    removeButton.addEventListener("click", function () {
        newConfig.remove();
    });
}
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