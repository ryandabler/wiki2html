class Page {
    constructor({
        wikimarkup = ""
    } = {}) {
        this.wikimarkup = wikimarkup;
        this.html = wikimarkup;
        this.categoryList = [];
        this.subdomainLinks = [];
        this.unnamedExternalLinks = [];
        this.placeholders = new Map();
    }

    addUnnamedExternalLink(fullUrl) {
        return this.unnamedExternalLinks.push(fullUrl);
    }

    setPlaceholder(text) {
        const key = `<<<PLACEHOLDER_${this.placeholders.size}>>>`;
        this.placeholders.set(key, text);
        return key;
    }
}

module.exports = { Page };