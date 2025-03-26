export interface IconSizes {
    small: string;
    medium: string;
    large: string;
}

export type IconSize = keyof IconSizes;

export type CreateIconContainer = (size: IconSize, marginRight?: string, scale?: number) => string;

export interface NavButton {
    text: string;
    page: string;
}

// Base interfaces for different content types
export interface RuneData {
    name: string;
    wordsOfPower: string;
    description: string[];
    upgrades: string[];
    scale?: number;
}

export interface RelicData {
    name: string;
    icon: string;
    charges: string;
    cooldown: string;
    description: string[];
    scale?: number;
}

export interface TabletData {
    location: string;
    text: string;
    translation: string;
    notes: string;
}

export interface HazardData {
    name: string;
    icon: string;
    secondaryIcon?: string;
    location: string;
    description: string[];
    scale?: number;
}

// Content data types
export interface RunesContent {
    circles: { name: string; runes: RuneData[] }[];
}

export interface RelicsContent {
    relics: RelicData[];
}

export interface EncounterData {
    name: string;
    icon: string;
    location: string;
    description: string[];
    scale?: number;
}

export interface HazardsContent {
    hazards: HazardData[];
}

export interface EncountersContent {
    encounters: EncounterData[];
}

export interface TabletsContent {
    tablets: TabletData[];
}

export interface LootItemData {
    name: string;
    icon: string[];
    sources: string;
    description: string[];
}

export interface LootContent {
    loot: LootItemData[];
}

export interface GeneralItemData {
    name: string;
    location: string;
    description: string[];
}

export interface GeneralContent {
    [category: string]: GeneralItemData[];
}

// Empty content type for pages without data
export type EmptyContent = Record<string, never>;

// Content creator types for each specific content type
export type ContentCreator<T = any> = (data: T, createIconContainer: CreateIconContainer) => string | Promise<string>;

// Content creators mapping with specific types
export interface ContentCreators {
    [key: string]: ContentCreator;
}
