function startFirmwareDeployment() {
    const selectedSwitches = JSON.parse(localStorage.getItem('selectedSwitches')) || [];
    const progressSection = document.getElementById('progress-section');

    if (selectedSwitches.length === 0) {
        alert('No switches selected for firmware deployment!');
        return;
    }

    // Clear existing progress UI
    progressSection.innerHTML = '';

    // Create progress bars for each switch
    let completedCount = 0; // Track completed deployments
    selectedSwitches.forEach((switchData, index) => {
        const switchProgress = document.createElement('div');
        switchProgress.classList.add('progress-container');
        switchProgress.innerHTML = `
            <h3>${switchData.name} (${switchData.ip})</h3>
            <div class="progress-bar" id="progress-bar-${index}">
                <div class="progress-fill" id="progress-fill-${index}" style="width: 0%;"></div>
            </div>
            <p id="progress-status-${index}">Waiting to start...</p>
        `;
        progressSection.appendChild(switchProgress);

        // Simulate firmware deployment
        simulateFirmwareDeployment(index, switchData.name, () => {
            completedCount++;
            if (completedCount === selectedSwitches.length) {
                showBackButton();
            }
        });
    });
}

function simulateFirmwareDeployment(index, switchName, callback) {
    const progressFill = document.getElementById(`progress-fill-${index}`);
    const progressStatus = document.getElementById(`progress-status-${index}`);
    let progress = 0;

    const interval = setInterval(() => {
        progress += 10;
        progressFill.style.width = `${progress}%`;
        progressStatus.textContent = `Deploying firmware for ${switchName}: ${progress}%`;

        if (progress >= 100) {
            clearInterval(interval);
            progressStatus.innerHTML = `Firmware deployment completed for ${switchName} <span style="color: green; font-weight: bold;">Success</span>`;
            if (callback) callback(); // Notify that this switch is done
        }
    }, 500); // Simulate progress every 500ms
}

function showBackButton() {
    const buttonsContainer = document.querySelector('.buttons-container');
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.classList.add('back-button');
    backButton.onclick = () => {
        window.location.href = 'Update_firmware.html'; // Redirect to the desired page
    };
    buttonsContainer.appendChild(backButton); // Add the Back button dynamically
}