/**
 * A project states its licence in up to three places — the README, the LICENSE
 * file, and package.json — and nothing keeps them in agreement. When they
 * disagree, nobody can tell what terms the code is actually under, which is a
 * legal problem rather than a tidiness one.
 */

/** Spellings people actually write, mapped to the SPDX id GitHub reports. */
const ALIASES: [RegExp, string][] = [
    [/\bapache[\s-]*(?:license[\s,-]*)?(?:version[\s-]*)?2(?:\.0)?\b/i, "Apache-2.0"],
    [/\bagpl[\s-]*(?:v)?3(?:\.0)?\b|\baffero general public license[\s,-]*(?:v)?3?/i, "AGPL-3.0"],
    [/\blgpl[\s-]*(?:v)?3(?:\.0)?\b/i, "LGPL-3.0"],
    [/\blgpl[\s-]*(?:v)?2\.1\b/i, "LGPL-2.1"],
    [/\bgpl[\s-]*(?:v)?3(?:\.0)?\b|\bgnu general public license[\s,-]*(?:v)?3/i, "GPL-3.0"],
    [/\bgpl[\s-]*(?:v)?2(?:\.0)?\b|\bgnu general public license[\s,-]*(?:v)?2/i, "GPL-2.0"],
    [/\bmpl[\s-]*2(?:\.0)?\b|\bmozilla public license[\s,-]*2(?:\.0)?\b/i, "MPL-2.0"],
    [/\bbsd[\s-]*3[\s-]*clause\b/i, "BSD-3-Clause"],
    [/\bbsd[\s-]*2[\s-]*clause\b/i, "BSD-2-Clause"],
    [/\bepl[\s-]*2(?:\.0)?\b|\beclipse public license[\s,-]*2(?:\.0)?\b/i, "EPL-2.0"],
    [/\bcc0[\s-]*1(?:\.0)?\b/i, "CC0-1.0"],
    // More specific first: CC-BY-SA before CC-BY, MIT-0 before MIT. The list is
    // ordered, and the first pattern that matches wins.
    [/\bcc[\s-]*by[\s-]*sa[\s-]*4(?:\.0)?\b/i, "CC-BY-SA-4.0"],
    [/\bcc[\s-]*by[\s-]*4(?:\.0)?\b/i, "CC-BY-4.0"],
    [/\bbsd[\s-]*4[\s-]*clause\b/i, "BSD-4-Clause"],
    [/\bboost software license\b|\bbsl[\s-]*1(?:\.0)?\b/i, "BSL-1.0"],
    [/\bartistic[\s-]*2(?:\.0)?\b/i, "Artistic-2.0"],
    [/\bwtfpl\b/i, "WTFPL"],
    [/\bzlib\b/i, "Zlib"],
    [/\bunlicense\b/i, "Unlicense"],
    [/\bisc\b/i, "ISC"],
    // MIT-0 drops MIT's attribution requirement, so it is a different licence
    // and must be recognised before the plain MIT pattern can swallow it.
    [/\bmit[\s-]*0\b|\bmit no attribution\b/i, "MIT-0"],
    [/\bmit\b/i, "MIT"],
];

/** GPL-3.0-only, GPL-3.0-or-later and GPL-3.0 are the same licence family. */
export function normalizeLicense(input: string | null | undefined): string | null {
    if (!input) return null;

    const trimmed = input.trim();
    if (!trimmed || /^(noassertion|other|unlicensed)$/i.test(trimmed)) return null;

    // An SPDX id arrives already correct; strip the -only / -or-later suffix so
    // "GPL-2.0-only" and "GPL-2.0" do not read as a disagreement.
    const spdx = trimmed.replace(/-(only|or-later)$/i, "");

    // An id-shaped string is matched exactly and never fuzzily. Otherwise
    // "MIT-0" matches the /\bmit\b/ pattern and is reported as MIT — and MIT-0
    // is a different licence, which drops the attribution requirement. Silently
    // equating two licences is worse than admitting we do not recognise one.
    if (/^[A-Za-z0-9.+-]+$/.test(spdx) && !/\s/.test(spdx)) {
        const known = ALIASES.find(([, id]) => id.toLowerCase() === spdx.toLowerCase());
        return known ? known[1] : null;
    }

    for (const [pattern, id] of ALIASES) {
        if (pattern.test(trimmed)) return id;
    }

    return null;
}

export interface LicenseClaim {
    spdx: string;
    line: number;
    text: string;
    source: "badge" | "prose";
}

/**
 * Licence claims in a README. Only lines that are about licensing count: a
 * README explaining that its dependencies are MIT is not claiming to be MIT,
 * and flagging that would be a false accusation.
 */
export function findLicenseClaims(content: string): LicenseClaim[] {
    const claims: LicenseClaim[] = [];

    content.split("\n").forEach((line, index) => {
        const isBadge = /shields\.io\/(badge\/licen|github\/licen)/i.test(line);
        const mentionsLicence = /licen[cs]e/i.test(line);
        if (!isBadge && !mentionsLicence) return;

        // "See the LICENSE file" names no licence, so there is nothing to compare.
        const subject = isBadge
            ? decodeURIComponent(line).replace(/[_-]/g, " ")
            : line;

        for (const [pattern, id] of ALIASES) {
            if (!pattern.test(subject)) continue;
            if (claims.some((claim) => claim.spdx === id && claim.line === index + 1)) break;

            claims.push({
                spdx: id,
                line: index + 1,
                text: line.trim().slice(0, 120),
                source: isBadge ? "badge" : "prose",
            });
            break;
        }
    });

    return claims;
}

export interface LicenseSources {
    /** SPDX id GitHub detected from the LICENSE file, if any. */
    repoLicense?: string | null;
    /** The `license` field in package.json, if any. */
    packageLicense?: string | null;
}

export interface LicenseDisagreement {
    claim: string;
    reality: string;
    line: number;
}

export function compareLicenses(
    content: string,
    sources: LicenseSources
): LicenseDisagreement[] {
    const repo = normalizeLicense(sources.repoLicense);
    const pkg = normalizeLicense(sources.packageLicense);
    const claims = findLicenseClaims(content);
    const disagreements: LicenseDisagreement[] = [];

    // The LICENSE file is the authority: it is the document a court would read.
    const authority = repo ?? pkg;

    if (authority) {
        for (const claim of claims) {
            if (claim.spdx === authority) continue;
            disagreements.push({
                claim: `README ${claim.source === "badge" ? "badge" : "text"} says ${claim.spdx}`,
                reality: repo
                    ? `LICENSE file is ${repo}`
                    : `package.json says ${pkg}`,
                line: claim.line,
            });
        }
    }

    if (repo && pkg && repo !== pkg) {
        disagreements.push({
            claim: `package.json says ${pkg}`,
            reality: `LICENSE file is ${repo}`,
            line: 1,
        });
    }

    // Two different licences claimed inside the README itself.
    const distinct = [...new Set(claims.map((claim) => claim.spdx))];
    if (distinct.length > 1) {
        const later = claims.find((claim) => claim.spdx === distinct[1]);
        disagreements.push({
            claim: `README claims ${distinct.join(" and ")}`,
            reality: "a project has one licence; readers cannot tell which applies",
            line: later?.line ?? 1,
        });
    }

    return disagreements;
}
