////////////////////////////
// Initialize
////////////////////////////
const chai  = require("chai");
const mocha = require("mocha");

const { lastElement,
    listTag,
    listItemTag,
    fastForward,
    rewind
} = require("../src/utilities");

const expect = chai.expect;

////////////////////////////
// Test
////////////////////////////
describe("Utilities", function() {
    describe("lastElement", function() {
        it("Should return the last element in an array", function() {
            const links = [
                "link 1",
                "link 2"
            ];
            const last = lastElement(links);
            expect(last).to.equal("link 2");
        });
    });

    describe("listItemTag", function() {
        it("Should return '<dd>' and '</dd>'", function() {
            const tags = [
                listItemTag(":"),
                listItemTag(":", true),
            ];
            const answers = [
                "<dd>",
                "</dd>"
            ];
            tags.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should return '<dt>' and '</dt>'", function() {
            const tags = [
                listItemTag(";"),
                listItemTag(";", true),
            ];
            const answers = [
                "<dt>",
                "</dt>"
            ];
            tags.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });

        it("Should return '<li>' and '</li>'", function() {
            const tags = [
                listItemTag("#"),
                listItemTag("#", true),
                listItemTag("*"),
                listItemTag("*", true)
            ];
            const answers = [
                "<li>",
                "</li>",
                "<li>",
                "</li>"
            ];
            tags.forEach((item, idx) => {
                expect(item).to.equal(answers[idx]);
            });
        });
    });

    describe("fastForward", function() {
        it("Should bump up the depth of a line", function() {
            const lineArr = [ "", "", "Text", [":", ":"] ];
            const layer = [ ":" ];
            const text = fastForward("", lineArr, layer);
            expect(layer.length).to.equal(lineArr[lineArr.length - 1].length);
            expect(text).to.equal("<dl>\n<dd>");
        });

        it("Should not adjust two lines on the same depth", function() {
            const lineArr = [ "", "", "Text", [":", ":"] ];
            const layer = [ ":", ":" ];
            const origLength = layer.length;
            const origText = "";
            const text = fastForward(origText, lineArr, layer);
            expect(layer.length).to.equal(origLength);
            expect(text).to.equal(origText);
        });

        it("Should only add ';' for last character", function() {
            const lineArr = [ "", "", "", "Text", [";", ";", ";"] ];
            const layer = [];
            const text = fastForward("", lineArr, layer);
            expect(layer).to.deep.equal( [":", ":", ";"] );
            expect(text).to.equal("<dl>\n<dd>\n<dl>\n<dd>\n<dl>\n<dt>");
        });
    });

    describe("rewind", function() {
        it("Should rewind by the default value (=1)", function() {
            const layer = [":", ":"];
            const text = rewind("", layer);
            expect(layer).to.deep.equal( [":"] );
            expect(text).to.equal("</dd>\n</dl>");
        });

        it("Should rewind by a given amount", function() {
            const layer = [":", ":"];
            const text = rewind("", layer, layer.length);
            expect(layer).to.deep.equal( [] );
            expect(text).to.equal("</dd>\n</dl>\n</dd>\n</dl>");
        });
    });
});
