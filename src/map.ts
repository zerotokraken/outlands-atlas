import L from 'leaflet';
import { Location, LocationsData, CategoryData, AVAILABLE_ICONS } from './types.js';
import { TileService } from './services/tileService.js';
import { InfoMenu } from './components/InfoMenu.js';

interface TileConfig {
    startDir: number;
    endDir: number;
    startTile: number;
    endTile: number;
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
    private currentLevel: string = "Level 1";
    private hiddenCategories: Set<string> = new Set();
    private mapLayers: { [key: string]: { layer: L.LayerGroup; bounds: L.LatLngBoundsExpression } } = {};
    private isLoadingMap: boolean = false;
    private tileService: TileService;
    private infoMenu: InfoMenu;
    private coordDisplay: HTMLElement | null = null;

    constructor(private locationsData: LocationsData) {
        this.tileService = new TileService();
        this.infoMenu = new InfoMenu();
    }

    private getMarkerSize(): number {
        if (!this.map) return 32;
        const zoom = this.map.getZoom();
        return Math.max(16, Math.min(128, 32 * Math.pow(2, zoom)));
    }

    private createMarkerIcon(mainCategory: string, subCategory: string, location?: Location, size: number = 32): L.DivIcon {
        const halfSize = size / 2;
        
        if (location?.icon) {
            // Get the icon's base scale from AVAILABLE_ICONS
            const iconConfig = Object.values(AVAILABLE_ICONS).find(config => config.path === location.icon);
            let scale = iconConfig?.scale || 100;
            // Apply location-specific scale override if it exists
            if (location.scale) {
                scale = location.scale;
            }
            const scaledSize = size * (scale / 100);
            const scaledHalfSize = scaledSize / 2;
            return L.divIcon({
                className: 'marker-icon',
            html: `<img src="/${location.icon}" style="width: ${scaledSize}px; height: auto; image-rendering: -webkit-optimize-contrast;">`,
                iconSize: [scaledSize, scaledSize],
                iconAnchor: [scaledHalfSize, scaledHalfSize]
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
                    "Misc": "#3498db"
                };
                return L.divIcon({
                    className: 'marker-icon',
                    html: `<div style="background-color: ${colors[mainCategory] || '#3498db'}; width: ${size}px; height: ${size}px;"></div>`,
                    iconSize: [size, size],
                    iconAnchor: [halfSize, halfSize]
                });
        }

        let scale = iconConfig.scale;
        // Apply location-specific scale override if it exists
        if (location?.scale) {
            scale = location.scale;
        }
        const scaledSize = size * (scale / 100);
        const scaledHalfSize = scaledSize / 2;
        return L.divIcon({
            className: 'marker-icon',
                html: `<img src="/${iconConfig.path}" style="width: ${scaledSize}px; height: auto; image-rendering: -webkit-optimize-contrast;">`,
            iconSize: [scaledSize, scaledSize],
            iconAnchor: [scaledHalfSize, scaledHalfSize]
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
                            const marker = L.marker(coord, {
                                icon: this.createMarkerIcon(mainCategory, categoryName, loc, currentSize),
                                location: loc,
                                category: categoryName,
                                mainCategory: mainCategory,
                                containerIndex: index,
                                zIndexOffset: 1000
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

        const createCategoryItem = (title: string, locations: Location[], mainCategory: string) => {
            const categoryName = title.charAt(0).toUpperCase() + title.slice(1);
            const isVisible = !this.hiddenCategories.has(categoryName);
            const count = getLocationCount(locations);
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
                        createCategoryItem(subCategory, locations, mainCategory)
                    ).join('')}
                </div>
            `;
            categoriesContainer.innerHTML += categoryHtml;
        });

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

        onProgress?.(50, 'Initializing map...');
        
        this.coordDisplay = document.createElement('div');
        this.coordDisplay.className = 'coordinate-display';
        this.coordDisplay.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-family: monospace;
            z-index: 1000;
        `;
        document.body.appendChild(this.coordDisplay);

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

        this.map.on('click', (e) => {
            const coords = e.latlng;
            const coordArray = [Math.round(coords.lat), Math.round(coords.lng)];
            const coordString = `[${coordArray[0]}, ${coordArray[1]}]`;
            navigator.clipboard.writeText(coordString);
            
            if (this.coordDisplay) {
                const originalStyle = this.coordDisplay.style.background;
                this.coordDisplay.style.background = 'rgba(0, 255, 0, 0.7)';
                setTimeout(() => {
                    if (this.coordDisplay) {
                        this.coordDisplay.style.background = originalStyle;
                    }
                }, 200);
            }
        });

        this.map.on('mousemove', (e) => {
            if (this.coordDisplay) {
                const coords = e.latlng;
                const coordArray = [Math.round(coords.lat), Math.round(coords.lng)];
                const coordString = `[${coordArray[0]}, ${coordArray[1]}]`;
                this.coordDisplay.innerHTML = `
                    Raw: ${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}<br>
                    JSON: <span style="cursor: pointer; text-decoration: underline;" onclick="navigator.clipboard.writeText('${coordString}')">${coordString}</span>
                    <span style="font-size: 0.8em; margin-left: 5px;">(click to copy)</span>
                `;
            }
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
                                marker.setIcon(L.divIcon({
                                    className: 'marker-icon',
                                    html: iconHtml.replace(/width: \d+px/, `width: ${scaledSize}px`),
                                    iconSize: [scaledSize, scaledSize],
                                    iconAnchor: [scaledHalfSize, scaledHalfSize]
                                }));
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

    private async loadTileConfig(level: string): Promise<TileConfig> {
        let floorPath;
        const levelLower = level.toLowerCase();
        if (levelLower === 'sewers' || levelLower === 'tunnel') {
            // Handle named locations - always use lowercase for path
            floorPath = levelLower;
        } else {
            // Handle numbered floors
            const floorNumber = level.split(' ')[1];
            floorPath = `floor-${floorNumber}`;
        }
        const response = await fetch(`/floors/${floorPath}/required_tiles.json`);
        const config = await response.json();
        return config.tiles;
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
            let floorPath;
            const levelLower = level.toLowerCase();
            if (levelLower === 'sewers' || levelLower === 'tunnel') {
                floorPath = levelLower;
            } else {
                const floorNumber = level.split(' ')[1];
                floorPath = `floor-${floorNumber}`;
            }
            const config = await this.loadTileConfig(level);
            
            const layerGroup = L.layerGroup();
            const tileSize = 256;
            const numCols = config.endDir - config.startDir + 1;
            const numRows = config.endTile - config.startTile + 1;

            for (let col = 0; col < numCols; col++) {
                for (let row = 0; row < numRows; row++) {
                    const directory = col + config.startDir;
                    const file = row + config.startTile;
                    
                    // Use a very small overlap to prevent tile lines
                    const overlap = 0.1;
                    const bounds = [
                        [(numRows - row - 1) * tileSize - overlap, col * tileSize - overlap],
                        [(numRows - row) * tileSize + overlap, (col + 1) * tileSize + overlap]
                    ] as L.LatLngBoundsExpression;

                    const tilePath = `/floors/${floorPath}/tiles/${directory}/${file}.png`;
                    const overlay = L.imageOverlay(tilePath, bounds, {
                        className: 'seamless-tile'
                    });
                    overlay.addTo(layerGroup);
                }
            }

            const viewBounds: L.LatLngBoundsExpression = [
                [0, 0],
                [numRows * tileSize, numCols * tileSize]
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
        this.updateMarkers();
    }

    public setLevel(level: string): void {
        if (this.isLoadingMap) return;
        this.currentLevel = level;
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
    }

    public showAllCategories(): void {
        this.hiddenCategories.clear();
        this.updateMarkers();
    }

    public hideAllCategories(): void {
        const categories = this.getAllCategories();
        categories.forEach(category => this.hiddenCategories.add(category));
        this.updateMarkers();
    }

    public isCategoryVisible(categoryName: string): boolean {
        return !this.hiddenCategories.has(categoryName);
    }

    public cleanup(): void {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        if (this.coordDisplay) {
            this.coordDisplay.remove();
            this.coordDisplay = null;
        }
        if (this.markersLayer) {
            this.markersLayer.clearLayers();
            this.markersLayer = null;
        }
        this.mapLayers = {};
        this.tileService.cleanup();
    }

    private getAllCategories(): string[] {
        const categories = new Set<string>();
        Object.values(this.locationsData).forEach(levelData => {
            Object.values(levelData).forEach(categoryData => {
                if (categoryData) {
                    Object.keys(categoryData as CategoryData).forEach(category => categories.add(category));
                }
            });
        });
        return Array.from(categories);
    }
}
