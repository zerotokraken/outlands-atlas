import { CreateIconContainer, HazardsContent, HazardData } from '../types/InfoMenuTypes.js';
import { createCard, createGrid, createSection, CardData } from '../utils/uiHelpers.js';

export function createHazardsContent(data: HazardsContent, createIconContainer: CreateIconContainer): string {
    const createHazardCard = (hazard: HazardData): CardData => {
        if (hazard.secondaryIcon) {
            const icons = `<div style="${createIconContainer('large', '10px', hazard.scale)}"><img src="${hazard.icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;"></div><div style="${createIconContainer('large', undefined, hazard.scale)}"><img src="${hazard.secondaryIcon}" style="max-width: 100%; max-height: 100%; object-fit: contain;"></div>`;
            return {
                title: hazard.name,
                subtitle: '',
                description: hazard.description,
                icon: undefined,
                location: hazard.location,
                customIcons: icons
            };
        }

        return {
            title: hazard.name,
            subtitle: '',
            description: hazard.description,
            icon: hazard.icon,
            location: hazard.location,
            customIcons: undefined
        };
    };

    const cards = data.hazards.map(hazard => createCard(createHazardCard(hazard), createIconContainer, hazard.scale));
    const grid = createGrid(cards);
    const section = createSection('Hazards', grid);

    return `
        <div class="hazards-content" style="display: flex; flex-direction: column; gap: 20px;">
            ${section}
        </div>
    `;
}
