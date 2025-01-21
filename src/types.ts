interface Location {
    id: number | string;
    title: string;
    description: string;
    coordinates: [number, number] | Array<[number, number]>;  // Single coordinate pair or array of coordinate pairs
    codex_upgrade?: string;
    words?: string;
    icon?: string;  // Path to icon relative to src/, e.g. "icons/Stairs.png"
    scale?: number; // Optional scale percentage for the icon, defaults to 100
    container?: string[]; // Array of containers matching coordinates array
}

interface IconConfig {
    path: string;
    scale: number;  // Allow any number for scale
}

// Remove the 'as const' assertion to allow scale overrides

// Available icons with their configurations
const AVAILABLE_ICONS = {
    STAIRS: { path: "icons/Stairs.png", scale: 300 },
    SKULL: { path: "icons/skull2.png", scale: 100 },
    STAR: { path: "icons/star.png", scale: 100 },
    GATE_RED: { path: "icons/Gates_Red.png", scale: 100 },
    GATE_YELLOW: { path: "icons/Gates_Yellow.png", scale: 100 },
    // Time runes
    RUNE_KNOCK: { path: "icons/runes/timerune-knock.png", scale: 150 },
    RUNE_MEND: { path: "icons/runes/timerune-mendtime.png", scale: 100 },
    RUNE_IRONFLESH: { path: "icons/runes/timerune-ironflesh.png", scale: 100 },
    RUNE_REPEL: { path: "icons/runes/timerune-repel.png", scale: 100 },
    RUNE_ANIMATEDWEAPON: { path: "icons/runes/timerune-animatedweapon.png", scale: 100 },
    RUNE_AWAKENEARTH: { path: "icons/runes/timerune-awakenearth.png", scale: 100 },
    RUNE_BLOOMTIME: { path: "icons/runes/timerune-bloomtime.png", scale: 100 },
    RUNE_CIRCLEOFPOWER: { path: "icons/runes/timerune-circleofpower.png", scale: 100 },
    RUNE_CONJUREPOTION: { path: "icons/runes/timerune-conjurepotion.png", scale: 100 },
    RUNE_FORTIFYRATIONS: { path: "icons/runes/timerune-fortifyrations.png", scale: 100 },
    RUNE_MAGICWARD: { path: "icons/runes/timerune-magicward.png", scale: 100 },
    RUNE_MASSINVISIBILITY: { path: "icons/runes/timerune-massinvisibility.png", scale: 100 },
    RUNE_MASSSLEEP: { path: "icons/runes/timerune-masssleep.png", scale: 100 },
    RUNE_METEORSHOWER: { path: "icons/runes/timerune-meteorshower.png", scale: 100 },
    RUNE_NEGATETIME: { path: "icons/runes/timerune-negatetime.png", scale: 100 },
    RUNE_REFRESH: { path: "icons/runes/timerune-refresh.png", scale: 100 },
    RUNE_SILVERSAPLING: { path: "icons/runes/timerune-silversapling.png", scale: 100 },
    RUNE_TIMELYWEALTH: { path: "icons/runes/timerune-timelywealth.png", scale: 100 },
    RUNE_TREMOR: { path: "icons/runes/timerune-tremor.png", scale: 100 },
    RUNE_WILDCREATURES: { path: "icons/runes/timerune-wildcreatures.png", scale: 100 },
};

interface CategoryData {
    [subcategory: string]: Location[];
}

interface LevelData {
    Passage?: CategoryData;
    Runes?: CategoryData;
    [key: string]: CategoryData | undefined;
}

interface LocationsData {
    [level: string]: LevelData;
}

// Extend Leaflet's MarkerOptions to include our custom properties
declare module 'leaflet' {
    interface MarkerOptions {
        category?: string;
        location?: Location;
        containerIndex?: number; // Add index to track which container this marker represents
    }
}

export type { Location, CategoryData, LevelData, LocationsData };
export { AVAILABLE_ICONS };
