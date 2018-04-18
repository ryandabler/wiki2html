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
        // Push ":" until we are at the very last element, then push whatever is in lineArr
        // The reason for this is because the parser starts lists with <dl><dd> even if semicolons
        // represent some of the layer
        layer.push(layer.length === lastElement(lineArr).length - 1 ? lastElement(lineArr)[layer.length] : ":");
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