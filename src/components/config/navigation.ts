import { NavButton } from '../types/InfoMenuTypes.js';

export const navigationButtons: NavButton[] = [
    { text: 'General', page: 'general' },
    { text: 'Time Runes', page: 'runes' },
    { text: 'Time Relics', page: 'relics' },
    { text: 'Encounters', page: 'encounters' },
    { text: 'Loot', page: 'loot' },
    { text: 'Quests', page: 'quests' },
    { text: 'Scripts', page: 'scripts' },
    { text: 'Tablets', page: 'tablets' }
];

export const defaultPage = 'general';

export const contentMapping: { [key: string]: string } = {
    'general': '/json/general.json',
    'runes': '/json/runes.json',
    'relics': '/json/relics.json',
    'encounters': '/json/encounters.json',
    'loot': '/json/loot.json',
    'quests': '/json/quests.json',
    'scripts': '/json/scripts.json',
    'tablets': '/json/language/gargish_tablets.json'
};
