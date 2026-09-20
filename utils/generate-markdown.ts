import type { RepoSummary } from "@/app/api/repos/route";
import type { StreakStats, UserStats } from "@/types";

export interface MarkdownInput {
    name: string;
    githubUsername: string;
    bio: string;
    twitterUsername: string;
    linkedinUsername: string;
    portfolioUrl: string;
    stats: UserStats | undefined;
    streak: StreakStats | undefined;
    repos: RepoSummary[];
}

export interface MarkdownOptions {
    projects: boolean;
    stats: boolean;
    stack: boolean;
    connect: boolean;
    projectLimit: number;
}

export const defaultMarkdownOptions: MarkdownOptions = {
    projects: true,
    stats: true,
    stack: true,
    connect: true,
    projectLimit: 5,
};

// skillicons.dev slugs for the languages GitHub actually reports. Anything not
// here is dropped rather than guessed: a broken icon is worse than a short row.
const SKILL_ICONS: Record<string, string> = {
    TypeScript: "ts",
    JavaScript: "js",
    Python: "py",
    Go: "go",
    Rust: "rust",
    Java: "java",
    Kotlin: "kotlin",
    Swift: "swift",
    "C++": "cpp",
    C: "c",
    "C#": "cs",
    Ruby: "ruby",
    PHP: "php",
    Dart: "dart",
    Elixir: "elixir",
    Haskell: "haskell",
    Lua: "lua",
    Scala: "scala",
    Shell: "bash",
    HTML: "html",
    CSS: "css",
    Vue: "vue",
    Svelte: "svelte",
    Jupyter: "py",
    "Jupyter Notebook": "py",
    Solidity: "solidity",
    Zig: "zig",
};

const escapePipes = (text: string) => text.replace(/\|/g, "\\|");

// One line, trimmed to fit a table cell without wrapping the row.
const shorten = (text: string, max = 92) =>
    text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

export function generateMarkdown(
    input: MarkdownInput,
    options: MarkdownOptions = defaultMarkdownOptions
): string {
    const {
        name,
        githubUsername,
        bio,
        twitterUsername,
        linkedinUsername,
        portfolioUrl,
        stats,
        streak,
        repos,
    } = input;

    const blocks: string[] = [];

    if (bio) blocks.push(bio);

    blocks.push(`# ${name || githubUsername}`);

    if (options.projects && repos.length > 0) {
        const top = repos
            .filter((repo) => !repo.archived)
            .slice(0, Math.max(1, options.projectLimit));

        if (top.length > 0) {
            const rows = top.map((repo) => {
                const stars = repo.stars > 0 ? `${repo.stars.toLocaleString("en-US")} ★` : "—";
                const about = repo.description
                    ? escapePipes(shorten(repo.description))
                    : "—";
                return `| [${repo.name}](${repo.url}) | ${stars} | ${about} |`;
            });

            blocks.push(
                ["| Project | Stars | What it is |", "| --- | --- | --- |", ...rows].join("\n")
            );
        }
    }

    if (options.stats && stats) {
        // Plain text, not a card image: it stays readable in a diff, in a screen
        // reader, and to anything parsing the repo.
        const figures = [
            ["Commits", stats.Commits],
            ["Pull requests", stats["Pull Requests"]],
            ["Stars earned", stats["Star Earned"]],
            ["Followers", stats.Followers],
            ["Contributed to", stats["Contributed To"]],
        ]
            .filter(([, value]) => typeof value === "number")
            .map(([label, value]) => `**${(value as number).toLocaleString("en-US")}** ${label}`);

        if (streak?.currentStreak) {
            figures.push(`**${streak.currentStreak}d** current streak`);
        }

        if (figures.length > 0) {
            blocks.push(figures.join(" · "));
        }
    }

    if (options.stack) {
        // Derived from the languages of their own repositories, most used first,
        // so the row is evidence rather than a wish list.
        const counts = new Map<string, number>();
        for (const repo of repos) {
            const languages = repo.languages?.length ? repo.languages : [repo.language];
            for (const language of languages) {
                const slug = SKILL_ICONS[language];
                if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
            }
        }

        const icons = [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([slug]) => slug);

        if (icons.length > 0) {
            blocks.push(
                `[![My skills](https://skillicons.dev/icons?i=${icons.join(",")})](https://skillicons.dev)`
            );
        }
    }

    if (options.connect) {
        const links = [
            githubUsername && `[GitHub](https://github.com/${githubUsername})`,
            twitterUsername && `[X](https://x.com/${twitterUsername})`,
            linkedinUsername && `[LinkedIn](https://linkedin.com/in/${linkedinUsername})`,
            portfolioUrl &&
                `[Website](${portfolioUrl.startsWith("http") ? portfolioUrl : `https://${portfolioUrl}`})`,
        ].filter(Boolean);

        if (links.length > 0) blocks.push(links.join(" · "));
    }

    return `${blocks.join("\n\n")}\n`;
}
