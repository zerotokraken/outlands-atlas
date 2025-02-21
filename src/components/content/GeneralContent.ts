import { GeneralContent, GeneralItemData, CreateIconContainer } from '../types/InfoMenuTypes.js';
import { createCard, createGrid, createSection, CardData } from '../utils/uiHelpers.js';

export function createGeneralContent(data: GeneralContent, createIconContainer: CreateIconContainer): string {
    const createGeneralCard = (item: GeneralItemData): CardData => {
        return {
            title: item.name,
            subtitle: '',
            description: item.description,
            location: `Location: ${item.location}`,
            customIcons: undefined
        };
    };

    return Object.entries(data).map(([category, items]) => {
        const cards = items.map(item => createCard(createGeneralCard(item), createIconContainer));
        const grid = createGrid(cards);
        const section = createSection(category, grid);

        return `
            <div class="general-content" style="display: flex; flex-direction: column; gap: 20px;">
                ${section}
            </div>
        `;
    }).join('');
}
