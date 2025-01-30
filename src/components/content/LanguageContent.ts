import { CreateIconContainer } from '../types/InfoMenuTypes.js';
import { LanguageData, LexiconEntry, GrammarRule, ExamplePhrase } from '../types/LanguageTypes.js';
import { createCard, createGrid, createSection } from '../utils/uiHelpers.js';
import { createErrorMessage } from '../utils/errorHandling.js';

function createLexiconSection(data: LanguageData): string {
    const createEntryHtml = (entry: LexiconEntry) => `
        <div style="margin-bottom: 8px; padding: 8px; background: #1a1a1a; border-radius: 4px;">
            <div style="color: #d4af37; font-weight: bold;">${entry.gargish}</div>
            <div style="color: #fff; margin: 4px 0;">${entry.english}</div>
            <div style="color: #999; font-style: italic; font-size: 0.9em;">${entry.notes}</div>
        </div>
    `;

    return `
        <div class="lexicon-section">
            <h3 style="color: #d4af37; margin: 16px 0;">Basic Terms</h3>
            <div class="basic-terms">
                ${data.lexicon.basic.map(createEntryHtml).join('')}
            </div>
            <h3 style="color: #d4af37; margin: 16px 0;">Advanced Phrases</h3>
            <div class="advanced-terms">
                ${data.lexicon.advanced.map(createEntryHtml).join('')}
            </div>
        </div>
    `;
}

function createGrammarSection(data: LanguageData): string {
    const createRuleHtml = (rule: GrammarRule) => `
        <div style="margin-bottom: 8px; padding: 8px; background: #1a1a1a; border-radius: 4px;">
            <div style="color: #d4af37; font-weight: bold;">${rule.prefix || rule.suffix}</div>
            <div style="color: #fff; margin: 4px 0;">${rule.meaning}</div>
            <div style="color: #999; font-style: italic; font-size: 0.9em;">Example: ${rule.example}</div>
        </div>
    `;

    return `
        <div class="grammar-section">
            <h3 style="color: #d4af37; margin: 16px 0;">Prefixes</h3>
            <div class="prefixes">
                ${data.grammar.prefixes.map(createRuleHtml).join('')}
            </div>
            <h3 style="color: #d4af37; margin: 16px 0;">Suffixes</h3>
            <div class="suffixes">
                ${data.grammar.suffixes.map(createRuleHtml).join('')}
            </div>
        </div>
    `;
}

function createExamplesSection(data: LanguageData): string {
    const createExampleHtml = (example: ExamplePhrase) => `
        <div style="margin-bottom: 8px; padding: 8px; background: #1a1a1a; border-radius: 4px;">
            <div style="color: #d4af37; font-weight: bold;">${example.gargish}</div>
            <div style="color: #fff; margin: 4px 0;">Literal: ${example.literal}</div>
            <div style="color: #fff; margin: 4px 0;">Meaning: ${example.meaning}</div>
            <div style="color: #999; font-style: italic; font-size: 0.9em;">Context: ${example.context}</div>
        </div>
    `;

    return `
        <div class="examples-section">
            <h3 style="color: #d4af37; margin: 16px 0;">Example Phrases</h3>
            ${data.examples.map(createExampleHtml).join('')}
        </div>
    `;
}

export async function createLanguageContent(_data: unknown, _createIconContainer: CreateIconContainer): Promise<string> {
    try {
        const response = await fetch('/json/language.json');
        const languageData: LanguageData = await response.json();

        return `
            <div class="language-content" style="display: flex; flex-direction: column; gap: 20px;">
                ${createLexiconSection(languageData)}
                ${createGrammarSection(languageData)}
                ${createExamplesSection(languageData)}
            </div>
        `;
    } catch (error) {
        console.error('Error loading language data:', error);
        return createErrorMessage('Error loading language data. Please try again.');
    }
}
