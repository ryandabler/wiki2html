////////////////////////////
// Initialize
////////////////////////////
const chai  = require("chai");
const mocha = require("mocha");

const { Page } = require("../src");

const expect = chai.expect;

////////////////////////////
// Test
////////////////////////////
describe("Page", function() {
    let page;

    beforeEach(function() {
        page = new Page();
    });

    describe("addUnnamedExternalLink", function() {
        it("Should add links to its internal array and return its length", function() {
            const links = [
                "link 1",
                "link 2"
            ];
            const startLength = page.unnamedExternalLinks.length;
            const lengths = links.map(link => page.addUnnamedExternalLink(link));
            
            lengths.forEach((length, idx) => {
                expect(length).to.equal(startLength + idx + 1);
            });
            expect(page.unnamedExternalLinks).to.deep.equal(links);
        });
    });

    describe("setPlaceholder", function() {
        it("Should generate a placeholder for supplied text and return it", function() {
            const text = "abc";
            const placeholder = page.setPlaceholder(text);
            
            expect(page.placeholders.size).to.equal(1);
            expect(page.placeholders.get(placeholder)).to.equal(text);
        });
    });

    describe("replacePlaceholders", function() {
        let text1, text2;
        let ph1, ph2;
        let fillerText;

        beforeEach(function() {
            fillerText = `\n\nTest\n\n`;
            [ text1, text2 ] = [ "abc", "def" ];
            [ ph1, ph2 ] = [ page.setPlaceholder(text1), page.setPlaceholder(text2) ];
            page.html = `${ph1}${fillerText}${ph2}`;
        });

        it("Should replace all placeholders with original text", function() {
            page.replacePlaceholders();
            
            expect(page.html).to.equal(`${text1}${fillerText}${text2}`);
            expect(page.placeholders.size).to.equal(0);
        });
    });
});
