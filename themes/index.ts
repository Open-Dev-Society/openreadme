import type { ComponentType } from 'react';
import OpenReadmeGrid from '@/components/theme/BentoClassic';
import EditorialCard from '@/components/theme/EditorialCard';
import TerminalCard from '@/components/theme/TerminalCard';
import NeofetchCard from '@/components/theme/NeofetchCard';
import MinimalCard from '@/components/theme/MinimalCard';
import PosterCard from '@/components/theme/PosterCard';
import type { UserStats, StreakStats, Graph } from '@/types';

export type ThemeComponentProps = {
  name: string;
  githubURL: string;
  twitterURL: string;
  linkedinURL: string;
  imageUrl: string;
  stats: UserStats | undefined;
  streak: StreakStats | undefined;
  graph: Graph[] | undefined;
  portfolioUrl: string;
  theme: string; // Add the theme prop to match OpenReadmeGridProps
  ascii?: string;
};

export type ThemeId = 'bento1' | 'editorial' | 'terminal' | 'neofetch' | 'minimal' | 'poster';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description?: string;
  preview?: string; // url to an image
}

export interface ThemeRegistryItem {
  id: ThemeId;
  component: ComponentType<ThemeComponentProps>;
  meta: ThemeMeta;
}

const registry: ThemeRegistryItem[] = [
  {
    id: 'bento1',
    component: OpenReadmeGrid,
    meta: {
      id: 'bento1',
      name: 'Bento Classic',
      description: 'Original OpenReadme bento grid',
      preview: '/home.png',
    },
  },
  {
    id: 'editorial',
    component: EditorialCard as unknown as ComponentType<ThemeComponentProps>,
    meta: {
      id: 'editorial',
      name: 'Editorial',
      description: 'Print logic: oversized name, ruled stat table, one accent',
    },
  },
  {
    id: 'terminal',
    component: TerminalCard as unknown as ComponentType<ThemeComponentProps>,
    meta: {
      id: 'terminal',
      name: 'Terminal',
      description: 'A shell session: monospace, prompts, amber values',
    },
  },
  {
    id: 'neofetch',
    component: NeofetchCard as unknown as ComponentType<ThemeComponentProps>,
    meta: {
      id: 'neofetch',
      name: 'Neofetch',
      description: 'ASCII portrait of your avatar beside a dotted-leader stat table',
    },
  },
  {
    id: 'minimal',
    component: MinimalCard as unknown as ComponentType<ThemeComponentProps>,
    meta: {
      id: 'minimal',
      name: 'Minimal',
      description: 'Light, quiet, one line of numbers and nothing else',
    },
  },
  {
    id: 'poster',
    component: PosterCard as unknown as ComponentType<ThemeComponentProps>,
    meta: {
      id: 'poster',
      name: 'Poster',
      description: 'Full-bleed photo, oversized name, stat strip',
    },
  },
];

export const themes = registry;

export const getThemeComponent = (id: ThemeId): ComponentType<ThemeComponentProps> => {
  const found = registry.find((t) => t.id === id);
  return (found?.component ?? OpenReadmeGrid) as ComponentType<ThemeComponentProps>;
};

export const getThemeOptions = () => registry.map((t) => t.meta);
