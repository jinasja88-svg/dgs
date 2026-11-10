import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const PUBLIC_PATHS = ['/shop', '/pricing', '/about', '/faq', '/notices', '/guide', '/contact', '/terms', '/privacy', '/coupang'];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return PUBLIC_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === '/shop' ? 'daily' : 'monthly',
    priority: path === '/shop' ? 1 : 0.5,
  }));
}
