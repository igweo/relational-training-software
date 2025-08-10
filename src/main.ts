/// <reference types="@angular/localize" />

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { isDevMode } from '@angular/core';
import { inject as injectAnalytics } from '@vercel/analytics';


import { AppModule } from './app/app.module';

// Initialize Vercel Analytics
injectAnalytics({ mode: isDevMode() ? 'development' : 'production' });

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
