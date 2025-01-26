export class InfoMenu {
    private container: HTMLElement;
    private menu: HTMLElement | null = null;
    private currentPage: string = '';
    private escapeListener: ((e: KeyboardEvent) => void) | null = null;

    // Icon size configuration
    private static readonly ICON_SIZES = {
        small: '64px',
        medium: '84px',
        large: '96px',
    };

    // Helper method to create icon container
    private createIconContainer(size: keyof typeof InfoMenu.ICON_SIZES, marginRight = '8px', scale?: number) {
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
        // Create container for the info button and menu
        this.container = document.createElement('div');
        this.container.className = 'info-container';
        this.container.style.cssText = `
            position: absolute;
            top: -10px;
            left: -10px;
            z-index: 10000;
        `;

        // Create info button
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
        const hazardsButton = createNavButton('Hazards', 'hazards');
        const teleportsButton = createNavButton('Teleports', 'teleports');
        const encountersButton = createNavButton('Encounters', 'encounters');
        const entitiesButton = createNavButton('Entities', 'entities');
        const lootButton = createNavButton('Loot', 'loot');
        const npcsButton = createNavButton('NPCs', 'npcs');
        const questsButton = createNavButton('Quests', 'quests');
        const questItemsButton = createNavButton('Quest Items', 'quest-items');
        const routesButton = createNavButton('Routes', 'routes');
        nav.appendChild(runesButton);
        nav.appendChild(relicsButton);
        nav.appendChild(hazardsButton);
        nav.appendChild(teleportsButton);
        nav.appendChild(encountersButton);
        nav.appendChild(entitiesButton);
        nav.appendChild(lootButton);
        nav.appendChild(npcsButton);
        nav.appendChild(questsButton);
        nav.appendChild(questItemsButton);
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
        } else if (page === 'hazards') {
            const hazardsData = await fetch('/json/hazards.json').then(res => res.json());
            content.innerHTML = this.createHazardsContent(hazardsData);
        } else if (page === 'teleports') {
            const teleportsData = await fetch('/json/teleports.json').then(res => res.json());
            content.innerHTML = this.createTeleportsContent(teleportsData);
        } else if (page === 'encounters') {
            const encountersData = await fetch('/json/encounters.json').then(res => res.json());
            content.innerHTML = this.createEncountersContent(encountersData);
        } else if (page === 'entities') {
            const entitiesData = await fetch('/json/entities.json').then(res => res.json());
            content.innerHTML = this.createEntitiesContent(entitiesData);
        } else if (page === 'loot') {
            const lootData = await fetch('/json/loot.json').then(res => res.json());
            content.innerHTML = this.createLootContent(lootData);
        } else if (page === 'npcs') {
            const npcsData = await fetch('/json/npcs.json').then(res => res.json());
            content.innerHTML = this.createNpcsContent(npcsData);
        } else if (page === 'quests') {
            const questsData = await fetch('/json/quests.json').then(res => res.json());
            content.innerHTML = this.createQuestsContent(questsData);
        } else if (page === 'quest-items') {
            const questItemsData = await fetch('/json/quest-items.json').then(res => res.json());
            content.innerHTML = this.createQuestItemsContent(questItemsData);
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
                            <div style="${this.createIconContainer('large')}">
                                <img src="/icons/runes/timerune-${iconName}.png" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                            </div>
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
                        <div style="${this.createIconContainer('large')}">
                            <img src="/icons/relics/${relic.icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                        </div>
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

    private createHazardsContent(data: any): string {
        let html = `
            <div class="hazards-list" style="display: flex; flex-direction: column; gap: 12px;">
        `;
        
        data.hazards.forEach((hazard: any) => {
            html += `
                <div class="hazard-card" style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 10px; font-size: 0.85em;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div style="display: flex; gap: 4px; margin-right: 8px;">
                            ${Array.isArray(hazard.icon) 
                                ? hazard.icon.map((icon: string) => `
                                    <div style="${this.createIconContainer('large', '0', hazard.scale)}">
                                        <img src="/${icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                    </div>
                                `).join('')
                                : `<div style="${this.createIconContainer('large', '0')}">
                                    <img src="/${hazard.icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                   </div>`
                            }
                        </div>
                        <div>
                            <h3 style="color: #d4af37; margin: 0; font-size: 1em;">${hazard.name}</h3>
                            <div style="color: #999; font-size: 0.85em;">
                                ${hazard.location}
                            </div>
                        </div>
                    </div>
                    <div style="margin: 8px 0;">
                        ${hazard.description.map((desc: string) => `
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

    private createTeleportsContent(data: any): string {
        let html = `
            <div class="teleports-list" style="display: flex; flex-direction: column; gap: 12px;">
        `;
        
        data["Teleporation & Portals"].forEach((teleport: any) => {
            html += `
                <div class="teleport-card" style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 10px; font-size: 0.85em;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div style="display: flex; gap: 4px; margin-right: 8px;">
                            ${Array.isArray(teleport.icon) 
                                ? teleport.icon.map((icon: string) => `
                                    <div style="${this.createIconContainer('large', '0')}">
                                        <img src="/icons/${icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                    </div>
                                `).join('')
                                : `<div style="${this.createIconContainer('large', '0')}">
                                    <img src="/icons/${teleport.icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                   </div>`
                            }
                        </div>
                        <div>
                            <h3 style="color: #d4af37; margin: 0; font-size: 1em;">${teleport.name}</h3>
                            <div style="color: #999; font-size: 0.85em;">
                                ${teleport.location}
                            </div>
                        </div>
                    </div>
                    <div style="margin: 8px 0;">
                        ${teleport.description.map((desc: string) => `
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

    private createEncountersContent(data: any): string {
        let html = `
            <div class="encounters-list" style="display: flex; flex-direction: column; gap: 12px;">
        `;
        
        if (data.encounters) {
            data.encounters.forEach((encounter: any) => {
                html += `
                    <div class="encounter-card" style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 10px; font-size: 0.85em;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; gap: 4px; margin-right: 8px;">
                                ${Array.isArray(encounter.icon) 
                                    ? encounter.icon.map((icon: string) => `
                                        <div style="${this.createIconContainer('large', '0')}">
                                            <img src="/icons/${icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                        </div>
                                    `).join('')
                                    : `<div style="${this.createIconContainer('large', '0')}">
                                        <img src="/icons/${encounter.icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                       </div>`
                                }
                            </div>
                            <div>
                                <h3 style="color: #d4af37; margin: 0; font-size: 1em;">${encounter.name}</h3>
                                <div style="color: #999; font-size: 0.85em;">
                                    ${encounter.location}
                                </div>
                            </div>
                        </div>
                        <div style="margin: 8px 0;">
                            ${encounter.description.map((desc: string) => `
                                <div style="color: #999; margin-bottom: 4px;">• ${desc}</div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }

        html += `
            </div>
        `;

        return html;
    }

    private createEntitiesContent(data: any): string {
        let html = `
            <div class="entities-list" style="display: flex; flex-direction: column; gap: 12px;">
        `;
        
        if (data.entities) {
            data.entities.forEach((entity: any) => {
                html += `
                    <div class="entity-card" style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 10px; font-size: 0.85em;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; gap: 4px; margin-right: 8px;">
                                ${Array.isArray(entity.icon) 
                                    ? entity.icon.map((icon: string) => `
                                        <div style="${this.createIconContainer('large', '0')}">
                                            <img src="/icons/${icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                        </div>
                                    `).join('')
                                    : `<div style="${this.createIconContainer('large', '0')}">
                                        <img src="/icons/${entity.icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                       </div>`
                                }
                            </div>
                            <div>
                                <h3 style="color: #d4af37; margin: 0; font-size: 1em;">${entity.name}</h3>
                                <div style="color: #999; font-size: 0.85em;">
                                    ${entity.location}
                                </div>
                            </div>
                        </div>
                        <div style="margin: 8px 0;">
                            ${entity.description.map((desc: string) => `
                                <div style="color: #999; margin-bottom: 4px;">• ${desc}</div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }

        html += `
            </div>
        `;

        return html;
    }

    private createLootContent(data: any): string {
        let html = `
            <div class="loot-list" style="display: flex; flex-direction: column; gap: 12px;">
        `;
        
        if (data.loot) {
            data.loot.forEach((item: any) => {
                html += `
                    <div class="loot-card" style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 10px; font-size: 0.85em;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; gap: 4px; margin-right: 8px;">
                                ${Array.isArray(item.icon) 
                                    ? item.icon.map((icon: string) => `
                                        <div style="${this.createIconContainer('large', '0')}">
                                            <img src="/icons/${icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                        </div>
                                    `).join('')
                                    : `<div style="${this.createIconContainer('large', '0')}">
                                        <img src="/icons/${item.icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                       </div>`
                                }
                            </div>
                            <div>
                                <h3 style="color: #d4af37; margin: 0; font-size: 1em;">${item.name}</h3>
                                <div style="color: #999; font-size: 0.85em;">
                                    ${item.location}
                                </div>
                            </div>
                        </div>
                        <div style="margin: 8px 0;">
                            ${item.description.map((desc: string) => `
                                <div style="color: #999; margin-bottom: 4px;">• ${desc}</div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }

        html += `
            </div>
        `;

        return html;
    }

    private createNpcsContent(data: any): string {
        let html = `
            <div class="npcs-list" style="display: flex; flex-direction: column; gap: 12px;">
        `;
        
        if (data.npcs) {
            data.npcs.forEach((npc: any) => {
                html += `
                    <div class="npc-card" style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 10px; font-size: 0.85em;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; gap: 4px; margin-right: 8px;">
                                ${Array.isArray(npc.icon) 
                                    ? npc.icon.map((icon: string) => `
                                        <div style="${this.createIconContainer('large', '0')}">
                                            <img src="/icons/${icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                        </div>
                                    `).join('')
                                    : `<div style="${this.createIconContainer('large', '0')}">
                                        <img src="/icons/${npc.icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                       </div>`
                                }
                            </div>
                            <div>
                                <h3 style="color: #d4af37; margin: 0; font-size: 1em;">${npc.name}</h3>
                                <div style="color: #999; font-size: 0.85em;">
                                    ${npc.location}
                                </div>
                                ${npc.quests ? `<div style="color: #999; font-size: 0.85em;">Quests: ${npc.quests}</div>` : ''}
                            </div>
                        </div>
                        <div style="margin: 8px 0;">
                            ${npc.description.map((desc: string) => `
                                <div style="color: #999; margin-bottom: 4px;">• ${desc}</div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }

        html += `
            </div>
        `;

        return html;
    }

    private createQuestsContent(data: any): string {
        let html = `
            <div class="quests-list" style="display: flex; flex-direction: column; gap: 12px;">
        `;
        
        if (data.quests) {
            data.quests.forEach((quest: any) => {
                html += `
                    <div class="quest-card" style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 10px; font-size: 0.85em;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; gap: 4px; margin-right: 8px;">
                                ${Array.isArray(quest.icon) 
                                    ? quest.icon.map((icon: string) => `
                                        <div style="${this.createIconContainer('large', '0')}">
                                            <img src="/icons/${icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                        </div>
                                    `).join('')
                                    : `<div style="${this.createIconContainer('large', '0')}">
                                        <img src="/icons/${quest.icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                       </div>`
                                }
                            </div>
                            <div>
                                <h3 style="color: #d4af37; margin: 0; font-size: 1em;">${quest.name}</h3>
                                <div style="color: #999; font-size: 0.85em;">
                                    ${quest.location}
                                </div>
                            </div>
                        </div>
                        <div style="margin: 8px 0;">
                            ${quest.description.map((desc: string) => `
                                <div style="color: #999; margin-bottom: 4px;">• ${desc}</div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }

        html += `
            </div>
        `;

        return html;
    }

    private createQuestItemsContent(data: any): string {
        let html = `
            <div class="quest-items-list" style="display: flex; flex-direction: column; gap: 12px;">
        `;
        
        if (data["quest-items"]) {
            data["quest-items"].forEach((item: any) => {
                html += `
                    <div class="quest-item-card" style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 10px; font-size: 0.85em;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; gap: 4px; margin-right: 8px;">
                                ${Array.isArray(item.icon) 
                                    ? item.icon.map((icon: string) => `
                                        <div style="${this.createIconContainer('large', '0')}">
                                            <img src="/icons/${icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                        </div>
                                    `).join('')
                                    : `<div style="${this.createIconContainer('large', '0')}">
                                        <img src="/icons/${item.icon}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                       </div>`
                                }
                            </div>
                            <div>
                                <h3 style="color: #d4af37; margin: 0; font-size: 1em;">${item.name}</h3>
                                <div style="color: #999; font-size: 0.85em;">
                                    ${item.location}
                                </div>
                            </div>
                        </div>
                        <div style="margin: 8px 0;">
                            ${item.description.map((desc: string) => `
                                <div style="color: #999; margin-bottom: 4px;">• ${desc}</div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }

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

                // Find the button image
                const buttonImg = this.container.querySelector('img');
                
                if (!isVisible) {
                    // Remove glow when opening menu
                    if (buttonImg) {
                        buttonImg.style.filter = 'none';
                    }
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
                    // Restore glow when closing menu
                    if (buttonImg) {
                        buttonImg.style.filter = 'drop-shadow(0 0 4px #d4af37) drop-shadow(0 0 8px #d4af37)';
                    }
                }
            }
        }
    }
}
