"use strict";

class Page {
    constructor(wikimarkup) {
        this.wikimarkup = wikimarkup;
        this.html = wikimarkup;
        this.categoryList = [];
        this.subdomainLinks = [];
        this.unnamedExternalLinks = [];
    }

    addUnnamedExternalLink(fullUrl) {
        return this.unnamedExternalLinks.push(fullUrl);
    }
}

class Parser {
    constructor({
        pageList = [],
        server = { protocol: "http", subdomain: "www", domain: "wiki", tld: "com", path: "wiki" },
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
        return found.length ? found[0] : false;
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

    _pipeLink(original, p6) {
        if (p6) {
            return p6;
        }

        if (p6 === "") {
            const segments = original.split(":");
            if (segments.length > 1) {
                segments.shift();
            }

            return segments.join(":");
        }

        return original;
    }
    
    _parseHeaders(wikimarkup) {
        let text = wikimarkup;
        for (let n = 6; n > 0; n--) {
            const regex = new RegExp(`^={${n}}(.+)={${n}}$`, "gm");
            text = text.replace(regex, `<h${n}>$1</h${n}>`);
        }
        return text;
    }

    _capitalizeFirstLetter(text) {
        return this.settings.allowLowerCase ? text
                                            : text.charAt(0).toUpperCase() + text.slice(1);
    }

    _createLink(server, fullName, piping, popFirstSegment=true, capitalizationApplies=false) {
        let newP4 = popFirstSegment ? fullName.replace(" ", "_").split(":").splice(1).join(":")
                                    : fullName.replace(" ", "_");
        newP4 = capitalizationApplies ? this._capitalizeFirstLetter(newP4) : newP4;
        const newP6 = this._pipeLink(fullName, piping);

        return `<a href='${this.getBaseURL(server) + "/" + newP4}'>${newP6 ? newP6 : newP4}</a>`;
    }

    _parseDoubleBrackets(wikimarkup) {
        const createLink = (function cl(match, fullName, piping, offset, string) {
            const server = JSON.parse(JSON.stringify(this.settings.server));
            const segments = fullName.split(":");
            const sister   = this.isValidSisterWiki(segments[0]);

            if (sister) {
                const { domain, tld } = sister.server;
                Object.assign(server, { domain, tld });
                
                return this._createLink(server, fullName, piping);
            } else if (this.isValidSubdomain(segments[0])) {
                Object.assign(server, { subdomain: segments[0] });
                
                return match.charAt(2) === ":" ? 
                    this._createLink(server, fullName, piping) : "";
            } else if (segments[0] === this.settings.categoryNS) {
                return match.charAt(2) === ":" ?
                    this._createLink(server, fullName, piping, false) : "";
            } else {
                return this._createLink(server, fullName, piping, false, true);
            }
        }).bind(this);
        
        return wikimarkup.replace(/\[{2}:?((?:[^\[\]\|:]+:)*[^\[\]\|:]+)(?:\|(.*))?\]{2}/g,
                                  createLink);
    }

    _parseSingleBrackets(wikimarkup, page) {
        const createLink = (match, scheme, separator, url, piping, offset, string) => {
            const fullURL = scheme + separator + url;
            
            if (piping) {
                return `<a href=${fullURL}>${piping}</a>`;
            } else {
                const length = page.addUnnamedExternalLink(fullUrl);
                return `<a href=${fullURL}>[${length}]</a>`;
            }
        }
        
        let text = wikimarkup;
        text = text.replace(/\[(https?(?=:\/{2})|ftps?(?=:\/{2})|ircs?(?=:\/{2})|news(?=:\/{2})|gopher(?=:\/{2})|mailto(?!:\/+))(:\/{0,2})([^\/\s]+)(?: ?([^\[\]]*))*?\]/g, createLink);
        return text;
    }

    parse(wikimarkup) {
        const document = new Page(wikimarkup);
        let text = wikimarkup;
        document.html = this._parseHeaders(document.html);
        document.html = this._parseInteralLinks(document.html);
        return document;
    }
}

module.exports = { Parser };