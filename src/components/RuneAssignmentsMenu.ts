import { IconSizes } from './types/InfoMenuTypes.js';

type Role = 'Tank' | 'Melee DPS' | 'Ranged DPS' | 'Support' | 'Bard';

interface RuneAssignment {
    playerName: string;
    role: Role;
    runes: [string, string, string];
}

interface RuneCount {
    [key: string]: number;
}

export class RuneAssignmentsMenu {
    private container: HTMLElement;
    private menu: HTMLElement | null = null;
    private escapeListener: ((e: KeyboardEvent) => void) | null = null;
    private assignments: RuneAssignment[] = [];
    private statsRow: HTMLElement | null = null;

    private static readonly ICON_SIZES: IconSizes = {
        small: '36px',
        medium: '50px',
        large: '60px',
    };

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'rune-assignments-container';
        this.container.style.cssText = `
            position: absolute;
            top: 162px;
            left: 3px;
            z-index: 100000;
        `;

        const plannerButton = document.createElement('button');
        plannerButton.className = 'planner-button';
        const buttonImg = document.createElement('img');
        buttonImg.src = '/icons/planner.png';
        buttonImg.style.cssText = `
            width: ${RuneAssignmentsMenu.ICON_SIZES.large};
            height: ${RuneAssignmentsMenu.ICON_SIZES.large};
            image-rendering: pixelated;
            filter: drop-shadow(0 0 4px #90EE90) 
                   drop-shadow(0 0 8px #90EE90);
        `;
        plannerButton.appendChild(buttonImg);
        
        plannerButton.style.cssText = `
            background: transparent;
            border: none;
            padding: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        plannerButton.addEventListener('click', () => {
            buttonImg.style.filter = 'none';
            this.toggleMenu();
        });

        this.container.appendChild(plannerButton);
        this.loadAssignments();
    }

    private loadAssignments() {
        const saved = localStorage.getItem('runeAssignments');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Filter out invalid entries
                this.assignments = parsed.filter((assignment: RuneAssignment) => 
                    assignment && 
                    assignment.playerName && 
                    assignment.playerName.trim() !== '' &&
                    assignment.role &&
                    Array.isArray(assignment.runes) &&
                    assignment.runes.length === 3
                );
                // Save filtered assignments back
                this.saveAssignments();
            } catch (e) {
                console.error('Failed to load rune assignments:', e);
                this.assignments = [];
            }
        }
    }

    private saveAssignments() {
        localStorage.setItem('runeAssignments', JSON.stringify(this.assignments));
    }

    private async loadRuneOptions(): Promise<string[]> {
        try {
            const response = await fetch('./json/runes.json');
            const data = await response.json();
            const runes: string[] = [];
            
            data.circles.forEach((circle: any) => {
                circle.runes.forEach((rune: any) => {
                    runes.push(rune.name);
                });
            });
            
            return runes.sort();
        } catch (error) {
            console.error('Failed to load runes:', error);
            return [];
        }
    }

    private getAssignedRuneCounts(): RuneCount {
        const counts: RuneCount = {};
        this.assignments.forEach(assignment => {
            assignment.runes.forEach(rune => {
                if (rune) {
                    counts[rune] = (counts[rune] || 0) + 1;
                }
            });
        });
        return counts;
    }

    private async updateRuneStats() {
        if (!this.statsRow) return;

        const allRunes = await this.loadRuneOptions();
        const assignedRunes = this.getAssignedRuneCounts();
        const unassignedRunes = allRunes.filter(rune => !assignedRunes[rune]);
        const assignedRunesList = Object.entries(assignedRunes)
            .map(([rune, count]) => `${rune}(${count})`)
            .join(', ');

        this.statsRow.innerHTML = `
            <td colspan="6" style="padding: 10px; background: #1a1a1a;">
                <div style="margin-bottom: 10px;">
                    <strong style="color: #90EE90;">Unassigned Runes:</strong> 
                    <span style="color: #ccc;">${unassignedRunes.join(', ') || 'None'}</span>
                </div>
                <div>
                    <strong style="color: #90EE90;">Assigned Runes:</strong> 
                    <span style="color: #ccc;">${assignedRunesList || 'None'}</span>
                </div>
            </td>
        `;
    }

    private async createMenu() {
        const backdrop = document.createElement('div');
        backdrop.className = 'rune-assignments-backdrop';
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
        this.menu.className = 'rune-assignments-menu';
        this.menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;  
            transform: translate(-50%, -50%);
            z-index: 200001;
            background: #262626;
            border: 1px solid #90EE90;
            width: min(1200px, 95vw);
            max-height: 90vh;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #90EE90 #262626;
            color: #fff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            font-size: 0.9em;
            padding: 12px 50px 12px 20px;
        `;
        
        this.menu.style.setProperty('--scrollbar-color', '#90EE90');
        this.menu.style.setProperty('--scrollbar-bg', '#262626');

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

        const title = document.createElement('h2');
        title.textContent = 'Rune Assignments';
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: #90EE90;
            font-size: 1.5em;
        `;
        this.menu.appendChild(title);

        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        `;

        const thead = document.createElement('thead');

        // Create stats row
        this.statsRow = document.createElement('tr');
        thead.appendChild(this.statsRow);
        await this.updateRuneStats();

        // Create header row
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th style="text-align: left; padding: 10px; border-bottom: 1px solid #90EE90;">Player Name</th>
            <th style="text-align: left; padding: 10px; border-bottom: 1px solid #90EE90;">Role</th>
            <th style="text-align: left; padding: 10px; border-bottom: 1px solid #90EE90;">Rune 1</th>
            <th style="text-align: left; padding: 10px; border-bottom: 1px solid #90EE90;">Rune 2</th>
            <th style="text-align: left; padding: 10px; border-bottom: 1px solid #90EE90;">Rune 3</th>
            <th style="text-align: center; padding: 10px; border-bottom: 1px solid #90EE90;">Actions</th>
        `;
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        for (const [index, assignment] of this.assignments.entries()) {
            const tr = await this.createAssignmentRow(assignment, index);
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);

        this.menu.appendChild(table);

        const addButton = document.createElement('button');
        addButton.textContent = 'Add Player';
        addButton.style.cssText = `
            background: #90EE90;
            border: none;
            color: #000;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.2s ease;
        `;
        addButton.addEventListener('click', async () => {
            await this.addNewAssignment();
            await this.updateRuneStats();
        });
        addButton.addEventListener('mouseover', () => {
            addButton.style.backgroundColor = '#A8F9A8';
        });
        addButton.addEventListener('mouseout', () => {
            addButton.style.backgroundColor = '#90EE90';
        });
        this.menu.appendChild(addButton);

        // Add Clear All button
        const clearAllButton = document.createElement('button');
        clearAllButton.textContent = 'Clear All';
        clearAllButton.style.cssText = `
            background: #ff4444;
            border: none;
            color: #fff;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.2s ease;
            margin-left: 10px;
        `;
        clearAllButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all assignments?')) {
                this.assignments = [];
                this.saveAssignments();
                const tbody = this.menu?.querySelector('tbody');
                if (tbody) {
                    tbody.innerHTML = '';
                }
                await this.updateRuneStats();
            }
        });
        clearAllButton.addEventListener('mouseover', () => {
            clearAllButton.style.backgroundColor = '#ff6666';
        });
        clearAllButton.addEventListener('mouseout', () => {
            clearAllButton.style.backgroundColor = '#ff4444';
        });
        this.menu.appendChild(clearAllButton);

        backdrop.appendChild(this.menu);
        document.body.appendChild(backdrop);
    }

    private async createAssignmentRow(assignment: RuneAssignment, index: number): Promise<HTMLTableRowElement> {
        const tr = document.createElement('tr');
        tr.style.cssText = `
            border-bottom: 1px solid #333;
        `;
        
        // Store assignment data for reliable deletion
        const assignmentId = `${assignment.playerName}-${assignment.role}-${assignment.runes.join('-')}-${Date.now()}`;
        tr.dataset.assignmentId = assignmentId;

        // Player name cell
        const nameCell = document.createElement('td');
        nameCell.style.padding = '10px';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = assignment.playerName;
        nameInput.style.cssText = `
            background: #333;
            border: 1px solid #444;
            color: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            width: 150px;
        `;
        nameInput.addEventListener('change', () => {
            assignment.playerName = nameInput.value;
            this.saveAssignments();
        });
        nameCell.appendChild(nameInput);

        // Role selection cell
        const roleCell = document.createElement('td');
        roleCell.style.padding = '10px';
        const roleSelect = document.createElement('select');
        roleSelect.style.cssText = `
            background: #333;
            border: 1px solid #444;
            color: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            width: 150px;
        `;
        const roles: Role[] = ['Tank', 'Melee DPS', 'Ranged DPS', 'Support', 'Bard'];
        roleSelect.innerHTML = '<option value="">Select Role</option>' +
            roles.map(role => `<option value="${role}" ${role === assignment.role ? 'selected' : ''}>${role}</option>`).join('');
        roleSelect.value = assignment.role || '';
        roleSelect.addEventListener('change', () => {
            assignment.role = roleSelect.value as Role;
            this.saveAssignments();
        });
        roleCell.appendChild(roleSelect);

        // Rune selection cells
        const runes = await this.loadRuneOptions();
        const runeSelects = assignment.runes.map((rune, runeIndex) => {
            const cell = document.createElement('td');
            cell.style.padding = '10px';
            const select = document.createElement('select');
            select.style.cssText = `
                background: #333;
                border: 1px solid #444;
                color: #fff;
                padding: 4px 8px;
                border-radius: 4px;
                width: 150px;
            `;
            select.innerHTML = '<option value="">Select Rune</option>' +
                runes.map(runeName => 
                    `<option value="${runeName}" ${runeName === rune ? 'selected' : ''}>${runeName}</option>`
                ).join('');
            select.value = rune;
            select.addEventListener('change', async () => {
                assignment.runes[runeIndex] = select.value as string;
                this.saveAssignments();
                await this.updateRuneStats();
            });
            cell.appendChild(select);
            return cell;
        });

        // Delete button cell
        const actionsCell = document.createElement('td');
        actionsCell.style.cssText = `
            padding: 10px;
            text-align: center;
        `;
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '🗑️';
        deleteButton.style.cssText = `
            background: transparent;
            border: none;
            color: #999;
            cursor: pointer;
            font-size: 1.2em;
            padding: 4px 8px;
            transition: all 0.2s ease;
        `;
        deleteButton.addEventListener('click', async () => {
            const assignmentId = tr.dataset.assignmentId;
            if (assignmentId) {
                const [name, role, ...runesParts] = assignmentId.split('-');
                const timestamp = runesParts.pop(); // Remove timestamp
                const runes = runesParts;
                
                // Find and remove the assignment
                const idx = this.assignments.findIndex(a => 
                    a.playerName === name && 
                    a.role === role && 
                    JSON.stringify(a.runes) === JSON.stringify(runes)
                );
                
                if (idx !== -1) {
                    this.assignments.splice(idx, 1);
                    this.saveAssignments();
                    tr.remove();
                    await this.updateRuneStats();
                }
            }
        });
        deleteButton.addEventListener('mouseover', () => deleteButton.style.color = '#ff4444');
        deleteButton.addEventListener('mouseout', () => deleteButton.style.color = '#999');
        actionsCell.appendChild(deleteButton);

        tr.appendChild(nameCell);
        tr.appendChild(roleCell);
        runeSelects.forEach(cell => tr.appendChild(cell));
        tr.appendChild(actionsCell);

        return tr;
    }

    private async addNewAssignment() {
        const newAssignment: RuneAssignment = {
            playerName: '',
            role: '' as Role,
            runes: ['', '', '']
        };
        this.assignments.push(newAssignment);
        
        if (this.menu) {
            const tbody = this.menu.querySelector('tbody');
            if (tbody) {
                const tr = await this.createAssignmentRow(newAssignment, this.assignments.length - 1);
                tbody.appendChild(tr);
            }
        }
    }

    public mount(parent: HTMLElement) {
        parent.appendChild(this.container);
    }

    private async toggleMenu() {
        if (!this.menu) {
            await this.createMenu();
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
                        buttonImg.style.filter = 'drop-shadow(0 0 4px #90EE90) drop-shadow(0 0 8px #90EE90)';
                    }
                }
            }
        }
    }
}
