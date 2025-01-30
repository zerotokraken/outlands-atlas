import { ContentCreators, EmptyContent, RunesContent, RelicsContent, HazardsContent, TabletsContent } from '../types/InfoMenuTypes.js';
import { createLanguageContent } from '../content/LanguageContent.js';
import { createRunesContent } from '../content/RunesContent.js';
import { createRelicsContent } from '../content/RelicsContent.js';
import { createHazardsContent } from '../content/HazardsContent.js';
import { createTabletsContent } from '../content/TabletsContent.js';

export const contentCreators: ContentCreators = {
    'language': (data: EmptyContent, createIconContainer) => createLanguageContent(data, createIconContainer),
    'runes': (data: RunesContent, createIconContainer) => createRunesContent(data, createIconContainer),
    'relics': (data: RelicsContent, createIconContainer) => createRelicsContent(data, createIconContainer),
    'hazards': (data: HazardsContent, createIconContainer) => createHazardsContent(data, createIconContainer),
    'tablets': (data: TabletsContent, createIconContainer) => createTabletsContent(data, createIconContainer)
};
