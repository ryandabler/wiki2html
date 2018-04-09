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
});
