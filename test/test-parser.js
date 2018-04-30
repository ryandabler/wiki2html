////////////////////////////
// Initialize
////////////////////////////
const chai  = require("chai");
const mocha = require("mocha");

const { Parser, Page } = require("../src");

const expect = chai.expect;

////////////////////////////
// Test
////////////////////////////
describe("Parser", function() {
    let parser;

    beforeEach(function() {
        parser = new Parser({ 
            server: {
                protocol: "http",
                subdomain: "en",
                domain: "wikipedia",
                tld: "org",
                path: "wiki"
            },

            interwiki: [
                {
                    server: {
                        protocol: "http",
                        subdomain: "www",
                        domain: "wikisource",
                        tld: "org",
                        path: "wiki"
                    },
                    indicators: ["s", "wikisource"]
                }, {
                    server: {
                        protocol: "http",
                        subdomain: "www",
                        domain: "wikipedia",
                        tld: "org",
                        path: "wiki"
                    },
                    indicators: ["w", "wikipedia"],
                    subdomains: ["en", "fr"]
                }
            ]
        });
    });

    describe("isValidSisterWiki", function() {
        it("Should return true for a valid wiki", function() {
            const indicators = [
                "s",
                "wikisource"
            ];
            const parseFn  = parser.isValidSisterWiki.bind(parser);
            const result   = indicators.map(parseFn);
            result.forEach(item => {
                expect(item).not.to.be.false;
            });
        });

        it("Should return false on for invalid wiki", function() {
            const indicator = "ss";
            const result = parser.isValidSisterWiki(indicator);
            expect(result).to.be.false;
        });
    });

    describe("isValidSubdomain", function() {
        it("Should return true for a valid subdomain", function() {
            const isValid = parser.isValidSubdomain("fr");
            expect(isValid).to.be.true;
        });

        it("Should return false on for invalid subdomain", function() {
            const isValid = parser.isValidSubdomain("frr");
            expect(isValid).to.be.false;
        });
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
                "[[a b]]"
            ];
            const parseFn  = parser._parseDoubleBrackets.bind(parser);
            const result   = wikitext.map(parseFn);
            const url      = parser.getBaseURL();
            const answers  = [
                `<a href='${url}/Abc'>abc</a>`,
                `<a href='${url}/A_b'>a b</a>`
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should make lower case links if allowed", function() {
            parser.settings.allowLowerCase = true;

            const wikitext = [
                "[[abc]]"
            ];
            const parseFn  = parser._parseDoubleBrackets.bind(parser);
            const result   = wikitext.map(parseFn);
            const url      = parser.getBaseURL();
            const answers  = [
                `<a href='${url}/abc'>abc</a>`
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should parse interwiki links", function() {
            const wikitext = [
                "[[s:abc]]",
                "[[s:Zyz]]",
                "[[wikisource:es:def]]"
            ];
            const parseFn  = parser._parseDoubleBrackets.bind(parser);
            const result   = wikitext.map(parseFn);
            const answers  = [
                "<a href='http://en.wikisource.org/wiki/abc'>s:abc</a>",
                "<a href='http://en.wikisource.org/wiki/Zyz'>s:Zyz</a>",
                "<a href='http://en.wikisource.org/wiki/es:def'>wikisource:es:def</a>"
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should parse intersubdomain links", function() {
            const wikitext = [
                "[[fr:abc]]",
                "[[:fr:def]]",
                "[[:fr:wikipedia:test]]"
            ];
            const parseFn  = parser._parseDoubleBrackets.bind(parser);
            const result   = wikitext.map(parseFn);
            const answers  = [
                "",
                "<a href='http://fr.wikipedia.org/wiki/def'>fr:def</a>",
                "<a href='http://fr.wikipedia.org/wiki/wikipedia:test'>fr:wikipedia:test</a>"
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should parse inter-namespace links", function() {
            const wikitext = [
                "[[Template:Test]]",
                "[[Category:Test]]",
                "[[:Category:Test]]"
            ];
            const parseFn  = parser._parseDoubleBrackets.bind(parser);
            const result   = wikitext.map(parseFn);
            const answers  = [
                "<a href='http://en.wikipedia.org/wiki/Template:Test'>Template:Test</a>",
                "",
                "<a href='http://en.wikipedia.org/wiki/Category:Test'>Category:Test</a>"
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should pipe links properly", function() {
            const wikitext = [
                "[[abc|def]]",
                "[[cabbage|]]",
                "[[s:zzz|bbb]]",
                "[[s:zzz|]]",
                "[[wikisource:de:Categorie:Test|]]",
                "[[:fr:abc|]]",
                "[[:fr:abc|def]]",
                "[[:fr:Template:Test|]]"
            ];
            const parseFn  = parser._parseDoubleBrackets.bind(parser);
            const result   = wikitext.map(parseFn);
            const url      = parser.getBaseURL();
            const answers  = [
                `<a href='${url}/Abc'>def</a>`,
                `<a href='${url}/Cabbage'>cabbage</a>`,
                "<a href='http://en.wikisource.org/wiki/zzz'>bbb</a>",
                "<a href='http://en.wikisource.org/wiki/zzz'>zzz</a>",
                "<a href='http://en.wikisource.org/wiki/de:Categorie:Test'>de:Categorie:Test</a>",
                "<a href='http://fr.wikipedia.org/wiki/abc'>abc</a>",
                "<a href='http://fr.wikipedia.org/wiki/abc'>def</a>",
                "<a href='http://fr.wikipedia.org/wiki/Template:Test'>Template:Test</a>"
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

    describe("_replaceNowikiAndPreTags", function() {
        it("Should replace <pre> and <nowiki> tags with placeholders", function() {
            const wikitext = [
                `<pre>
abc
</pre>`,
`<nowiki>
abc
</nowiki>`,
`<nowiki>
<pre>abc</pre>
</nowiki>`,
`<nowiki>abc</nowiki>
<pre>abc</pre>`
            ];
            const parseFn  = parser._replaceNowikiAndPreTags.bind(parser);
            const result   = wikitext.map(text => {
                const pg = new Page(text);
                return parseFn(text, pg);
            });
            const answers  = [
                "<<<PLACEHOLDER_0>>>",
                "<<<PLACEHOLDER_0>>>",
                "<<<PLACEHOLDER_0>>>",
                `<<<PLACEHOLDER_0>>>
<<<PLACEHOLDER_1>>>`
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });
    });

    describe("_parseBlockLevelText", function() {
        it("Should convert '#' blocks to ordered list", function() {
            const wikitext = [
                `#abc
#def`,
                `#abc
##def
##ghi
#jkl`
            ];
            const parseFn  = parser._parseBlockLevelText.bind(parser);
            const result   = wikitext.map(text => {
                return parseFn(text, "#", parser.createList);
            });
            const answers  = [
                `<ol>
<li>abc</li>
<li>def</li>
</ol>`,
                `<ol>
<li>abc
<ol>
<li>def</li>
<li>ghi</li>
</ol>
</li>
<li>jkl</li>
</ol>`
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should convert ' ' blocks to <pre>", function() {
            const wikitext = [
                ` abc
 def`,
                `abc
 def
 ghi
jkl`
            ];
            const parseFn  = parser._parseBlockLevelText.bind(parser);
            const result   = wikitext.map(text => {
                return parseFn(text, " ", parser.replaceSpace);
            });
            const answers  = [
                `<pre>
abc
def
</pre>
`,
                `abc
<pre>
def
ghi
</pre>
jkl`
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should convert '*' blocks to unordered list", function() {
            const wikitext = [
                `*abc
*def`,
                `*abc
**def
**ghi
*jkl`
            ];
            const parseFn  = parser._parseBlockLevelText.bind(parser);
            const result   = wikitext.map(text => {
                return parseFn(text, "*", parser.createList);
            });
            const answers  = [
                `<ul>
<li>abc</li>
<li>def</li>
</ul>`,
                `<ul>
<li>abc
<ul>
<li>def</li>
<li>ghi</li>
</ul>
</li>
<li>jkl</li>
</ul>`
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should convert ';' and ':' blocks to definition list", function() {
            const wikitext = [
                `;abc
:def
;ghi
:jkl`,
                `:abc
:;def
::;ghi`,
                `:abc
::def
:::ghi
::jkl
::::mno
::::pqr
:stu`,
                `:abc
::;def
:::ghi
:jkl`,
                `:abc
::;def
:;ghi
:jkl`,
                `:abc
:;def
:ghi
::jkl
:::mno
:stu
:;;;;zxy`
            ];
            const parseFn  = parser._parseBlockLevelText.bind(parser);
            const result   = wikitext.map(text => {
                return parseFn(text, ":;", parser.createList);
            });
            const answers  = [
                `<dl>
<dt>abc</dt>
<dd>def</dd>
<dt>ghi</dt>
<dd>jkl</dd>
</dl>`,
                `<dl>
<dd>abc
<dl>
<dt>def</dt>
<dd>
<dl>
<dt>ghi</dt>
</dl>
</dd>
</dl>
</dd>
</dl>`,
                `<dl>
<dd>abc
<dl>
<dd>def
<dl>
<dd>ghi</dd>
</dl>
</dd>
<dd>jkl
<dl>
<dd>
<dl>
<dd>mno</dd>
<dd>pqr</dd>
</dl>
</dd>
</dl>
</dd>
</dl>
</dd>
<dd>stu</dd>
</dl>`,
                `<dl>
<dd>abc
<dl>
<dd>
<dl>
<dt>def</dt>
<dd>ghi</dd>
</dl>
</dd>
</dl>
</dd>
<dd>jkl</dd>
</dl>`,
                `<dl>
<dd>abc
<dl>
<dd>
<dl>
<dt>def</dt>
</dl>
</dd>
</dl>
<dl>
<dt>ghi</dt>
</dl>
</dd>
<dd>jkl</dd>
</dl>`,
                `<dl>
<dd>abc
<dl>
<dt>def</dt>
</dl>
</dd>
<dd>ghi
<dl>
<dd>jkl
<dl>
<dd>mno</dd>
</dl>
</dd>
</dl>
</dd>
<dd>stu
<dl>
<dd>
<dl>
<dd>
<dl>
<dd>
<dl>
<dt>zxy</dt>
</dl>
</dd>
</dl>
</dd>
</dl>
</dd>
</dl>
</dd>
</dl>`
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });
    });

    describe("_parseDashLines", function() {
        it("Should convert 4 or more dashes to <hr> tags", function() {
            const wikitext = [
                "---",
                "----",
                "--------------",
                "----abd",
                "a----"
            ];
            const parseFn  = parser._parseDashLines.bind(parser);
            const result   = wikitext.map(text => {
                return parseFn(text);
            });
            const answers  = [
                "---",
                "<hr>",
                "<hr>",
                `<hr>
abd`,
                "a----"
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });
    });

    describe("_parseTextFormats", function() {
        it("Should convert apostrophes to <i><b> tags", function() {
            const wikitext = [
                "''Italic''",
                "'''Bold'''",
                "'''''Bold Italic'''''"
            ];
            const parseFn  = parser._parseTextFormats.bind(parser);
            const result   = wikitext.map(text => {
                return parseFn(text);
            });
            const answers  = [
                "<i>Italic</i>",
                "<b>Bold</b>",
                "<i><b>Bold Italic</b></i>"
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should handle apostrophes not in 2, 3, 5 increments", function() {
            const wikitext = [
                "''''Bold'''",
                "''''''Bold Italic''''''"
            ];
            const parseFn  = parser._parseTextFormats.bind(parser);
            const result   = wikitext.map(text => {
                return parseFn(text);
            });
            const answers  = [
                "'<b>Bold</b>",
                "'<i><b>Bold Italic'</b></i>"
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });
    });

    describe("_parseTables", function() {
        it("Should create tables", function() {
            const wikitext = [
                `{| class="wikitable"
| Orange
| Apple
| style="text-align:right;" | 12,333.00
|-
| Bread
| Pie
| style="text-align:right;" | 500.00
|-
| Butter
| Ice cream
| style="text-align:right;" | 1.00
|}`,
                `{| class="wikitable"
| Orange || Apple     || style="text-align:right;" | 12,333.00
|-
| Bread || Pie       || style="text-align:right;" | 500.00
|-
| Butter || Ice cream || style="text-align:right;" | 1.00
|}`,
                `{| class="wikitable"
| Orange
| Apple
| style="text-align:right;"| 12,333.00
|-
| Bread
| Pie
| style="text-align:right;"| 500.00
|- style="font-style: italic; color: green;"
| Butter
| Ice cream
| style="text-align:right;"| 1.00
|}`
            ];
            const parseFn  = parser._parseTables.bind(parser);
            const result   = wikitext.map(text => {
                return parseFn(text);
            });
            const answers  = [
                `<table class="wikitable">
<tr>
<td>Orange</td>
<td>Apple</td>
<td style="text-align:right;">12,333.00</td>
</tr>
<tr>
<td>Bread</td>
<td>Pie</td>
<td style="text-align:right;">500.00</td>
</tr>
<tr>
<td>Butter</td>
<td>Ice cream</td>
<td style="text-align:right;">1.00</td>
</tr>
</table>`,
                `<table class="wikitable">
<tr>
<td>Orange</td>
<td>Apple</td>
<td style="text-align:right;">12,333.00</td>
</tr>
<tr>
<td>Bread</td>
<td>Pie</td>
<td style="text-align:right;">500.00</td>
</tr>
<tr>
<td>Butter</td>
<td>Ice cream</td>
<td style="text-align:right;">1.00</td>
</tr>
</table>`,
                `<table class="wikitable">
<tr>
<td>Orange</td>
<td>Apple</td>
<td style="text-align:right;">12,333.00</td>
</tr>
<tr>
<td>Bread</td>
<td>Pie</td>
<td style="text-align:right;">500.00</td>
</tr>
<tr style="font-style: italic; color: green;">
<td>Butter</td>
<td>Ice cream</td>
<td style="text-align:right;">1.00</td>
</tr>
</table>`
            ];
            result.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });
    });

    describe("parse", function() {
        it("Should parse a document", function() {
            const wikitext = `==Abc==
 Def
 Def|abc
*This is going to be [[great|awesome]]. But not too [http://www.google.com].

===Howdy===
#Item 1
##Item 2
#Item 3
----`;
            const result   = parser.parse(wikitext);
            const answer  = `<h2>Abc</h2>
<pre>
Def
Def|abc
</pre>
<ul>
<li>This is going to be <a href='${parser.getBaseURL()}/Great'>awesome</a>. But not too <a href='http://www.google.com'>[1]</a></li>
</ul>.

<h3>Howdy</h3>
<ol>
<li>Item 1
<ol>
<li>Item 2</li>
</ol>
</li>
<li>Item 3</li>
</ol>
<hr>`;

            // expect(result).to.equal(answer);
        });
    });
});
