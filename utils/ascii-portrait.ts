import sharp from "sharp";

// Server only: sharp does the decoding, so this never runs in the browser.
// A portrait becomes a grid of characters chosen by brightness — the trick is
// the aspect correction, since a monospace cell is about twice as tall as wide.

// A short ramp reads as a portrait; a long one reads as noise, because every
// step of brightness becomes a different glyph and the face dissolves into it.
const RAMPS = {
    compact: " .:-=+*#%@",
    blocks: " ░▒▓█",
    dense: " .,:ilwW#@",
} as const;

export type RampName = keyof typeof RAMPS;

export interface AsciiOptions {
    width: number;
    contrast: number;
    ramp: RampName;
    /** Fades the corners so a busy background stops competing with the face. */
    vignette: boolean;
}

export const defaultAsciiOptions: AsciiOptions = {
    width: 46,
    contrast: 1.5,
    ramp: "compact",
    vignette: true,
};

export async function asciiPortrait(
    imageUrl: string,
    options: AsciiOptions = defaultAsciiOptions
): Promise<string> {
    const response = await fetch(imageUrl, {
        headers: { "User-Agent": "OpenReadme" },
        next: { revalidate: 86400 },
    });

    if (!response.ok) {
        throw new Error(`Image fetch failed: ${response.status}`);
    }

    const source = Buffer.from(await response.arrayBuffer());
    const meta = await sharp(source).metadata();
    const ratio = (meta.height ?? 1) / (meta.width ?? 1);

    const width = Math.max(16, Math.min(120, Math.round(options.width)));
    // 0.5 because a character cell is roughly twice as tall as it is wide.
    const height = Math.max(8, Math.round(width * ratio * 0.5));

    const contrast = options.contrast;
    const { data } = await sharp(source)
        .greyscale()
        // A slight blur first: without it, single noisy pixels survive the
        // downsample and speckle the face with stray glyphs.
        .blur(0.6)
        .normalise()
        .linear(contrast, -(128 * contrast) + 128)
        .resize(width, height, { fit: "fill" })
        .raw()
        .toBuffer({ resolveWithObject: true });

    const ramp = RAMPS[options.ramp] ?? RAMPS.compact;

    const rows: string[] = [];
    for (let y = 0; y < height; y++) {
        let row = "";
        for (let x = 0; x < width; x++) {
            let luminance = data[y * width + x] / 255;

            if (options.vignette) {
                // Distance from centre, normalised, then eased so the middle is
                // untouched and only the outer third falls away.
                const dx = (x / (width - 1) - 0.5) * 2;
                const dy = (y / (height - 1) - 0.5) * 2;
                const distance = Math.min(1, Math.hypot(dx, dy) / 1.25);
                luminance *= 1 - Math.pow(distance, 2.6);
            }

            const index = Math.round(Math.max(0, Math.min(1, luminance)) * (ramp.length - 1));
            row += ramp[index];
        }
        // Trailing blanks would widen the card for nothing.
        rows.push(row.replace(/\s+$/, ""));
    }

    return rows.join("\n");
}
