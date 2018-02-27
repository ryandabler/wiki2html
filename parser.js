"use strict";

class Parser {
    constructor({
        pageList = [],
        server = { protocol: "http", subdomain: "www", domain: "wiki", tld: "com", path: "" },
        interwiki = [],
        categoryNS = "Category",
        allowLowerCase = false
    } = {}) {
        this.settings = { pageList, server, interwiki, categoryNS, allowLowerCase };
    }

    getBaseURL() {
        const { protocol, subdomain, domain, tld, path } = this.settings.server;
        return `${protocol}://${subdomain}.${domain}.${tld}/${path}`;
    }

    _parseHeaders(wikimarkup) {
        let text = wikimarkup;
        for (let n = 6; n > 0; n--) {
            const regex = new RegExp(`^={${n}}(.+)={${n}}$`, "gm");
            text = text.replace(regex, `<h${n}>$1</h${n}>`);
        }
        return text;
    }
    
    _parseLinks(wikimarkup) {
        const createLink = (function cl(match, p1, p2, p3, p4, p5, p6, offset, string) {
            // Process the href portion of the link
            let newP4 = this.settings.allowLowerCase ? p4
                                                     : p4.charAt(0).toUpperCase() + p4.slice(1);
            newP4 = newP4.replace(" ", "_");

            return `<a href='${this.getBaseURL() + "/" + newP4}'>${p6 ? p6 : p4}</a>`;
        }).bind(this);
        
        let text = wikimarkup;
        text = text.replace(/\[{2}:?((?:([^\[\]\|:]+):)?(?:([^\[\]\|:]+):)?)([^\[\]\|:]+)(?:(\|)(.*))?\]{2}/g, createLink);
        return text;
    }

    parse(wikimarkup) {
        let text = wikimarkup;
        text = this._parseHeaders(text);
        text = this._parseLinks(text);
        return text;
    }
}

module.exports = { Parser };