import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SpeechService {
    private synth = window.speechSynthesis;

    speak(text: string, lang: string = 'en-US', rate?: number) {
        if (!this.synth) {
            console.error('Speech Synthesis not supported in this browser.');
            return;
        }

        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = (rate == null) ? 1.0 : rate; // start at normal cadence by default

        this.synth.speak(utterance);
    }

    speakAsync(text: string, lang: string = 'en-US', rate?: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.synth) {
                console.error('Speech Synthesis not supported in this browser.');
                resolve();
                return;
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = (rate == null) ? 1.0 : rate;
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve(); // resolve to avoid blocking UI on errors
            this.synth.speak(utterance);
        });
    }

    stop() {
        this.synth.cancel();
    }
    pending() {
        this.synth.pending;
    }

    isSpeaking(): boolean {
        return this.synth.speaking;
    }
    extractWordsWithNegation(inputArray: string[]): string[] {
        return inputArray.map(item => {
            // Match all the <span class="subject">...</span> and <span class="is-negated">...</span> tags
            const regexSubject = /<span class="subject">(.*?)<\/span>/g;
            const regexNegation = /<span class="is-negated">(.*?)<\/span>/g;

            let result = '';
            let lastIndex = 0;

            // Extract words inside subject spans and handle negation spans
            let matchSubject;
            while ((matchSubject = regexSubject.exec(item)) !== null) {
                // Add text before the match (i.e., the part outside the <span> tags)
                result += item.substring(lastIndex, matchSubject.index);

                result += matchSubject[1]; // Add the subject word

                lastIndex = regexSubject.lastIndex; // Update last index after match
            }

            // Now handle the negated words
            let matchNegation;
            while ((matchNegation = regexNegation.exec(item)) !== null) {
                // Add text before the match (i.e., the part outside the <span> tags)
                result += item.substring(lastIndex, matchNegation.index);

                result += `(negation of) ${matchNegation[1]}`; // Add the negated word with the "negation" phrase

                lastIndex = regexNegation.lastIndex; // Update last index after match
            }

            // Add remaining text after the last span tag
            result += item.substring(lastIndex);

            // Return the processed string
            return result.trim();
        });
    }

    // --- Entity-only audio helpers ---
    private extractSubjects(text: string): string[] {
        return [...text.matchAll(/<span class="subject">(.*?)<\/span>/g)].map(m => m[1]);
    }

    private buildEntityOrder(premises: string[], conclusion: string | string[]): string[] {
        const all = [...premises, ...(Array.isArray(conclusion) ? conclusion : [conclusion])].join(" ");
        const seen = new Set<string>();
        const order: string[] = [];
        for (const subj of this.extractSubjects(all)) {
            if (!seen.has(subj)) {
                seen.add(subj);
                order.push(subj);
            }
        }
        return order;
    }

    private toEntitySpeech(html: string, map: Map<string, number>): string {
        let s = html;
        // Convert negation spans into spoken negation
        s = s.replace(/<span class=\"is-negated\">(.*?)<\/span>/g, (_m, p1) => `not ${p1}`);
        // Replace subjects with entity indices
        s = s.replace(/<span class=\"subject\">(.*?)<\/span>/g, (_m, p1) => {
            const n = map.get(p1);
            return `entity ${n}`;
        });
        // Strip remaining tags
        s = s.replace(/<[^>]+>/g, '');
        return s.replace(/\s+/g, ' ').trim();
    }

    // Convert HTML premise/conclusion to plain speech with subject names
    private toPlainSpeech(html: string): string {
        let s = html;
        s = s.replace(/<span class=\"is-negated\">(.*?)<\/span>/g, (_m, p1) => `not ${p1}`);
        s = s.replace(/<span class=\"subject\">(.*?)<\/span>/g, (_m, p1) => p1);
        s = s.replace(/<[^>]+>/g, '');
        s = s.replace(/\s+/g, ' ').trim();
        return s;
    }

    // Public: narrate a question using entity indices. If speakPreface is true, it will also read the Entities list.
    async speakQuestionAsEntities(q: { premises: string[]; conclusion: string | string[] }, lang: string = 'en-US', speakPreface: boolean = false): Promise<void> {
        const premises = q.premises || [];
        const conclusionArr = Array.isArray(q.conclusion) ? q.conclusion : [q.conclusion];

        const order = this.buildEntityOrder(premises, conclusionArr);
        const map = new Map(order.map((s, i) => [s, i + 1] as const));

        if (speakPreface && order.length) {
            const entityList = order.map((_s, i) => `entity ${i + 1}`).join(', ');
            await this.speakAsync(`Entities: ${entityList}.`, lang, 1.0);
        }

        // Gradually ramp rate across premises (start normal, step up slightly, cap)
        const baseRate = 1.0;
        const step = 0.05; // gentle ramp
        const maxRate = 1.3;
        for (let i = 0; i < premises.length; i++) {
            const line = this.toEntitySpeech(premises[i], map);
            const rate = Math.min(maxRate, baseRate + i * step);
            await this.speakAsync(`${line}.`, lang, rate);
        }
        // Do not read conclusions in entity mode; visuals will show them.
        return;
    }

    // Public: fully-auditory narration (premises + conclusion) using subject names
    async speakQuestionFully(q: { premises: string[]; conclusion: string | string[] }, lang: string = 'en-US', baseRate: number = 1.0): Promise<void> {
        const premises = q.premises || [];
        const conclusions = Array.isArray(q.conclusion) ? q.conclusion : [q.conclusion];

        for (let i = 0; i < premises.length; i++) {
            const line = this.toPlainSpeech(premises[i]);
            await this.speakAsync(`${line}.`, lang, baseRate);
        }
        for (const c of conclusions) {
            const line = this.toPlainSpeech(c);
            await this.speakAsync(`Conclusion: ${line}`, lang, baseRate);
        }
    }
}
