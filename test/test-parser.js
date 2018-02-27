////////////////////////////
// Initialize
////////////////////////////
const chai  = require("chai");
const mocha = require("mocha");

const { Parser } = require("../parser.js");

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

    describe("_parseL_parseInteralLinksinks", function() {
        it("Should parse simple intrawiki links", function() {
            const wikitext = [
                                "[[abc]]",
                                "[[pip_ing]]",
                                "[[aba$ip]]",
                                "[[aaa()bbb]]",
                                "[[a b]]",
                                "[[abc|def]]",
                "[[a b|]]"
                             ];
            const parseFn  = parser._parseInteralLinks.bind(parser);
            const result   = wikitext.map(parseFn);
            const url      = parser.getBaseURL();
            const answers  = [
                                `<a href='${url}/Abc'>abc</a>`,
                                `<a href='${url}/Pip_ing'>pip_ing</a>`,
                                `<a href='${url}/Aba$ip'>aba$ip</a>`,
                                `<a href='${url}/Aaa()bbb'>aaa()bbb</a>`,
                                `<a href='${url}/A_b'>a b</a>`,
                                `<a href='${url}/Abc'>def</a>`,
                                `<a href='${url}/A_b'>a b</a>`
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
                    domain: "wikiquote",
                    tld: "org",
                    path: "wiki"
            },
                indicators: ["q", "wikiquote"]
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
                "[[q:bde]]",
                "[[wikiquote:elf]]",
                "[[s:zzz|bbb]]",
                "[[s:zzz|]]",
                "[[s:es:aaa|]]"
            ];
            const parseFn  = parser._parseInteralLinks.bind(parser);
            const result   = wikitext.map(parseFn);
            const answers  = [
                "<a href='http://en.wikisource.org/wiki/abc'>s:abc</a>",
                "<a href='http://en.wikisource.org/wiki/Zyz'>s:Zyz</a>",
                "<a href='http://en.wikisource.org/wiki/es:def'>wikisource:es:def</a>",
                "<a href='http://en.wikiquote.org/wiki/bde'>q:bde</a>",
                "<a href='http://en.wikiquote.org/wiki/elf'>wikiquote:elf</a>",
                "<a href='http://en.wikisource.org/wiki/zzz'>bbb</a>",
                "<a href='http://en.wikisource.org/wiki/zzz'>zzz</a>",
                "<a href='http://en.wikisource.org/wiki/es:aaa'>es:aaa</a>"
            ];
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
                "[[zzz:Zyz]]",
                "[[:fr:abc|]]",
                "[[:fr:abc|def]]"

            ];
            const parseFn  = parser._parseInteralLinks.bind(parser);
            const result   = wikitext.map(parseFn);
            const answers  = [
                "",
                "<a href='http://fr.wikipedia.org/wiki/def'>fr:def</a>",
                "<a href='http://en.wikipedia.org/wiki/Zzz:Zyz'>zzz:Zyz</a>",
                "<a href='http://fr.wikipedia.org/wiki/abc'>abc</a>",
                "<a href='http://fr.wikipedia.org/wiki/abc'>def</a>"
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
                "[[Wikipedia:Test]]",
                "[[Talk:Test]]",
                "[[Category:Test]]",
                "[[:Category:Test]]",
                "[[Template:Test|]]"
            ];
            const parseFn  = parser._parseInteralLinks.bind(parser);
            const result   = wikitext.map(parseFn);
            const answers  = [
                "<a href='http://en.wikipedia.org/wiki/Template:Test'>Template:Test</a>",
                "<a href='http://en.wikipedia.org/wiki/Wikipedia:Test'>Wikipedia:Test</a>",
                "<a href='http://en.wikipedia.org/wiki/Talk:Test'>Talk:Test</a>",
                "",
                "<a href='http://en.wikipedia.org/wiki/Category:Test'>Category:Test</a>",
                "<a href='http://en.wikipedia.org/wiki/Template:Test'>Test</a>"
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });
    });
});
