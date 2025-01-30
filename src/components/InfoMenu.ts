import { IconSizes, IconSize, CreateIconContainer } from './types/InfoMenuTypes.js';
import { navigationButtons, defaultPage, contentMapping } from './config/navigation.js';
import { contentCreators } from './config/contentCreators.js';
import { createErrorMessage, createLoadingMessage, createComingSoonMessage } from './utils/errorHandling.js';

export class InfoMenu {
    private container: HTMLElement;
    private menu: HTMLElement | null = null;
    private currentPage: string = '';
    private escapeListener: ((e: KeyboardEvent) => void) | null = null;

    private static readonly ICON_SIZES: IconSizes = {
        small: '36px',
        medium: '50px',
        large: '60px',
    };

    private createIconContainer(size: IconSize, marginRight = '8px', scale?: number): string {
        const baseSize = InfoMenu.ICON_SIZES[size];
        const containerSize = scale ? `${parseInt(baseSize) * (scale/100)}px` : baseSize;
        return `
            width: ${containerSize};
            height: ${containerSize};
            margin-right: ${marginRight};
            display: flex;
            align-items: center;
            justify-content: center;
        `;
    }

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'info-container';
        this.container.style.cssText = `
            position: absolute;
            top: 0;
            left: 20;
            z-index: 100000;
        `;

        const infoButton = document.createElement('button');
        infoButton.className = 'info-button';
        const buttonImg = document.createElement('img');
        buttonImg.src = '/icons/click-me.png';
        buttonImg.style.cssText = `
            width: ${InfoMenu.ICON_SIZES.large};
            height: ${InfoMenu.ICON_SIZES.large};
            image-rendering: pixelated;
            filter: drop-shadow(0 0 4px #d4af37) 
                   drop-shadow(0 0 8px #d4af37);
        `;
        infoButton.appendChild(buttonImg);
        
        infoButton.style.cssText = `
            background: transparent;
            border: none;
            padding: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        infoButton.addEventListener('click', () => {
            buttonImg.style.filter = 'none';
            this.toggleMenu();
        });

        this.container.appendChild(infoButton);
    }

    private createMenu() {
        const backdrop = document.createElement('div');
        backdrop.className = 'info-menu-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            z-index: 200000;
        `;
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                this.toggleMenu();
            }
        });

        this.menu = document.createElement('div');
        this.menu.className = 'info-menu';
        this.menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;  
            transform: translate(-50%, -50%);
            z-index: 200001;
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
        
        this.menu.style.setProperty('--scrollbar-color', '#d4af37');
        this.menu.style.setProperty('--scrollbar-bg', '#262626');
        
        const scrollbarStyles = document.createElement('style');
        scrollbarStyles.textContent = `
            .info-menu::-webkit-scrollbar {
                width: 8px;
            }
            .info-menu::-webkit-scrollbar-track {
                background: var(--scrollbar-bg);
            }
            .info-menu::-webkit-scrollbar-thumb {
                background-color: var(--scrollbar-color);
                border-radius: 4px;
                border: 2px solid var(--scrollbar-bg);
            }
        `;
        document.head.appendChild(scrollbarStyles);

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
            z-index: 200002;
        `;
        closeButton.addEventListener('click', () => this.toggleMenu());
        closeButton.addEventListener('mouseover', () => closeButton.style.color = '#fff');
        closeButton.addEventListener('mouseout', () => closeButton.style.color = '#999');
        this.menu.appendChild(closeButton);

        const nav = document.createElement('div');
        nav.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 12px;
            border-bottom: 1px solid #d4af37;
            padding-bottom: 8px;
        `;

        const createNavButton = (text: string, page: string) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.style.cssText = `
                background: transparent;
                border: 1px solid #333;
                color: #999;
                padding: 6px 10px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.9em;
            `;
            button.addEventListener('click', () => this.showPage(page));
            button.addEventListener('mouseover', () => {
                if (this.currentPage !== page) {
                    button.style.background = '#333';
                    button.style.borderColor = '#444';
                    button.style.color = '#fff';
                }
            });
            button.addEventListener('mouseout', () => {
                if (this.currentPage !== page) {
                    button.style.background = 'transparent';
                    button.style.borderColor = '#333';
                    button.style.color = '#999';
                }
            });
            return button;
        };

        navigationButtons.forEach(({ text, page }) => {
            nav.appendChild(createNavButton(text, page));
        });

        const content = document.createElement('div');
        content.className = 'info-content';

        this.menu.appendChild(nav);
        this.menu.appendChild(content);
        backdrop.appendChild(this.menu);
        document.body.appendChild(backdrop);

        this.showPage(defaultPage);
    }

    private async showPage(page: string) {
        if (!this.menu) return;

        const buttons = this.menu.querySelectorAll('button');
        buttons.forEach(button => {
            if (button.textContent?.toLowerCase().includes(page)) {
                button.style.background = '#d4af37';
                button.style.borderColor = '#d4af37';
                button.style.color = '#000';
            } else {
                button.style.background = 'transparent';
                button.style.borderColor = '#333';
                button.style.color = '#999';
            }
        });

        const content = this.menu.querySelector('.info-content');
        if (!content) return;

        this.currentPage = page;
        content.innerHTML = createLoadingMessage();

        try {
            const creator = contentCreators[page];
            if (creator) {
                if (page === 'language') {
                    const html = await creator({}, this.createIconContainer.bind(this));
                    content.innerHTML = html;
                } else {
                    const jsonPath = contentMapping[page];
                    if (jsonPath) {
                        const data = await fetch(jsonPath).then(res => res.json());
                        const html = await creator(data, this.createIconContainer.bind(this));
                        content.innerHTML = html;
                    } else {
                        content.innerHTML = createComingSoonMessage(page);
                    }
                }
            } else {
                content.innerHTML = createComingSoonMessage(page);
            }
        } catch (error) {
            console.error(`Error loading content for page ${page}:`, error);
            content.innerHTML = createErrorMessage();
        }
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
                        buttonImg.style.filter = 'drop-shadow(0 0 4px #d4af37) drop-shadow(0 0 8px #d4af37)';
                    }
                }
            }
        }
    }
}
