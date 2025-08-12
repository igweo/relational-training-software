import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { GlyphGeneratorService, GlyphOptions } from '../../services/glyph-generator.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-glyph',
  template: `
    <img 
      [src]="glyphDataURL" 
      [alt]="seed.toString() || 'glyph'"
      [style.width.px]="size"
      [style.height.px]="size"
      style="display: inline-block; vertical-align: middle;"
    />
  `,
  styles: []
})
export class GlyphComponent implements OnInit, OnChanges {
  @Input() seed!: string | number;
  @Input() options: GlyphOptions = {};

  glyphDataURL: SafeUrl = '';
  size: number = 24;

  constructor(
    private glyphGenerator: GlyphGeneratorService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.generateGlyph();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['seed'] || changes['options']) {
      this.generateGlyph();
    }
  }

  private generateGlyph(): void {
    if (!this.seed) return;

    const glyphOptions: GlyphOptions = {
      size: 24,
      strokeWidth: 1.5,
      fg: 'currentColor',
      complexity: 4,
      symmetry: 'radial',
      ...this.options,
      seed: this.seed
    };

    this.size = glyphOptions.size || 24;
    
    const dataURL = this.glyphGenerator.generateGlyphDataURL(this.seed, glyphOptions);
    this.glyphDataURL = this.sanitizer.bypassSecurityTrustUrl(dataURL);
  }
}
