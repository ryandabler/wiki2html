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

    describe("_parseLinks", function() {
        it("Should parse existent links without colons", function() {
            const wikitext = [
                                "[[abc]]",
                                "[[pip_ing]]",
                                "[[aba$ip]]",
                                "[[aaa()bbb]]",
                                "[[a b]]",
                                "[[abc|def]]",
                                "[[a b|]]"
                             ];
            const parseFn  = parser._parseLinks.bind(parser);
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
    });
});
