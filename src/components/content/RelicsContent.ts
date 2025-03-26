import { CreateIconContainer, RelicsContent, RelicData } from '../types/InfoMenuTypes.js';
import { createCard, createGrid, createSection, CardData } from '../utils/uiHelpers.js';

export function createRelicsContent(data: RelicsContent, createIconContainer: CreateIconContainer): string {
    const createRelicCard = (relic: RelicData): CardData => ({
        title: relic.name,
        subtitle: `${relic.charges} Charges • ${relic.cooldown}`,
        description: relic.description,
        icon: `/icons/relics/${relic.icon}`,
        additionalInfo: {
            'Charges': relic.charges,
            'Cooldown': relic.cooldown
        },
        scale: relic.scale
    });

    const cards = data.relics.map(relic => createCard(createRelicCard(relic), createIconContainer, relic.scale));
    const grid = createGrid(cards);
    const section = createSection('Time Relics', grid);

    return `
        <div class="relics-content" style="display: flex; flex-direction: column; gap: 20px;">
            ${section}
        </div>
    `;
}
