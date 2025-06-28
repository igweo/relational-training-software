import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SpeechService {
    private synth = window.speechSynthesis;

    speak(text: string, lang: string = 'en-US') {
        if (!this.synth) {
            console.error('Speech Synthesis not supported in this browser.');
            return;
        }

        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 2;

        this.synth.speak(utterance);
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
}
