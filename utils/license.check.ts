/** `npx tsx utils/license.check.ts` — licence matching, where a wrong answer is a false accusation. */
import assert from "node:assert/strict";
import { normalizeLicense, findLicenseClaims, compareLicenses } from "./license";

assert.equal(normalizeLicense("MIT"), "MIT");
assert.equal(normalizeLicense("GPL-2.0-only"), "GPL-2.0", "-only is the same licence");
assert.equal(normalizeLicense("GPL-3.0-or-later"), "GPL-3.0", "-or-later is the same licence");
assert.equal(normalizeLicense("Apache License, Version 2.0"), "Apache-2.0");
assert.equal(normalizeLicense("NOASSERTION"), null, "GitHub's 'could not tell' is not a licence");
assert.equal(normalizeLicense(""), null);

// AGPL must not be read as GPL: they are different obligations.
assert.equal(normalizeLicense("AGPL-3.0"), "AGPL-3.0");
assert.equal(normalizeLicense("GNU Affero General Public License v3"), "AGPL-3.0");

const readme = `# Thing
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
This project is licensed under the MIT License.
It depends on ffmpeg, which is GPL-2.0, and on some Apache-2.0 libraries.
See the LICENSE file for details.
`;

const claims = findLicenseClaims(readme);
assert.deepEqual([...new Set(claims.map((c) => c.spdx))], ["MIT"],
    "a line about a dependency's licence is not a claim about this project");
assert.ok(claims.some((c) => c.source === "badge"), "badge is a claim");
assert.ok(claims.some((c) => c.source === "prose"), "prose is a claim");
assert.ok(!claims.some((c) => c.text.includes("See the LICENSE file")),
    "naming no licence claims nothing");

// README says MIT, the file says AGPL.
const mismatch = compareLicenses(readme, { repoLicense: "AGPL-3.0", packageLicense: null });
assert.ok(mismatch.length >= 1, "disagreement is reported");
assert.ok(mismatch[0].reality.includes("AGPL-3.0"), "the LICENSE file is the authority");

// Agreement is silence.
assert.deepEqual(compareLicenses(readme, { repoLicense: "MIT", packageLicense: "MIT" }), []);
// MIT-0 drops MIT's attribution requirement, so it is a different licence.
// Both the badge line and the prose line are reported: each is its own edit.
const mit0 = compareLicenses(readme, { repoLicense: "MIT-0", packageLicense: null });
assert.equal(mit0.length, 2, "MIT-0 is not MIT, and both claiming lines are flagged");
assert.ok(mit0.every((d) => d.reality.includes("MIT-0")));

// package.json against LICENSE, with the README silent.
const quiet = compareLicenses("# Thing\nNo licence talk here.\n",
    { repoLicense: "AGPL-3.0", packageLicense: "MIT" });
assert.equal(quiet.length, 1);
assert.ok(quiet[0].claim.includes("package.json"));

// Nothing to compare against: say nothing rather than guess.
assert.deepEqual(compareLicenses(readme, { repoLicense: null, packageLicense: null }), []);

console.log("license: all checks passed");
