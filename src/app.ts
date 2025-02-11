import { MapManager } from './map.js';

// Create map container
const mapContainer = document.createElement('div');
mapContainer.id = 'map-container';
document.body.appendChild(mapContainer);

const mapElement = document.createElement('div');
mapElement.id = 'map';
mapContainer.appendChild(mapElement);

// Create and initialize the map
const map = new MapManager();
map.initialize('map').catch(error => {
    console.error('Error initializing map:', error);
});
