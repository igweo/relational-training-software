/// <reference types="@angular/localize" />

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { inject } from '@vercel/analytics';

import { AppModule } from './app/app.module';

// Initialize Vercel Analytics
inject();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
