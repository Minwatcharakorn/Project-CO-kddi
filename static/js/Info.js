/**************************************************************
 * 1) Show Error Modal
 **************************************************************/
function showErrorModal(message, description = '') {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const errorDescription = document.querySelector('#errorModal p:nth-of-type(2)'); 

    errorMessage.textContent = message;

    if (description) {
        errorDescription.textContent = description;
        errorDescription.style.display = 'block';
    } else {
        errorDescription.style.display = 'none';
    }

    errorModal.style.display = 'flex';

    const closeErrorModal = document.getElementById('closeErrorModal');
    closeErrorModal.onclick = () => {
        errorModal.style.display = 'none';
    };
}

/**************************************************************
 * 2) Fetch VLAN
 **************************************************************/
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
        console.log("Fetched VLAN Data:", data.vlan_data); // Debug ข้อมูล

        // Reset "noVlanMessage" row
        const noVlanMessage = document.getElementById("noVlanMessage");
        if (noVlanMessage) {
            noVlanMessage.style.display = "none";
        }

        if (data.vlan_data && data.vlan_data.length > 0) {
            data.vlan_data.forEach(vlan => {
                const row = document.createElement("tr");

                const idCell = document.createElement("td");
                idCell.textContent = vlan.id;
                row.appendChild(idCell);

                const nameCell = document.createElement("td");
                nameCell.textContent = vlan.name;
                row.appendChild(nameCell);

                const statusCell = document.createElement("td");
                statusCell.textContent = vlan.status;
                row.appendChild(statusCell);

                const portsCell = document.createElement("td");
                portsCell.classList.add("ports");
                portsCell.textContent = vlan.ports;
                row.appendChild(portsCell);

                vlanTableBody.appendChild(row);
            });
        } else {
            // ถ้าไม่มี VLAN ให้โชว์แถว "No VLAN data available"
            noVlanMessage.style.display = "table-row";
        }
    } catch (error) {
        console.error("Error fetching VLAN data:", error);
        showErrorModal(
            "Error Loading VLAN Data",
            "Unable to fetch VLAN information. Please check your network or try again later."
        );
    }
}

/**************************************************************
 * 3) Global Charts (CPU, Memory, Temperature)
 **************************************************************/
let cpuChart, memoryChart, temperatureChart;

/**************************************************************
 * 4) Fetch Switch Data (CPU/Memory/Temperature) and Draw Charts
 **************************************************************/
async function fetchSwitchData() {
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

        // Prepare data for charts
        const cpuUsage = data.cpu_usage || 0;
        const memoryUsage = data.memory_usage || 0;
        const temperature = data.temperature || 0;

        // Chart generator
        const createChart = (ctx, label, value, color, yAxisLabel = 'Percentage') => {
            return new Chart(ctx, {
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
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: (yAxisLabel === 'Celsius') ? 100 : 100,
                            title: {
                                display: true,
                                text: yAxisLabel
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                        datalabels: {
                            display: true,
                            color: '#000',
                            font: { size: 12, weight: 'bold' },
                            formatter: (val) => (yAxisLabel === 'Celsius') ? `${val}°C` : `${val}%`,
                            anchor: 'end',
                            align: 'end',
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
        };

        // Destroy old charts before re-creating
        if (cpuChart) cpuChart.destroy();
        if (memoryChart) memoryChart.destroy();
        if (temperatureChart) temperatureChart.destroy();

        // Create new charts
        cpuChart = createChart(
            document.getElementById('cpuChart'),
            'CPU Usage',
            cpuUsage,
            'rgba(50, 205, 50, 0.7)'
        );
        memoryChart = createChart(
            document.getElementById('memoryChart'),
            'Memory Usage',
            memoryUsage,
            'rgba(54, 162, 235, 0.6)'
        );
        temperatureChart = createChart(
            document.getElementById('temperatureChart'),
            'Temperature',
            temperature,
            'rgba(255, 99, 71, 0.7)',
            'Celsius'
        );

    } catch (error) {
        console.error("Error loading switch data:", error);
        showErrorModal(
            "Error Loading Data",
            "Unable to fetch switch information. Please check your network or try again later."
        );
    }
}

/**************************************************************
 * 5) Fetch License Info
 **************************************************************/
async function fetchLicenseInfo() {
    const switchId = window.location.pathname.split("/").pop();
    try {
        const response = await fetch(`/api/license/${switchId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch license data. Status: ${response.status}`);
        }

        const data = await response.json();
        const licenseContainer = document.getElementById("licenseContainer");
        licenseContainer.innerHTML = ""; 

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

/**************************************************************
 * 6) Fetch Interface Info
 **************************************************************/
async function fetchInterfaceInfo() {
    const switchId = window.location.pathname.split("/").pop();
    try {
        const response = await fetch(`/api/interfaces/${switchId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch interface data. Status: ${response.status}`);
        }

        const data = await response.json();
        const portStatusContainer = document.querySelector(".port-status");
        portStatusContainer.innerHTML = ""; 

        data.interfaces.forEach((iface) => {
            const portDiv = document.createElement("div");
            portDiv.classList.add("port");
            if (iface.status === "Up") {
                portDiv.classList.add("active");
            }

            const portImg = document.createElement("img");
            portImg.src = iface.status === "Up"
                ? "/static/img/Port_UP.png"
                : "/static/img/Port_DOWN.png";
            portImg.alt = iface.status;

            const portLabel = document.createElement("span");
            portLabel.classList.add("port-number");
            portLabel.innerText = iface.name;

            portDiv.appendChild(portImg);
            portDiv.appendChild(portLabel);
            portStatusContainer.appendChild(portDiv);
        });
    } catch (error) {
        console.error("Error fetching interface data:", error);
        showErrorModal("Error Loading Interfaces", "Unable to fetch interface information. Please try again.");
    }
}

/**************************************************************
 * 7) Refresh All Data (Showing Modal Only On First Load)
 **************************************************************/
let isInitialLoad = true;

async function refreshAllInfo() {
    const loadingModal = document.getElementById('loadingModal');

    // ถ้าเป็นการโหลดครั้งแรก => โชว์ Modal
    if (isInitialLoad) {
        loadingModal.style.display = 'flex';
    }

    try {
        // เรียกฟังก์ชันดึงข้อมูลทั้งหมด
        await fetchSwitchData();
        await fetchLicenseInfo();
        await fetchVlanInfo();
        await fetchInterfaceInfo();

    } catch (err) {
        console.error("Error refreshing info:", err);
        showErrorModal(
            "Error Loading Data",
            "Unable to fetch some info. Check your connection or try again."
        );
    } finally {
        // ปิด Modal แค่ครั้งแรก
        if (isInitialLoad) {
            isInitialLoad = false;
            loadingModal.style.display = 'none';
        }
    }
}

/**************************************************************
 * 8) DOMContentLoaded -> Load All Data + Auto Refresh (No Modal)
 **************************************************************/
document.addEventListener("DOMContentLoaded", () => {
    // เรียกครั้งแรก => แสดง Loading Modal
    refreshAllInfo();

    // รอบต่อไป -> ไม่โชว์ Modal
    setInterval(refreshAllInfo, 10000);
});
