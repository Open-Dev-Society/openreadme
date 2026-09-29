import { formatCount, profileLinks, type ThemeCardProps } from "./types";

// The quiet one. A name, one line of numbers, one line of links, and air.
// Nothing here competes with the repositories pinned underneath it.
export default function MinimalCard({
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

    const figures = [
        [formatCount(stats?.Commits), "commits"],
        [formatCount(stats?.["Pull Requests"]), "pull requests"],
        [formatCount(stats?.["Star Earned"]), "stars"],
        [formatCount(stats?.Followers), "followers"],
        streak?.currentStreak ? [`${streak.currentStreak}`, "day streak"] : null,
    ].filter(Boolean) as [string, string][];

    return (
        <div
            style={{
                backgroundColor: "#fafaf9",
                padding: "64px 64px 56px",
                color: "#18181b",
            }}
        >
            <div className="flex items-center gap-6">
                {imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt=""
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "50%",
                            objectFit: "cover",
                        }}
                    />
                )}
                <h1
                    style={{
                        fontSize: "44px",
                        fontWeight: 500,
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                    }}
                >
                    {name || githubURL || "Your Name"}
                </h1>
            </div>

            {/* One line, spaced like a caption rather than stacked like a dashboard. */}
            <div
                className="flex flex-wrap items-baseline gap-x-8 gap-y-2"
                style={{ marginTop: "40px" }}
            >
                {figures.map(([value, label]) => (
                    <span key={label} style={{ fontSize: "15px" }}>
                        <strong style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                            {value}
                        </strong>
                        <span style={{ color: "#71717a" }}> {label}</span>
                    </span>
                ))}
            </div>

            {links.length > 0 && (
                <div
                    style={{
                        marginTop: "36px",
                        paddingTop: "20px",
                        borderTop: "1px solid #e4e4e7",
                        color: "#71717a",
                        fontSize: "13px",
                    }}
                >
                    {links.join("   ·   ")}
                </div>
            )}
        </div>
    );
}
