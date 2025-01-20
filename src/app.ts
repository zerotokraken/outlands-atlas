import { MapManager } from './map.js';
import { LocationsData } from './types.js';

class App {
    private mapManager: MapManager;

    constructor(private locationsData: LocationsData) {
        this.mapManager = new MapManager(locationsData);
    }

    public async initialize(onProgress?: (progress: number, message: string) => void): Promise<void> {
        await this.mapManager.initialize('map', onProgress);
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Setup level switcher
        document.querySelectorAll('.map-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.map-link').forEach(l => l.classList.remove('selected'));
                (e.currentTarget as HTMLElement).classList.add('selected');
                const level = (e.currentTarget as HTMLElement).textContent;
                if (level) {
                    this.mapManager.setLevel(level);
                }
            });
        });

        // Setup category toggles
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                const categoryName = item.querySelector('.title')?.textContent;
                if (categoryName) {
                    this.mapManager.toggleCategory(categoryName);
                    if (this.mapManager.isCategoryVisible(categoryName)) {
                        item.classList.remove('category-hidden');
                        item.classList.add('category-visible');
                    } else {
                        item.classList.add('category-hidden');
                        item.classList.remove('category-visible');
                    }
                }
            });
        });

        // Show/Hide all buttons
        const showAllButton = document.getElementById('showAll');
        const hideAllButton = document.getElementById('hideAll');

        if (showAllButton) {
            showAllButton.addEventListener('click', () => {
                this.mapManager.showAllCategories();
                document.querySelectorAll('.category-item').forEach(item => {
                    item.classList.remove('category-hidden');
                    item.classList.add('category-visible');
                });
            });
        }

        if (hideAllButton) {
            hideAllButton.addEventListener('click', () => {
                this.mapManager.hideAllCategories();
                document.querySelectorAll('.category-item').forEach(item => {
                    item.classList.add('category-hidden');
                    item.classList.remove('category-visible');
                });
            });
        }

        // Remember categories checkbox
        const rememberCategoriesCheckbox = document.getElementById('remember-categories-checkbox') as HTMLInputElement;
        if (rememberCategoriesCheckbox) {
            rememberCategoriesCheckbox.addEventListener('change', () => {
                if (rememberCategoriesCheckbox.checked) {
                    // Implement category remembering logic here if needed
                    console.log('Categories will be remembered');
                }
            });
        }
    }
}

// Initialize the application when the DOM is loaded
let isInitialized = false;
window.addEventListener('DOMContentLoaded', async () => {
    if (isInitialized) {
        console.warn('Application is already initialized');
        return;
    }

    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    try {
        const response = await fetch('/json/locations.json');
        const locationsData = await response.json();
        const app = new App(locationsData);
        await app.initialize();
        isInitialized = true;
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
});
