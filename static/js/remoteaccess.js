function showModal() {
    document.getElementById("terminal-modal").style.display = "block";
}

function closeTerminal() {
    document.getElementById("terminal-modal").style.display = "none";
}

function executeCommand() {
    const input = document.getElementById("terminal-command");
    const output = document.getElementById("terminal-output");

    if (input.value.trim() !== "") {
        output.textContent += `\nSwitch# ${input.value}`;
        setTimeout(() => {
            output.textContent += `\nCommand "${input.value}" executed.\n`;
            const terminal = document.getElementById("terminal");
            terminal.scrollTop = terminal.scrollHeight;
        }, 500); // Simulate response delay
    }
    input.value = "";
}
