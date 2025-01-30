import { CreateIconContainer } from './types/InfoMenuTypes.js';
import { createErrorMessage, createLoadingMessage } from './utils/errorHandling.js';
import { GargishLetterData, GargishWordDefinition } from './types/LanguageTypes.js';

export class LanguageInfoMenu {
    private container: HTMLElement;
    private menu: HTMLElement | null = null;
    private currentTab: string = 'A';
    private escapeListener: ((e: KeyboardEvent) => void) | null = null;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'language-info-container';
        this.container.style.cssText = `
            position: absolute;
            top: 86px;
            left: 0;
            z-index: 100001;
        `;

        const infoButton = document.createElement('button');
        infoButton.className = 'language-info-button';
        infoButton.style.cssText = `
            background: transparent;
            border: none;
            padding: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        const buttonImg = document.createElement('img');
        buttonImg.src = '/icons/language.png';
        buttonImg.style.cssText = `
            width: 60px;
            height: 60px;
            image-rendering: pixelated;
            filter: drop-shadow(0 0 4px #3498db) 
                   drop-shadow(0 0 8px #3498db);
        `;
        infoButton.appendChild(buttonImg);
        
        infoButton.addEventListener('click', () => {
            buttonImg.style.filter = 'none';
            this.toggleMenu();
        });

        this.container.appendChild(infoButton);
    }

    private createMenu() {
        const backdrop = document.createElement('div');
        backdrop.className = 'language-info-menu-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            z-index: 300000;
        `;
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                this.toggleMenu();
            }
        });

        this.menu = document.createElement('div');
        this.menu.className = 'language-info-menu';
        this.menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 300001;
            background: #262626;
            border: 1px solid #d4af37;
            width: min(1600px, 95vw);
            max-height: 90vh;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #d4af37 #262626;
            color: #fff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            font-size: 0.9em;
            padding: 12px 50px 12px 20px;
        `;

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: transparent;
            border: none;
            color: #999;
            font-size: 20px;
            cursor: pointer;
            padding: 5px;
            line-height: 1;
            transition: all 0.2s ease;
            z-index: 300002;
        `;
        closeButton.addEventListener('click', () => this.toggleMenu());
        closeButton.addEventListener('mouseover', () => closeButton.style.color = '#fff');
        closeButton.addEventListener('mouseout', () => closeButton.style.color = '#999');
        this.menu.appendChild(closeButton);

        const content = document.createElement('div');
        content.className = 'language-info-content';
        content.innerHTML = createLoadingMessage();

        this.menu.appendChild(content);
        backdrop.appendChild(this.menu);
        document.body.appendChild(backdrop);

        this.loadContent();
    }

    private async loadContent() {
        const content = this.menu?.querySelector('.language-info-content');
        if (!content) return;

        try {
            const [letterData, suffixes] = await Promise.all([
                fetch(`/json/language/gargish/${this.currentTab.toLowerCase()}.json`).then(res => res.json()),
                fetch('/json/language/gargish_suffixes.json').then(res => res.json())
            ]);

            // Create tabs
            const nav = document.createElement('div');
            nav.className = 'letter-tabs';

            // Add letter tabs A-Z
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
                const button = document.createElement('button');
                button.textContent = letter;
                button.style.cssText = `
                    background: ${this.currentTab === letter ? '#d4af37' : 'transparent'};
                    border: 1px solid ${this.currentTab === letter ? '#d4af37' : '#333'};
                    color: ${this.currentTab === letter ? '#000' : '#999'};
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;
                button.addEventListener('click', () => this.showTab(letter));
                nav.appendChild(button);
            });

            // Add Suffixes tab
            const suffixesButton = document.createElement('button');
            suffixesButton.textContent = 'Suffixes';
            suffixesButton.className = 'suffixes';
            suffixesButton.style.cssText = `
                background: ${this.currentTab === 'Suffixes' ? '#d4af37' : 'transparent'};
                border: 1px solid ${this.currentTab === 'Suffixes' ? '#d4af37' : '#333'};
                color: ${this.currentTab === 'Suffixes' ? '#000' : '#999'};
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            suffixesButton.addEventListener('click', () => this.showTab('Suffixes'));
            nav.appendChild(suffixesButton);

            content.innerHTML = '';
            content.appendChild(nav);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'language-content';
            contentDiv.style.cssText = 'display: flex; flex-direction: column; gap: 20px; margin-top: 20px;';

            if (this.currentTab === 'Suffixes') {
                contentDiv.innerHTML = this.createSuffixesContent(suffixes);
            } else {
                contentDiv.innerHTML = this.createExamplesContent(letterData);
            }

            content.appendChild(contentDiv);
        } catch (error) {
            console.error('Error loading language data:', error);
            content.innerHTML = createErrorMessage('Error loading language data. Please try again.');
        }
    }

    private showTab(tab: string) {
        this.currentTab = tab;
        this.loadContent();
    }

    private createExamplesContent(letterData: GargishLetterData): string {
        if (Object.keys(letterData).length === 0) {
            return `<div style="color: #999; text-align: center;">No words found starting with '${this.currentTab}'</div>`;
        }

        return Object.entries(letterData).map(([word, definition]) => {
            let definitionHtml = '';
            if (typeof definition === 'string') {
                definitionHtml = `<div>${definition}</div>`;
            } else if (Array.isArray(definition)) {
                definitionHtml = definition.map(def => `<div>${def}</div>`).join('');
            } else if (typeof definition === 'object' && definition !== null) {
                const wordDef = definition as GargishWordDefinition;
                definitionHtml = `
                    ${wordDef.alternates ? `<div style="color: #666;">Alternates: ${wordDef.alternates.join(', ')}</div>` : ''}
                    ${wordDef.definitions ? wordDef.definitions.map(def => `<div>${def}</div>`).join('') : ''}
                `;
            }

            return `
                <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 16px;">
                    <h3 style="color: #d4af37; margin: 0 0 12px 0; font-size: 1em;">${word}</h3>
                    <div style="color: #999;">
                        ${definitionHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    private createSuffixesContent(suffixData: any): string {
        return suffixData.suffixes.map(suffix => `
            <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 16px;">
                <h3 style="color: #d4af37; margin: 0 0 12px 0; font-size: 1em;">${suffix.suffix}</h3>
                <div style="color: #999;">
                    <div>Meaning: ${suffix.meaning}</div>
                    <div>Examples:</div>
                    <ul style="margin-top: 4px; margin-left: 20px;">
                        ${suffix.examples.map(ex => `<li>${ex}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');
    }

    public mount(parent: HTMLElement) {
        parent.appendChild(this.container);
    }

    private toggleMenu() {
        if (!this.menu) {
            this.createMenu();
        }

        if (this.menu) {
            const backdrop = this.menu.parentElement;
            if (backdrop) {
                const isVisible = backdrop.style.display === 'block';
                backdrop.style.display = isVisible ? 'none' : 'block';

                const buttonImg = this.container.querySelector('img');
                
                if (!isVisible) {
                    if (buttonImg) buttonImg.style.filter = 'none';
                    this.escapeListener = (e: KeyboardEvent) => {
                        if (e.key === 'Escape') this.toggleMenu();
                    };
                    document.addEventListener('keydown', this.escapeListener);
                } else {
                    if (this.escapeListener) {
                        document.removeEventListener('keydown', this.escapeListener);
                        this.escapeListener = null;
                    }
                    if (buttonImg) {
                        buttonImg.style.filter = 'drop-shadow(0 0 4px #3498db) drop-shadow(0 0 8px #3498db)';
                    }
                }
            }
        }
    }
}
