// File Upload
document.getElementById('upload-file').addEventListener('click', () => {
    document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        document.getElementById('command-area').value = e.target.result;
    };

    if (file) {
        reader.readAsText(file);
    }
});
