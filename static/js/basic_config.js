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
