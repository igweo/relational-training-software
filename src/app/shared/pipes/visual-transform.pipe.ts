import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { VisualService } from '../../syllogimous/services/visual.service';
import { GlyphGeneratorService, GlyphOptions } from '../../syllogimous/services/glyph-generator.service';
import { LS_IMAGE_MODE } from '../../syllogimous/constants/local-storage.constants';

@Pipe({
  name: 'visualTransform'
})
export class VisualTransformPipe implements PipeTransform {
  private glyphCache = new Map<string, string>();

  constructor(
    private sanitizer: DomSanitizer,
    private glyphGenerator: GlyphGeneratorService
  ) {}

  transform(value: string | string[], visualMode: boolean = false): SafeHtml {
    const imageMode = localStorage.getItem(LS_IMAGE_MODE) === 'true';
    const shouldTransform = !!visualMode || imageMode;

    if (!value || !shouldTransform) {
      const fallbackValue = Array.isArray(value) ? value.join(' ') : (value || '');
      return this.sanitizer.bypassSecurityTrustHtml(fallbackValue);
    }

    try {
      // Handle string arrays by joining them
      const stringValue = Array.isArray(value) ? value.join(' ') : value;
      const transformedHtml = imageMode
        ? this.transformToImageHtml(stringValue)
        : this.transformToVisualHtml(stringValue);
      return this.sanitizer.bypassSecurityTrustHtml(transformedHtml);
    } catch (error) {
      console.error('Error transforming visual content:', error);
      // Return original content if transformation fails
      const fallbackValue = Array.isArray(value) ? value.join(' ') : value;
      return this.sanitizer.bypassSecurityTrustHtml(fallbackValue);
    }
  }

  private transformToVisualHtml(html: string): string {
    if (!html) return html;

    // Create a temporary DOM element to safely parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Detect comparative cues from original html (case-insensitive)
    const lc = html.toLowerCase();
    const greaterRegex = /\b(greater than|more than|higher than|larger than|superior to|above)\b/;
    const lessRegex = /\b(less than|fewer than|lower than|smaller than|inferior to|below)\b/;
    const isGreaterRelation = greaterRegex.test(lc);
    const isLessRelation = !isGreaterRelation && lessRegex.test(lc);

    // Find all subject spans and replace their content with glyphs
    const subjectSpans = tempDiv.querySelectorAll('span.subject');
    
    subjectSpans.forEach(span => {
      const word = span.textContent?.trim();
      if (word) {
        const glyphImg = this.getGlyphImage(word);
        span.innerHTML = glyphImg;
      }
    });

    // Apply visual comparative cues when we have a simple binary comparison
    if ((isGreaterRelation || isLessRelation) && subjectSpans.length >= 2) {
      const first = subjectSpans[0] as HTMLElement;
      const second = subjectSpans[1] as HTMLElement;
      if (first && second) {
        // Ensure spans are inline-block so transforms take effect predictably
        first.style.display = first.style.display || 'inline-block';
        second.style.display = second.style.display || 'inline-block';

        if (isGreaterRelation) {
          first.classList.add('cue-greater');
          second.classList.add('cue-less');
        } else if (isLessRelation) {
          first.classList.add('cue-less');
          second.classList.add('cue-greater');
        }
      }
    }

    // Also handle any standalone words that might need transformation
    // but aren't in subject spans (preserve existing functionality)
    let result = tempDiv.innerHTML;
    result = this.transformStandaloneWords(result);

    return result;
  }

  private transformToImageHtml(html: string): string {
    if (!html) return html;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const subjectSpans = tempDiv.querySelectorAll('span.subject');

    subjectSpans.forEach(span => {
      const subject = span.textContent?.trim() || '';
      if (!subject) return;
      const imgTag = this.buildSeededImageTag(subject);
      span.innerHTML = imgTag;
    });

    return tempDiv.innerHTML;
  }

  private buildSeededImageTag(seed: string): string {
    // Deterministic per subject using picsum seed
    const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/28/28`;
    const alt = seed.replace(/"/g, '"');
    return `<img src="${url}" alt="${alt}" style="display: inline-block; width: 1.4em; height: 1.4em; vertical-align: middle; margin: 0 2px; border-radius: 4px; object-fit: cover;" class="image-entity" />`;
  }

  private getGlyphImage(word: string): string {
    const cacheKey = word.toLowerCase();
    
    if (this.glyphCache.has(cacheKey)) {
      return this.glyphCache.get(cacheKey)!;
    }

    try {
      const glyphOptions: GlyphOptions = {
        size: 24,
        strokeWidth: 1.5,
        fg: 'currentColor',
        complexity: 4,
        symmetry: 'radial',
        seed: word
      };

      const dataURL = this.glyphGenerator.generateGlyphDataURL(word, glyphOptions);
      
      // Create a proper HTML-safe data URL
      const safeDataURL = dataURL.replace(/"/g, '"');
      const glyphImg = `<img src="${safeDataURL}" alt="${word}" style="display: inline-block; width: 1.2em; height: 1.2em; vertical-align: middle; margin: 0 2px;" class="glyph-symbol" />`;
      
      this.glyphCache.set(cacheKey, glyphImg);
      return glyphImg;
    } catch (error) {
      console.error(`Error generating glyph for word "${word}":`, error);
      // Return the original word if glyph generation fails
      return word;
    }
  }

  private transformStandaloneWords(html: string): string {
    // This handles words that aren't wrapped in subject spans
    // Keep this minimal to avoid breaking existing HTML structure
    return html;
  }
}
