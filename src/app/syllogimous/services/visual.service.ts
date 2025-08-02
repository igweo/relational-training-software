import { Injectable } from '@angular/core';
import { NOT_STRINGS, NOUNS, STRINGS } from '../constants/question.constants';

@Injectable({
    providedIn: 'root',
})
export class VisualService {
    private visualSymbolMap = new Map<string, string>();
    private relationshipSymbols = {
        // Comparison symbols
        'greater than': '↗️',
        'larger than': '↗️',
        'higher than': '↗️',
        'superior to': '↗️',
        'above': '⬆️',
        'less than': '↙️',
        'smaller than': '↙️',
        'lower than': '↙️',
        'inferior to': '↙️',
        'below': '⬇️',
        'under': '⬇️',
        
        // Temporal symbols
        'after': '▶️',
        'later than': '▶️',
        'subsequent to': '▶️',
        'following': '▶️',
        'before': '◀️',
        'earlier than': '◀️',
        'prior to': '◀️',
        'preceding': '◀️',
        
        // Directional symbols
        'north of': '🧭⬆️',
        'south of': '🧭⬇️',
        'east of': '🧭➡️',
        'west of': '🧭⬅️',
        'left of': '⬅️',
        'right of': '➡️',
        
        // Identity symbols
        'same as': '🔗',
        'identical to': '🔗',
        'equivalent to': '🔗',
        'equal to': '🔗',
        'different from': '❌',
        'distinct from': '❌',
        'opposite to': '🔄',
        'contrary to': '🔄',
        
        // Connection symbols
        'connected to': '🔗',
        'linked with': '🔗',
        'joined to': '🔗',
        'related to': '🔗',
        'disconnected from': '🚫',
        'unrelated to': '🚫',
        'separated from': '🚫',
        
        // Logical symbols
        'and': '∧',
        'or': '∨',
        'not': '¬',
        'if': '→',
        'then': '→',
        'all': '∀',
        'some': '∃',
        'no': '∅',
        'none': '∅'
    };

    constructor() {
        this.initializeSymbolMaps();
    }

    private initializeSymbolMaps() {
        // Create consistent mappings for nouns and strings
        const allWords = [...NOUNS, ...STRINGS];
        const visualSymbols = [...NOT_STRINGS];
        
        // Ensure we have enough visual symbols by cycling through them if needed
        allWords.forEach((word, index) => {
            const symbolIndex = index % visualSymbols.length;
            this.visualSymbolMap.set(word.toLowerCase(), visualSymbols[symbolIndex]);
        });
    }

    transformToVisual(text: string): string {
        if (!text) return text;

        let transformedText = text;

        // Transform subjects within span tags
        transformedText = transformedText.replace(
            /<span class="subject">(.*?)<\/span>/g, 
            (match, subject) => {
                const visualSymbol = this.getVisualSymbol(subject);
                return `<span class="subject">${visualSymbol}</span>`;
            }
        );

        // Transform remaining meaningful words that aren't in spans (but skip relationship words)
        transformedText = this.transformRemainingWords(transformedText);

        return transformedText;
    }

    private getVisualSymbol(word: string): string {
        const normalizedWord = word.toLowerCase().trim();
        return this.visualSymbolMap.get(normalizedWord) || word;
    }

    private transformRelationships(text: string): string {
        let transformedText = text;

        // Sort by length (longest first) to avoid partial matches
        const sortedRelationships = Object.keys(this.relationshipSymbols)
            .sort((a, b) => b.length - a.length);

        for (const relationship of sortedRelationships) {
            const symbol = this.relationshipSymbols[relationship as keyof typeof this.relationshipSymbols];
            
            // Use word boundaries to ensure complete word matches
            const regex = new RegExp(`\\b${relationship}\\b`, 'gi');
            
            // Don't transform if it's inside a negated span
            transformedText = transformedText.replace(regex, (match, offset) => {
                const beforeMatch = transformedText.substring(0, offset);
                const afterMatch = transformedText.substring(offset + match.length);
                
                // Check if we're inside a negated span
                const lastNegatedStart = beforeMatch.lastIndexOf('<span class="is-negated">');
                const lastNegatedEnd = beforeMatch.lastIndexOf('</span>');
                
                if (lastNegatedStart > lastNegatedEnd) {
                    // We're inside a negated span, don't transform
                    return match;
                }
                
                return symbol;
            });
        }

        return transformedText;
    }

    private transformRemainingWords(text: string): string {
        let transformedText = text;

        // Transform any remaining nouns/strings that aren't in spans
        const allWords = [...NOUNS, ...STRINGS];
        
        for (const word of allWords) {
            const regex = new RegExp(`\\b${word}\\b(?![^<]*</span>)`, 'gi');
            transformedText = transformedText.replace(regex, (match) => {
                return this.getVisualSymbol(match);
            });
        }

        return transformedText;
    }

    extractWordsWithNegation(inputArray: string[]): string[] {
        return inputArray.map(item => this.transformToVisual(item));
    }
}
