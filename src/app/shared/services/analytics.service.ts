import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { track } from '@vercel/analytics';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private router: Router) {
    this.initPageViewTracking();
  }

  /**
   * Initialize automatic page view tracking on route changes
   */
  private initPageViewTracking(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        // Track page view with the route URL
        const navEvent = event as NavigationEnd;
        this.trackEvent('page_view', {
          path: navEvent.url,
          title: document.title
        });
      });
  }

  /**
   * Track custom events
   * @param name Event name
   * @param properties Optional event properties
   */
  trackEvent(name: string, properties?: Record<string, any>): void {
    try {
      track(name, properties);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  /**
   * Track game-specific events with common properties
   * @param eventName Game event name
   * @param gameData Game-specific data
   */
  trackGameEvent(eventName: string, gameData?: Record<string, any>): void {
    this.trackEvent(`game_${eventName}`, {
      timestamp: new Date().toISOString(),
      ...gameData
    });
  }

  /**
   * Track UI interactions
   * @param element Element that was interacted with
   * @param action Action performed (click, hover, etc.)
   * @param data Additional data about the interaction
   */
  trackInteraction(element: string, action: string, data?: Record<string, any>): void {
    this.trackEvent('ui_interaction', {
      element,
      action,
      ...data
    });
  }
}
