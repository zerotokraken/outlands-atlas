import { CreateIconContainer, TabletsContent } from '../types/InfoMenuTypes.js';

export const createTabletsContent = (data: TabletsContent, createIconContainer: CreateIconContainer): string => {
    return `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <h2 style="color: #d4af37; margin-bottom: 10px; font-size: 1.1em;">Gargish Tablets</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px;">
                ${data.tablets.map(tablet => `
                    <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 16px;">
                        <h3 style="color: #d4af37; margin: 0 0 12px 0; font-size: 1em;">${tablet.location}</h3>
                        <div style="color: #999;">
                            <div style="margin-bottom: 8px;">
                                <strong>Text:</strong> ${tablet.text}
                            </div>
                            <div style="margin-bottom: 8px;">
                                <strong>Translation:</strong> ${tablet.translation}
                            </div>
                            <div>
                                <strong>Notes:</strong> ${tablet.notes}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};
