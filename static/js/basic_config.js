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

        <label for="vlan-IP-${vlanCounter}">IP VLAN</label>
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


let selectedMethods = [];

// Toggle Dropdown Visibility
function toggleDropdown() {
    const menu = document.getElementById('dropdown-options');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// Update Selected Methods
function updateSelections() {
    selectedMethods = [];
    const options = document.querySelectorAll('#dropdown-options input:checked');
    options.forEach(option => selectedMethods.push(option.value));
    document.getElementById('selected-methods').innerText = selectedMethods.length
        ? `Selected: ${selectedMethods.join(', ')}`
        : 'No method selected';
}

// Save Selected Methods Configuration
function saveConfiguration() {
    alert(`Configuration Saved: ${selectedMethods.join(', ')}`);
}

// Show Configurations Based on Selection
function showConfig() {
    const sshConfig = document.getElementById('ssh-config');
    const telnetConfig = document.getElementById('telnet-config');
    const sshAndTelnetConfig = document.getElementById('ssh_telnet-config');

    const sshOption = document.getElementById('ssh-option').checked;
    const telnetOption = document.getElementById('telnet-option').checked;

    if (sshOption && telnetOption) {
        sshConfig.style.display = 'none';
        telnetConfig.style.display = 'none';
        sshAndTelnetConfig.style.display = 'block';
    } else if (sshOption) {
        sshConfig.style.display = 'block';
        telnetConfig.style.display = 'none';
        sshAndTelnetConfig.style.display = 'none';
    } else if (telnetOption) {
        telnetConfig.style.display = 'block';
        sshConfig.style.display = 'none';
        sshAndTelnetConfig.style.display = 'none';
    } else {
        sshConfig.style.display = 'none';
        telnetConfig.style.display = 'none';
        sshAndTelnetConfig.style.display = 'none';
    }
}

let dhcpCounter = 1; // Counter for DHCP Pools

// Event Listener for Page Load
document.addEventListener("DOMContentLoaded", () => {
    // Add Event Listener for Remove Buttons of Existing DHCP Pools
    const defaultRemoveButtons = document.querySelectorAll(".remove-dhcp-pool");
    defaultRemoveButtons.forEach(button => {
        button.addEventListener("click", function () {
            handleRemoveDhcpPool(this);
        });
    });
});


document.addEventListener("DOMContentLoaded", () => {
    // Add event listener for the Enable Lease checkbox
    document.querySelectorAll(".toggle-lease").forEach(checkbox => {
        checkbox.addEventListener("change", function () {
            const leaseFields = this.closest(".dhcp-pool").querySelector("#lease-fields-1");
            if (this.checked) {
                leaseFields.style.display = "block"; // Show lease fields
            } else {
                leaseFields.style.display = "none"; // Hide lease fields
            }
        });
    });
});

// Add New DHCP Pool
document.getElementById("add-dhcp-pool").addEventListener("click", function () {
    dhcpCounter++;
    const dhcpPools = document.getElementById("dhcp-pools");

    const newPool = document.createElement("div");
    newPool.className = "dhcp-pool";
    newPool.innerHTML = `
        <form class="dhcp-form">
            <label for="dhcp-pool-name-${dhcpCounter}">DHCP Pool Name:</label>
            <input type="text" id="dhcp-pool-name-${dhcpCounter}" name="dhcp-pool-name" placeholder="Enter DHCP Pool Name" required>
            <br><br>
            <div class="inline-fields">
                <div>
                    <label for="dhcp-network-${dhcpCounter}">IP Address:</label>
                    <input type="text" id="dhcp-network-${dhcpCounter}" name="dhcp-network" placeholder="e.g. 192.168.1.0" required>
                </div>
                <div>
                    <label for="dhcp-subnet-${dhcpCounter}">Subnet Mask:</label>
                    <select id="dhcp-subnet-${dhcpCounter}" name="dhcp-subnet" required></select>
                </div>
            </div>
            <br>
            <label for="default-router-${dhcpCounter}">Default Gateway:</label>
            <input type="text" id="default-router-${dhcpCounter}" name="default-router" placeholder="Enter Default Gateway" required>
            <br><br>
            <label for="dns-server-${dhcpCounter}">DNS Server:</label>
            <input type="text" id="dns-server-${dhcpCounter}" name="dns-server" placeholder="Enter DNS Server" required>
            <br><br>
            <label for="Lease-${dhcpCounter}">Lease:</label>
            <div class="inline-fields">
                <input type="number" id="Lease-${dhcpCounter}" name="lease-time" placeholder="Enter Lease Time" min="1" required>
                <select id="lease-unit-${dhcpCounter}" name="lease-unit">
                    <option value="hours" selected>Hours</option>
                    <option value="days">Days</option>
                    <option value="minutes">Minutes</option>
                </select>
            </div>
            <br><br>
            <label for="excluded-address-${dhcpCounter}">DHCP Excluded Address:</label>
            <input type="text" id="excluded-address-${dhcpCounter}" name="excluded-address" placeholder="Enter Excluded Address e.g. 192.168.10.1">
            <br><br>
            <button type="button" class="remove-dhcp-pool">
                <i class="fas fa-trash-alt"></i> Remove DHCP Pool
            </button>
            <br><br>
        </form>
    `;

    // Add Event Listener for the New Pool's Remove Button
    newPool.querySelector(".remove-dhcp-pool").addEventListener("click", function () {
        handleRemoveDhcpPool(this);
    });

    dhcpPools.appendChild(newPool);

    // Populate Subnet Mask Options for the New Pool
    populateSubnetOptions(newPool.querySelector("select[name='dhcp-subnet']"));
});

// Handle Remove DHCP Pool
function handleRemoveDhcpPool(button) {
    button.closest(".dhcp-pool").remove(); // Remove DHCP Pool immediately
}

// Populate Subnet Mask Dropdown Options
function populateSubnetOptions(selectElement) {
    const subnetMasks = [
        "128.0.0.0", "192.0.0.0", "224.0.0.0", "240.0.0.0", "248.0.0.0", "252.0.0.0",
        "254.0.0.0", "255.0.0.0", "255.128.0.0", "255.192.0.0", "255.224.0.0",
        "255.240.0.0", "255.248.0.0", "255.252.0.0", "255.254.0.0", "255.255.0.0",
        "255.255.128.0", "255.255.192.0", "255.255.224.0", "255.255.240.0",
        "255.255.248.0", "255.255.252.0", "255.255.254.0", "255.255.255.0",
        "255.255.255.128", "255.255.255.192", "255.255.255.224", "255.255.255.240",
        "255.255.255.248", "255.255.255.252", "255.255.255.254", "255.255.255.255"
    ];

    subnetMasks.forEach(mask => {
        const option = document.createElement("option");
        option.value = mask;
        option.textContent = mask;
        selectElement.appendChild(option);
    });
}

// Populate Subnet Mask Options for Default Pool on Page Load
document.addEventListener("DOMContentLoaded", () => {
    const defaultSubnetSelect = document.querySelector("select[name='dhcp-subnet']");
    populateSubnetOptions(defaultSubnetSelect);
});

// Save DHCP Configuration
document.getElementById("save-dhcp-config").addEventListener("click", function () {
    const dhcpForms = document.querySelectorAll(".dhcp-form");
    dhcpForms.forEach(form => {
        const formData = new FormData(form);
        const leaseTime = formData.get("lease-time");
        const leaseUnit = formData.get("lease-unit");

        // Calculate Lease Time in Hours
        let leaseInHours;
        if (leaseUnit === "days") {
            leaseInHours = leaseTime * 24;
        } else if (leaseUnit === "minutes") {
            leaseInHours = leaseTime / 60;
        } else {
            leaseInHours = leaseTime;
        }

        console.log("Saving DHCP Configuration:", {
            ...Object.fromEntries(formData),
            leaseInHours
        });
    });

    alert("DHCP Configuration Saved!");
});

let hsrpCounter = 1;

document.addEventListener("DOMContentLoaded", () => {
    // Add Event Listener for Remove Buttons of Existing DHCP 
    const defaultDhcpRemoveButtons = document.querySelectorAll(".remove-dhcp-pool");
    defaultDhcpRemoveButtons.forEach(button => {
        button.addEventListener("click", function () {
            handleRemoveDhcpPool(this);
        });
    });

    // Add Event Listener for Remove Buttons of Existing HSRP 
    const defaultHsrpRemoveButtons = document.querySelectorAll(".remove-hsrp-pool");
    defaultHsrpRemoveButtons.forEach(button => {
        button.addEventListener("click", function () {
            handleRemoveHsrpPool(this);
        });
    });
});

// Add New HSRP Pool
document.getElementById("add-hsrp-pool").addEventListener("click", function () {
    hsrpCounter++;
    const hsrpPools = document.getElementById("hsrp-pools");

    const newPool = document.createElement("div");
    newPool.className = "hsrp-pool";
    newPool.innerHTML = `
        <form class="hsrp-form">
            <label for="hsrp-interface-${hsrpCounter}">Interface:</label>
            <input type="text" id="hsrp-interface-${hsrpCounter}" name="hsrp-interface" placeholder="e.g. GigabitEthernet0/1" required>
            <label for="hsrp-ip-${hsrpCounter}">IP Address:</label>
            <input type="text" id="hsrp-ip-${hsrpCounter}" name="hsrp-ip" placeholder="e.g. 192.168.1.2" required>
            <label for="hsrp-virtual-ip-${hsrpCounter}">HSRP Virtual IP:</label>
            <input type="text" id="hsrp-virtual-ip-${hsrpCounter}" name="hsrp-virtual-ip" placeholder="e.g. 192.168.1.1" required>
            <label for="hsrp-priority-${hsrpCounter}">Priority:</label>
            <input type="number" id="hsrp-priority-${hsrpCounter}" name="hsrp-priority" placeholder="e.g. 150" min="1" max="255" required>
            <div style="display: flex; align-items: center;">
                <label for="hsrp-preempt-${hsrpCounter}">Preempt:</label>
                <input type="checkbox" id="hsrp-preempt-${hsrpCounter}" name="hsrp-preempt">
            </div>
            <br><br>
            <button type="button" class="remove-hsrp-pool">
                <i class="fas fa-trash-alt"></i> Remove HSRP Configuration
            </button>
            <br><br>
        </form>
    `;

    // Add Event Listener for the New Pool's Remove Button
    newPool.querySelector(".remove-hsrp-pool").addEventListener("click", function () {
        handleRemoveHsrpPool(this);
    });

    hsrpPools.appendChild(newPool);
});

// Handle Remove HSRP Pool
function handleRemoveHsrpPool(button) {
    button.closest(".hsrp-pool").remove(); // Remove HSRP Pool immediately
}

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

            <div class="ip-input ip-single" id="ip-single-${interfaceCounter}" style="display: none;">
                <label for="interface-ip-${interfaceCounter}">IP Address:</label>
                <input type="text" id="interface-ip-${interfaceCounter}" name="interface-ip" placeholder="Enter IP Address">
            </div>

            <div class="Description IP" id="Description_ip-${interfaceCounter}" style="display: none;">
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

// Handle Removal of Interface Configurations
function handleRemoveInterfaceConfig(button) {
    button.closest(".interface-config").remove();
}

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

        // Hide the "IP Address" and show "Description" fields
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


// IP Static Route Configuration
let routeCounter = 1;

// Subnet Mask Options
const subnetMasks = [
    "128.0.0.0", "192.0.0.0", "224.0.0.0", "240.0.0.0", "248.0.0.0", "252.0.0.0",
    "254.0.0.0", "255.0.0.0", "255.128.0.0", "255.192.0.0", "255.224.0.0",
    "255.240.0.0", "255.248.0.0", "255.252.0.0", "255.254.0.0", "255.255.0.0",
    "255.255.128.0", "255.255.192.0", "255.255.224.0", "255.255.240.0",
    "255.255.248.0", "255.255.252.0", "255.255.254.0", "255.255.255.0",
    "255.255.255.128", "255.255.255.192", "255.255.255.224", "255.255.255.240",
    "255.255.255.248", "255.255.255.252", "255.255.255.254", "255.255.255.255"
];

// Populate Subnet Mask Dropdown
function populateSubnetMask(selectElement) {
    subnetMasks.forEach(mask => {
        const option = document.createElement("option");
        option.value = mask;
        option.textContent = mask;
        selectElement.appendChild(option);
    });
}

// Add New Static Route Row
document.getElementById("add-ip-route").addEventListener("click", function () {
    routeCounter++;
    const routeRows = document.getElementById("ip-route-rows");

    const newRouteRow = document.createElement("div");
    newRouteRow.className = "ip-route-row";
    newRouteRow.innerHTML = `
        <form class="ip-route-form">
            <label for="ip-route-${routeCounter}">IP Static Route</label>
            <input type="text" id="ip-route-${routeCounter}" name="ip-route" placeholder="Enter Destination Network" required>

            <label for="subnet-mask-${routeCounter}">Subnet Mask</label>
            <select id="subnet-mask-${routeCounter}" name="subnet-mask" required></select>

            <label for="next-hop-${routeCounter}">Next Hop IP</label>
            <input type="text" id="next-hop-${routeCounter}" name="next-hop" placeholder="Enter Next Hop IP" required>
        </form>
        <button type="button" class="remove-ip-route">
            <i class="fas fa-trash-alt"></i> Remove IP Static Route
        </button>
    `;

    // Add event listener to the remove button
    newRouteRow.querySelector(".remove-ip-route").addEventListener("click", function () {
        handleRemoveIpRoute(this);
    });

    // Populate the Subnet Mask dropdown
    populateSubnetMask(newRouteRow.querySelector(`#subnet-mask-${routeCounter}`));

    routeRows.appendChild(newRouteRow);
});

// Handle Remove Static Route Row
function handleRemoveIpRoute(button) {
    button.closest(".ip-route-row").remove();
}

// Populate Subnet Mask for the Default Row
document.addEventListener("DOMContentLoaded", () => {
    const defaultSubnetSelect = document.querySelector("select[name='subnet-mask']");
    populateSubnetMask(defaultSubnetSelect);

    // Add event listeners for default remove buttons
    document.querySelectorAll(".remove-ip-route").forEach(button => {
        button.addEventListener("click", function () {
            handleRemoveIpRoute(this);
        });
    });
});

// Save Static Routes
document.getElementById("save-ip-routes").addEventListener("click", function () {
    const routes = [];
    document.querySelectorAll(".ip-route-form").forEach(form => {
        const formData = new FormData(form);
        routes.push({
            route: formData.get("ip-route"),
            mask: formData.get("subnet-mask"),
            nextHop: formData.get("next-hop")
        });
    });

    console.log("Saved Routes:", routes);
    alert("Routes Saved Successfully!");
});