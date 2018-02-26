class Parser {
    constructor({
        pageList = [],
        server = { protocol: "http", subdomain: "www", domain: "wiki", tld: "com", path: "" },
        interwiki = [],
        categoryNS = "Category"
    } = {}) {
        this.settings = { pageList, server, interwiki, categoryNS }; 
    }

    static _parseHeaders(wikimarkup) {
        let text = wikimarkup;
        for (let n = 6; n > 0; n--) {
            const regex = new RegExp(`^={${n}}(.+)={${n}}$`, "gm");
            text = text.replace(regex, `<h${n}>$1</h${n}>`);
        }
        return text;
    }
    
    static _parseLinks(wikimarkup) {
        function createLink(match, p1, p2, p3, offset, string) {
            // Process the href portion of the link
            let capitalP1 = p1.charAt(0).toUpperCase() + p1.slice(1);
            capitalP1 = capitalP1.replace(" ", "_");

            return `<a href='${capitalP1}'>${p3 ? p3 : p1}</a>`
        }

        let text = wikimarkup;
        text = text.replace(/\[{2}([^\[\]\|]+)(\|(.*))?\]{2}/g, createLink);
        return text;
    }

    static parse(wikimarkup) {
        let text = wikimarkup;
        text = this._parseHeaders(text);
        text = this._parseLinks(text);
        return text;
    }
}

module.exports = { Parser };