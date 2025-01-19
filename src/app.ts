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
// Show loading screen
function showLoading(message: string) {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 9999;
    `;
    loadingScreen.innerHTML = `
        <h2>Loading Atlas...</h2>
        <p id="loading-message">${message}</p>
        <div class="progress-bar" style="width: 200px; height: 20px; background: #333; border-radius: 10px; overflow: hidden;">
            <div id="progress" style="width: 0%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
        </div>
    `;
    document.body.appendChild(loadingScreen);
}

function updateLoadingProgress(progress: number, message?: string) {
    const progressBar = document.getElementById('progress');
    const loadingMessage = document.getElementById('loading-message');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    if (loadingMessage && message) {
        loadingMessage.textContent = message;
    }
}

function hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.5s';
        setTimeout(() => loadingScreen.remove(), 500);
    }
}

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
        showLoading('Loading map data...');
        
        // Load locations data
        updateLoadingProgress(10, 'Loading locations data...');
        const response = await fetch('src/json/locations.json');
        const locationsData = await response.json();
        
        // Create app instance
        updateLoadingProgress(20, 'Initializing application...');
        const app = new App(locationsData);
        
        // Initialize app with progress callback
        await app.initialize((progress, message) => {
            updateLoadingProgress(progress, message);
        });
        
        // Hide loading screen
        updateLoadingProgress(100, 'Ready!');
        setTimeout(hideLoading, 500);
        
        isInitialized = true;
    } catch (error) {
        console.error('Failed to initialize application:', error);
        updateLoadingProgress(100, 'Error loading map. Please refresh the page.');
    }
});
