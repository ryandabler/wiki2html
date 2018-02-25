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
        const result = Parser._parseHeaders(wikitext);
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
        const result = Parser._parseHeaders(wikitext);
        const answer = `=A=a
b==B==`;
        expect(result).to.equal(answer);
    });

    it("Should correctly render unexpected edge cases", function() {
        const wikitext = `===
==a===
=== =`;
        const result = Parser._parseHeaders(wikitext);
        const answer = `<h1>=</h1>
<h2>a=</h2>
<h1>== </h1>`;
        expect(result).to.equal(answer);
    });
});
