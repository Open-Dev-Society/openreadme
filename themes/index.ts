import type { ComponentType } from 'react';
import OpenReadmeGrid from '@/components/theme/BentoClassic';
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
};

export type ThemeId = 'bento1';

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
];

export const themes = registry;

export const getThemeComponent = (id: ThemeId): ComponentType<ThemeComponentProps> => {
  const found = registry.find((t) => t.id === id);
  return (found?.component ?? OpenReadmeGrid) as ComponentType<ThemeComponentProps>;
};

export const getThemeOptions = () => registry.map((t) => t.meta);
