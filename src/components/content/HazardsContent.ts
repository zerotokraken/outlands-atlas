import { CreateIconContainer, HazardsContent, HazardData } from '../types/InfoMenuTypes.js';
import { createCard, createGrid, createSection, CardData } from '../utils/uiHelpers.js';

export function createHazardsContent(data: HazardsContent, createIconContainer: CreateIconContainer): string {
    const createHazardCard = (hazard: HazardData): CardData => ({
        title: hazard.name,
        subtitle: hazard.location,
        description: hazard.description,
        icon: Array.isArray(hazard.icon) ? hazard.icon[0] : hazard.icon,
        location: hazard.location,
        additionalInfo: hazard.scale ? { 'Scale': `${hazard.scale}%` } : undefined
    });

    const cards = data.hazards.map(hazard => createCard(createHazardCard(hazard), createIconContainer, hazard.scale));
    const grid = createGrid(cards);
    const section = createSection('Hazards', grid);

    return `
        <div class="hazards-content" style="display: flex; flex-direction: column; gap: 20px;">
            ${section}
        </div>
    `;
}
