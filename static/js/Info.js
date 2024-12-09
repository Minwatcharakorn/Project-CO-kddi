// Function to Show Error Modal
function showErrorModal(message, description = '') {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const errorDescription = document.querySelector('#errorModal p:nth-of-type(2)'); // Select the second <p> tag

    // Set the main error message
    errorMessage.textContent = message;

    // Set the secondary description or hide it if not provided
    if (description) {
        errorDescription.textContent = description;
        errorDescription.style.display = 'block'; // Ensure it's visible
    } else {
        errorDescription.style.display = 'none'; // Hide if no description
    }

    // Show the modal
    errorModal.style.display = 'flex';

    // Add event listener to close the modal
    const closeErrorModal = document.getElementById('closeErrorModal');
    closeErrorModal.onclick = () => {
        errorModal.style.display = 'none';
    };
}

// Function to Fetch VLAN Information
async function fetchVlanInfo() {
    const switchId = window.location.pathname.split("/").pop();
    try {
        const response = await fetch(`/api/vlan/${switchId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch VLAN data. Status: ${response.status}`);
        }

        const data = await response.json();
        const vlanTableBody = document.getElementById("vlanTableBody");
        vlanTableBody.innerHTML = ""; // Clear existing rows

        if (data.vlan_data && data.vlan_data.length > 0) {
            data.vlan_data.forEach(vlan => {
                const row = document.createElement("tr");

                // VLAN ID
                const idCell = document.createElement("td");
                idCell.textContent = vlan.id;
                row.appendChild(idCell);

                // VLAN Name
                const nameCell = document.createElement("td");
                nameCell.textContent = vlan.name;
                row.appendChild(nameCell);

                // Status
                const statusCell = document.createElement("td");
                statusCell.textContent = vlan.status;
                row.appendChild(statusCell);

                // Ports
                const portsCell = document.createElement("td");
                portsCell.classList.add("ports");
                portsCell.textContent = vlan.ports;
                row.appendChild(portsCell);

                vlanTableBody.appendChild(row);
            });
        } else {
            document.getElementById("noVlanMessage").style.display = "table-row";
        }
    } catch (error) {
        console.error("Error fetching VLAN data:", error);
        showErrorModal(
            "Error Loading VLAN Data",
            "Unable to fetch VLAN information. Please check your network or try again later."
        );
    }
}

// Fetch VLAN data when the page is loaded
document.addEventListener("DOMContentLoaded", fetchVlanInfo);



// Existing DOMContentLoaded logic
document.addEventListener("DOMContentLoaded", async () => {
    const loadingModal = document.getElementById('loadingModal');
    loadingModal.style.display = 'flex';

    const switchId = window.location.pathname.split("/").pop();

    try {
        const response = await fetch(`/api/switch/${switchId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch switch data. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Switch Data:", data);

        const formatUptime = (uptimeSeconds) => {
            const days = Math.floor(uptimeSeconds / 86400);
            const hours = Math.floor((uptimeSeconds % 86400) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = uptimeSeconds % 60;
            return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        };

        // Update text data
        document.getElementById('hostnameTop').innerText = data.hostname || 'N/A';
        document.getElementById('hostnameBottom').innerText = data.hostname || 'N/A';
        document.getElementById('uptime').innerText = data.uptime 
            ? formatUptime(Math.floor(data.uptime / 100)) 
            : 'N/A';
        document.getElementById('devicetypeBottom').innerText = data.device_type || 'N/A';
        // document.getElementById('ipAddress').innerText = data.ip || 'N/A';


        // Prepare data for charts
        const cpuUsage = data.cpu_usage || 0;
        const memoryUsage = data.memory_usage || 0;
        const temperature = data.temperature || 0;

        // Render port statuses dynamically
        const numPorts = data.num_ports || 0;
        const portStatus = data.port_status || [];
        const portContainer = document.getElementById("portStatusContainer");

        for (let i = 0; i < numPorts; i++) {
            const portDiv = document.createElement("div");
            portDiv.className = "port";

            const img = document.createElement("img");
            img.className = "port-image";
            img.src = portStatus[i] === "1" 
                ? "/static/img/Port_UP.png"  
                : "/static/img/Port_DOWN.png";
            img.alt = portStatus[i] === "1" ? "Port Up" : "Port Down";

            const portNumber = document.createElement("span");
            portNumber.className = "port-number";
            portNumber.innerText = i + 1;

            portDiv.appendChild(img);
            portDiv.appendChild(portNumber);
            portContainer.appendChild(portDiv);
        }

        // Create individual charts
        const createChart = (ctx, label, value, color) => {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [label],
                    datasets: [{
                        label: label,
                        data: [value],
                        backgroundColor: color,
                        borderColor: color,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Percentage'
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    }
                },
                plugins: [{
                    id: 'centerText',
                    beforeDraw: (chart) => {
                        const { width } = chart.chartArea;
                        const { top, height } = chart.chartArea;
                        const ctx = chart.ctx;

                        ctx.save();
                        ctx.font = 'bold 16px Arial';
                        ctx.fillStyle = color;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        const centerX = chart.getDatasetMeta(0).data[0].x;
                        const centerY = top + height / 2;

                        ctx.fillText(`${value}%`, centerX, centerY);
                        ctx.restore();
                    }
                }]
            });
        };

        createChart(document.getElementById('cpuChart'), 'CPU Usage', cpuUsage, 'rgba(50, 205, 50, 0.7)');
        createChart(document.getElementById('memoryChart'), 'Memory Usage', memoryUsage, 'rgba(54, 162, 235, 0.6)');
        createChart(document.getElementById('temperatureChart'), 'Temperature', temperature, 'rgba(255, 99, 71, 0.7)');

        document.getElementById('cpuPercent').innerText = `${cpuUsage}%`;
        document.getElementById('memoryPercent').innerText = `${memoryUsage}%`;
        document.getElementById('temperatureValue').innerText = `${temperature}°C`;

    } catch (error) {
        console.error("Error loading switch data:", error);

        // Show Error Modal when error occurs
        showErrorModal(
            "Error Loading Data",
            "Unable to fetch switch information. Please check your network or try again later."
        );
    } finally {
        loadingModal.style.display = 'none';
    }
});


async function fetchLicenseInfo() {
    const switchId = window.location.pathname.split("/").pop();
    try {
        const response = await fetch(`/api/license/${switchId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch license data. Status: ${response.status}`);
        }

        const data = await response.json();
        const licenseContainer = document.getElementById("licenseContainer");
        licenseContainer.innerHTML = ""; // Clear existing content

        if (data.licenses && data.licenses.length > 0) {
            data.licenses.forEach(license => {
                const licenseDiv = document.createElement("div");
                licenseDiv.classList.add("license-item");

                licenseDiv.innerHTML = `
                    <p><strong>Description:</strong> ${license.description}</p>
                    <p><strong>Status:</strong> ${license.status}</p>
                    <p><strong>Type:</strong> ${license.type}</p>
                    <p><strong>Feature:</strong> ${license.feature}</p>
                `;

                licenseContainer.appendChild(licenseDiv);
            });
        } else {
            licenseContainer.innerHTML = "<p>No license information available.</p>";
        }
    } catch (error) {
        console.error("Error fetching license data:", error);
        showErrorModal("Error Loading License Data", "Unable to fetch license information. Please try again.");
    }
}

// Call fetchLicenseInfo when the page loads
document.addEventListener("DOMContentLoaded", fetchLicenseInfo);

