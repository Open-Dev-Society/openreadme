import type { StreakStats, UserStats } from "@/types";

export interface EditorialCardProps {
    name: string;
    githubURL: string;
    twitterURL: string;
    linkedinURL: string;
    imageUrl: string;
    portfolioUrl: string;
    stats: UserStats | undefined;
    streak: StreakStats | undefined;
}

// Print logic, not tile logic: one ground, one accent, rules instead of boxes,
// and the numbers set as a table so they can be read down the column.
// No hooks, no next/image, no icon library — the screenshot route renders this
// same component to static markup, so it must survive outside the browser.
const RULE = "#26262b";
const ACCENT = "#4ade80";
const MUTED = "#8b8b94";

const StatRow = ({ label, value }: { label: string; value: string }) => (
    <div
        className="flex items-baseline justify-between py-3"
        style={{ borderBottom: `1px solid ${RULE}` }}
    >
        <span
            className="text-[11px] uppercase"
            style={{ color: MUTED, letterSpacing: "0.14em" }}
        >
            {label}
        </span>
        <span
            className="text-2xl font-medium text-white"
            style={{ fontVariantNumeric: "tabular-nums" }}
        >
            {value}
        </span>
    </div>
);

export default function EditorialCard({
    name,
    githubURL,
    twitterURL,
    linkedinURL,
    imageUrl,
    portfolioUrl,
    stats,
    streak,
}: EditorialCardProps) {
    const num = (value: number | undefined) =>
        typeof value === "number" ? value.toLocaleString("en-US") : "—";

    // The handles a reader can actually follow, as one line of small caps.
    const links = [
        githubURL && `github.com/${githubURL}`,
        twitterURL && `x.com/${twitterURL}`,
        linkedinURL && `linkedin.com/in/${linkedinURL}`,
        portfolioUrl && portfolioUrl.replace(/^https?:\/\//, ""),
    ].filter(Boolean) as string[];

    return (
        <div
            className="w-full overflow-hidden"
            style={{ backgroundColor: "#0b0b0d", padding: "56px 56px 48px" }}
        >
            {/* Masthead: the name is the loudest thing on the card. */}
            <div
                className="flex items-start justify-between gap-10 pb-8"
                style={{ borderBottom: `1px solid ${RULE}` }}
            >
                <div className="min-w-0">
                    <div
                        className="text-[11px] uppercase mb-5"
                        style={{ color: ACCENT, letterSpacing: "0.2em" }}
                    >
                        GitHub Profile
                    </div>
                    <h1
                        className="text-white break-words"
                        style={{
                            fontSize: "76px",
                            lineHeight: 0.92,
                            fontWeight: 500,
                            letterSpacing: "-0.035em",
                        }}
                    >
                        {name || githubURL || "Your Name"}
                    </h1>
                    {links.length > 0 && (
                        <div
                            className="flex flex-wrap items-center mt-6 gap-x-4 gap-y-2 text-[12px]"
                            style={{ color: MUTED, letterSpacing: "0.04em" }}
                        >
                            {links.map((link, index) => (
                                <span key={link} className="flex items-center gap-4">
                                    {index > 0 && <span style={{ color: RULE }}>/</span>}
                                    {link}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt=""
                        width={132}
                        height={132}
                        className="flex-shrink-0 object-cover"
                        style={{
                            width: "132px",
                            height: "132px",
                            borderRadius: "2px",
                            filter: "grayscale(100%) contrast(1.05)",
                        }}
                    />
                )}
            </div>

            {/* The numbers, as a table rather than six coloured tiles. */}
            <div className="grid grid-cols-2 mt-10 gap-x-16">
                <div>
                    <StatRow label="Commits" value={num(stats?.Commits)} />
                    <StatRow label="Pull Requests" value={num(stats?.["Pull Requests"])} />
                    <StatRow label="Stars Earned" value={num(stats?.["Star Earned"])} />
                </div>
                <div>
                    <StatRow label="Followers" value={num(stats?.Followers)} />
                    <StatRow label="Contributed To" value={num(stats?.["Contributed To"])} />
                    <StatRow
                        label="Current Streak"
                        value={streak?.currentStreak ? `${streak.currentStreak}d` : "—"}
                    />
                </div>
            </div>

            {/* No contribution graph: on a profile README GitHub renders the real
                one directly below this image, and on a project README it is not
                the reader's question. */}

            <div
                className="flex items-center justify-between mt-12 pt-5 text-[10px] uppercase"
                style={{ borderTop: `1px solid ${RULE}`, color: MUTED, letterSpacing: "0.18em" }}
            >
                <span>openreadme</span>
                <span>Open Dev Society</span>
            </div>
        </div>
    );
}
