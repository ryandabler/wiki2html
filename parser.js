export default class MWParser {
    static _parseHeaders(wikimarkup) {
        let text = wikimarkup;
        for (let n = 6; n > 0; n--) {
            const regex = new RegExp(`^={${n}}(.+)={${n}}$`, "gm");
            text = text.replace(regex, `<h${n}>$1</h${n}>`);
        }
        return text;
    }
    
    static parse(wikimarkup) {
        let text = wikimarkup;
        text = MWParser._parseHeaders(text);
        return text;
    }
}