import type { ComponentType } from "react";
import EditorialCard from "@/components/theme/EditorialCard";
import MinimalCard from "@/components/theme/MinimalCard";
import PosterCard from "@/components/theme/PosterCard";
import TerminalCard from "@/components/theme/TerminalCard";
import type { ThemeCardProps } from "@/components/theme/types";

// Themes the screenshot route can render on its own, because they are pure
// markup. Adding a card here is all it takes for the generated image to follow
// the picker — no second copy of the design in the route.
export const staticThemes: Record<string, ComponentType<ThemeCardProps>> = {
    editorial: EditorialCard,
    terminal: TerminalCard,
    minimal: MinimalCard,
    poster: PosterCard,
};

// Each theme's page background, so the screenshot has no white gutter.
export const themeBackgrounds: Record<string, string> = {
    editorial: "#0b0b0d",
    terminal: "#08080a",
    minimal: "#fafaf9",
    poster: "#0a0a0a",
};
