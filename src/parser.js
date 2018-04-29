"use strict";

const { Page } = require("./page");
const { lastElement,
    listTag,
    listItemTag,
    fastForward,
    rewind
} = require("./utilities");

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
        return wiki.subdomains.find(subdomain => subdomain === designation) ? true : false;
    }

    _pipeLink(original, pipe) {
        if (pipe) {
            return pipe;
        }

        if (pipe === "") {
            const segments = original.includes(":") ?
                original.split(":").filter((item, idx) => idx !== 0) :
                original.split(":");

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

        return `<a href='${this.getBaseURL(server) + "/" + newP4}'>${newP6}</a>`;
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
                return `<a href='${fullURL}'>${piping}</a>`;
            } else {
                const length = page.addUnnamedExternalLink(fullURL);
                return `<a href='${fullURL}'>[${length}]</a>`;
            }
        }
        
        return wikimarkup.replace(/\[(https?(?=:\/{2})|ftps?(?=:\/{2})|ircs?(?=:\/{2})|news(?=:\/{2})|gopher(?=:\/{2})|mailto(?!:\/+))(:\/{0,2})([^\/\s]+)(?: ?([^\[\]]*))*?\]/g, createLink);
    }

    replaceSpace(match, offset, string) { 
        return (
`<pre>
${match.split("\n")
    .filter(item => item !== "")
    .map(item => item.trim())
    .join("\n")
}
</pre>\n`
        );
    }

    createList(match, offset, string) {
        let layer = [];
        const processedLines = match.split("\n")
            .map(line => line.split(/[:;#*]/).concat( [ line.replace(/[^:;#*]+/, "").split("") ] ))
            .map((lineArr, idx, arr) => {
                let text = "";

                // Check to make sure that the list element depth for lineArr
                // equals the depth of layer.  If not, fast forward layer to the correct
                // depth. If they are equal, open the list item.
                if (layer.length < lastElement(lineArr).length) {
                    text = fastForward("", lineArr, layer) + lineArr[lineArr.length - 2];
                } else {
                    text += listItemTag(lastElement(lineArr)[layer.length - 1]) + lineArr[lineArr.length - 2];
                }
                
                // Simple case: current line and next line are on the same depth
                if (arr[idx + 1] && arr[idx + 1].length === lineArr.length) {
                    const nextDelim = lastElement(arr[idx + 1])[layer.length - 1];

                    text += listItemTag(lastElement(lineArr)[layer.length - 1], true);

                    layer.pop();
                    layer.push(nextDelim);
                } else if (arr[idx + 1] && arr[idx + 1].length < lineArr.length) {
                    const difference = lineArr.length - arr[idx + 1].length;
                    text = `${rewind(text, layer, difference)}
${listItemTag(lastElement(layer), true)}`;

                    if (lastElement(layer) !== lastElement(lastElement(arr[idx + 1]))) {
                        text += `\n${listTag(lastElement(layer), true)}
${listTag(lastElement(lastElement(arr[idx + 1])))}`;
                        layer.pop();
                        layer.push(lastElement(lastElement(arr[idx + 1])));
                    }
                } else if (arr[idx + 1] && arr[idx + 1].length > lineArr.length) {
                    if (lastElement(layer) === ";" && lastElement(arr[idx + 1])[layer.length - 1] === ":") {
                        const delim = layer.pop();

                        text += `${listItemTag(delim, true)}\n${listItemTag(lastElement(arr[idx + 1])[layer.length])}`;
                        layer.push(":");
                    }
                }

                return text;
            });
            
        const closure = rewind("", layer, layer.length);
        return processedLines.join("\n") + closure;
    }

    _parseBlockLevelText(wikimarkup, delimiter, fn) {
        const regExp = new RegExp(`(?<!.)(?:[${delimiter}](?:.+)\n?)+`);
        return wikimarkup.replace(regExp, fn);
    }

    _replaceNowikiAndPreTags(wikimarkup, page) {
        const replaceTags = function(match, offset, string) {
            return page.setPlaceholder(match);
        }

        return wikimarkup.replace(
            /<nowiki>[\s\S]*?<\/nowiki>|<pre>[\s\S]*?<\/pre>/g,
            replaceTags
        );
    }

    _parseDashLines(wikimarkup) {
        const convertToHR = function(match, dashes, addlText, offset, string) {
            return addlText ? `<hr>\n${addlText}` : "<hr>";
        }

        return wikimarkup.replace(/^(-{4,})(.+)*$/gm, convertToHR);
    }

    _parseTextFormats(wikimarkup) {
        let text = wikimarkup;
        const formats = [
            [5, "<i><b>", "</b></i>"],
            [3, "<b>", "</b>"],
            [2, "<i>", "</i>"]
        ];

        formats.forEach(format => {
            const regex = new RegExp(`('*)('{${format[0]}}(.+'*)'{${format[0]}})`);
            text = text.replace(regex, `$1${format[1]}$3${format[2]}`);
        });

        return text;
    }

    parse(wikimarkup) {
        const document = new Page(wikimarkup);

        // Stage 1: Convert wikimarkup to <pre> and replace all <pre> and <nowiki>
        // tags with placeholder elements
        document.html = this._parseBlockLevelText(document.html, " ", this.replaceSpace);
        document.html = this._replaceNowikiAndPreTags(document.html, document);

        // Stage 2: Convert wikiML to HTML
        document.html = this._parseHeaders(document.html);
        document.html = this._parseDoubleBrackets(document.html);
        document.html = this._parseSingleBrackets(document.html, document);
        document.html = this._parseBlockLevelText(document.html, "#", this.createList);
        document.html = this._parseBlockLevelText(document.html, "*", this.createList);
        document.html = this._parseBlockLevelText(document.html, ":;", this.createList);
        document.html = this._parseDashLines(document.html);

        // Replace placeholders with <pre> and <nowiki> tags
        document.replacePlaceholders();
        
        return document;
    }
}

module.exports = { Parser };