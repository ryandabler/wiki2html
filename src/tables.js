class TableEngine {
    createTableStart(tableStart) {
        let table = "<table";
        let tableML = tableStart;
        const regex = /(?:{\|)?\s*([^=]*=".*?")/;

        while (tableML.match(regex)) {
            tableML = tableML.replace(regex, (match, attrib) => {
                table += ` ${attrib}`;
                return "";
            });
        }

        return table + ">";
    }
    
    createRowStart(rowStart) {
        let row = "<tr";

        // rowStart could be null if we are working with the first
        // row group because the "|-" delimiter is optional
        const match = rowStart ? rowStart.match(/\|-\s*(.+)/) : null;

        row += match !== null ? ` ${match[1]}>` : ">";
        return row;
    }

    createRowCell(cell) {
        let td = "<td";
        td += cell.includes("|") ? ` ${cell.split("|")[0].trim()}>${cell.split("|")[1].trim()}` : `>${cell.trim()}`;
        td += "</td>";
        return td;
    }

    createRowContent(rowContent) {
        let td = rowContent;
        if (td.match(/\n/)) {
            td = rowContent.replace(/\|\|?\s*(.*?)\s*(?=\|\||$|\n)/g, (match, cell) => this.createRowCell(cell))
        } else {
            
        }
        
        return td;
    }

    createTableRow(match, rowStart, rowContent) {
        let tr = this.createRowStart(rowStart);
        tr += this.createRowContent(rowContent);
        tr += "</tr>";
        return tr;
    }

    createTableBody(body) {
        // Add newline to body in order to match final row group
        const amendedBody = body + "\n";
        return amendedBody.replace(/(\|-.*\n)?((?:\|.+?\n)+?)(?=(?:\|-.*|$))/g, (match, rowStart, rowContent) => this.createTableRow(match, rowStart, rowContent));
    }

    createTable(match, tableStart, body, tableEnd) {
        const tableOpen = this.createTableStart(tableStart);
        const tableBody = this.createTableBody(body);
        return tableOpen + tableBody + "</table>";
    }
}