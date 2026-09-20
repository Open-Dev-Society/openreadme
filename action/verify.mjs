#!/usr/bin/env node
/**
 * OpenReadme's README check, as a GitHub Action step.
 *
 * It reads the README from the checked-out workspace — so it judges what a pull
 * request proposes, not what is already on the default branch — and posts it to
 * the OpenReadme API, which holds the single implementation of the checks.
 *
 * No dependencies on purpose: an Action that needs `npm install` is an Action
 * that breaks on somebody else's runner.
 *
 * ponytail: the API does the checking, so a private repository's README is sent
 * to that service. Fine for public repos, which is who this is for today; a
 * self-hosted endpoint is the upgrade path, via the `api-url` input.
 */
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const env = process.env;
const workspace = env.GITHUB_WORKSPACE ?? process.cwd();
const repo = env.GITHUB_REPOSITORY ?? "";
const apiUrl = env.INPUT_API_URL || "https://openreadme.vercel.app/api/front-door";
const failOnFindings = (env.INPUT_FAIL_ON_FINDINGS ?? "false") === "true";
const shouldComment = (env.INPUT_COMMENT ?? "true") === "true";

const CANDIDATES = ["README.md", "readme.md", "README.MD", "Readme.md", "README"];

const LABELS = {
    "dead-link": "Dead link",
    "dead-image": "Dead image",
    "stale-stars": "Stale star count",
    "orphan-workflow-badge": "Badge without a workflow",
    "license-mismatch": "Licence disagreement",
};

function findReadme() {
    for (const name of CANDIDATES) {
        const path = join(workspace, name);
        if (existsSync(path)) return { path, name };
    }
    return null;
}

function summary(lines) {
    if (env.GITHUB_STEP_SUMMARY) {
        try {
            appendFileSync(env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
        } catch {
            // A summary that cannot be written is not worth failing a build over.
        }
    }
}

async function comment(body) {
    const token = env.GITHUB_TOKEN;
    const eventPath = env.GITHUB_EVENT_PATH;
    if (!token || !eventPath || !existsSync(eventPath)) return;

    let number;
    try {
        number = JSON.parse(readFileSync(eventPath, "utf8"))?.pull_request?.number;
    } catch {
        return;
    }
    if (!number) return;

    const marker = "<!-- openreadme-check -->";
    const headers = {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "openreadme-check",
    };

    try {
        // Update our previous comment rather than stacking a new one on every push.
        const existing = await fetch(
            `https://api.github.com/repos/${repo}/issues/${number}/comments?per_page=100`,
            { headers }
        ).then((res) => (res.ok ? res.json() : []));

        const mine = existing.find((item) => item.body?.includes(marker));
        const payload = JSON.stringify({ body: `${marker}\n${body}` });

        if (mine) {
            await fetch(`https://api.github.com/repos/${repo}/issues/comments/${mine.id}`, {
                method: "PATCH",
                headers,
                body: payload,
            });
        } else {
            await fetch(`https://api.github.com/repos/${repo}/issues/${number}/comments`, {
                method: "POST",
                headers,
                body: payload,
            });
        }
    } catch (error) {
        console.log(`Could not post the comment: ${error.message}`);
    }
}

async function main() {
    const readme = findReadme();
    if (!readme) {
        console.log("No README found in the workspace; nothing to check.");
        summary(["### OpenReadme", "", "No README found in this repository."]);
        return;
    }

    const content = readFileSync(readme.path, "utf8");

    let result;
    try {
        const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "User-Agent": "openreadme-check" },
            body: JSON.stringify({ repo, content }),
        });
        result = await res.json();
        if (!res.ok) throw new Error(result?.error ?? `HTTP ${res.status}`);
    } catch (error) {
        // The service being unreachable is not the same as the README being wrong,
        // so this never fails the build.
        console.log(`Could not reach the OpenReadme API: ${error.message}`);
        return;
    }

    const findings = result.findings ?? [];
    const lines = [`### OpenReadme — ${readme.name}`, ""];

    if (typeof result.healthPercentage === "number") {
        lines.push(
            `Community profile: **${result.healthPercentage}%**` +
                (result.missing?.length ? ` · missing: ${result.missing.join(", ")}` : "")
        );
        lines.push("");
    }

    if (findings.length === 0) {
        console.log("Every link, badge and star count checked out.");
        lines.push("Every link, badge and star count checked out. Nothing to fix.");
    } else {
        console.log(`${findings.length} finding(s):`);
        lines.push(`| Line | What | Claim | Actually |`, `| --- | --- | --- | --- |`);

        for (const finding of findings) {
            console.log(`  L${finding.line} [${finding.kind}] ${finding.claim} → ${finding.reality}`);
            // A GitHub annotation puts the finding on the diff itself.
            console.log(
                `::warning file=${readme.name},line=${finding.line}::${LABELS[finding.kind] ?? finding.kind}: ${finding.claim} — ${finding.reality}`
            );
            lines.push(
                `| ${finding.line} | ${LABELS[finding.kind] ?? finding.kind} | \`${finding.claim}\` | ${finding.reality} |`
            );
        }
    }

    for (const note of result.decisions ?? []) {
        lines.push("", note);
    }

    summary(lines);
    if (shouldComment && findings.length > 0) await comment(lines.join("\n"));

    if (env.GITHUB_OUTPUT) {
        appendFileSync(env.GITHUB_OUTPUT, `findings=${findings.length}\n`);
    }

    if (failOnFindings && findings.length > 0) {
        console.log(`::error::${findings.length} README claim(s) are no longer true`);
        process.exit(1);
    }
}

main();
