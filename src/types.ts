interface Location {
    id: number | string;
    title: string;
    description: string;
    coordinates: [number, number] | Array<[number, number]>;  // Single coordinate pair or array of coordinate pairs
    codex_upgrade?: string;
    words?: string;
    icon?: string;  // Path relative to root, e.g. "icons/Stairs.png" or "images/bleeding-sands.png"
    scale?: number; // Optional scale percentage for the icon, defaults to 100
    container?: string[]; // Array of containers matching coordinates array
    requirements?: string; // Optional requirements for accessing this location
}

interface IconConfig {
    path: string;
    scale: number;  // Allow any number for scale
}

// Remove the 'as const' assertion to allow scale overrides

// Available icons with their configurations
const AVAILABLE_ICONS = {
    // Default icons
    STAIRS: { path: "icons/Stairs.png", scale: 250 },
    SKULL: { path: "icons/skull2.png", scale: 100 },
    STAR: { path: "icons/star.png", scale: 100 },
    GATE_RED: { path: "icons/Gates_Red.png", scale: 100 },
    GATE_YELLOW: { path: "icons/Gates_Yellow.png", scale: 150 },
    GATE_SILVER: { path: "icons/Gates_Silver.png", scale: 150 },
    TELEPORT_REL_POR: { path: "icons/rel-por.png", scale: 200 },
    WAYSTAR: { path: "icons/waystar.png", scale: 150 },
    LADDERS: { path: "icons/ladder.png", scale: 300 },
    TELEPORT_TILE: { path: "icons/teleport-rune.png", scale: 125 },
    GEM_VENDOR: { path: "icons/treasure.png", scale: 125},
    CAVE: { path: "icons/cave.png", scale: 150},
    FLAG: { path: "icons/flag.png", scale: 150},
    BOX: { path: "icons/wooden-box.png", scale: 150},
    HIDDEN_PASSAGE: { path: "icons/hidden_passage.png", scale: 125},
    TRAP: { path: "icons/trap.png", scale: 150},
    GRAY_CHEST: { path: "icons/gray_chest.png", scale: 125},
    TREASURE_CHEST: { path: "icons/treasure_chest.png", scale: 135},
    VOIDBALL: { path: "icons/voidball.png", scale: 125},
    PORTAL: { path: "icons/portal.png", scale: 150},
    SECRET_DOOR: { path: "icons/secret-door.png", scale: 150},
    WATER: { path: "icons/water.png", scale: 150},
    DRAGON: { path: "icons/dragon.png", scale: 200},
    BOSS: { path: "icons/boss.png", scale: 150},
    SHACKLES: { path: "icons/shackles.png", scale: 200},
    EXCLAMATION_MARK: { path: "icons/exclamation-mark.png", scale: 200},
    WALL: { path: "icons/brick-wall.png", scale: 150},
    ANKH: { path: "icons/ankh.png", scale: 200},
    LEVER: { path: "icons/lever.png", scale: 150},
    REVEALER: { path: "icons/eye.png", scale: 125},
    BARRIER: { path: "icons/barrier.png", scale: 150},
    CRYSTAL: { path: "icons/crystal.png", scale: 125},
    AMBUSH: { path: "icons/swords.png", scale: 150},
    BRIDGE: { path: "icons/bridge.png", scale: 250},
    RED_DOORS: { path: "icons/red-doors.png", scale: 175},
    BOOKS: { path: "icons/book.png", scale: 175},
    COMPASS: { path: "icons/compass.png", scale: 150},
    PILGRIM: { path: "icons/pilgrim.png", scale: 150},
    // Time runes
    RUNE_KNOCK: { path: "icons/runes/timerune-knock.png", scale: 100 },
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
    // Images
    BLEEDING_SANDS: { path: "images/bleeding-sands.png", scale: 300 },
    // Bosses
    POISON_FINGER: { path: "icons/bosses/poison-finger.png", scale: 200},
    EXOTHRUGG: { path: "images/exothrugg.png", scale: 300 },
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

interface RoutePoint {
    coordinates: [number, number];
    description?: string;  // Description for this marked point
    pathPoints?: [number, number][];  // Optional array of coordinates for the path to the next marked point
    locationId?: string | number;  // Reference to an existing location's ID
    gap?: boolean;  // If true, don't draw a line to the next point
}

interface RouteSegment {
    level: string;  // Which floor/level this segment is on
    points: RoutePoint[];  // Array of marked points with optional path points between them
}

interface Route {
    id: string;
    title: string;
    description: string;
    segments: RouteSegment[];  // Array of floor-specific segments
    color?: string;  // Optional color for the route line, defaults to a standard color if not specified
    dashArray?: string;  // Optional dash pattern for the line
    straightLines?: boolean;  // If true, don't apply curve interpolation to the route lines
}

interface RoutesData {
    [category: string]: Route[];  // Routes grouped by category (e.g., "farming", "quests", etc.)
}

export type { Location, CategoryData, LevelData, LocationsData, Route, RoutePoint, RoutesData };
export { AVAILABLE_ICONS };
