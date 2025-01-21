interface Location {
    id: number | string;
    title: string;
    description: string;
    coordinates: [number, number] | Array<[number, number]>;  // Single coordinate pair or array of coordinate pairs
    codex_upgrade?: string;
    words?: string;
    icon?: string;  // Path to icon relative to src/, e.g. "icons/Stairs.png"
    scale?: number; // Optional scale percentage for the icon, defaults to 100
    container?: string; // Optional container type where the item is found
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
    RUNE_KNOCK: { path: "icons/timerune-knock.png", scale: 100 },
    RUNE_MEND: { path: "icons/timerune-mendtime.png", scale: 100 },
    RUNE_IRONFLESH: { path: "icons/timerune-ironflesh.png", scale: 100 },
    RUNE_REPEL: { path: "icons/timerune-repel.png", scale: 100 },
    RUNE_ANIMATEDWEAPON: { path: "icons/timerune-animatedweapon.png", scale: 100 },
    RUNE_AWAKENEARTH: { path: "icons/timerune-awakenearth.png", scale: 100 },
    RUNE_BLOOMTIME: { path: "icons/timerune-bloomtime.png", scale: 100 },
    RUNE_CIRCLEOFPOWER: { path: "icons/timerune-circleofpower.png", scale: 100 },
    RUNE_CONJUREPOTION: { path: "icons/timerune-conjurepotion.png", scale: 100 },
    RUNE_FORTIFYRATIONS: { path: "icons/timerune-fortifyrations.png", scale: 100 },
    RUNE_MAGICWARD: { path: "icons/timerune-magicward.png", scale: 100 },
    RUNE_MASSINVISIBILITY: { path: "icons/timerune-massinvisibility.png", scale: 100 },
    RUNE_MASSSLEEP: { path: "icons/timerune-masssleep.png", scale: 100 },
    RUNE_METEORSHOWER: { path: "icons/timerune-meteorshower.png", scale: 100 },
    RUNE_NEGATETIME: { path: "icons/timerune-negatetime.png", scale: 100 },
    RUNE_REFRESH: { path: "icons/timerune-refresh.png", scale: 100 },
    RUNE_SILVERSAPLING: { path: "icons/timerune-silversapling.png", scale: 100 },
    RUNE_TIMELYWEALTH: { path: "icons/timerune-timelywealth.png", scale: 100 },
    RUNE_TREMOR: { path: "icons/timerune-tremor.png", scale: 100 },
    RUNE_WILDCREATURES: { path: "icons/timerune-wildcreatures.png", scale: 100 },
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
    }
}

export type { Location, CategoryData, LevelData, LocationsData };
export { AVAILABLE_ICONS };
