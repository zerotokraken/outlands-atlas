import { cardStyle, headerStyle, subtitleStyle, descriptionStyle, flexRowStyle } from './styles.js';
import { CreateIconContainer } from '../types/InfoMenuTypes.js';

export interface CardData {
    title: string;
    subtitle: string;
    description: string | string[];
    icon?: string;
    location?: string;
    additionalInfo?: { [key: string]: string };
    customIcons?: string;
    scale?: number;
}

export function createCard(
    data: CardData,
    createIconContainer: CreateIconContainer,
    scale?: number
): string {
    const { title, subtitle, description, icon, location, additionalInfo, customIcons } = data;

    const descriptionHtml = Array.isArray(description)
        ? description.map(desc => `<div style="color: #999; margin-bottom: 4px;">• ${desc}</div>`).join('')
        : description;

    const additionalInfoHtml = additionalInfo
        ? Object.entries(additionalInfo)
            .map(([key, value]) => `<div style="${subtitleStyle}">${key}: ${value}</div>`)
            .join('')
        : '';

    return `
        <div class="card" style="${cardStyle}">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <div style="display: flex; justify-content: center; gap: 10px;">
                    ${customIcons || (icon ? `
                        <div style="${createIconContainer('large', '0', scale)}">
                            <img src="${icon}" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;">
                        </div>
                    ` : '')}
                </div>
                <div style="text-align: center;">
                    <h3 style="${headerStyle}">${title}</h3>
                    ${location ? `<div style="${subtitleStyle}">${location}</div>` : ''}
                    ${additionalInfoHtml}
                </div>
                <div style="${descriptionStyle}">
                    ${descriptionHtml}
                </div>
            </div>
        </div>
    `;
}

export function createGrid(cards: string[]): string {
    return `
        <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px;">
            ${cards.join('')}
        </div>
    `;
}

export function createSection(title: string, content: string): string {
    return `
        <div class="section" style="margin-bottom: 20px;">
            <h2 style="color: #d4af37; margin-bottom: 10px; font-size: 1.1em;">${title}</h2>
            ${content}
        </div>
    `;
}
