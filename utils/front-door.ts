/**
 * A repository's front door: everything a visitor and a would-be contributor
 * meets before they read a line of code. GitHub scores it at
 * /repos/{owner}/{repo}/community/profile, and most repositories fail.
 *
 * This reads what a repository actually contains and writes the missing pieces
 * from that evidence. It never writes a LICENSE: which licence to ship is a
 * legal decision belonging to the owner, not a default worth guessing.
 */

export interface Evidence {
    owner: string;
    repo: string;
    description: string;
    language: string;
    topics: string[];
    defaultBranch: string;
    license: string | null;
    /** npm scripts, when the repository has a package.json. */
    scripts: Record<string, string>;
    packageManager: "npm" | "pnpm" | "yarn";
    hasWorkflows: boolean;
    contactEmail: string;
}

export interface FrontDoor {
    healthPercentage: number;
    /** Community-profile keys GitHub reports as absent. */
    missing: string[];
    evidence: Evidence;
}

export interface GeneratedFile {
    path: string;
    content: string;
    /** Why this file is being added, for the pull request body. */
    reason: string;
}

const HEADERS = (token?: string) => ({
    Accept: "application/vnd.github+json",
    "User-Agent": "OpenReadme-FrontDoor",
    ...(token ? { Authorization: `token ${token}` } : {}),
});

async function readJson(url: string, token?: string) {
    const res = await fetch(url, { headers: HEADERS(token) });
    return res.ok ? res.json() : null;
}

async function readFile(
    owner: string,
    repo: string,
    path: string,
    token?: string
): Promise<string | null> {
    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        { headers: { ...HEADERS(token), Accept: "application/vnd.github.raw" } }
    );
    return res.ok ? res.text() : null;
}

export async function inspectFrontDoor(
    owner: string,
    repo: string,
    token?: string,
    contactEmail = ""
): Promise<FrontDoor> {
    const [meta, community, pkgRaw, workflows] = await Promise.all([
        readJson(`https://api.github.com/repos/${owner}/${repo}`, token),
        readJson(`https://api.github.com/repos/${owner}/${repo}/community/profile`, token),
        readFile(owner, repo, "package.json", token),
        readJson(
            `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows`,
            token
        ),
    ]);

    if (!meta) throw new Error(`Cannot read ${owner}/${repo}`);

    let scripts: Record<string, string> = {};
    let packageManager: Evidence["packageManager"] = "npm";
    if (pkgRaw) {
        try {
            const pkg = JSON.parse(pkgRaw);
            scripts = pkg.scripts ?? {};
            if (typeof pkg.packageManager === "string") {
                if (pkg.packageManager.startsWith("pnpm")) packageManager = "pnpm";
                if (pkg.packageManager.startsWith("yarn")) packageManager = "yarn";
            }
        } catch {
            // A package.json we cannot parse tells us nothing; carry on without it.
        }
    }

    const files = community?.files ?? {};
    const missing = [
        "readme",
        "contributing",
        "code_of_conduct",
        "license",
        "issue_template",
        "pull_request_template",
    ].filter((key) => !files[key]);

    return {
        healthPercentage: community?.health_percentage ?? 0,
        missing,
        evidence: {
            owner,
            repo,
            description: meta.description ?? "",
            language: meta.language ?? "",
            topics: meta.topics ?? [],
            defaultBranch: meta.default_branch ?? "main",
            license: meta.license?.spdx_id ?? null,
            scripts,
            packageManager,
            hasWorkflows: Array.isArray(workflows) && workflows.length > 0,
            contactEmail,
        },
    };
}

const runner = (evidence: Evidence) =>
    evidence.packageManager === "npm" ? "npm run" : evidence.packageManager;

const installCommand = (evidence: Evidence) =>
    ({ npm: "npm install", pnpm: "pnpm install", yarn: "yarn" })[evidence.packageManager];

function codeOfConduct(evidence: Evidence): string {
    const contact = evidence.contactEmail || `the maintainers of ${evidence.repo}`;
    const reporting = evidence.contactEmail
        ? `**${evidence.contactEmail}**`
        : `the maintainers, privately`;

    return `# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in
${evidence.repo} a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, religion, or sexual identity and
orientation.

## Our Standards

Examples of behavior that contributes to a positive environment:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Accepting constructive feedback gracefully
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior:

- Sexualized language or imagery, and unwelcome sexual attention or advances
- Trolling, insulting or derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a
  professional setting

## Enforcement Responsibilities

Maintainers are responsible for clarifying and enforcing these standards, and
will take appropriate and fair corrective action in response to any behavior
they deem inappropriate, threatening, offensive, or harmful.

## Scope

This Code of Conduct applies within all community spaces, and also applies when
an individual is officially representing the project in public spaces.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to ${reporting}. All complaints will be reviewed and investigated
promptly and fairly. Maintainers are obligated to respect the privacy and
security of the reporter of any incident.

## Attribution

Adapted from the [Contributor Covenant](https://www.contributor-covenant.org),
version 2.1, available at
https://www.contributor-covenant.org/version/2/1/code_of_conduct.html
`;
}

function bugReport(evidence: Evidence): string {
    // Steps are worth asking for only if we can tell them how to start the thing.
    const startHint = evidence.scripts.dev
        ? `Run \`${runner(evidence)} dev\`, then…`
        : "Start from…";

    return `name: Bug report
description: Something in ${evidence.repo} does not work as documented
labels: ["bug"]
body:
  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: What you saw, and what you expected instead.
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      description: The smallest sequence that shows the problem.
      placeholder: |
        1. ${startHint}
        2.
        3.
    validations:
      required: true

  - type: input
    id: version
    attributes:
      label: Version or commit
      description: The release, or the commit SHA you are on.
    validations:
      required: true
${
    evidence.language
        ? `
  - type: input
    id: environment
    attributes:
      label: Environment
      description: Operating system, and your ${evidence.language} version.
      placeholder: macOS 15, ${evidence.language} 20.x
    validations:
      required: false
`
        : ""
}
  - type: textarea
    id: logs
    attributes:
      label: Logs or screenshots
      description: Paste any error output. It will be formatted as code automatically.
      render: shell
    validations:
      required: false
`;
}

function featureRequest(evidence: Evidence): string {
    return `name: Feature request
description: Suggest something ${evidence.repo} should do
labels: ["enhancement"]
body:
  - type: textarea
    id: problem
    attributes:
      label: What problem does this solve?
      description: The situation you are in when you need this. Not the solution yet.
    validations:
      required: true

  - type: textarea
    id: proposal
    attributes:
      label: What should happen?
      description: What you would like ${evidence.repo} to do instead.
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: What have you tried?
      description: Workarounds, other tools, or why the current behaviour does not fit.
    validations:
      required: false
`;
}

function pullRequestTemplate(evidence: Evidence): string {
    const checks: string[] = [];
    if (evidence.scripts.lint) checks.push(`- [ ] \`${runner(evidence)} lint\` passes`);
    if (evidence.scripts.test) checks.push(`- [ ] \`${runner(evidence)} test\` passes`);
    if (evidence.scripts.build) checks.push(`- [ ] \`${runner(evidence)} build\` succeeds`);
    checks.push("- [ ] I have described what this changes and why");

    return `## What does this change?

<!-- What the reader of this repository can do after this that they could not before. -->

## Why?

<!-- The problem it solves. Link the issue if there is one: Fixes #123 -->

## How was it tested?

<!-- What you ran, and what you saw. "It builds" is not testing. -->

## Checklist

${checks.join("\n")}
`;
}

function contributing(evidence: Evidence): string {
    const install = installCommand(evidence);
    const dev = evidence.scripts.dev
        ? `${runner(evidence)} dev`
        : evidence.scripts.start
          ? `${runner(evidence)} start`
          : null;

    const commands = Object.entries(evidence.scripts)
        .filter(([name]) => ["dev", "build", "test", "lint", "start"].includes(name))
        .map(([name, script]) => `| \`${runner(evidence)} ${name}\` | \`${script}\` |`);

    return `# Contributing to ${evidence.repo}

Thanks for being here. ${evidence.description || `${evidence.repo} is open source, and contributions are welcome.`}

## Getting set up

\`\`\`bash
git clone https://github.com/${evidence.owner}/${evidence.repo}.git
cd ${evidence.repo}
${install}${dev ? `\n${dev}` : ""}
\`\`\`
${
    commands.length > 0
        ? `
### Commands that exist today

| Command | Runs |
| --- | --- |
${commands.join("\n")}
`
        : ""
}
## Making a change

1. Branch from \`${evidence.defaultBranch}\`.
2. Make the change, and keep the diff to one thing.
3. Open a pull request describing what changed and why.${
        evidence.hasWorkflows ? "\n4. CI runs on your pull request; keep it green." : ""
    }

## Not sure where to start?

Look for issues labelled [\`good first issue\`](https://github.com/${evidence.owner}/${evidence.repo}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22). If there are none open, or something is unclear, open an issue and ask — that is a contribution too.

## Reporting a bug

Open an issue with what you did, what you expected, and what happened. A small
reproduction is worth more than a long description.

Everyone taking part agrees to the [Code of Conduct](CODE_OF_CONDUCT.md).
`;
}

export function generateFrontDoor(frontDoor: FrontDoor): GeneratedFile[] {
    const { missing, evidence } = frontDoor;
    const files: GeneratedFile[] = [];

    if (missing.includes("code_of_conduct")) {
        files.push({
            path: "CODE_OF_CONDUCT.md",
            content: codeOfConduct(evidence),
            reason: "Contributor Covenant 2.1, so there is a stated standard and a way to report a breach.",
        });
    }

    if (missing.includes("contributing")) {
        files.push({
            path: "CONTRIBUTING.md",
            content: contributing(evidence),
            reason: "Setup steps built from the repository's real scripts, so a newcomer can get it running.",
        });
    }

    if (missing.includes("issue_template")) {
        files.push({
            path: ".github/ISSUE_TEMPLATE/bug_report.yml",
            content: bugReport(evidence),
            reason: "An issue form that asks for steps, version and logs, turning \"it doesn't work\" into something actionable.",
        });
        files.push({
            path: ".github/ISSUE_TEMPLATE/feature_request.yml",
            content: featureRequest(evidence),
            reason: "A form that asks for the problem before the solution.",
        });
    }

    if (missing.includes("pull_request_template")) {
        files.push({
            path: ".github/PULL_REQUEST_TEMPLATE.md",
            content: pullRequestTemplate(evidence),
            reason: "A template whose checklist names the commands this repository actually has.",
        });
    }

    return files;
}

/** Things a tool must not decide on the owner's behalf. */
export function ownerDecisions(frontDoor: FrontDoor): string[] {
    const notes: string[] = [];

    if (frontDoor.missing.includes("license")) {
        notes.push(
            "**No LICENSE.** Without one, default copyright applies and nobody may legally use, copy or modify this code — including people who already have. Choosing a licence is yours to make, not a tool's: https://choosealicense.com"
        );
    }

    if (frontDoor.missing.includes("readme")) {
        notes.push(
            "**No README.** This repository has nothing to greet a visitor with, so anyone landing here sees a file tree and leaves."
        );
    }

    return notes;
}
