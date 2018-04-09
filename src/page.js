class Page {
    constructor({
        wikimarkup = ""
    } = {}) {
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

module.exports = { Page };