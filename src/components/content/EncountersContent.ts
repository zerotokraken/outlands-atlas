import { CreateIconContainer, EncountersContent, EncounterData } from '../types/InfoMenuTypes.js';
import { createCard, createGrid, createSection, CardData } from '../utils/uiHelpers.js';

export function createEncountersContent(data: EncountersContent, createIconContainer: CreateIconContainer): string {
    const createEncounterCard = (encounter: EncounterData): CardData => {
        return {
            title: encounter.name,
            subtitle: '',
            description: encounter.description,
            icon: encounter.icon,
            location: encounter.location,
            customIcons: undefined
        };
    };

    const cards = data.encounters.map(encounter => createCard(createEncounterCard(encounter), createIconContainer, encounter.scale));
    const grid = createGrid(cards);
    const section = createSection('Encounters', grid);

    return `
        <div class="encounters-content" style="display: flex; flex-direction: column; gap: 20px;">
            ${section}
        </div>
    `;
}
