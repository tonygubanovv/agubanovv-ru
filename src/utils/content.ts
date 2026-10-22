import { getCollection, type CollectionEntry } from 'astro:content';

type Entry = CollectionEntry<'blog'>;
const compare = (a: Entry, b: Entry) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id, 'en');
export const blogEntries = async () => (await getCollection('blog')).sort(compare);
export const dateLabel = (date: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }).format(new Date(`${date}T12:00:00+03:00`));

export const publicationPath = (entry: CollectionEntry<'blog'>) => entry.data.permalink ? `${entry.data.permalink}/` : `blog/${entry.id}/`;
