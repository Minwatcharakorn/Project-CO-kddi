function sortTable(columnIndex) {
    const tableBody = document.getElementById("template-table-body");
    const rows = Array.from(tableBody.querySelectorAll("tr"));

    // Toggle ascending/descending
    let isAscending = tableBody.getAttribute("data-sort-order") !== "asc";
    tableBody.setAttribute("data-sort-order", isAscending ? "asc" : "desc");

    // Sort rows
    rows.sort((a, b) => {
        const cellA = a.cells[columnIndex].innerText.trim();
        const cellB = b.cells[columnIndex].innerText.trim();

        // หากเป็นคอลัมน์ Last Updated ให้แปลงวันที่เพื่อการเปรียบเทียบ
        if (columnIndex === 4) {
            const dateA = new Date(cellA);
            const dateB = new Date(cellB);
            return isAscending ? dateA - dateB : dateB - dateA;
        }

        // หากเป็น NO ให้เปรียบเทียบตัวเลข
        if (columnIndex === 0) {
            return isAscending ? Number(cellA) - Number(cellB) : Number(cellB) - Number(cellA);
        }

        return 0;
    });

    // Re-render rows
    rows.forEach(row => tableBody.appendChild(row));
}
