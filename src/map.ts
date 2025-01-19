import L from 'leaflet';
import { Location, LocationsData, AVAILABLE_ICONS } from './types.js';

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
}

export class MapManager {
    private map: L.Map | null = null;
    private markersLayer: L.LayerGroup | null = null;
    private currentLevel: string = "Level 1";
    private hiddenCategories: Set<string> = new Set();
    private mapLayers: { [key: string]: { layer: L.LayerGroup; bounds: L.LatLngBoundsExpression } } = {};
    private isLoadingMap: boolean = false;
    private cloudcubeUrl: string = '';
    
    constructor(private locationsData: LocationsData) {
    }

    private async initializeCloudcubeUrl(): Promise<void> {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            this.cloudcubeUrl = config.cloudcubeUrl;
            if (!this.cloudcubeUrl) {
                throw new Error('CLOUDCUBE_URL is not set');
            }
            console.log('CloudCube URL:', this.cloudcubeUrl);
        } catch (error) {
            console.error('Failed to fetch config:', error);
            throw error;
        }
    }

    private updateMarkers(): void {
        if (!this.markersLayer || !this.map) return;
        
        console.log('Updating markers, hidden categories:', Array.from(this.hiddenCategories)); // Debug log
        
        this.markersLayer.clearLayers();
        
        const levelData = this.locationsData[this.currentLevel];
        if (!levelData) return;
        
        const currentSize = this.getMarkerSize();
        
        // Add passage markers
        if (levelData.Passage) {
            for (const type in levelData.Passage) {
                const categoryName = type.charAt(0).toUpperCase() + type.slice(1);
                console.log('Checking category:', categoryName, 'Hidden:', this.hiddenCategories.has(categoryName)); // Debug log
                if (!this.hiddenCategories.has(categoryName)) {
                    levelData.Passage[type].forEach(loc => {
                        const coordinates = Array.isArray(loc.coordinates[0]) 
                            ? loc.coordinates as [number, number][]
                            : [loc.coordinates as [number, number]];
                        
                        coordinates.forEach(coord => {
                            const marker = L.marker(coord, {
                                icon: this.createMarkerIcon('Passage', categoryName, loc, currentSize),
                                location: loc,
                                category: categoryName,
                                mainCategory: 'Passage',
                                zIndexOffset: 1000
                            } as MarkerOptions);
                            
                            marker.bindPopup(this.createPopupContent(loc));
                            this.markersLayer?.addLayer(marker);
                        });
                    });
                }
            }
        }
        
        // Add rune markers
        if (levelData.Runes) {
            for (const circle in levelData.Runes) {
                const categoryName = circle.charAt(0).toUpperCase() + circle.slice(1);
                console.log('Checking category:', categoryName, 'Hidden:', this.hiddenCategories.has(categoryName)); // Debug log
                if (!this.hiddenCategories.has(categoryName)) {
                    levelData.Runes[circle].forEach(rune => {
                        const coordinates = Array.isArray(rune.coordinates[0])
                            ? rune.coordinates as [number, number][]
                            : [rune.coordinates as [number, number]];
                        
                        coordinates.forEach(coord => {
                            const marker = L.marker(coord, {
                                icon: this.createMarkerIcon('Runes', categoryName, rune, currentSize),
                                location: rune,
                                category: categoryName,
                                mainCategory: 'Runes',
                                zIndexOffset: 1000
                            } as MarkerOptions);
                            
                            marker.bindPopup(this.createPopupContent(rune));
                            this.markersLayer?.addLayer(marker);
                        });
                    });
                }
            }
        }
    }

    private initializeSidebar(): void {
        const categoriesContainer = document.getElementById('categories');
        if (!categoriesContainer) return;

        // Clear existing categories
        categoriesContainer.innerHTML = '';

        const levelData = this.locationsData[this.currentLevel];
        if (!levelData) return;

        // Helper function to create category items
        const createCategoryItem = (title: string, count: number, iconClass: string) => {
            // Ensure consistent case for category names
            const categoryName = title.charAt(0).toUpperCase() + title.slice(1);
            const isVisible = !this.hiddenCategories.has(categoryName);
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

        // Add Passage categories
        if (levelData.Passage) {
            const passageHtml = `
                <div class="header">Passage</div>
                <div class="group-categories">
                    ${Object.entries(levelData.Passage).map(([subCategory, locations]) => {
                        console.log('Creating Passage category:', subCategory); // Debug log
                        return createCategoryItem(subCategory, locations.length, 'icon-important');
                    }).join('')}
                </div>
            `;
            categoriesContainer.innerHTML += passageHtml;
        }

        // Add Runes categories
        if (levelData.Runes) {
            const runesHtml = `
                <div class="header">Runes</div>
                <div class="group-categories">
                    ${Object.entries(levelData.Runes).map(([subCategory, locations]) => {
                        console.log('Creating Runes category:', subCategory); // Debug log
                        return createCategoryItem(subCategory, locations.length, 'icon-resource');
                    }).join('')}
                </div>
            `;
            categoriesContainer.innerHTML += runesHtml;
        }

        // Add click handlers for category items
        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            const handleClick = (e: Event) => {
                const mouseEvent = e as MouseEvent;
                if (mouseEvent.target !== item && !item.contains(mouseEvent.target as Node)) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                const category = item.getAttribute('data-category');
                if (!category) return;

                console.log('Toggling category:', category); // Debug log
                
                const wasHidden = this.hiddenCategories.has(category);
                
                // Update state
                if (wasHidden) {
                    this.hiddenCategories.delete(category);
                    item.classList.add('category-visible');
                } else {
                    this.hiddenCategories.add(category);
                    item.classList.remove('category-visible');
                }

                console.log('Hidden categories after toggle:', Array.from(this.hiddenCategories)); // Debug log
                
                // Only update if state actually changed
                if (wasHidden !== this.hiddenCategories.has(category)) {
                    this.updateMarkers();
                }
            };
            
            item.addEventListener('click', handleClick, { capture: true });
        });

        // Add click handlers for show/hide all buttons
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

    private getMarkerSize(): number {
        if (!this.map) return 32;
        const zoom = this.map.getZoom();
        // Base size is 32px at zoom level 0
        return Math.max(16, Math.min(128, 32 * Math.pow(2, zoom)));
    }

    private coordDisplay: HTMLElement | null = null;

    public async initialize(elementId: string, onProgress?: (progress: number, message: string) => void): Promise<void> {
        if (this.map) {
            console.warn('Map is already initialized, cleaning up...');
            this.map.remove();
            this.map = null;
            if (this.coordDisplay) {
                this.coordDisplay.remove();
                this.coordDisplay = null;
            }
            if (this.markersLayer) {
                this.markersLayer.clearLayers();
                this.markersLayer = null;
            }
            this.mapLayers = {};
        }

        onProgress?.(35, 'Initializing CloudCube...');
        await this.initializeCloudcubeUrl();
        // Create coordinate display element
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

        // Add mousemove and click handlers
        this.map.on('click', (e) => {
            const coords = e.latlng;
            const coordArray = [Math.round(coords.lat), Math.round(coords.lng)];
            const coordString = `[${coordArray[0]}, ${coordArray[1]}]`;
            navigator.clipboard.writeText(coordString);
            
            // Show temporary feedback
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

        // Add zoom handler to update marker sizes
        this.map.on('zoomend', () => {
            // Only update marker sizes, don't reinitialize
            if (this.markersLayer) {
                const currentSize = this.getMarkerSize();
                this.markersLayer.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        const marker = layer as L.Marker;
                        const markerOptions = marker.options as MarkerOptions;
                        if (markerOptions.location && markerOptions.mainCategory && markerOptions.category) {
                            // Only update the icon size, don't recreate markers
                            const icon = marker.getIcon() as L.DivIcon;
                            const iconHtml = icon.options.html;
                            if (iconHtml && typeof iconHtml === 'string') {
                                const scaledSize = currentSize * (markerOptions.location.scale || 100) / 100;
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

        // Initialize sidebar and load map layers
        this.initializeSidebar();
        await this.loadAllMapLayers(onProgress);

        // Add click handlers for map switcher
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
        const response = await fetch(`/api/s3/floors/floor-${level.split(' ')[1]}/required_tiles.json`);
        const config = await response.json();
        return config.tiles;
    }

    private async loadAllMapLayers(onProgress?: (progress: number, message: string) => void): Promise<void> {
        if (!this.map) return;
        
        this.isLoadingMap = true;
        let firstLayer = true;
        
        try {
            const levels = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 6.5", "Level 7", "Level 8"];
            const progressPerLevel = 60 / levels.length; // 60% of progress bar for loading levels (40-100%)
            
            for (let i = 0; i < levels.length; i++) {
                const level = levels[i];
                onProgress?.(40 + (i * progressPerLevel), `Loading ${level}...`);
                const floorNumber = level.split(' ')[1];
                const config = await this.loadTileConfig(level);
                
                const layerGroup = L.layerGroup();
                const tileSize = 256;
                const numCols = config.endDir - config.startDir + 1;
                const numRows = config.endTile - config.startTile + 1;

                // Add tiles
                const totalTiles = numCols * numRows;
                let loadedTiles = 0;
                for (let col = 0; col < numCols; col++) {
                    for (let row = 0; row < numRows; row++) {
                        loadedTiles++;
                        const tileProgress = (loadedTiles / totalTiles) * progressPerLevel;
                        onProgress?.(40 + (i * progressPerLevel) + tileProgress, `Loading ${level} (${Math.round(loadedTiles/totalTiles * 100)}%)...`);
                        const directory = col + config.startDir;
                        const file = row + config.startTile;
                        
                        // Add a small overlap to prevent seams
                        const overlap = 2;
                        const bounds = [
                            [(numRows - row - 1) * tileSize - overlap, col * tileSize - overlap],
                            [(numRows - row) * tileSize + overlap, (col + 1) * tileSize + overlap]
                        ] as L.LatLngBoundsExpression;

                        L.imageOverlay(
                            `/api/s3/floors/floor-${floorNumber}/tiles/${directory}/${file}.png`,
                            bounds
                        ).addTo(layerGroup);
                    }
                }

                // Calculate bounds for this layer
                const viewBounds: L.LatLngBoundsExpression = [
                    [0, 0],
                    [numRows * tileSize, numCols * tileSize]
                ];

                // Store the layer group and its bounds
                this.mapLayers[level] = {
                    layer: layerGroup,
                    bounds: viewBounds
                };
                
                // Only add the first layer
                if (firstLayer) {
                    layerGroup.addTo(this.map);
                    this.map.fitBounds(viewBounds);
                    firstLayer = false;
                }
            }
            
            // Initialize markers for the current level
            this.updateMarkers();
            
            // Report completion
            onProgress?.(100, 'Ready!');
            
        } finally {
            this.isLoadingMap = false;
        }
    }

    private async loadMapLayer(level: string): Promise<void> {
        if (!this.map || this.isLoadingMap) return;
        
        // Hide all layers except the current one
        Object.entries(this.mapLayers).forEach(([layerLevel, { layer, bounds }]) => {
            if (layerLevel === level) {
                this.map?.addLayer(layer);
                this.map?.fitBounds(bounds);
            } else {
                this.map?.removeLayer(layer);
            }
        });
        
        // Clear and update markers
        if (this.markersLayer) {
            this.markersLayer.clearLayers();
        }
        this.updateMarkers();
    }

    private createMarkerIcon(mainCategory: string, subCategory: string, location?: Location, size: number = 32): L.DivIcon {
        console.log('Creating marker for:', mainCategory, subCategory); // Debug log
        const halfSize = size / 2;
        // If location has a specific icon, use it
        if (location?.icon) {
            const iconConfig = Object.values(AVAILABLE_ICONS).find(config => config.path === location.icon);
            const scale = iconConfig?.scale || 100;
            const scaledSize = size * scale / 100;
            const scaledHalfSize = scaledSize / 2;
            return L.divIcon({
                className: 'marker-icon',
                html: `<img src="/${location.icon}" style="width: ${scaledSize}px; height: auto;">`,
                iconSize: [scaledSize, scaledSize],
                iconAnchor: [scaledHalfSize, scaledHalfSize]
            });
        }

        // Default icons based on category
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
                // Fallback to colored square if no icon matches
                const colors: { [key: string]: string } = {
                    "Passage": "#e74c3c",
                    "Runes": "#f1c40f"
                };
                return L.divIcon({
                    className: 'marker-icon',
                    html: `<div style="background-color: ${colors[mainCategory] || '#3498db'}; width: ${size}px; height: ${size}px;"></div>`,
                    iconSize: [size, size],
                    iconAnchor: [halfSize, halfSize]
                });
        }

        // Return icon with default image for category
        const scaledSize = size * iconConfig.scale / 100;
        const scaledHalfSize = scaledSize / 2;
        return L.divIcon({
            className: 'marker-icon',
            html: `<img src="/${iconConfig.path}" style="width: ${scaledSize}px; height: auto;">`,
            iconSize: [scaledSize, scaledSize],
            iconAnchor: [scaledHalfSize, scaledHalfSize]
        });
    }

    private createPopupContent(location: Location): HTMLElement {
        const content = document.createElement('div');
        content.className = 'popup-content';
        
        const title = document.createElement('h3');
        title.textContent = location.title;
        content.appendChild(title);
        
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
        
        // Only show codex upgrade for runes
        if (location.codex_upgrade && location.words) { // Runes have words, other locations don't
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

    public setLevel(level: string): void {
        if (this.isLoadingMap) return;
        this.currentLevel = level;
        this.loadMapLayer(level).then(() => {
            this.initializeSidebar(); // Reinitialize sidebar for new level
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

    private getAllCategories(): string[] {
        const categories = new Set<string>();
        Object.values(this.locationsData).forEach(levelData => {
            if (levelData.Passage) {
                Object.keys(levelData.Passage).forEach(category => categories.add(category));
            }
            if (levelData.Runes) {
                Object.keys(levelData.Runes).forEach(category => categories.add(category));
            }
        });
        return Array.from(categories);
    }
}
