import { XMLParser } from 'fast-xml-parser';
import { AlertProvider } from './base';
import { Alert } from '../schema';

export class ImdCapProvider implements AlertProvider {
  private feedUrl = 'https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml';

  private knownStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Chattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Jammu and Kashmir",
    "Ladakh"
  ];

  async fetchAlerts(): Promise<Omit<Alert, 'id' | 'locationMatchLevel' | 'fetchedAt' | 'updatedAt'>[]> {
    try {
      const response = await fetch(this.feedUrl, {
        next: { revalidate: 60 },
      });

      if (!response.ok) {
        throw new Error(`IMD CAP fetch failed: ${response.status} ${response.statusText}`);
      }

      const xmlData = await response.text();
      return this.parseRss(xmlData);
    } catch (error) {
      console.error('[ImdCapProvider] Error fetching alerts:', error);
      throw error;
    }
  }

  private parseRss(xmlString: string): Omit<Alert, 'id' | 'locationMatchLevel' | 'fetchedAt' | 'updatedAt'>[] {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    const parsed = parser.parse(xmlString);
    const channel = parsed?.rss?.channel;

    if (!channel) {
      console.warn('[ImdCapProvider] Invalid or empty RSS schema');
      return [];
    }

    // items can be undefined, a single object, or an array
    let items = channel.item;
    if (!items) return [];
    if (!Array.isArray(items)) {
      items = [items];
    }

    const alerts: Omit<Alert, 'id' | 'locationMatchLevel' | 'fetchedAt' | 'updatedAt'>[] = [];

    for (const item of items) {
      const title = typeof item.title === 'string' ? item.title : '';
      const link = typeof item.link === 'string' ? item.link : '';
      const description = typeof item.description === 'string' ? item.description : '';
      const pubDate = typeof item.pubDate === 'string' ? item.pubDate : '';
      const guid = item.guid?.['#text'] || typeof item.guid === 'string' ? item.guid : '';

      const externalId = guid || link || String(Date.now());
      const areas = this.extractAreas(description);

      // Map IMD titles to standard severity
      let severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown' = 'Unknown';
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('extremely') || lowerTitle.includes('red')) {
        severity = 'Extreme';
      } else if (lowerTitle.includes('very heavy') || lowerTitle.includes('orange')) {
        severity = 'Severe';
      } else if (lowerTitle.includes('heavy') || lowerTitle.includes('yellow')) {
        severity = 'Moderate';
      } else {
        severity = 'Minor';
      }

      // Convert pubDate to ISO if possible
      let effectiveAt = undefined;
      if (pubDate) {
        try {
          effectiveAt = new Date(pubDate).toISOString();
        } catch {
          // Keep undefined if invalid
        }
      }

      alerts.push({
        externalId: String(externalId),
        source: 'IMD CAP',
        event: title || 'Weather Alert',
        severity,
        headline: title,
        description,
        areas,
        sourceUrl: link,
        effectiveAt,
        // RSS feed does not supply expiry, default is missing
        expiresAt: undefined,
      });
    }

    return alerts;
  }

  private extractAreas(description: string): string[] {
    const descLower = description.toLowerCase();
    const found: string[] = [];
    for (const state of this.knownStates) {
      if (descLower.includes(state.toLowerCase())) {
        found.push(state);
      }
    }
    return found;
  }
}
