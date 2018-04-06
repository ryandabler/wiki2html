////////////////////////////
// Initialize
////////////////////////////
const chai  = require("chai");
const mocha = require("mocha");

const { Parser, Page } = require("../parser.js");

const expect = chai.expect;

////////////////////////////
// Test
////////////////////////////
describe("Parser", function() {
    beforeEach(function() {
        return parser = new Parser();
    });

    describe("_parseHeaders", function() {
        it("Should parse well-formed headers", function() {
            const wikitext = `=A=
==B==
===C===
==D==
===E===
====F====
=====G=====
====H====
=====I=====
======J======`;
            const result = parser._parseHeaders(wikitext);
            const answer = `<h1>A</h1>
<h2>B</h2>
<h3>C</h3>
<h2>D</h2>
<h3>E</h3>
<h4>F</h4>
<h5>G</h5>
<h4>H</h4>
<h5>I</h5>
<h6>J</h6>`;
            expect(result).to.equal(answer);
        });

        it("Should not parse malformed headers", function() {
            const wikitext = `=A=a
b==B==`;
            const result = parser._parseHeaders(wikitext);
            const answer = `=A=a
b==B==`;
            expect(result).to.equal(answer);
        });

        it("Should correctly render unexpected edge cases", function() {
            const wikitext = `===
==a===
=== =`;
            const result = parser._parseHeaders(wikitext);
            const answer = `<h1>=</h1>
<h2>a=</h2>
<h1>== </h1>`;
            expect(result).to.equal(answer);
        });
    });

    describe("_parseDoubleBrackets", function() {
        it("Should parse simple intrawiki links", function() {
            const wikitext = [
                                "[[abc]]",
                                "[[a b]]",
                                "[[abc|def]]"
                             ];
            const parseFn  = parser._parseDoubleBrackets.bind(parser);
            const result   = wikitext.map(parseFn);
            const url      = parser.getBaseURL();
            const answers  = [
                                `<a href='${url}/Abc'>abc</a>`,
                                `<a href='${url}/A_b'>a b</a>`,
                                `<a href='${url}/Abc'>def</a>`
                             ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should parse interwiki links", function() {
            // Set up parser
            parser.settings.server = {
                protocol: "http",
                subdomain: "en",
                domain: "wikipedia",
                tld: "org",
                path: "wiki"
            };
            
            parser.settings.interwiki.push({
                server: { protocol: "http",
                    subdomain: "www",
                    domain: "wikisource",
                    tld: "org",
                    path: "wiki"
                },
                indicators: ["s", "wikisource"]
            }, {
                server: { protocol: "http",
                    subdomain: "www",
                    domain: "wikipedia",
                    tld: "org",
                    path: "wiki"
                },
                indicators: ["w", "wikipedia"]
            });

            // Run test
            const wikitext = [
                "[[s:abc]]",
                "[[s:Zyz]]",
                "[[wikisource:es:def]]",
                "[[s:zzz|bbb]]",
                "[[s:zzz|]]",
            ];
            const parseFn  = parser._parseDoubleBrackets.bind(parser);
            const result   = wikitext.map(parseFn);
            const answers  = [
                "<a href='http://en.wikisource.org/wiki/abc'>s:abc</a>",
                "<a href='http://en.wikisource.org/wiki/Zyz'>s:Zyz</a>",
                "<a href='http://en.wikisource.org/wiki/es:def'>wikisource:es:def</a>",
                "<a href='http://en.wikisource.org/wiki/zzz'>bbb</a>",
                "<a href='http://en.wikisource.org/wiki/zzz'>zzz</a>",
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should parse intersubdomain links", function() {
            // Set up parser
            parser.settings.server = {
                protocol: "http",
                subdomain: "en",
                domain: "wikipedia",
                tld: "org",
                path: "wiki"
            };
            
            parser.settings.interwiki.push({
                server: { protocol: "http",
                    subdomain: "www",
                    domain: "wikipedia",
                    tld: "org",
                    path: "wiki"
                },
                indicators: ["w", "wikipedia"],
                subdomains: ["en", "fr"]
            });

            // Run test
            const wikitext = [
                "[[fr:abc]]",
                "[[:fr:def]]",
                "[[:fr:abc|]]",
                "[[:fr:abc|def]]",
                "[[:fr:Template:Test|]]"
                "[[:fr:wikipedia:test]]"

            ];
            const parseFn  = parser._parseDoubleBrackets.bind(parser);
            const result   = wikitext.map(parseFn);
            const answers  = [
                "",
                "<a href='http://fr.wikipedia.org/wiki/def'>fr:def</a>",
                "<a href='http://fr.wikipedia.org/wiki/abc'>abc</a>",
                "<a href='http://fr.wikipedia.org/wiki/abc'>def</a>",
                "<a href='http://fr.wikipedia.org/wiki/Template:Test'>Template:Test</a>"
                "<a href='http://fr.wikipedia.org/wiki/wikipedia:test'>fr:wikipedia:test</a>"
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should parse inter-namespace links", function() {
            // Set up parser
            parser.settings.server = {
                protocol: "http",
                subdomain: "en",
                domain: "wikipedia",
                tld: "org",
                path: "wiki"
            };
            
            parser.settings.interwiki.push({
                server: { protocol: "http",
                    subdomain: "www",
                    domain: "wikipedia",
                    tld: "org",
                    path: "wiki"
                },
                indicators: ["w", "wikipedia"],
                subdomains: ["en", "fr"]
            });

            // Run test
            const wikitext = [
                "[[Template:Test]]",
                "[[Category:Test]]",
                "[[:Category:Test]]",
                "[[Template:Test|]]"
            ];
            const parseFn  = parser._parseDoubleBrackets.bind(parser);
            const result   = wikitext.map(parseFn);
            const answers  = [
                "<a href='http://en.wikipedia.org/wiki/Template:Test'>Template:Test</a>",
                "",
                "<a href='http://en.wikipedia.org/wiki/Category:Test'>Category:Test</a>",
                "<a href='http://en.wikipedia.org/wiki/Template:Test'>Test</a>"
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });
    });

    describe("_parseSingleBrackets", function() {
        it("Should parse properly formed external links", function() {
            const wikitext = [
                "[http://www.google.com]",
                "[https://www.google.com Google]",
                "[irc://irc.google.com]\n[ircs://irc.google.com]",
                "[news://www.newster.com New test]",
                "[ftp://ftp.google.com Ftp]",
                "[ftps://ftp.google.com]",
                "[gopher://gopher.com gopher://]",
                "[mailto:test@test.com E-mail]"
            ];
            const parseFn  = parser._parseSingleBrackets.bind(parser);
            const result   = wikitext.map(text => {
                const pg = new Page(text);
                return parseFn(text, pg);
            });
            const answers  = [
                "<a href='http://www.google.com'>[1]</a>",
                "<a href='https://www.google.com'>Google</a>",
                "<a href='irc://irc.google.com'>[1]</a>\n<a href='ircs://irc.google.com'>[2]</a>",
                "<a href='news://www.newster.com'>New test</a>",
                "<a href='ftp://ftp.google.com'>Ftp</a>",
                "<a href='ftps://ftp.google.com'>[1]</a>",
                "<a href='gopher://gopher.com'>gopher://</a>",
                "<a href='mailto:test@test.com'>E-mail</a>"
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should not parse external links without proper URI scheme", function() {
            const wikitext = [
                "[www.google.com]",
                "[flm://www.google.com Test]",
                "[file://www.google.com/a.pdf a]"
            ];
            const parseFn  = parser._parseSingleBrackets.bind(parser);
            const result   = wikitext.map(text => {
                const pg = new Page(text);
                return parseFn(text, pg);
            });
            const answers  = [
                "[www.google.com]",
                "[flm://www.google.com Test]",
                "[file://www.google.com/a.pdf a]"
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });
    });
});
