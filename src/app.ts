import { MapManager } from './map.js';

// Create map container
const mapContainer = document.createElement('div');
mapContainer.id = 'map-container';
document.body.appendChild(mapContainer);

const mapElement = document.createElement('div');
mapElement.id = 'map';
mapContainer.appendChild(mapElement);

// Load locations data and initialize map
fetch('./json/locations.json')
    .then(response => response.json())
    .then(locationsData => {
        // Create and initialize the map
        const map = new MapManager(locationsData);
        map.initialize('map');
    })
    .catch(error => {
        console.error('Error loading locations data:', error);
    });
