import L from 'leaflet';
import { Location, LocationsData, CategoryData, AVAILABLE_ICONS, Route, RoutesData } from './types.js';
import { TileService } from './services/tileService.js';
import { InfoMenu } from './components/InfoMenu.js';
import { LanguageInfoMenu } from './components/LanguageInfoMenu.js';

interface TileConfig {
    startDir: number;
    endDir: number;
    startTile: number;
    endTile: number;
}

interface TileSetConfig {
    startDir: number;
    endDir: number;
    startTile: number;
    endTile: number;
    offsetX?: number;
    ignore?: Array<{
        dir: number | number[];
        tile: number | number[];
    }>;
}

interface MarkerOptions extends L.MarkerOptions {
    location?: Location;
    category?: string;
    mainCategory?: string;
    containerIndex?: number;
}

export class MapManager {
    private map: L.Map | null = null;
    private markersLayer: L.LayerGroup | null = null;
    private routesLayer: L.LayerGroup | null = null;
    private currentLevel: string = "Level 1";
    private hiddenCategories: Set<string> = new Set();
    private mapLayers: { [key: string]: { layer: L.LayerGroup; bounds: L.LatLngBoundsExpression } } = {};
    private isLoadingMap: boolean = false;
    private tileService: TileService;
    private infoMenu: InfoMenu;
    private languageInfoMenu: LanguageInfoMenu;
    private routes: RoutesData = {};

    constructor(private locationsData: LocationsData) {
        this.tileService = new TileService();
        this.infoMenu = new InfoMenu();
        this.languageInfoMenu = new LanguageInfoMenu();
        this.loadRoutes();
    }

    private async loadRoutes(): Promise<void> {
        try {
            // Initialize empty routes object
            this.routes = {};
            
            // Define known route files (can be expanded later)
            const routeFiles = ['entrance-to-sewers.json', 'sewers-to-colony.json'];
            
            // Load each route file
            for (const file of routeFiles) {
                try {
                    const routeResponse = await fetch(`./json/routes/${file}`);
                    const routeData = await routeResponse.json();
                    
                    // Extract category from filename (e.g., "sewers-route.json" -> "Sewers Route")
                    const category = file.replace('.json', '')
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    
                    // Add route array to the appropriate category
                    if (!this.routes[category]) {
                        this.routes[category] = [];
                    }
                    this.routes[category] = routeData;
                    
                    // Add route category to hiddenCategories by default
                    this.hiddenCategories.add(category);
                } catch (error) {
                    console.error(`Failed to load route file ${file}:`, error);
                }
            }
        } catch (error) {
            console.error('Failed to load routes:', error);
            this.routes = {};
        }
    }

    private drawRoutes(): void {
        if (!this.routesLayer || !this.map) return;
        
        this.routesLayer.clearLayers();
        
        Object.entries(this.routes).forEach(([category, routes]) => {
            if (this.hiddenCategories.has(category)) return;
            
            routes.forEach(route => {
                // Find segments for current level
                const levelSegments = route.segments.filter(segment => segment.level === this.currentLevel);
                
                levelSegments.forEach(segment => {
                    // Split points into path segments based on gaps
                    const pathSegments: [number, number][][] = [[]];
                    let currentPathSegment = 0;

                    segment.points.forEach((point, index) => {
                        // Get coordinates for this point
                        let coords: [number, number];
                        if (point.locationId) {
                            const location = this.findLocationById(point.locationId);
                            if (location) {
                                coords = Array.isArray(location.coordinates[0]) 
                                    ? (location.coordinates as [number, number][])[0]
                                    : location.coordinates as [number, number];
                                
                                // Use location's description if point doesn't have one
                                if (!point.description) {
                                    point.description = location.description;
                                }
                            } else {
                                return; // Skip if location not found
                            }
                        } else {
                            coords = point.coordinates;
                        }
                        
                        // Add point to current path segment
                        pathSegments[currentPathSegment].push(coords);
                        
                        // Add path points if they exist
                        if (point.pathPoints) {
                            pathSegments[currentPathSegment].push(...point.pathPoints);
                        }
                        
                        // If this point has gap=true and it's not the last point,
                        // start a new path segment for the next points
                        if (point.gap && index < segment.points.length - 1) {
                            pathSegments.push([]);
                            currentPathSegment++;
                        }
                    });

                    // Create a polyline for each path segment
                    pathSegments.forEach(segmentPoints => {
                        if (segmentPoints.length > 0) {
                            // Create curved path using spline interpolation
                            const curvedPoints = this.createCurvedPath(segmentPoints);
                            
                            const routeLine = L.polyline(curvedPoints, {
                                color: route.color || '#3388ff',
                                weight: 3,
                                opacity: 0.8,
                                dashArray: route.dashArray,
                                smoothFactor: 1
                            });

                            // Add popup to the route line
                            const routeContent = document.createElement('div');
                            routeContent.className = 'route-popup';
                            routeContent.innerHTML = `
                                <h3>${route.title}</h3>
                                <p>${route.description}</p>
                            `;
                            routeLine.bindPopup(routeContent);
                            
                            this.routesLayer?.addLayer(routeLine);
                        }
                    });

                    // Create markers only for main points with descriptions
                    segment.points.forEach((point, index) => {
                        if (point.description) {
                            const marker = L.circleMarker(point.coordinates, {
                                radius: 5,
                                color: route.color || '#3388ff',
                                fillColor: '#fff',
                                fillOpacity: 1,
                                weight: 2
                            });
                            
                            const content = document.createElement('div');
                            content.className = 'route-point-popup';
                            content.innerHTML = `
                                <h4>${index === 0 ? 'Start' : index === segment.points.length - 1 ? 'End' : `Step ${index}`}</h4>
                                <p>${point.description}</p>
                            `;
                            
                            marker.bindPopup(content);
                            this.routesLayer?.addLayer(marker);
                        }
                    });
                });
            });
        });
    }

    private getMarkerSize(): number {
        if (!this.map) return 32;
        const zoom = this.map.getZoom();
        return Math.max(16, Math.min(128, 32 * Math.pow(2, zoom)));
    }

    private createMarkerIcon(mainCategory: string, subCategory: string, location?: Location, size: number = 32): L.DivIcon {
        const baseClass = 'marker-icon';
        const zoomClass = `zoom-level-${this.map?.getZoom() || 0}`;
        
        if (location?.icon) {
            const iconConfig = Object.values(AVAILABLE_ICONS).find(config => config.path === location.icon);
            let scale = iconConfig?.scale || 100;
            if (location.scale) {
                scale = location.scale;
            }
            
            const scaledSize = size * (scale / 100);
            // Add rune-icon class if it's a rune icon
            const isRune = location.icon?.includes('/runes/');
            const runeClass = isRune ? 'rune-icon' : '';
            // Add red glow for boss icons
            const isBoss = location.icon?.includes('/bosses/');
            const glow = isBoss ? 'filter: drop-shadow(0 0 2px red) drop-shadow(0 0 4px red) drop-shadow(0 0 6px red);' : '';
            
            return L.divIcon({
                className: `${baseClass} ${zoomClass} ${runeClass}`,
                html: `<div class="icon-wrapper" style="transform-origin: center;">
                         <img src="./${location.icon}" class="icon-image" style="width: 100%; height: 100%; image-rendering: -webkit-optimize-contrast; ${glow}">
                       </div>`,
                iconSize: [scaledSize, scaledSize],
                iconAnchor: [scaledSize/2, scaledSize/2]
            });
        }

        let iconConfig;
        const categoryKey = `${mainCategory}/${subCategory}`.toLowerCase();
        switch (categoryKey) {
            case 'passage/stairs':
                iconConfig = AVAILABLE_ICONS.STAIRS;
                break;
            case 'passage/portals':
                iconConfig = AVAILABLE_ICONS.GATE_YELLOW;
                break;
            default:
                const colors: { [key: string]: string } = {
                    "Passage": "#e74c3c",
                    "Runes": "#f1c40f",
                    "Misc": "#3498db",
                    "Routes": "#2ecc71"
                };
                const defaultScale = 100;
                const scaledSize = size * (defaultScale / 100);
                return L.divIcon({
                    className: `${baseClass} ${zoomClass}`,
                    html: `<div class="icon-wrapper" style="background-color: ${colors[mainCategory] || '#3498db'}; width: 100%; height: 100%;"></div>`,
                    iconSize: [scaledSize, scaledSize],
                    iconAnchor: [scaledSize/2, scaledSize/2]
                });
        }

        let scale = iconConfig.scale;
        if (location?.scale) {
            scale = location.scale;
        }
        
        const scaledSize = size * (scale / 100);
        return L.divIcon({
            className: `${baseClass} ${zoomClass}`,
            html: `<div class="icon-wrapper" style="transform-origin: center;">
                     <img src="./${iconConfig.path}" class="icon-image" style="width: 100%; height: 100%; image-rendering: -webkit-optimize-contrast;">
                   </div>`,
            iconSize: [scaledSize, scaledSize],
            iconAnchor: [scaledSize/2, scaledSize/2]
        });
    }

    private updateMarkers(): void {
        if (!this.markersLayer || !this.map) return;
        
        this.markersLayer.clearLayers();
        
        const levelData = this.locationsData[this.currentLevel];
        if (!levelData) return;
        
        const currentSize = this.getMarkerSize();
        
        // Handle all categories dynamically
        Object.entries(levelData).forEach(([mainCategory, categoryData]) => {
            if (!categoryData) return;
            Object.entries(categoryData as CategoryData).forEach(([subCategory, locations]: [string, Location[]]) => {
                const categoryName = subCategory.charAt(0).toUpperCase() + subCategory.slice(1);
                if (!this.hiddenCategories.has(categoryName)) {
                    locations.forEach(loc => {
                        const coordinates = Array.isArray(loc.coordinates[0]) 
                            ? loc.coordinates as [number, number][]
                            : [loc.coordinates as [number, number]];
                        
                        coordinates.forEach((coord, index) => {
                            const currentIcon = this.createMarkerIcon(mainCategory, categoryName, loc, currentSize);
                            const iconSize = currentIcon.options.iconSize || [currentSize, currentSize];
                            const marker = L.marker(coord, {
                                icon: currentIcon,
                                location: loc,
                                category: categoryName,
                                mainCategory: mainCategory,
                                containerIndex: index,
                                zIndexOffset: 1000,
                                // Center the marker on the coordinates
                                iconAnchor: [iconSize[0] / 2, iconSize[1] / 2]
                            } as MarkerOptions);
                            
                            marker.bindPopup(() => this.createPopupContent(loc, marker.options as MarkerOptions));
                            this.markersLayer?.addLayer(marker);
                        });
                    });
                }
            });
        });
    }

    private createPopupContent(location: Location, options?: MarkerOptions): HTMLElement {
        const content = document.createElement('div');
        content.className = 'popup-content';
        
        const title = document.createElement('h3');
        title.textContent = location.title;
        content.appendChild(title);
        
        if (location.container && Array.isArray(location.container)) {
            const containerIndex = options?.containerIndex ?? 0;
            if (location.container[containerIndex]) {
                const container = document.createElement('p');
                container.innerHTML = `<i>Found in: ${location.container[containerIndex]}</i>`;
                content.appendChild(container);
            }
        }

        if (location.words) {
            const words = document.createElement('p');
            words.innerHTML = `<i>${location.words}</i>`;
            content.appendChild(words);
        }
        
        const descriptionTitle = document.createElement('h4');
        descriptionTitle.textContent = 'Description';
        content.appendChild(descriptionTitle);

        const description = document.createElement('p');
        description.textContent = location.description;
        content.appendChild(description);

        if (location.requirements) {
            const requirementsTitle = document.createElement('h4');
            requirementsTitle.textContent = 'Requirements';
            content.appendChild(requirementsTitle);

            const requirements = document.createElement('p');
            requirements.className = 'requirements-info';
            requirements.textContent = location.requirements;
            content.appendChild(requirements);
        }
        
        if (location.codex_upgrade) {
            const codexTitle = document.createElement('h4');
            codexTitle.textContent = 'Codex Upgrade';
            content.appendChild(codexTitle);

            const codex = document.createElement('p');
            codex.className = 'codex-info';
            codex.textContent = location.codex_upgrade;
            content.appendChild(codex);
        }
        
        return content;
    }

    private initializeSidebar(): void {
        const categoriesContainer = document.getElementById('categories');
        if (!categoriesContainer) return;

        categoriesContainer.innerHTML = '';

        const levelData = this.locationsData[this.currentLevel];
        if (!levelData) return;

        const getLocationCount = (locations: Location[]) => {
            return locations.reduce((total, loc) => {
                // If coordinates is an array of arrays, count each coordinate set
                if (Array.isArray(loc.coordinates[0])) {
                    return total + (loc.coordinates as [number, number][]).length;
                }
                // Single coordinate set counts as 1
                return total + 1;
            }, 0);
        };

        const createCategoryItem = (title: string, count: number, mainCategory: string) => {
            const categoryName = title.charAt(0).toUpperCase() + title.slice(1);
            const isVisible = !this.hiddenCategories.has(categoryName);
            const iconClass = mainCategory === 'Passage' ? 'icon-important' : 'icon-resource';
            return `
                <div class="category-item ${isVisible ? 'category-visible' : ''}" data-category="${categoryName}">
                    <span class="icon ${iconClass}">
                        <span class="path1"></span>
                        <span class="path2"></span>
                        <span class="path3"></span>
                    </span>
                    <span class="title">${title}</span>
                    <span class="bubble">${count}</span>
                </div>
            `;
        };

        // Handle all categories dynamically
        Object.entries(levelData).forEach(([mainCategory, categoryData]) => {
            if (!categoryData) return;
            const categoryHtml = `
                <div class="header">${mainCategory}</div>
                <div class="group-categories">
                    ${Object.entries(categoryData as CategoryData).map(([subCategory, locations]: [string, Location[]]) => 
                        createCategoryItem(subCategory, getLocationCount(locations), mainCategory)
                    ).join('')}
                </div>
            `;
            categoriesContainer.innerHTML += categoryHtml;
        });

        // Add routes to sidebar if there are any for this level
        const routesForLevel = Object.entries(this.routes).reduce((acc, [category, routes]) => {
            const levelRoutes = routes.filter(route => route.segments.some(segment => segment.level === this.currentLevel));
            if (levelRoutes.length > 0) {
                // For each route, get all levels it appears on for the tooltip
                const routeLevels = routes.reduce((levels: string[], route) => {
                    route.segments.forEach(segment => {
                        if (!levels.includes(segment.level)) {
                            levels.push(segment.level);
                        }
                    });
                    return levels;
                }, []);
                
                acc[category] = { routes: levelRoutes, levels: routeLevels };
            }
            return acc;
        }, {} as { [key: string]: { routes: Route[], levels: string[] } });

        if (Object.keys(routesForLevel).length > 0) {
            const routesHtml = `
                <div class="header">Routes</div>
                <div class="group-categories">
                    ${Object.entries(routesForLevel).map(([category, { routes, levels }]) => {
                        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                        const isVisible = !this.hiddenCategories.has(categoryName);
                        const iconClass = 'icon-resource';
                        return `
                            <div class="category-item ${isVisible ? 'category-visible' : ''}" 
                                 data-category="${categoryName}">
                                <span class="icon ${iconClass}">
                                    <span class="path1"></span>
                                    <span class="path2"></span>
                                    <span class="path3"></span>
                                </span>
                                <span class="title">${category}</span>
                                <span class="bubble">${routes.length}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            categoriesContainer.innerHTML += routesHtml;
        }

        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            const handleClick = (e: Event) => {
                const mouseEvent = e as MouseEvent;
                if (mouseEvent.target !== item && !item.contains(mouseEvent.target as Node)) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                const category = item.getAttribute('data-category');
                if (!category) return;
                
                const wasHidden = this.hiddenCategories.has(category);
                
                if (wasHidden) {
                    this.hiddenCategories.delete(category);
                    item.classList.add('category-visible');
                } else {
                    this.hiddenCategories.add(category);
                    item.classList.remove('category-visible');
                }
                
                if (wasHidden !== this.hiddenCategories.has(category)) {
                    this.updateMarkers();
                    this.drawRoutes();
                }
            };
            
            item.addEventListener('click', handleClick, { capture: true });
        });

        const showAllButton = document.getElementById('showAll');
        const hideAllButton = document.getElementById('hideAll');

        if (showAllButton) {
            showAllButton.addEventListener('click', () => {
                this.showAllCategories();
                categoryItems.forEach(item => item.classList.add('category-visible'));
            });
        }

        if (hideAllButton) {
            hideAllButton.addEventListener('click', () => {
                this.hideAllCategories();
                categoryItems.forEach(item => item.classList.remove('category-visible'));
            });
        }
    }

    public async initialize(elementId: string, onProgress?: (progress: number, message: string) => void): Promise<void> {
        // Clean up any existing map instance
        this.cleanup();

        // Remove any existing map container
        const existingMap = document.getElementById(elementId);
        if (existingMap) {
            existingMap.remove();
        }

        // Create a new map container
        const mapContainer = document.createElement('div');
        mapContainer.id = elementId;
        const mapContainerElement = document.getElementById('map-container');
        if (!mapContainerElement) return;
        
        mapContainerElement.appendChild(mapContainer);
        this.infoMenu.mount(mapContainerElement);
        this.languageInfoMenu.mount(mapContainerElement);

        onProgress?.(40, 'Loading routes...');
        await this.loadRoutes();
        onProgress?.(50, 'Initializing map...');
        
        this.map = L.map(elementId, {
            crs: L.CRS.Simple,
            minZoom: -4,
            maxZoom: 2,
            maxBoundsViscosity: 0.8,
            keyboard: true,
            scrollWheelZoom: true,
            zoomControl: false,
            zoomSnap: 0.25,
            zoomDelta: 0.25,
            wheelPxPerZoomLevel: 120
        });

        L.control.zoom({
            position: 'topright'
        }).addTo(this.map);

        this.markersLayer = L.layerGroup().addTo(this.map);
        this.routesLayer = L.layerGroup().addTo(this.map);

        this.map.on('click', (e) => {
            const coords = e.latlng;
            const coordArray = [Math.round(coords.lat), Math.round(coords.lng)];
            const coordString = `[${coordArray[0]}, ${coordArray[1]}]`;
            navigator.clipboard.writeText(coordString);
            
        });

        this.map.on('zoomend', () => {
            if (this.markersLayer) {
                const currentSize = this.getMarkerSize();
                this.markersLayer.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        const marker = layer as L.Marker;
                        const markerOptions = marker.options as MarkerOptions;
                        if (markerOptions.location && markerOptions.mainCategory && markerOptions.category) {
                            const icon = marker.getIcon() as L.DivIcon;
                            const iconHtml = icon.options.html;
                            if (iconHtml && typeof iconHtml === 'string') {
                                // Get the icon's base scale from AVAILABLE_ICONS or location
                                let scale = 100;
                                if (markerOptions.location?.icon) {
                                    const iconConfig = Object.values(AVAILABLE_ICONS).find(config => config.path === markerOptions.location?.icon);
                                    scale = iconConfig?.scale || 100;
                                }
                                // Apply location-specific scale override if it exists
                                if (markerOptions.location?.scale) {
                                    scale = markerOptions.location.scale;
                                }
                                const scaledSize = currentSize * (scale / 100);
                                const scaledHalfSize = scaledSize / 2;
                                // Preserve the rune-icon class if it exists
                                const isRune = markerOptions.location?.icon?.includes('/runes/');
                                const runeClass = isRune ? 'rune-icon' : '';
                                // Add red outline for boss icons
                                const isBoss = markerOptions.location?.icon?.includes('/bosses/');
                                const glow = isBoss ? 'filter: drop-shadow(0 0 2px red) drop-shadow(0 0 4px red) drop-shadow(0 0 6px red);' : '';
                                
                                const newIcon = L.divIcon({
                                    className: `marker-icon ${runeClass}`,
                                    html: `<div class="icon-wrapper" style="transform-origin: center;">
                                            <img src="${iconHtml.match(/src="([^"]+)"/)?.[1]}" class="icon-image" style="width: 100%; height: 100%; image-rendering: -webkit-optimize-contrast; ${glow}">
                                          </div>`,
                                    iconSize: [scaledSize, scaledSize],
                                    iconAnchor: [scaledHalfSize, scaledHalfSize]
                                });
                                marker.setIcon(newIcon);
                                // Update marker options to keep it centered
                                (marker.options as L.MarkerOptions & { iconAnchor?: [number, number] }).iconAnchor = [scaledHalfSize, scaledHalfSize];
                            }
                        }
                    }
                });
            }
        });

        this.initializeSidebar();
        
        // Only load the initial floor (Level 1)
        await this.loadMapLayer("Level 1");
        onProgress?.(100, 'Ready!');

        const mapLinks = document.querySelectorAll('.map-link');
        mapLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isLoadingMap) return;
                mapLinks.forEach(l => l.classList.remove('selected'));
                link.classList.add('selected');
                const level = link.textContent || "Level 1";
                this.setLevel(level);
            });
        });
    }

    private getFloorPath(level: string): string {
        const levelLower = level.toLowerCase();
        
        // Handle special named areas
        const specialAreas = {
            'sewers': 'sewers',
            'tunnel': 'tunnel',
            'the molten core': 'the-molten-core',
            'stonegate': "stonegate",
            'hall of virtue': "hall-of-virtue",
            'the abyssal core': "the-abyssal-core"
        };

        // Check if it's a special area (case-insensitive)
        for (const [areaName, dirName] of Object.entries(specialAreas)) {
            if (levelLower === areaName || level === dirName) {
                return dirName;
            }
        }
        
        // Handle numbered floors
        const floorNumber = level.split(' ')[1];
        if (floorNumber === '2') {
            // Handle split level 2 - explicitly check for "Lower" and "Upper"
            if (level.includes('Lower')) {
                return 'floor-2-lower-reaches';
            }
            if (level.includes('Upper')) {
                return 'floor-2-upper-reaches';
            }
            // Default to lower reaches if not specified
            return 'floor-2-lower-reaches';
        }
        
        return `floor-${floorNumber}`;
    }

    private async loadTileConfig(level: string): Promise<{ primary: TileSetConfig; secondaries?: TileSetConfig[] }> {
        const floorPath = this.getFloorPath(level);
        const response = await fetch(`./floors/${floorPath}/required_tiles.json`);
        const config = await response.json();
        
        // Handle both new and old format
        if ('primary' in config.tiles) {
            // Convert old secondary to new secondaries array format if needed
            if (config.tiles.secondary && !config.tiles.secondaries) {
                return {
                    primary: config.tiles.primary,
                    secondaries: [config.tiles.secondary]
                };
            }
            return config.tiles;
        } else {
            // Convert old format to new format
            return { primary: config.tiles };
        }
    }

    private async loadMapLayer(level: string): Promise<void> {
        if (!this.map || this.isLoadingMap) return;
        
        // Clean up old layer's blob URLs
        this.tileService.cleanup();
        
        // If we already have this layer loaded, just show it
        if (this.mapLayers[level]) {
            Object.entries(this.mapLayers).forEach(([layerLevel, { layer, bounds }]) => {
                if (layerLevel === level) {
                    this.map?.addLayer(layer);
                    this.map?.fitBounds(bounds);
                } else {
                    this.map?.removeLayer(layer);
                }
            });
        } else {
            // Load the new layer
            const floorPath = this.getFloorPath(level);
            const config = await this.loadTileConfig(level);
            
            const layerGroup = L.layerGroup();
            const tileSize = 256;

            // Function to load a tile set
            const loadTileSet = (tileConfig: TileSetConfig, verticalOffset: number = 0) => {
                const numCols = tileConfig.endDir - tileConfig.startDir + 1;
                const numRows = tileConfig.endTile - tileConfig.startTile + 1;
                const offsetX = tileConfig.offsetX || 0;

                for (let col = 0; col < numCols; col++) {
                    for (let row = 0; row < numRows; row++) {
                        const directory = col + tileConfig.startDir;
                        const file = row + tileConfig.startTile;
                        
                        // Check if this tile should be ignored
                        const shouldIgnore = tileConfig.ignore?.some(ignore => {
                            const dirs = Array.isArray(ignore.dir) ? ignore.dir : [ignore.dir];
                            const tiles = Array.isArray(ignore.tile) ? ignore.tile : [ignore.tile];
                            return dirs.includes(directory) && tiles.includes(file);
                        });
                        
                        if (!shouldIgnore) {
                            // Use a very small overlap to prevent tile lines
                            const overlap = 0.1;
                            const bounds = [
                                [(numRows - row - 1) * tileSize + verticalOffset - overlap, (col * tileSize + offsetX) - overlap],
                                [(numRows - row) * tileSize + verticalOffset + overlap, ((col + 1) * tileSize + offsetX) + overlap]
                            ] as L.LatLngBoundsExpression;

                            const tilePath = `./floors/${floorPath}/tiles/${directory}/${file}.png`;
                            const overlay = L.imageOverlay(tilePath, bounds, {
                                className: 'seamless-tile'
                            });
                            overlay.addTo(layerGroup);
                        }
                    }
                }
                return { numRows, numCols, offsetX };
            };

            // Calculate primary dimensions
            const primaryRows = config.primary.endTile - config.primary.startTile + 1;
            const primaryCols = config.primary.endDir - config.primary.startDir + 1;
            const primaryWidth = primaryCols * tileSize;

            // Load primary tiles
            const primary = loadTileSet(config.primary, 0);
            
            // Load secondary tiles if they exist
            let totalWidth = primaryWidth;
            
            if (config.secondaries && config.secondaries.length > 0) {
                // Split secondaries into columns of 4
                const columnsNeeded = Math.ceil(config.secondaries.length / 4);
                const columns: typeof config.secondaries[] = [];
                
                for (let i = 0; i < columnsNeeded; i++) {
                    columns.push(config.secondaries.slice(i * 4, (i + 1) * 4));
                }

                // Calculate max width needed for each column
                const getColumnWidth = (areas: typeof config.secondaries) => {
                    return Math.max(...areas.map(area => 
                        (area.endDir - area.startDir + 0.5) * tileSize
                    ), 0);
                };

                // Calculate column widths
                const columnWidths = columns.map(getColumnWidth);

                // Add spacing between columns
                const columnSpacing = tileSize; // 1 tile worth of spacing

                // Calculate heights and vertical offsets for each column
                const columnHeights = columns.map(column => 
                    column.reduce((sum, secondary) => 
                        sum + ((secondary.endTile - secondary.startTile + 1) * tileSize), 0)
                );

                // Process each column
                let currentX = primaryWidth + columnSpacing;
                columns.forEach((column, columnIndex) => {
                    // Calculate vertical offset to center the column
                    let verticalOffset = ((primaryRows * tileSize) - columnHeights[columnIndex]) / 2;

                    // Process each secondary in this column
                    column.forEach(secondary => {
                        const secondaryRows = secondary.endTile - secondary.startTile + 1;
                        secondary.offsetX = currentX;
                        const secondaryResult = loadTileSet(secondary, verticalOffset);
                        verticalOffset += secondaryRows * tileSize;
                    });

                    // Move to next column position
                    currentX += columnWidths[columnIndex] + columnSpacing;
                });

                // Update total width to include all columns and spacing
                totalWidth = currentX;
            }

            // Calculate total bounds to encompass all tiles
            const totalHeight = primaryRows * tileSize;

            const viewBounds: L.LatLngBoundsExpression = [
                [0, 0],
                [totalHeight, totalWidth]
            ];

            // Remove old layers
            Object.values(this.mapLayers).forEach(({ layer }) => {
                this.map?.removeLayer(layer);
            });

            // Store and show new layer
            this.mapLayers[level] = {
                layer: layerGroup,
                bounds: viewBounds
            };
            
            layerGroup.addTo(this.map);
            this.map?.fitBounds(viewBounds);
        }
        
        if (this.markersLayer) {
            this.markersLayer.clearLayers();
        }
        if (this.routesLayer) {
            this.routesLayer.clearLayers();
        }
        this.updateMarkers();
        this.drawRoutes();
    }

    public setLevel(level: string): void {
        if (this.isLoadingMap) return;
        
        // Normalize level names to match routes.json
        const specialAreas = {
            'Sewers': 'sewers',
            'Tunnel': 'tunnel',
            'The Molten Core': 'the molten core',
            'Stonegate': "stonegate",
            'Hall of Virtue': "hall of virtue",
            'The Abyssal Core': "the abyssal core"
        };
        
        // Check if it's a special area and normalize the name
        this.currentLevel = specialAreas[level as keyof typeof specialAreas] || level;
        
        this.loadMapLayer(level).then(() => {
            this.initializeSidebar();
        });
    }

    public toggleCategory(categoryName: string): void {
        if (this.hiddenCategories.has(categoryName)) {
            this.hiddenCategories.delete(categoryName);
        } else {
            this.hiddenCategories.add(categoryName);
        }
        this.updateMarkers();
        this.drawRoutes();
    }

    public showAllCategories(): void {
        this.hiddenCategories.clear();
        this.updateMarkers();
        this.drawRoutes();
    }

    public hideAllCategories(): void {
        const categories = this.getAllCategories();
        categories.forEach(category => this.hiddenCategories.add(category));
        this.updateMarkers();
        this.drawRoutes();
    }

    public isCategoryVisible(categoryName: string): boolean {
        return !this.hiddenCategories.has(categoryName);
    }

    private getAllCategories(): string[] {
        const categories = new Set<string>();
        // Add location categories
        Object.values(this.locationsData).forEach(levelData => {
            Object.values(levelData).forEach(categoryData => {
                if (categoryData) {
                    Object.keys(categoryData as CategoryData).forEach(category => categories.add(category));
                }
            });
        });
        // Add route categories
        Object.keys(this.routes).forEach(category => categories.add(category));
        return Array.from(categories);
    }

    private findLocationById(id: string | number): Location | null {
        for (const levelData of Object.values(this.locationsData)) {
            for (const categoryData of Object.values(levelData)) {
                if (!categoryData) continue;
                for (const locations of Object.values(categoryData)) {
                    const location = locations.find(loc => loc.id === id);
                    if (location) return location;
                }
            }
        }
        return null;
    }

    private createCurvedPath(points: [number, number][]): [number, number][] {
        if (points.length < 3) return points;

        const curvedPoints: [number, number][] = [];
        const tension = 0.5; // Controls how tight the curve is (0.3-0.5 works well)
        const numSegments = 16; // Number of segments between each point pair

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = i > 0 ? points[i - 1] : points[i];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = i < points.length - 2 ? points[i + 2] : p2;

            // Add the current point
            curvedPoints.push(p1);

            // Add interpolated points between current and next point
            for (let t = 1; t < numSegments; t++) {
                const t1 = t / numSegments;
                
                // Catmull-Rom spline interpolation
                const t2 = t1 * t1;
                const t3 = t2 * t1;
                
                const x = 0.5 * (
                    (2 * p1[0]) +
                    (-p0[0] + p2[0]) * t1 +
                    (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                    (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
                );
                
                const y = 0.5 * (
                    (2 * p1[1]) +
                    (-p0[1] + p2[1]) * t1 +
                    (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                    (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
                );
                
                curvedPoints.push([x, y]);
            }
        }
        
        // Add the last point
        curvedPoints.push(points[points.length - 1]);
        
        return curvedPoints;
    }

    public cleanup(): void {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        if (this.markersLayer) {
            this.markersLayer.clearLayers();
            this.markersLayer = null;
        }
        if (this.routesLayer) {
            this.routesLayer.clearLayers();
            this.routesLayer = null;
        }
        this.mapLayers = {};
        this.tileService.cleanup();
    }
}
