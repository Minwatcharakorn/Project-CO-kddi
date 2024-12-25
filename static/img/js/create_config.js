let vlanCounter = 1;

// Add New VLAN Form
document.getElementById("add-vlan-row").addEventListener("click", function () {
    vlanCounter++;
    const vlanRows = document.getElementById("vlan-rows");

    // Create a new VLAN form container
    const newVlanForm = document.createElement("form");
    newVlanForm.className = "config-form vlan-form"; // Add a specific class for VLAN forms
    newVlanForm.id = `vlan-form-${vlanCounter}`;

    // Add VLAN form content
    newVlanForm.innerHTML = `
        <div class="vlan-row form-group">
            <label for="vlan-id-${vlanCounter}">VLAN ID</label>
            <input type="number" id="vlan-id-${vlanCounter}" name="vlan-id[]" placeholder="Enter VLAN ID" min="1" max="4094" required>

            <label for="vlan-name-${vlanCounter}">VLAN Name</label>
            <input type="text" id="vlan-name-${vlanCounter}" name="vlan-name[]" placeholder="Enter VLAN Name" required>

            <label for="vlan-IP-${vlanCounter}">IP Address VLAN</label>
            <input type="text" id="vlan-IP-${vlanCounter}" name="vlan-IP[]" placeholder="Enter IP Address VLAN" required>

            <button type="button" class="remove-vlan-form" style="width: auto;">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;

    // Add event listener to the remove button
    newVlanForm.querySelector(".remove-vlan-form").addEventListener("click", function () {
        handleRemoveVlanForm(this);
    });

    vlanRows.appendChild(newVlanForm);
});

// Handle Remove VLAN Form
function handleRemoveVlanForm(button) {
    button.closest(".vlan-form").remove();
}

// Attach Event Listeners on Page Load
document.addEventListener("DOMContentLoaded", () => {
    const removeButtons = document.querySelectorAll(".remove-vlan-form");
    removeButtons.forEach(button => {
        button.addEventListener("click", function () {
            handleRemoveVlanForm(button);
        });
    });
});

// Handle Form Submission
document.getElementById("vlan-multiple-form").addEventListener("submit", function (e) {
    e.preventDefault();

    // Collect VLAN data
    const vlanData = [];
    const vlanForms = document.querySelectorAll(".vlan-form");
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

            <div class="Description IP" id="Description_ip-${interfaceCounter}">
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
            <button type="button" class="remove-vlan-row" style="width: auto;">
                <i class="fas fa-trash-alt"></i>
            </button>
        </form>
    `;

    // Attach event listener for "Remove Configuration" button
    newConfig.querySelector(".remove-interface-config").addEventListener("click", function () {
        newConfig.remove();
    });

    interfaceConfigs.appendChild(newConfig);
});

// Save All Configurations
document.getElementById("save-interface-configs").addEventListener("click", function () {
    const configs = [];
    document.querySelectorAll(".interface-config-form").forEach(form => {
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
