import { ContentCreators, EmptyContent, RunesContent, RelicsContent, HazardsContent, EncountersContent, TabletsContent, GeneralContent, LootContent, QuestItemsContent, QuestsContent } from '../types/InfoMenuTypes.js';
import { createLanguageContent } from '../content/LanguageContent.js';
import { createRunesContent } from '../content/RunesContent.js';
import { createRelicsContent } from '../content/RelicsContent.js';
import { createTabletsContent } from '../content/TabletsContent.js';
import { createEncountersContent } from '../content/EncountersContent.js';
import { createGeneralContent } from '../content/GeneralContent.js';
import { createLootContent } from '../content/LootContent.js';
import { createQuestsContent } from '../content/QuestsContent.js';

export const contentCreators: ContentCreators = {
    'language': (data: EmptyContent, createIconContainer) => createLanguageContent(data, createIconContainer),
    'runes': (data: RunesContent, createIconContainer) => createRunesContent(data, createIconContainer),
    'relics': (data: RelicsContent, createIconContainer) => createRelicsContent(data, createIconContainer),
    'tablets': (data: TabletsContent, createIconContainer) => createTabletsContent(data, createIconContainer),
    'encounters': (data: EncountersContent, createIconContainer) => createEncountersContent(data, createIconContainer),
    'general': (data: GeneralContent, createIconContainer) => createGeneralContent(data, createIconContainer),
    'loot': (data: LootContent, createIconContainer) => createLootContent(data, createIconContainer),
    'quests': (data: QuestsContent, createIconContainer) => createQuestsContent(data, createIconContainer)
};
