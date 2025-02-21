import { LootContent, LootItemData, CreateIconContainer } from '../types/InfoMenuTypes.js';
import { createCard, createGrid, createSection, CardData } from '../utils/uiHelpers.js';

export function createLootContent(data: LootContent, createIconContainer: CreateIconContainer): string {
    const createLootCard = (item: LootItemData): CardData => {
        return {
            title: item.name,
            subtitle: '',
            description: item.description,
            location: `Sources: ${item.sources}`,
            customIcons: `
                <div style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 10px;">
                    <div style="width: 240px; height: 240px; display: flex; justify-content: center; align-items: center;">
                        <img src="${item.icon[0]}" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                </div>
            `
        };
    };

    const cards = data.loot.map(item => createCard(createLootCard(item), createIconContainer));
    const grid = createGrid(cards);
    const section = createSection('Loot', grid);

    return `
        <div class="loot-content" style="display: flex; flex-direction: column; gap: 5px;">
            ${section}
        </div>
    `;
}
