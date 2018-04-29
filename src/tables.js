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
}