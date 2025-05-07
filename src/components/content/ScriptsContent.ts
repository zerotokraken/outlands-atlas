import { ScriptsContent, CreateIconContainer, Script } from '../types/InfoMenuTypes.js';
import { createCard, createSection, createGrid, CardData } from '../utils/uiHelpers.js';

function createScriptContent(script: Script): string {
    return `
        <div style="margin-bottom: 30px;">
            <div style="background: #2d2d2d; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                ${script.description.join('<br><br>')}
            </div>
            <div style="background: #1e1e1e; padding: 15px; border-radius: 5px; font-family: monospace; overflow-x: auto;">
                <pre style="margin: 0; color: #d4d4d4;"><code>${script.code}</code></pre>
            </div>
        </div>
    `;
}

export function createScriptsContent(data: ScriptsContent, createIconContainer: CreateIconContainer): string {
    const scriptTabs = data.scripts.map((script, index) => `
        <button class="script-tab${index === 0 ? ' active' : ''}" 
                data-script-index="${index}"
                style="padding: 10px; margin-right: 5px; cursor: pointer; border: none; background: none; color: rgb(153, 153, 153); border-bottom: 2px solid ${index === 0 ? '#007bff' : 'transparent'};">
            ${script.title}
        </button>
    `).join('');

    const scriptContents = data.scripts.map((script, index) => `
        <div class="script-tab-content" 
             data-script-index="${index}" 
             style="display: ${index === 0 ? 'block' : 'none'};">
            ${createScriptContent(script)}
        </div>
    `).join('');

    // Create a unique ID for this instance
    const containerId = `script-container-${Date.now()}`;

    // Initialize tab functionality after content is added
    setTimeout(() => {
        const container = document.getElementById(containerId);
        if (container) {
            const tabs = container.querySelectorAll('.script-tab') as NodeListOf<HTMLButtonElement>;
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const selectedIndex = tab.getAttribute('data-script-index');
                    
                    // Hide all content
                    const contents = container.querySelectorAll('.script-tab-content') as NodeListOf<HTMLDivElement>;
                    contents.forEach(content => {
                        content.style.display = 'none';
                    });
                    
                    // Show selected content
                    const selectedContent = container.querySelector(`.script-tab-content[data-script-index="${selectedIndex}"]`) as HTMLDivElement;
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
        <div id="${containerId}" class="scripts-container">
            <div class="script-tabs" style="margin-bottom: 20px;">
                ${scriptTabs}
            </div>
            <div class="script-contents">
                ${scriptContents}
            </div>
        </div>
    `;
}
