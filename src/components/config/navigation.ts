import { NavButton } from '../types/InfoMenuTypes.js';

export const navigationButtons: NavButton[] = [
    { text: 'General', page: 'general' },
    { text: 'Time Runes', page: 'runes' },
    { text: 'Time Relics', page: 'relics' },
    { text: 'Encounters', page: 'encounters' },
    { text: 'Loot', page: 'loot' },
    { text: 'NPCs', page: 'npcs' },
    { text: 'Quests', page: 'quests' },
    { text: 'Quest Items', page: 'quest-items' },
    { text: 'Tablets', page: 'tablets' }
];

export const defaultPage = 'general';

export const contentMapping: { [key: string]: string } = {
    'general': '/json/general.json',
    'runes': '/json/runes.json',
    'relics': '/json/relics.json',
    'encounters': '/json/encounters.json',
    'loot': '/json/loot.json',
    'npcs': '/json/npcs.json',
    'quests': '/json/quests.json',
    'quest-items': '/json/quest-items.json',
    'tablets': '/json/language/gargish_tablets.json'
};
