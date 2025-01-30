import { NavButton } from '../types/InfoMenuTypes.js';

export const navigationButtons: NavButton[] = [
    { text: 'Time Runes', page: 'runes' },
    { text: 'Time Relics', page: 'relics' },
    { text: 'Hazards', page: 'hazards' },
    { text: 'Encounters', page: 'encounters' },
    { text: 'Entities', page: 'entities' },
    { text: 'Loot', page: 'loot' },
    { text: 'NPCs', page: 'npcs' },
    { text: 'Quests', page: 'quests' },
    { text: 'Quest Items', page: 'quest-items' },
    { text: 'Tablets', page: 'tablets' }
];

export const defaultPage = 'runes';

export const contentMapping: { [key: string]: string } = {
    'runes': '/json/runes.json',
    'relics': '/json/relics.json',
    'hazards': '/json/hazards.json',
    'encounters': '/json/encounters.json',
    'entities': '/json/entities.json',
    'loot': '/json/loot.json',
    'npcs': '/json/npcs.json',
    'quests': '/json/quests.json',
    'quest-items': '/json/quest-items.json',
    'tablets': '/json/language/gargish_tablets.json'
};
