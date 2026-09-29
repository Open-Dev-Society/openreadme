import { formatCount, type ThemeCardProps } from "./types";

// neofetch, the screenful every Linux user has posted at least once: an ASCII
// portrait on the left, a dotted-leader table on the right. The leaders are real
// characters rather than a CSS border, because in a monospace column that is what
// makes the values line up exactly.
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const LABEL = "#e8a33d";
const SECTION = "#4ade80";
const VALUE = "#e4e4e7";
const DIM = "#4b5563";

const LEADER_WIDTH = 46;

const Row = ({ label, value }: { label: string; value: string }) => {
    const dots = Math.max(2, LEADER_WIDTH - label.length - value.length);
    return (
        <div style={{ whiteSpace: "pre" }}>
            <span style={{ color: DIM }}>. </span>
            <span style={{ color: LABEL }}>{label}:</span>
            <span style={{ color: DIM }}> {".".repeat(dots)} </span>
            <span style={{ color: VALUE }}>{value}</span>
        </div>
    );
};

const Section = ({ title }: { title: string }) => (
    <div style={{ whiteSpace: "pre", marginTop: "18px", marginBottom: "6px" }}>
        <span style={{ color: DIM }}>- </span>
        <span style={{ color: SECTION }}>{title} </span>
        <span style={{ color: DIM }}>
            {"─".repeat(Math.max(4, LEADER_WIDTH - title.length + 4))}
        </span>
    </div>
);

export default function NeofetchCard({
    name,
    githubURL,
    twitterURL,
    linkedinURL,
    portfolioUrl,
    stats,
    streak,
    ascii,
}: ThemeCardProps) {
    const contact: [string, string][] = [
        twitterURL ? ["X", `@${twitterURL}`] : null,
        linkedinURL ? ["LinkedIn", linkedinURL] : null,
        portfolioUrl ? ["Website", portfolioUrl.replace(/^https?:\/\//, "")] : null,
    ].filter(Boolean) as [string, string][];

    return (
        <div
            style={{
                backgroundColor: "#0d1117",
                fontFamily: MONO,
                padding: "40px 44px",
                display: "flex",
                gap: "44px",
                alignItems: "flex-start",
                fontSize: "13px",
                lineHeight: 1.45,
            }}
        >
            {ascii ? (
                <pre
                    style={{
                        margin: 0,
                        color: "#8b949e",
                        fontSize: "11px",
                        lineHeight: 1.05,
                        letterSpacing: "0.5px",
                        whiteSpace: "pre",
                        flexShrink: 0,
                    }}
                >
                    {ascii}
                </pre>
            ) : (
                <pre style={{ margin: 0, color: DIM, fontSize: "11px", flexShrink: 0 }}>
                    {"  ┌──────────────┐\n  │              │\n  │   no image   │\n  │              │\n  └──────────────┘"}
                </pre>
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ whiteSpace: "pre", marginBottom: "10px" }}>
                    <span style={{ color: SECTION }}>
                        {githubURL || "you"}
                        <span style={{ color: DIM }}>@</span>
                        github
                    </span>
                    <span style={{ color: DIM }}> {"─".repeat(38)}</span>
                </div>

                <Row label="Name" value={name || githubURL || "—"} />
                <Row label="Handle" value={githubURL ? `@${githubURL}` : "—"} />
                <Row label="Repos" value={formatCount(stats?.Repositories)} />
                <Row label="Orgs" value={formatCount(stats?.Organizations)} />

                {contact.length > 0 && (
                    <>
                        <Section title="Contact" />
                        {contact.map(([label, value]) => (
                            <Row key={label} label={label} value={value} />
                        ))}
                    </>
                )}

                <Section title="GitHub Stats" />
                <Row label="Commits" value={formatCount(stats?.Commits)} />
                <Row label="Pull Requests" value={formatCount(stats?.["Pull Requests"])} />
                <Row label="Issues" value={formatCount(stats?.Issues)} />
                <Row label="Stars Earned" value={formatCount(stats?.["Star Earned"])} />
                <Row label="Followers" value={formatCount(stats?.Followers)} />
                <Row label="Contributed To" value={formatCount(stats?.["Contributed To"])} />
                <Row
                    label="Current Streak"
                    value={streak?.currentStreak ? `${streak.currentStreak} days` : "—"}
                />
                <Row
                    label="Longest Streak"
                    value={streak?.longestStreak ? `${streak.longestStreak} days` : "—"}
                />

                {/* The colour bar every neofetch ends with. */}
                <div style={{ display: "flex", gap: "3px", marginTop: "20px" }}>
                    {["#0d1117", "#f85149", "#4ade80", "#e8a33d", "#58a6ff", "#bc8cff", "#39c5cf", "#e4e4e7"].map(
                        (color) => (
                            <span
                                key={color}
                                style={{
                                    width: "26px",
                                    height: "12px",
                                    backgroundColor: color,
                                    border: color === "#0d1117" ? "1px solid #21262d" : "none",
                                    display: "inline-block",
                                }}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
