document.addEventListener('DOMContentLoaded', () => {
    const contentSection = document.querySelector('.content');
    const selectedSwitches = JSON.parse(localStorage.getItem('selectedSwitches')) || [];

    if (selectedSwitches.length > 0) {
        const firmwareTable = document.createElement('div');
        firmwareTable.innerHTML = `
            <h2>Pre-Deployment Firmware</h2>
            <table>
                <thead>
                    <tr>
                        <th>Hostname</th>
                        <th>IP Address</th>
                        <th>Model</th>
                        <th>Firmware</th>
                        <th>Version</th>
                    </tr>
                </thead>
                <tbody>
                    ${selectedSwitches
                        .map(
                            switchData => `
                        <tr>
                            <td>${switchData.name}</td>
                            <td>${switchData.ip}</td>
                            <td>${switchData.model}</td>
                            <td>${switchData.firmware}</td>
                            <td>${switchData.version}</td>
                        </tr>
                    `
                        )
                        .join('')}
                </tbody>
            </table>
        `;
        contentSection.appendChild(firmwareTable);
    } else {
        contentSection.innerHTML = '<p>No selections were made.</p>';
    }
});