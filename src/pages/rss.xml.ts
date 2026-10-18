import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '@/lib/site-config';
import { typesetText } from '@/lib/typography';
import { absolute, p } from '@/lib/utils';

/** RSS по всем опубликованным материалам. Ссылки строятся от BASE_URL,
 *  чтобы фид работал и на project-site (/repo/), и на домене. */
export async function GET() {
  const items = await getCollection('blog', ({ data }) => !data.draft && !data.noindex);

  return rss({
    title: site.title,
    description: site.description,
    site: absolute('/'),
    trailingSlash: true,
    customData: `<language>${site.locale}</language>`,
    items: items
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
      .slice(0, 40)
      .map((entry) => ({
        title: entry.data.title,
        description: typesetText(entry.data.dek),
        pubDate: entry.data.date,
        link: absolute(p(`${entry.data.kind === 'case' ? '/cases/' : '/blog/'}${entry.id}/`)),
        categories: [entry.data.topic, ...entry.data.tags],
        author: site.byline,
      })),
  });
}
