export interface LexiconEntry {
    gargish: string;
    english: string;
    notes: string;
}

export interface GrammarRule {
    prefix?: string;
    suffix?: string;
    meaning: string;
    example: string;
}

export interface ExamplePhrase {
    gargish: string;
    literal: string;
    meaning: string;
    context: string;
}

export interface LanguageData {
    lexicon: {
        basic: LexiconEntry[];
        advanced: LexiconEntry[];
    };
    grammar: {
        prefixes: GrammarRule[];
        suffixes: GrammarRule[];
    };
    examples: ExamplePhrase[];
}

export interface GargishWordDefinition {
    alternates?: string[];
    definitions?: string[];
}

export type GargishWord = string | string[] | GargishWordDefinition;

export interface GargishLetterData {
    [word: string]: GargishWord;
}
