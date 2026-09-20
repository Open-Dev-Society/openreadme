"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { RepoSummary } from "@/app/api/repos/route";
import type { StreakStats, UserStats } from "@/types";
import {
    defaultMarkdownOptions,
    generateMarkdown,
    type MarkdownOptions,
} from "@/utils/generate-markdown";

const BLOCKS: { key: keyof Omit<MarkdownOptions, "projectLimit">; label: string }[] = [
    { key: "projects", label: "Projects" },
    { key: "stats", label: "Stats" },
    { key: "stack", label: "Stack" },
    { key: "connect", label: "Connect" },
];

// Markdown, not a picture of markdown: it stays clickable, themes with GitHub,
// and is readable by screen readers and by anything parsing the repo.
export default function MarkdownPanel({
    name,
    githubURL,
    twitterURL,
    linkedinURL,
    portfolioUrl,
    stats,
    streak,
}: {
    name: string;
    githubURL: string;
    twitterURL: string;
    linkedinURL: string;
    portfolioUrl: string;
    stats: UserStats | undefined;
    streak: StreakStats | undefined;
}) {
    const [repos, setRepos] = useState<RepoSummary[]>([]);
    const [source, setSource] = useState<string>("");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [options, setOptions] = useState<MarkdownOptions>(defaultMarkdownOptions);

    useEffect(() => {
        if (!githubURL) {
            setRepos([]);
            setBio("");
            return;
        }

        let cancelled = false;
        setLoading(true);

        Promise.all([
            fetch(`/api/repos?username=${githubURL}`).then((r) => r.json()),
            fetch(`/api/user-profile?username=${githubURL}`).then((r) => r.json()),
        ])
            .then(([repoData, profileData]) => {
                if (cancelled) return;
                setRepos(repoData.repos ?? []);
                setSource(repoData.source ?? "");
                setBio(profileData.bio ?? "");
            })
            .catch((error) => {
                console.error("Markdown source fetch failed:", error);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [githubURL]);

    const markdown = useMemo(
        () =>
            generateMarkdown(
                {
                    name,
                    githubUsername: githubURL,
                    bio,
                    twitterUsername: twitterURL,
                    linkedinUsername: linkedinURL,
                    portfolioUrl,
                    stats,
                    streak,
                    repos,
                },
                options
            ),
        [name, githubURL, bio, twitterURL, linkedinURL, portfolioUrl, stats, streak, repos, options]
    );

    const copy = async () => {
        await navigator.clipboard.writeText(markdown);
        setCopied(true);
        toast.success("Markdown copied — paste it into README.md");
        setTimeout(() => setCopied(false), 2000);
    };

    if (!githubURL) return null;

    return (
        <section className="w-full overflow-hidden border rounded-2xl border-white/10 bg-[#0b0b0d]">
            <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-white/10">
                <div>
                    <h3 className="text-base font-medium text-white">Markdown</h3>
                    <p className="mt-1 text-xs text-white/40">
                        {loading
                            ? "Reading your repositories…"
                            : source === "pinned"
                              ? `From your ${repos.length} pinned repositories, stars live`
                              : `From your ${repos.length} public repositories, stars live`}
                    </p>
                </div>

                <button
                    onClick={copy}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-black transition rounded-lg bg-emerald-400 hover:bg-emerald-300"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy markdown"}
                </button>
            </header>

            <div className="flex flex-wrap items-center gap-2 px-6 py-4 border-b border-white/10">
                {BLOCKS.map((block) => {
                    const on = options[block.key];
                    return (
                        <button
                            key={block.key}
                            onClick={() =>
                                setOptions((prev) => ({ ...prev, [block.key]: !prev[block.key] }))
                            }
                            aria-pressed={on}
                            className={`px-3 py-1.5 text-xs rounded-full border transition ${
                                on
                                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                                    : "border-white/10 text-white/40 hover:text-white/70"
                            }`}
                        >
                            {block.label}
                        </button>
                    );
                })}

                {options.projects && (
                    <label className="flex items-center gap-2 ml-auto text-xs text-white/40">
                        Projects shown
                        <input
                            type="range"
                            min={1}
                            max={Math.max(1, repos.length)}
                            value={Math.min(options.projectLimit, Math.max(1, repos.length))}
                            onChange={(e) =>
                                setOptions((prev) => ({
                                    ...prev,
                                    projectLimit: Number(e.target.value),
                                }))
                            }
                            className="w-28 accent-emerald-400"
                        />
                        <span className="w-4 text-white/70 tabular-nums">
                            {Math.min(options.projectLimit, Math.max(1, repos.length))}
                        </span>
                    </label>
                )}
            </div>

            <pre className="px-6 py-5 overflow-x-auto font-mono text-[13px] leading-relaxed text-white/80 whitespace-pre-wrap">
                {loading ? (
                    <span className="inline-flex items-center gap-2 text-white/40">
                        <Loader2 className="w-4 h-4 animate-spin" /> Building markdown…
                    </span>
                ) : (
                    markdown
                )}
            </pre>
        </section>
    );
}
