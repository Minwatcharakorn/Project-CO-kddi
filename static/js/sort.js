function sortTable(columnIndex) {
    const tableBody = document.getElementById("template-table-body");
    const rows = Array.from(tableBody.querySelectorAll("tr"));

    // Toggle ascending/descending
    let isAscending = tableBody.getAttribute("data-sort-order") !== "asc";
    tableBody.setAttribute("data-sort-order", isAscending ? "asc" : "desc");

    // Sort rows
    rows.sort((a, b) => {
        const cellA = a.cells[columnIndex].innerText.trim().toLowerCase();
        const cellB = b.cells[columnIndex].innerText.trim().toLowerCase();

        // Sort "Last Updated" as dates
        if (columnIndex === 4) {
            const dateA = new Date(cellA);
            const dateB = new Date(cellB);
            return isAscending ? dateA - dateB : dateB - dateA;
        }

        // Sort "NO" as numbers
        if (columnIndex === 0) {
            return isAscending ? Number(cellA) - Number(cellB) : Number(cellB) - Number(cellA);
        }

        // Sort "Template Name" or "Description" alphabetically
        if (columnIndex === 1 || columnIndex === 2) {
            return isAscending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        }

        return 0; // Default case if no specific sorting is required
    });

    // Re-render rows
    rows.forEach(row => tableBody.appendChild(row));
}