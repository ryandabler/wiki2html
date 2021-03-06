class TableEngine {
    createTableStart(tableStart) {
        const match = tableStart.match(/{\|\s*(.+)/);
        const table = match !== null ? `<table ${match[1]}>` : "<table>";
        return table + "\n";
    }
    
    createCaption(caption) {
        return `<caption>${caption}</caption>`;
    }

    createCellTag(delimiter) {
        return delimiter === "!" ? "th" : "td";
    }

    createRowStart(rowStart) {
        // rowStart could be null if we are working with the first
        // row group because the "|-" delimiter is optional
        const match = rowStart ? rowStart.match(/\|-\s*(.+)/) : null;

        const row = match !== null ? `<tr ${match[1]}>` : "<tr>";
        return row + "\n";
    }

    createRowCell(cell, tag) {
        let td = `<${this.createCellTag(tag)}`;
        td += cell.includes("|") ? ` ${cell.split("|")[0].trim()}>${cell.split("|")[1].trim()}` : `>${cell.trim()}`;
        td += `</${this.createCellTag(tag)}>`;
        return td + "\n";
    }

    createRowContent(rowContent) {
        return rowContent.replace(/(?:\|\|?|!!?)\s*?(.*?)\s*(?=(?:\|\||$|\n|!!))/g, (match, cell) => this.createRowCell(cell, match[0]));
    }

    createTableRow(rowStart, rowContent) {
        let tr = this.createRowStart(rowStart);
        tr += this.createRowContent(rowContent);
        tr += "</tr>";
        return tr + "\n";
    }

    createTableBody(body) {
        // Add newline to body in order to match final row group
        const amendedBody = body + "\n";
        return amendedBody.replace(/^(?:\|\+)\s*(.*)/, (match, caption) => this.createCaption(caption))
            .replace(/(\|-.*\n)?((?:(?:[|!]).*?\n)+?)(?=(?:\|-.*|$))/g, (match, rowStart, rowContent) => this.createTableRow(rowStart, rowContent));
    }

    createTable(match, tableStart, body, tableEnd) {
        const tableOpen = this.createTableStart(tableStart);
        const tableBody = this.createTableBody(body);
        const table = tableOpen + tableBody + "</table>";
        return table.replace(/\n{2,}/g, "\n");
    }
}

module.exports = { TableEngine };