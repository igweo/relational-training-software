import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { VisualService } from '../../syllogimous/services/visual.service';
import { GlyphGeneratorService, GlyphOptions } from '../../syllogimous/services/glyph-generator.service';

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
    if (!value || !visualMode) {
      const fallbackValue = Array.isArray(value) ? value.join(' ') : (value || '');
      return this.sanitizer.bypassSecurityTrustHtml(fallbackValue);
    }

    try {
      // Handle string arrays by joining them
      const stringValue = Array.isArray(value) ? value.join(' ') : value;
      const transformedHtml = this.transformToVisualHtml(stringValue);
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

    // Find all subject spans and replace their content with glyphs
    const subjectSpans = tempDiv.querySelectorAll('span.subject');
    
    subjectSpans.forEach(span => {
      const word = span.textContent?.trim();
      if (word) {
        const glyphImg = this.getGlyphImage(word);
        span.innerHTML = glyphImg;
      }
    });

    // Also handle any standalone words that might need transformation
    // but aren't in subject spans (preserve existing functionality)
    let result = tempDiv.innerHTML;
    result = this.transformStandaloneWords(result);

    return result;
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
