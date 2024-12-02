document.addEventListener("DOMContentLoaded", async () => {
    const switchId = window.location.pathname.split("/").pop();
    // await switchSelectionChanged();

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


        // document.getElementById('hostname').innerText = data.hostname || 'N/A';
        document.getElementById('uptime').innerText = data.uptime 
            ? formatUptime(Math.floor(data.uptime / 100)) // แปลงจากมิลลิวินาทีเป็นวินาที
            : 'N/A';                
        document.getElementById('system-time').innerText = data.system_time || 'N/A';
        document.getElementById('devicetypeTop').innerText = data.device_type || 'N/A';
        document.getElementById('devicetypeBottom').innerText = data.device_type || 'N/A';


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

            // Create an image element for the port status
            const img = document.createElement("img");
            img.className = "port-image";
            img.src = portStatus[i] === "1" 
                ? "/static/img/Port_UP.png"  // Path to Port_UP image
                : "/static/img/Port_DOWN.png";  // Path to Port_DOWN image
            img.alt = portStatus[i] === "1" ? "Port Up" : "Port Down";

            // Add port number
            const portNumber = document.createElement("span");
            portNumber.className = "port-number";
            portNumber.innerText = i + 1;

            // Append the image and port number to the div
            portDiv.appendChild(img);
            portDiv.appendChild(portNumber);

            // Add the div to the container
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
                    legend: {
                        display: false
                    },
                    // Custom plugin for rendering percentage
                    tooltip: {
                        enabled: false // Disable default tooltip
                    }
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
        // Render charts
        createChart(document.getElementById('cpuChart'), 'CPU Usage', cpuUsage, 'rgba(50, 205, 50, 0.7)');
        createChart(document.getElementById('memoryChart'), 'Memory Usage', memoryUsage, 'rgba(54, 162, 235, 0.6)');
        createChart(document.getElementById('temperatureChart'), 'Temperature', temperature, 'rgba(255, 99, 71, 0.7)');

        // Update percentage text
        document.getElementById('cpuPercent').innerText = `${cpuUsage}%`;
        document.getElementById('memoryPercent').innerText = `${memoryUsage}%`;
        document.getElementById('temperatureValue').innerText = `${temperature}°C`;

    } catch (error) {
        console.error("Error loading switch data:", error);
        alert("Failed to load switch information.");
    }
});
// async function switchSelectionChanged() {
//     const selectedSwitchId = document.getElementById('switchSelector').value;
//     console.log("Selected Switch ID:", selectedSwitchId);

//     try {
//         const response = await fetch(`/api/switch/${selectedSwitchId}`);
//         console.log("API Response Status:", response.status);

//         if (!response.ok) {
//             throw new Error(`Failed to fetch switch data. Status: ${response.status}`);
//         }

//         const data = await response.json();

//         // อัปเดตข้อมูลในหน้า
//         document.getElementById('hostnameTop').innerText = data.hostname || 'N/A';
//         document.getElementById('hostnameBottom').innerText = data.hostname || 'N/A';

//         const formatUptime = (uptimeSeconds) => {
//             if (!uptimeSeconds || isNaN(uptimeSeconds)) return "N/A"; // ตรวจสอบค่าก่อนแปลง
//             const days = Math.floor(uptimeSeconds / 86400);
//             const hours = Math.floor((uptimeSeconds % 86400) / 3600);
//             const minutes = Math.floor((uptimeSeconds % 3600) / 60);
//             const seconds = Math.floor(uptimeSeconds % 60);

//             return `${days}d ${hours}h ${minutes}m ${seconds}s`;
//         };

//         document.getElementById('uptime').innerText = data.uptime 
//             ? formatUptime(Math.floor(data.uptime / 100)) // แปลงจากมิลลิวินาทีเป็นวินาที
//             : 'N/A';

//         document.getElementById('system-time').innerText = data.system_time || 'N/A';
//         document.getElementById('devicetypeTop').innerText = data.device_type || 'N/A';
//         document.getElementById('devicetypeBottom').innerText = data.device_type || 'N/A';

//         updatePorts(data.num_ports, data.port_status || []);
//         updateCharts(data.cpu_usage, data.memory_usage, data.temperature);

//     } catch (error) {
//         console.error("Error loading switch data:", error);
//         alert("Failed to load switch information.");
//     }
// }

// function updatePorts(numPorts, portStatus) {
//     const portContainer = document.getElementById("portStatusContainer");
//     portContainer.innerHTML = ''; // Clear previous ports

//     for (let i = 0; i < numPorts; i++) {
//         const portDiv = document.createElement("div");
//         portDiv.className = "port";

//         const img = document.createElement("img");
//         img.className = "port-image";
//         img.src = portStatus[i] === "1" 
//             ? "/static/img/Port_UP.png"
//             : "/static/img/Port_DOWN.png";
//         img.alt = portStatus[i] === "1" ? "Port Up" : "Port Down";

//         const portNumber = document.createElement("span");
//         portNumber.className = "port-number";
//         portNumber.innerText = i + 1;

//         portDiv.appendChild(img);
//         portDiv.appendChild(portNumber);
//         portContainer.appendChild(portDiv);
//     }
// }

// function updateCharts(cpuUsage, memoryUsage, temperature) {
//     createChart(document.getElementById('cpuChart'), 'CPU Usage', cpuUsage, 'rgba(50, 205, 50, 0.7)');
//     createChart(document.getElementById('memoryChart'), 'Memory Usage', memoryUsage, 'rgba(54, 162, 235, 0.6)');
//     createChart(document.getElementById('temperatureChart'), 'Temperature', temperature, 'rgba(255, 99, 71, 0.7)');

//     document.getElementById('cpuPercent').innerText = `${cpuUsage}%`;
//     document.getElementById('memoryPercent').innerText = `${memoryUsage}%`;
//     document.getElementById('temperatureValue').innerText = `${temperature}°C`;
// }

// document.addEventListener("DOMContentLoaded", async () => {
//     await switchSelectionChanged();
// });