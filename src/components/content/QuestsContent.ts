import { QuestsContent, CreateIconContainer, Quest, QuestStep } from '../types/InfoMenuTypes.js';
import { createCard, createSection, createGrid, CardData } from '../utils/uiHelpers.js';

function createQuestStepCard(step: QuestStep, scale?: number): CardData {
    const description = [
        `<strong>Location:</strong> ${step.location}`,
        ...step.description
    ];

    if (step.requirements) {
        description.push(
            '<strong>Requirements:</strong>',
            ...step.requirements.map(req => `• ${req}`)
        );
    }

    if (step.rewards) {
        description.push(
            '<strong>Rewards:</strong>',
            ...step.rewards.map(reward => `• ${reward}`)
        );
    }

    return {
        title: step.title,
        subtitle: '',
        description,
        icon: step.icon || '',
        location: '',
        customIcons: undefined,
        scale
    };
}

function createQuestContent(quest: Quest, createIconContainer: CreateIconContainer): string {
    const questDescription = createSection(quest.name, `
        <div class="quest-description" style="margin-bottom: 20px; display: flex; align-items: center;">
            ${quest.icon ? createIconContainer('medium', '10px', quest.scale) : ''}
            <div>
                ${quest.description.map(desc => `<p>${desc}</p>`).join('')}
            </div>
        </div>
    `);

    const stepCards = quest.steps.map(step => createCard(createQuestStepCard(step, step.scale), createIconContainer, step.scale));
    const stepsGrid = createSection('Steps', createGrid(stepCards));

    return `
        <div class="quest-content">
            ${questDescription}
            ${stepsGrid}
        </div>
    `;
}

export function createQuestsContent(data: QuestsContent, createIconContainer: CreateIconContainer): string {
    const questTabs = data.quests.map((quest, index) => `
        <button class="quest-tab${index === 0 ? ' active' : ''}" 
                data-quest-index="${index}"
                style="padding: 10px; margin-right: 5px; cursor: pointer; border: none; background: none; color: rgb(153, 153, 153); border-bottom: 2px solid ${index === 0 ? '#007bff' : 'transparent'};">
            ${quest.name}
        </button>
    `).join('');

    const questContents = data.quests.map((quest, index) => `
        <div class="quest-tab-content" 
             data-quest-index="${index}" 
             style="display: ${index === 0 ? 'block' : 'none'};">
            ${createQuestContent(quest, createIconContainer)}
        </div>
    `).join('');

    // Create a unique ID for this instance
    const containerId = `quest-container-${Date.now()}`;

    // Initialize tab functionality after content is added
    setTimeout(() => {
        const container = document.getElementById(containerId);
        if (container) {
            const tabs = container.querySelectorAll('.quest-tab') as NodeListOf<HTMLButtonElement>;
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const selectedIndex = tab.getAttribute('data-quest-index');
                    
                    // Hide all content
                    const contents = container.querySelectorAll('.quest-tab-content') as NodeListOf<HTMLDivElement>;
                    contents.forEach(content => {
                        content.style.display = 'none';
                    });
                    
                    // Show selected content
                    const selectedContent = container.querySelector(`.quest-tab-content[data-quest-index="${selectedIndex}"]`) as HTMLDivElement;
                    if (selectedContent) {
                        selectedContent.style.display = 'block';
                    }
                    
                    // Update tab styles
                    tabs.forEach(t => {
                        t.style.borderBottom = '2px solid transparent';
                        t.classList.remove('active');
                    });
                    tab.style.borderBottom = '2px solid #007bff';
                    tab.classList.add('active');
                });
            });
        }
    }, 0);

    return `
        <div id="${containerId}" class="quests-container">
            <div class="quest-tabs" style="margin-bottom: 20px;">
                ${questTabs}
            </div>
            <div class="quest-contents">
                ${questContents}
            </div>
        </div>
    `;
}
