import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import { DEFAULT_LANG, baseSlug, type Lang } from './site';

export type PostEntry =
  | CollectionEntry<'thoughts'>
  | CollectionEntry<'notes'>
  | CollectionEntry<'video-notes'>
  | CollectionEntry<'scripts'>;

export type ProjectEntry = CollectionEntry<'projects'>;

export type HarnessEntry = CollectionEntry<'harness'>;

const POST_COLLECTIONS = ['thoughts', 'notes', 'video-notes', 'scripts'] as const;
const CONTENT_ROOT = join(process.cwd(), 'src/content');

function hasMarkdownFiles(directory: string): boolean {
  if (!existsSync(directory)) {
    return false;
  }

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory() && hasMarkdownFiles(entryPath)) {
      return true;
    }

    if (entry.isFile() && /\.(md|mdx)$/u.test(entry.name)) {
      return true;
    }
  }

  return false;
}

function collectionHasContent(collection: string) {
  return hasMarkdownFiles(join(CONTENT_ROOT, collection));
}

function languageScore(entryLang: Lang, targetLang: Lang) {
  if (entryLang === targetLang) return 2;
  if (entryLang === DEFAULT_LANG) return 1;
  return 0;
}

function pickLocalized<T extends PostEntry | ProjectEntry | HarnessEntry>(entries: T[], lang: Lang) {
  const bySlug = new Map<string, T>();

  for (const entry of entries) {
    const key = baseSlug(entry.id);
    const current = bySlug.get(key);

    if (!current || languageScore(entry.data.lang, lang) > languageScore(current.data.lang, lang)) {
      bySlug.set(key, entry);
    }
  }

  return [...bySlug.values()];
}

export async function getAllPosts() {
  const collections = POST_COLLECTIONS.filter((collection) => collectionHasContent(collection));
  const entries = await Promise.all(collections.map((collection) => getCollection(collection)));
  return entries.flat().filter((post) => !post.data.draft) as PostEntry[];
}

export async function getPosts(lang: Lang = DEFAULT_LANG) {
  return pickLocalized(await getAllPosts(), lang).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}

export async function getPostPaths(lang: Lang = DEFAULT_LANG) {
  const posts = await getPosts(lang);
  return posts.map((post) => ({
    params: { slug: baseSlug(post.id) },
    props: { post },
  }));
}

export async function getProjects(lang: Lang = DEFAULT_LANG) {
  if (!collectionHasContent('projects')) {
    return [];
  }

  const entries = (await getCollection('projects')).filter((project) => !project.data.draft);
  return pickLocalized(entries, lang).sort((a, b) => b.data.order - a.data.order);
}

export async function getProjectPaths(lang: Lang = DEFAULT_LANG) {
  const projects = await getProjects(lang);
  return projects.map((project) => ({
    params: { slug: baseSlug(project.id) },
    props: { project },
  }));
}

export async function getHarness(lang: Lang = DEFAULT_LANG) {
  if (!collectionHasContent('harness')) {
    return [];
  }

  const entries = (await getCollection('harness')).filter((entry) => !entry.data.draft);
  return pickLocalized(entries, lang).sort((a, b) => {
    if (a.data.order !== b.data.order) return a.data.order - b.data.order;
    return b.data.date.getTime() - a.data.date.getTime();
  });
}

export async function getHarnessPaths(lang: Lang = DEFAULT_LANG) {
  const entries = await getHarness(lang);
  return entries.map((entry) => ({
    params: { slug: baseSlug(entry.id) },
    props: { entry },
  }));
}
