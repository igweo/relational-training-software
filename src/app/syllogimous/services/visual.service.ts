import { Injectable } from '@angular/core';
import { NOT_STRINGS, NOUNS, STRINGS } from '../constants/question.constants';
import { GlyphGeneratorService, GlyphOptions } from './glyph-generator.service';
import { Question } from '../models/question.models';

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

    constructor(private glyphGenerator: GlyphGeneratorService) {
        this.initializeSymbolMaps();
    }

    private initializeSymbolMaps() {
        // Create consistent mappings for nouns and strings using glyph generator
        const allWords = [...NOUNS, ...STRINGS, ...NOT_STRINGS];
        
        // Generate unique glyphs for each word/symbol using the word as seed
        allWords.forEach((word) => {
            const glyphOptions: GlyphOptions = {
                size: 24, // Small size for inline use
                strokeWidth: 1.5,
                fg: 'currentColor',
                complexity: 4, // Medium complexity
                symmetry: 'radial',
                seed: word // Use the word itself as seed for consistency
            };
            
            const glyphDataURL = this.glyphGenerator.generateGlyphDataURL(word, glyphOptions);
            const glyphImg = `<img src="${glyphDataURL}" alt="${word}" style="display: inline-block; width: 1.2em; height: 1.2em; vertical-align: middle;" />`;
            
            this.visualSymbolMap.set(word.toLowerCase(), glyphImg);
        });
    }

    transformToVisual(text: string): string {
        if (!text) return text;

        let transformedText = text;

        // Handle potential HTML entity issues by normalizing quotes first
        transformedText = transformedText.replace(/&quot;/g, '"');
        
        // More robust regex pattern for subject spans
        transformedText = transformedText.replace(
            /<span\s+class=["']subject["'][^>]*>(.*?)<\/span>/gi, 
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
        const allWords = [...NOUNS, ...STRINGS, ...NOT_STRINGS];
        
        for (const word of allWords) {
            // For emoji/special characters in NOT_STRINGS, we need to escape them for regex
            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // For regular words, use word boundaries. For emojis/symbols, just match directly
            const useWordBoundaries = /^[a-zA-Z]+$/.test(word);
            const regexPattern = useWordBoundaries 
                ? `\\b${escapedWord}\\b(?![^<]*</span>)`
                : `${escapedWord}(?![^<]*</span>)`;
            
            const regex = new RegExp(regexPattern, 'gi');
            transformedText = transformedText.replace(regex, (match) => {
                return this.getVisualSymbol(match);
            });
        }

        return transformedText;
    }

    extractWordsWithNegation(inputArray: string[]): string[] {
        return inputArray.map(item => this.transformToVisual(item));
    }

    // Build compact Entities list (entity 1..N) for audio-mode UI
    buildEntitiesList(question: Question, useGlyphs: boolean = true): { order: string[], html: string } {
        const collect = (txt: string) => [...txt.matchAll(/<span class="subject">(.*?)<\/span>/g)].map(m => m[1]);
        const allText = [...question.premises, ...(Array.isArray(question.conclusion) ? question.conclusion : [question.conclusion])].join(' ');
        const seen = new Set<string>();
        const order: string[] = [];
        for (const s of collect(allText)) {
            if (!seen.has(s)) { seen.add(s); order.push(s); }
        }
        const li = order.map((s, i) => {
            const subjectHtml = useGlyphs ? this.getVisualSymbol(s) : s;
            return `<li><span class="subject">${subjectHtml}</span> <span class="ms-1 text-muted">(entity ${i+1})</span></li>`;
        }).join('');
        const entitiesHtml = `<ol class="mb-2">${li}</ol>`;

        // In entity audio mode, we show only the entities during narration.
        // Conclusion will be shown after narration completes by the component.
        const html = `${entitiesHtml}`;
        return { order, html };
    }
}
