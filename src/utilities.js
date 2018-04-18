function lastElement(arr) {
    return arr[arr.length - 1];
}

function listTag(delimiter, close = false) {
    const tags = {
        ":": `<${close ? "/" : ""}dl>`,
        ";": `<${close ? "/" : ""}dl>`,
        "#": `<${close ? "/" : ""}ol>`,
        "*": `<${close ? "/" : ""}ul>`
    };

    return tags[delimiter];
}

function listItemTag(delimiter, close = false) {
    const tags = {
        ":": `<${close ? "/" : ""}dd>`,
        ";": `<${close ? "/" : ""}dt>`,
        "#": `<${close ? "/" : ""}li>`,
        "*": `<${close ? "/" : ""}li>`
    };
    
    return tags[delimiter];
}

function fastForward(text, lineArr, layer) {
    while(layer.length < lastElement(lineArr).length) {
        // Push the delimiter onto the array, unless the delimiter is a ";" and we are not at the
        // end of lastElement(lineArr). This is because of how the MW parser generates <dl> lists
        // using strings of ";"
        let delim = lastElement(lineArr)[layer.length];
        delim = delim !== ";" || layer.length === lastElement(lineArr).length - 1 ? delim : ":";
        layer.push(delim);

        text += `${listTag(lastElement(layer))}\n${listItemTag(lastElement(layer))}\n`;
    }
    
    return text.slice(0, -1);
}

function rewind(text, layer, value = 1) {
    let counter = 0;
    while (counter < value) {
        const delim = layer.pop();
        text += `${listItemTag(delim, true)}\n${listTag(delim, true)}\n`;
        counter++;
    }

    return text.slice(0, -1);
}

module.exports = {
    lastElement,
    listTag,
    listItemTag,
    fastForward,
    rewind
};