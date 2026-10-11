import { formatCount, profileLinks, type ThemeCardProps } from "./types";

// The loud one: the photo is the card, the name sits on top of it, and the
// numbers run along the bottom as a strip. Built for the card people screenshot.
const ACCENT = "#e6ff4f";

export default function PosterCard({
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

    const figures: [string, string][] = [
        [formatCount(stats?.Commits), "COMMITS"],
        [formatCount(stats?.["Pull Requests"]), "PRS"],
        [formatCount(stats?.["Star Earned"]), "STARS"],
        [formatCount(stats?.Followers), "FOLLOWERS"],
        [streak?.currentStreak ? `${streak.currentStreak}` : "—", "STREAK"],
    ];

    return (
        <div style={{ backgroundColor: "#0a0a0a", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative", height: "420px" }}>
                {imageUrl ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt=""
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center 28%",
                                filter: "grayscale(100%) contrast(1.15) brightness(0.62)",
                            }}
                        />
                        {/* A wash rather than a scrim: the type stays readable without
                            flattening the photo into a grey rectangle. */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background:
                                    "linear-gradient(180deg, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.35) 45%, rgba(10,10,10,0.95) 100%)",
                            }}
                        />
                    </>
                ) : (
                    <div style={{ position: "absolute", inset: 0, backgroundColor: "#141414" }} />
                )}

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        padding: "48px 56px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                    }}
                >
                    <div
                        style={{
                            color: ACCENT,
                            fontSize: "11px",
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                        }}
                    >
                        {githubURL ? `@${githubURL}` : "github"}
                    </div>

                    <h1
                        style={{
                            color: "#ffffff",
                            fontSize: "104px",
                            lineHeight: 0.86,
                            fontWeight: 700,
                            letterSpacing: "-0.055em",
                            textTransform: "uppercase",
                            maxWidth: "80%",
                            wordBreak: "break-word",
                        }}
                    >
                        {name || githubURL || "Your Name"}
                    </h1>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: "32px",
                    padding: "26px 56px 34px",
                    borderTop: `2px solid ${ACCENT}`,
                }}
            >
                <div style={{ display: "flex", gap: "44px" }}>
                    {figures.map(([value, label]) => (
                        <div key={label}>
                            <div
                                style={{
                                    color: "#ffffff",
                                    fontSize: "30px",
                                    fontWeight: 600,
                                    lineHeight: 1,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {value}
                            </div>
                            <div
                                style={{
                                    color: "#7c7c85",
                                    fontSize: "10px",
                                    letterSpacing: "0.18em",
                                    marginTop: "8px",
                                }}
                            >
                                {label}
                            </div>
                        </div>
                    ))}
                </div>

                {links.length > 0 && (
                    <div style={{ color: "#7c7c85", fontSize: "12px", textAlign: "right" }}>
                        {links.slice(0, 2).join("  ·  ")}
                    </div>
                )}
            </div>
        </div>
    );
}
