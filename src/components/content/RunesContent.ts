import { CreateIconContainer, RunesContent, RuneData } from '../types/InfoMenuTypes.js';
import { createCard, createGrid, createSection, CardData } from '../utils/uiHelpers.js';

export function createRunesContent(data: RunesContent, createIconContainer: CreateIconContainer): string {
    const createRuneCard = (rune: RuneData): CardData => {
        const iconName = rune.name.toLowerCase().replace(/\s+/g, '');
        return {
            title: rune.name,
            subtitle: rune.wordsOfPower,
            description: [
                ...rune.description.map(desc => desc),
                '',
                'Upgrades:',
                ...rune.upgrades.map(upgrade => upgrade)
            ],
            icon: `/icons/runes/timerune-${iconName}.png`
        };
    };

    const sections = data.circles.map(circle => {
        const cards = circle.runes.map(rune => createCard(createRuneCard(rune), createIconContainer));
        const grid = createGrid(cards);
        return createSection(circle.name, grid);
    });

    return `
        <div class="runes-content" style="display: flex; flex-direction: column; gap: 20px;">
            ${sections.join('')}
        </div>
    `;
}
