/**
 * A README is a set of claims about a repository, and claims rot: stars move,
 * badges break, links die, install commands drift from package.json.
 *
 * Every finding here is checked against something live. Nothing is inferred from
 * style, and nothing is reported that could not be shown to be false.
 */
import { compareLicenses } from "./license";

export type FindingKind =
    | "dead-link"
    | "dead-image"
    | "stale-stars"
    | "orphan-workflow-badge"
    | "license-mismatch";

export interface Finding {
    kind: FindingKind;
    /** What the README says. */
    claim: string;
    /** What is actually true. */
    reality: string;
    line: number;
    url?: string;
}

export interface VerifyInput {
    /** Raw README markdown. */
    content: string;
    /** Owner of the repo the README belongs to, for relative links. */
    owner: string;
    repo: string;
    branch: string;
    token?: string;
    /** SPDX id GitHub detected from the LICENSE file. */
    repoLicense?: string | null;
    /** The `license` field in package.json. */
    packageLicense?: string | null;
}

interface Reference {
    url: string;
    line: number;
    isImage: boolean;
}

const MARKDOWN_LINK = /(!?)\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const HTML_SRC = /<(img|a)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;

export function collectReferences(content: string): Reference[] {
    const found: Reference[] = [];
    const lines = content.split("\n");

    lines.forEach((text, index) => {
        for (const match of text.matchAll(MARKDOWN_LINK)) {
            found.push({ url: match[2], line: index + 1, isImage: match[1] === "!" });
        }
        for (const match of text.matchAll(HTML_SRC)) {
            found.push({
                url: match[2],
                line: index + 1,
                isImage: match[1].toLowerCase() === "img",
            });
        }
    });

    // Anchors and mailto are not claims about the world.
    return found.filter(
        (ref) => !ref.url.startsWith("#") && !ref.url.startsWith("mailto:")
    );
}

/** Star counts written into prose, e.g. "13,200+ Stars" or "16k stars". */
export function findStarClaims(content: string): { line: number; text: string; value: number }[] {
    const claims: { line: number; text: string; value: number }[] = [];

    content.split("\n").forEach((text, index) => {
        for (const match of text.matchAll(/([\d][\d,\.]*)\s*(k\+?|\+)?\s*(?:★|⭐|stars?\b)/gi)) {
            const raw = match[1].replace(/,/g, "");
            let value = Number(raw);
            if (!Number.isFinite(value)) continue;
            if (/^k/i.test(match[2] ?? "")) value *= 1000;
            claims.push({ line: index + 1, text: match[0].trim(), value });
        }
    });

    return claims;
}

async function head(url: string, token?: string): Promise<number> {
    const headers: Record<string, string> = { "User-Agent": "OpenReadme-Verify" };
    if (token && url.startsWith("https://api.github.com")) {
        headers.Authorization = `token ${token}`;
    }

    try {
        // Some hosts refuse HEAD but answer GET, so a 405 is retried rather than
        // reported as a dead link.
        const res = await fetch(url, { method: "HEAD", headers, redirect: "follow" });
        if (res.status === 405 || res.status === 501) {
            const retry = await fetch(url, { method: "GET", headers, redirect: "follow" });
            return retry.status;
        }
        return res.status;
    } catch {
        return 0;
    }
}

/** Runs `task` over `items` with a fixed number in flight. */
async function pool<T, R>(items: T[], size: number, task: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length);
    const queue = items.map((item, index) => ({ item, index }));

    await Promise.all(
        Array.from({ length: Math.min(size, queue.length) }, async () => {
            while (queue.length > 0) {
                const next = queue.shift();
                if (!next) return;
                results[next.index] = await task(next.item);
            }
        })
    );

    return results;
}

export async function verifyReadme(input: VerifyInput): Promise<Finding[]> {
    const { content, owner, repo, branch, token } = input;
    const findings: Finding[] = [];
    const references = collectReferences(content);

    // A relative path is a claim that a file exists at that path in this repo.
    const resolve = (url: string) =>
        /^https?:\/\//i.test(url)
            ? url
            : `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${url.replace(/^\.?\//, "")}`;

    const statuses = await pool(references, 8, async (ref) => ({
        ref,
        status: await head(resolve(ref.url), token),
    }));

    for (const { ref, status } of statuses) {
        // Only report what the server actually disowned. A network failure (0),
        // a bot wall (403, LinkedIn's non-standard 999), a rate limit (429) or a
        // server fault (5xx) all mean "could not check", not "broken" — and a
        // verifier that cries wolf is worth less than no verifier.
        if (
            status === 0 ||
            status === 403 ||
            status === 429 ||
            status === 999 ||
            status >= 500 ||
            (status >= 200 && status < 400)
        ) {
            continue;
        }

        findings.push({
            kind: ref.isImage ? "dead-image" : "dead-link",
            claim: ref.url,
            reality: `HTTP ${status}`,
            line: ref.line,
            url: resolve(ref.url),
        });
    }

    // A workflow badge is a claim that the workflow exists.
    const badgePattern =
        /https:\/\/github\.com\/([^/]+)\/([^/]+)\/actions\/workflows\/([^/]+)\/badge\.svg/;
    for (const ref of references) {
        const match = ref.url.match(badgePattern);
        if (!match) continue;

        const [, badgeOwner, badgeRepo, workflow] = match;
        const status = await head(
            `https://api.github.com/repos/${badgeOwner}/${badgeRepo}/contents/.github/workflows/${workflow}`,
            token
        );

        if (status === 404) {
            findings.push({
                kind: "orphan-workflow-badge",
                claim: `badge for .github/workflows/${workflow}`,
                reality: "no such workflow file in the repository",
                line: ref.line,
                url: ref.url,
            });
        }
    }

    // A star count in prose is a claim about a repository the README links to.
    const linkedRepos = new Map<string, string>();
    for (const ref of references) {
        const match = ref.url.match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+)\/?$/);
        if (match) linkedRepos.set(`${match[1]}/${match[2]}`, ref.url);
    }

    const claims = findStarClaims(content);
    if (claims.length > 0 && linkedRepos.size > 0) {
        const counts = await pool([...linkedRepos.keys()], 6, async (fullName) => {
            const headers: Record<string, string> = { "User-Agent": "OpenReadme-Verify" };
            if (token) headers.Authorization = `token ${token}`;
            try {
                const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers });
                if (!res.ok) return { fullName, stars: null as number | null };
                const data = await res.json();
                return { fullName, stars: Number(data.stargazers_count) };
            } catch {
                return { fullName, stars: null as number | null };
            }
        });

        const lines = content.split("\n");
        for (const claim of claims) {
            const line = lines[claim.line - 1] ?? "";
            // Only compare when the claim and the repository link share a line,
            // otherwise the number could be about anything.
            const onLine = counts.find(
                ({ fullName }) => fullName && line.includes(fullName) && typeof fullName === "string"
            );
            if (!onLine || onLine.stars == null) continue;

            // Written counts are rounded on purpose ("16k", "13,200+"), so only a
            // gap wider than 10% counts as stale.
            const drift = Math.abs(onLine.stars - claim.value) / Math.max(1, onLine.stars);
            if (drift > 0.1) {
                findings.push({
                    kind: "stale-stars",
                    claim: `${claim.text} for ${onLine.fullName}`,
                    reality: `${onLine.stars.toLocaleString("en-US")} stars today`,
                    line: claim.line,
                });
            }
        }
    }

    // Which licence a project is under is stated in up to three places, and
    // nothing keeps them in agreement.
    for (const disagreement of compareLicenses(content, {
        repoLicense: input.repoLicense,
        packageLicense: input.packageLicense,
    })) {
        findings.push({
            kind: "license-mismatch",
            claim: disagreement.claim,
            reality: disagreement.reality,
            line: disagreement.line,
        });
    }

    return findings.sort((a, b) => a.line - b.line);
}
