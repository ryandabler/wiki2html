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

    getBaseURL(server = this.settings.server) {
        const { protocol, subdomain, domain, tld, path } = server;
        return `${protocol}://${subdomain}.${domain}.${tld}/${path}`;
    }

    isValidSisterWiki(designation) {
        const found = this.settings.interwiki.filter(item => {
            return item.indicators.find(indicator => indicator === designation) ? true : false;
        });
        return found ? found[0] : false;
    }

    isValidSubdomain(designation) {
        const wiki = this.settings.interwiki.find(item => 
            item.server.domain === this.settings.server.domain
        );
        const subdomain = wiki && wiki.subdomains
                                ? wiki.subdomains.find(subdomain => subdomain === designation)
                                : null;
        return subdomain ? true : false;
    }

    _pipeLink(newP6, p5, p6) {
        if (p5 && p6 !== "") {
            return p6;
        }

        if (p5 && p6 === "") {
            const segments = newP6.split(":");
            if (segments.length > 1) {
                segments.shift();
            }

            return segments.join(":");
        }

        return newP6;
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
            const server = JSON.parse(JSON.stringify(this.settings.server));
            let newP4 = p4,
                newP6 = p6;

            if (p1) {
                // We have a link with a colon - could be interwiki, inter-subdomain, or
                // internamespace
                const segments = p1.split(":");
                const firstSeg = segments[0];
                const sister   = this.isValidSisterWiki(firstSeg);

                newP6 = `${p1}${p4}`;
                if (sister) {
                    const { domain, tld } = sister.server;
                    Object.assign(server, { domain, tld });
                    newP4 = p3 ? `${p3}:${p4}` : newP4;
                } else if (this.isValidSubdomain(firstSeg)) {
                    Object.assign(server, { subdomain: firstSeg });
                    
                    // Subdomain links don't display unless they are preceded by a ":"
                    if (match.charAt(2) !== ":") return "";
                } else if (firstSeg === this.settings.categoryNS) {
                    // We are linking to a category. If first character of match is a ":"
                    // we will display it, otherwise we will return an empty string
                    if (match.charAt(2) === ":") {
                        newP4 = `${p1}${p4}`;
                    } else {
                        return "";
                    }
                } else {
                    newP6 = `${p1}${p4}`;
                    newP4 = `${p1}${p4}`;
                    newP4 = this.settings.allowLowerCase ? newP4
                                                         : newP4.charAt(0).toUpperCase() + newP4.slice(1);
                }
            } else {
                // Plain intra-wiki link
                newP4 = this.settings.allowLowerCase ? p4
                                                     : p4.charAt(0).toUpperCase() + p4.slice(1);
            }

            // Process newP4
            newP4 = newP4.replace(" ", "_");
            newP6 = this._pipeLink(newP6, p5, p6);
            return `<a href='${this.getBaseURL(server) + "/" + newP4}'>${newP6 ? newP6 : p4}</a>`;
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