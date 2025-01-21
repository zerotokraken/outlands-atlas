export class InfoMenu {
    private container: HTMLElement;
    private menu: HTMLElement | null = null;
    private currentPage: string = '';
    private escapeListener: ((e: KeyboardEvent) => void) | null = null;

    constructor() {
        // Create container for the info button and menu
        this.container = document.createElement('div');
        this.container.className = 'info-container';
        this.container.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 10000;
        `;

        // Create info button
        const infoButton = document.createElement('button');
        infoButton.className = 'info-button';
        infoButton.innerHTML = 'ℹ️';
        infoButton.style.cssText = `
            background: #262626;
            border: 1px solid #333;
            color: #fff;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s ease;
        `;
        infoButton.addEventListener('click', () => this.toggleMenu());
        infoButton.addEventListener('mouseover', () => {
            infoButton.style.background = '#333';
            infoButton.style.borderColor = '#444';
        });
        infoButton.addEventListener('mouseout', () => {
            infoButton.style.background = '#262626';
            infoButton.style.borderColor = '#333';
        });

        this.container.appendChild(infoButton);
    }

    private createMenu() {
        // Create backdrop
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
            z-index: 10001;
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
            z-index: 10002;
            background: #262626;
            border: 1px solid #d4af37;
            border-radius: 4px;
            padding: 12px 50px 12px 20px;
            width: min(1600px, 95vw);
            max-height: 90vh;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #d4af37 #262626;
            color: #fff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            font-size: 0.9em;
        `;
        
        // Add webkit scrollbar styles
        this.menu.style.setProperty('--scrollbar-color', '#d4af37');
        this.menu.style.setProperty('--scrollbar-bg', '#262626');
        
        // Add scrollbar styles to document
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

        // Create close button
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
            z-index: 10003;
        `;
        closeButton.addEventListener('click', () => this.toggleMenu());
        closeButton.addEventListener('mouseover', () => {
            closeButton.style.color = '#fff';
        });
        closeButton.addEventListener('mouseout', () => {
            closeButton.style.color = '#999';
        });
        this.menu.appendChild(closeButton);

        // Create navigation
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

        const runesButton = createNavButton('Time Runes', 'runes');
        const relicsButton = createNavButton('Time Relics', 'relics');
        nav.appendChild(runesButton);
        nav.appendChild(relicsButton);

        // Create content container
        const content = document.createElement('div');
        content.className = 'info-content';

        this.menu.appendChild(nav);
        this.menu.appendChild(content);
        backdrop.appendChild(this.menu);
        this.container.appendChild(backdrop);

        // Show runes page by default
        this.showPage('runes');
    }

    private async showPage(page: string) {
        if (!this.menu) return;

        // Update nav buttons
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

        if (page === 'runes') {
            const runesData = await fetch('/json/runes.json').then(res => res.json());
            content.innerHTML = this.createRunesContent(runesData);
        } else if (page === 'relics') {
            const relicsData = await fetch('/json/relics.json').then(res => res.json());
            content.innerHTML = this.createRelicsContent(relicsData);
        }
    }

    private createRunesContent(data: any): string {
        let html = '';
        
        data.circles.forEach((circle: any) => {
            html += `
                <div class="circle-section" style="margin-bottom: 20px;">
                    <h2 style="color: #d4af37; margin-bottom: 10px; font-size: 1.1em;">${circle.name}</h2>
                    <div class="runes-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px;">
            `;

            circle.runes.forEach((rune: any) => {
                const iconName = rune.name.toLowerCase().replace(/\s+/g, '');
                html += `
                    <div class="rune-card" style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 10px; font-size: 0.85em;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <img src="/icons/runes/timerune-${iconName}.png" style="width: 28px; height: 28px; margin-right: 8px;">
                            <div>
                                <h3 style="color: #d4af37; margin: 0; font-size: 1em;">${rune.name}</h3>
                                <div style="color: #999; font-style: italic; font-size: 0.85em;">${rune.wordsOfPower}</div>
                            </div>
                        </div>
                        <div style="margin: 8px 0;">
                            <div style="color: #ccc; margin-bottom: 4px;">Description:</div>
                            ${rune.description.map((desc: string) => `<div style="color: #999; margin-left: 8px;">• ${desc}</div>`).join('')}
                        </div>
                        <div style="margin: 8px 0;">
                            <div style="color: #ccc; margin-bottom: 4px;">Upgrades:</div>
                            ${rune.upgrades.map((upgrade: string) => `<div style="color: #999; margin-left: 8px;">• ${upgrade}</div>`).join('')}
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        return html;
    }

    private createRelicsContent(data: any): string {
        let html = `
            <div class="relics-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px;">
        `;
        
        data.relics.forEach((relic: any) => {
            html += `
                <div class="relic-card" style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 10px; font-size: 0.85em;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <img src="/icons/relics/${relic.icon}" style="width: 28px; height: 28px; margin-right: 8px;">
                        <div>
                            <h3 style="color: #d4af37; margin: 0; font-size: 1em;">${relic.name}</h3>
                            <div style="color: #999; font-size: 0.85em;">
                                ${relic.charges} Charges • ${relic.cooldown}
                            </div>
                        </div>
                    </div>
                    <div style="margin: 8px 0;">
                        ${relic.description.map((desc: string) => `
                            <div style="color: #999; margin-bottom: 4px;">• ${desc}</div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        html += `
            </div>
        `;

        return html;
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
                
                if (!isVisible) {
                    // Add escape key listener when opening
                    this.escapeListener = (e: KeyboardEvent) => {
                        if (e.key === 'Escape') {
                            this.toggleMenu();
                        }
                    };
                    document.addEventListener('keydown', this.escapeListener);
                } else {
                    // Remove escape key listener when closing
                    if (this.escapeListener) {
                        document.removeEventListener('keydown', this.escapeListener);
                        this.escapeListener = null;
                    }
                }
            }
        }
    }
}
