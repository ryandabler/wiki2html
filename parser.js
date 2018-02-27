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
        const createLink = (function cl(match, p1, p2, p3, p4, p5, offset, string) {
            // Process the href portion of the link
            let newP3 = this.settings.allowLowerCase ? p3
                                                     : p3.charAt(0).toUpperCase() + p3.slice(1);
            newP3 = newP3.replace(" ", "_");

            return `<a href='${this.getBaseURL() + "/" + newP3}'>${p5 ? p5 : p3}</a>`;
        }).bind(this);
        
        let text = wikimarkup;
        text = text.replace(/\[{2}:?(?:([^\[\]\|:]+):)?(?:([^\[\]\|:]+):)?([^\[\]\|:]+)(?:(\|)(.*))?\]{2}/g, createLink);
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