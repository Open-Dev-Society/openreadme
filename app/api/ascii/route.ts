import { NextRequest, NextResponse } from "next/server";
import { asciiPortrait, defaultAsciiOptions, type RampName } from "@/utils/ascii-portrait";

const RAMPS: RampName[] = ["compact", "blocks", "dense"];

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url")?.trim();

    if (!url) {
        return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // This endpoint fetches a URL the caller chose, so it only ever speaks HTTPS
    // to a public host — no http://, no bare hostnames, nothing on the loopback
    // or a private range that could reach something inside the network.
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return NextResponse.json({ error: "url is not valid" }, { status: 400 });
    }

    const host = parsed.hostname;
    const isPrivate =
        !host.includes(".") ||
        host === "localhost" ||
        /^(10|127|0)\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^169\.254\./.test(host) ||
        host.endsWith(".internal") ||
        host.endsWith(".local");

    if (parsed.protocol !== "https:" || isPrivate) {
        return NextResponse.json(
            { error: "url must be https and publicly routable" },
            { status: 400 }
        );
    }

    const rampParam = req.nextUrl.searchParams.get("ramp") as RampName | null;

    try {
        const ascii = await asciiPortrait(parsed.toString(), {
            width: Number(req.nextUrl.searchParams.get("width")) || defaultAsciiOptions.width,
            contrast:
                Number(req.nextUrl.searchParams.get("contrast")) || defaultAsciiOptions.contrast,
            ramp: rampParam && RAMPS.includes(rampParam) ? rampParam : defaultAsciiOptions.ramp,
            vignette: req.nextUrl.searchParams.get("vignette") !== "false",
        });

        return NextResponse.json({ ascii }, { status: 200 });
    } catch (error) {
        console.error("Error in GET /api/ascii:", error);
        return NextResponse.json({ error: "Could not read that image" }, { status: 502 });
    }
}
