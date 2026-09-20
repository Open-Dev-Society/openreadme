/**
 * Self-check for the markdown generator: `npx tsx utils/generate-markdown.check.ts`
 * No network, no framework — fixtures in, assertions out.
 */
import assert from "node:assert/strict";
import { generateMarkdown, defaultMarkdownOptions } from "./generate-markdown";
import type { MarkdownInput } from "./generate-markdown";
import type { UserStats } from "@/types";

const input: MarkdownInput = {
    name: "Ada Lovelace",
    githubUsername: "ada",
    bio: "First programmer",
    twitterUsername: "",
    linkedinUsername: "",
    portfolioUrl: "ada.dev",
    stats: {
        Commits: 6432,
        "Pull Requests": 173,
        "Star Earned": 66,
        Followers: 158,
        "Contributed To": 31,
    } as UserStats,
    streak: { currentStreak: 5 } as MarkdownInput["streak"],
    repos: [
        {
            name: "engine",
            description: "A | pipe in the description",
            url: "https://github.com/ada/engine",
            homepage: "",
            stars: 16677,
            language: "TypeScript",
            languages: ["TypeScript", "CSS"],
            archived: false,
        },
        {
            name: "retired",
            description: "Archived work",
            url: "https://github.com/ada/retired",
            homepage: "",
            stars: 900,
            language: "Python",
            languages: ["Python"],
            archived: true,
        },
    ],
};

const md = generateMarkdown(input, defaultMarkdownOptions);

assert.ok(md.includes("# Ada Lovelace"), "name heading");
assert.ok(md.startsWith("First programmer"), "bio leads");
assert.ok(md.includes("16,677 ★"), "stars are grouped");
assert.ok(!md.includes("retired"), "archived repos are left out");
assert.ok(md.includes("A \\| pipe"), "pipes are escaped so the table survives");
assert.ok(md.includes("i=ts,css"), "stack counts every language, most used first");
assert.ok(md.includes("[Website](https://ada.dev)"), "bare domains get a scheme");
assert.ok(!md.includes("undefined"), "nothing leaks");

// Every block is optional; with all of them off only the bio and name remain.
const bare = generateMarkdown(input, {
    projects: false,
    stats: false,
    stack: false,
    connect: false,
    projectLimit: 5,
});
assert.equal(bare.trim(), "First programmer\n\n# Ada Lovelace");

console.log("generate-markdown: all checks passed");
