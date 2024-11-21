let selectedMethods = [];

function toggleDropdown() {
    const menu = document.getElementById('dropdown-options');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function updateSelections() {
    selectedMethods = [];
    const options = document.querySelectorAll('#dropdown-options input:checked');
    options.forEach(option => selectedMethods.push(option.value));
    document.getElementById('selected-methods').innerText = selectedMethods.length
        ? `Selected: ${selectedMethods.join(', ')}`
        : 'No method selected';
}

function saveConfiguration() {
    alert(`Configuration Saved: ${selectedMethods.join(', ')}`);
}
function toggleDropdown() {
const menu = document.getElementById('dropdown-options');
menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function showConfig() {
    const sshConfig = document.getElementById('ssh-config');
    const telnetConfig = document.getElementById('telnet-config');
    const sshandtelnetConfig = document.getElementById('ssh_telnet-config');

    const sshOption = document.getElementById('ssh-option').checked;
    const telnetOption = document.getElementById('telnet-option').checked;

    if (sshOption && telnetOption) {
        sshConfig.style.display = 'none';
        telnetConfig.style.display = 'none';
        sshandtelnetConfig.style.display = 'block';
    } else if (sshOption) {
        sshConfig.style.display = 'block';
        telnetConfig.style.display = 'none';
        sshandtelnetConfig.style.display = 'none';
    } else if (telnetOption) {
        telnetConfig.style.display = 'block';
        sshConfig.style.display = 'none';
        sshandtelnetConfig.style.display = 'none';
    } else {
        sshConfig.style.display = 'none';
        telnetConfig.style.display = 'none';
        sshandtelnetConfig.style.display = 'none';
    }
}
let vlanCounter = 1; // ตัวนับแถว VLAN

// เพิ่มแถวใหม่สำหรับกรอก VLAN
document.getElementById("add-vlan-row").addEventListener("click", function () {
    vlanCounter++;
    const vlanRows = document.getElementById("vlan-rows");

    // สร้าง HTML สำหรับแถว VLAN ใหม่
    const newRow = document.createElement("div");
    newRow.className = "vlan-row";
    newRow.innerHTML = `
        <label for="vlan-id-${vlanCounter}">VLAN ID</label>
        <input type="number" id="vlan-id-${vlanCounter}" name="vlan-id[]" placeholder="Enter VLAN ID" min="1" max="4094" required style="width: auto;"> 
        <label for="vlan-name-${vlanCounter}">VLAN Name</label>
        <input type="text" id="vlan-name-${vlanCounter}" name="vlan-name[]" placeholder="Enter VLAN Name" required style="width: auto;">
        <button type="button" class="remove-vlan-row" style="width: auto;">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;

    // เพิ่มแถวใหม่เข้าไปใน DOM
    vlanRows.appendChild(newRow);

    // ผูก Event สำหรับปุ่มลบใหม่
    newRow.querySelector(".remove-vlan-row").addEventListener("click", function () {
        newRow.remove(); // ลบแถวออกจาก DOM
    });
});

// เพิ่ม Event ให้ปุ่มลบแถวแรก
document.querySelectorAll(".remove-vlan-row").forEach(button => {
    button.addEventListener("click", function () {
        button.parentElement.remove(); // ลบแถวออกจาก DOM
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const subnetSelect = document.getElementById("dhcp-subnet");
    const subnetMasks = [
        "128.0.0.0", "192.0.0.0", "224.0.0.0", "240.0.0.0", "248.0.0.0", "252.0.0.0",
        "254.0.0.0", "255.0.0.0", "255.128.0.0", "255.192.0.0", "255.224.0.0",
        "255.240.0.0", "255.248.0.0", "255.252.0.0", "255.254.0.0", "255.255.0.0",
        "255.255.128.0", "255.255.192.0", "255.255.224.0", "255.255.240.0",
        "255.255.248.0", "255.255.252.0", "255.255.254.0", "255.255.255.0",
        "255.255.255.128", "255.255.255.192", "255.255.255.224", "255.255.255.240",
        "255.255.255.248", "255.255.255.252", "255.255.255.254", "255.255.255.255"
    ];

    subnetMasks.forEach((mask, index) => {
        const cidr = index + 1; // CIDR starts from /1
        const option = document.createElement("option");
        option.value = mask;
        option.textContent = `${mask} (/${cidr})`;
        subnetSelect.appendChild(option);
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const enableLeaseDuration = document.getElementById("enable-lease-duration");
    const leaseDurationSection = document.getElementById("lease-duration-section");

    const enableExcludedAddresses = document.getElementById("enable-excluded-addresses");
    const excludedAddressesSection = document.getElementById("excluded-addresses-section");

    // Toggle Lease Duration section
    enableLeaseDuration.addEventListener("change", () => {
        leaseDurationSection.style.display = enableLeaseDuration.checked ? "block" : "none";
    });

    // Toggle Excluded Addresses section
    enableExcludedAddresses.addEventListener("change", () => {
        excludedAddressesSection.style.display = enableExcludedAddresses.checked ? "block" : "none";
    });
});

