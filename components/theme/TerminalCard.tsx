import { formatCount, profileLinks, type ThemeCardProps } from "./types";

// A shell session, because that is where the reader already spends the day.
// Everything is monospace and left-aligned to one column; the only colour is the
// prompt and the values, so the eye lands on numbers rather than decoration.
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const GREEN = "#4ade80";
const DIM = "#6b7280";
const AMBER = "#fbbf24";

const Line = ({ command }: { command: string }) => (
    <div style={{ color: DIM, marginTop: "26px" }}>
        <span style={{ color: GREEN }}>❯</span> {command}
    </div>
);

export default function TerminalCard({
    name,
    githubURL,
    twitterURL,
    linkedinURL,
    imageUrl,
    portfolioUrl,
    stats,
    streak,
}: ThemeCardProps) {
    const links = profileLinks({ githubURL, twitterURL, linkedinURL, portfolioUrl });

    const pairs: [string, string][] = [
        ["commits", formatCount(stats?.Commits)],
        ["pull_requests", formatCount(stats?.["Pull Requests"])],
        ["stars_earned", formatCount(stats?.["Star Earned"])],
        ["followers", formatCount(stats?.Followers)],
        ["contributed_to", formatCount(stats?.["Contributed To"])],
        ["current_streak", streak?.currentStreak ? `${streak.currentStreak}d` : "—"],
    ];

    const pad = Math.max(...pairs.map(([key]) => key.length));

    return (
        <div style={{ backgroundColor: "#08080a", fontFamily: MONO }}>
            {/* Window chrome, the one piece of skeuomorphism that earns its place. */}
            <div
                className="flex items-center gap-2 px-5 py-3"
                style={{ borderBottom: "1px solid #1c1c21" }}
            >
                {["#ff5f57", "#febc2e", "#28c840"].map((color) => (
                    <span
                        key={color}
                        style={{
                            width: "11px",
                            height: "11px",
                            borderRadius: "50%",
                            backgroundColor: color,
                            display: "inline-block",
                        }}
                    />
                ))}
                <span className="ml-3 text-[12px]" style={{ color: DIM }}>
                    {githubURL ? `~/${githubURL}` : "~"} — zsh
                </span>
            </div>

            <div className="px-8 pt-6 pb-9 text-[15px]" style={{ lineHeight: 1.75 }}>
                <Line command="whoami" />
                <div className="flex items-center gap-4" style={{ marginTop: "8px" }}>
                    {imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={imageUrl}
                            alt=""
                            style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "3px",
                                border: `1px solid #1c1c21`,
                                objectFit: "cover",
                            }}
                        />
                    )}
                    <div>
                        <div style={{ color: "#f4f4f5", fontSize: "26px", fontWeight: 600 }}>
                            {name || githubURL || "your name"}
                        </div>
                        {links.length > 0 && (
                            <div style={{ color: DIM, fontSize: "13px", marginTop: "2px" }}>
                                {links.join("  ·  ")}
                            </div>
                        )}
                    </div>
                </div>

                <Line command="git log --author --stat" />
                <div style={{ marginTop: "8px" }}>
                    {pairs.map(([key, value]) => (
                        <div key={key} style={{ color: "#d4d4d8" }}>
                            <span style={{ color: DIM }}>
                                {key.padEnd(pad, " ").replace(/ /g, " ")}
                            </span>
                            <span style={{ color: DIM }}>{"  "}</span>
                            <span style={{ color: AMBER }}>{value}</span>
                        </div>
                    ))}
                </div>

                <Line command="" />
                <span
                    style={{
                        display: "inline-block",
                        width: "9px",
                        height: "17px",
                        backgroundColor: GREEN,
                        verticalAlign: "-3px",
                        marginLeft: "2px",
                    }}
                />
            </div>
        </div>
    );
}
