/**
 * Self-check for the README verifier: `npx tsx utils/verify-readme.check.ts`
 * Covers the parsing, which is where a wrong answer becomes a false accusation.
 * The network checks are exercised by running it against a real repository.
 */
import assert from "node:assert/strict";
import { collectReferences, findStarClaims } from "./verify-readme";

const readme = `# Project

[Docs](https://example.com/docs) and ![badge](https://img.shields.io/x.svg)
See [the contributing guide](/CONTRIBUTING.md), or [jump to install](#install).
Mail [us](mailto:hi@example.com).
<a href="https://example.com/html-link">html</a>
<img src="https://example.com/html-image.png" alt="">
[Titled](https://example.com/titled "A title")
`;

const refs = collectReferences(readme);
const urls = refs.map((r) => r.url);

assert.ok(urls.includes("https://example.com/docs"), "markdown link");
assert.ok(urls.includes("https://img.shields.io/x.svg"), "markdown image");
assert.ok(urls.includes("/CONTRIBUTING.md"), "relative link is a claim too");
assert.ok(urls.includes("https://example.com/html-link"), "html anchor");
assert.ok(urls.includes("https://example.com/html-image.png"), "html image");
assert.ok(urls.includes("https://example.com/titled"), "title is not part of the url");
assert.ok(!urls.some((u) => u.startsWith("#")), "anchors are not claims");
assert.ok(!urls.some((u) => u.startsWith("mailto:")), "mailto is not a claim");

assert.equal(
    refs.find((r) => r.url === "https://img.shields.io/x.svg")?.isImage,
    true,
    "images are marked as images"
);
assert.equal(
    refs.find((r) => r.url === "https://example.com/docs")?.isImage,
    false,
    "links are not images"
);
assert.equal(
    refs.find((r) => r.url === "https://example.com/docs")?.line,
    3,
    "line numbers point at the claim"
);

const claims = findStarClaims(`
OpenStock has 13,200+ Stars today.
Another has 16k stars.
And one with 342 ★.
Version 2.0 of the thing.
`);

assert.deepEqual(
    claims.map((c) => c.value),
    [13200, 16000, 342],
    "counts parse, including k and separators"
);
assert.equal(claims.length, 3, "a version number is not a star count");

console.log("verify-readme: all checks passed");
