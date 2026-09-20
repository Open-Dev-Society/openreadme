import type { StreakStats, UserStats } from "@/types";

// Every card takes exactly this and renders markup — no hooks, no next/image, no
// icon library — because the screenshot route renders these same components to
// static markup outside the browser.
export interface ThemeCardProps {
    name: string;
    githubURL: string;
    twitterURL: string;
    linkedinURL: string;
    imageUrl: string;
    portfolioUrl: string;
    stats: UserStats | undefined;
    streak: StreakStats | undefined;
    /** Pre-rendered ASCII portrait; only the neofetch card uses it. */
    ascii?: string;
}

export const formatCount = (value: number | undefined) =>
    typeof value === "number" ? value.toLocaleString("en-US") : "—";

// The handles worth printing, in the order people read them.
export const profileLinks = ({
    githubURL,
    twitterURL,
    linkedinURL,
    portfolioUrl,
}: Pick<ThemeCardProps, "githubURL" | "twitterURL" | "linkedinURL" | "portfolioUrl">) =>
    [
        githubURL && `github.com/${githubURL}`,
        twitterURL && `x.com/${twitterURL}`,
        linkedinURL && `in/${linkedinURL}`,
        portfolioUrl && portfolioUrl.replace(/^https?:\/\//, ""),
    ].filter(Boolean) as string[];
