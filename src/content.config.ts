import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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

const markdownLoader = (directory: string) => {
  const loader = glob({
    base: './src/content',
    pattern: `${directory}/**/*.{md,mdx}`,
    generateId: ({ entry, data }) => {
      if (typeof data.slug === 'string') {
        return data.slug;
      }

      return entry
        .replace(new RegExp(`^${directory}/`), '')
        .replace(/\.(md|mdx)$/u, '')
        .replace(/\/index$/u, '');
    },
  });

  return {
    name: `${directory}-markdown-loader`,
    load: async (context) => {
      const directoryPath = fileURLToPath(new URL(`./src/content/${directory}/`, context.config.root));

      if (!hasMarkdownFiles(directoryPath)) {
        return;
      }

      return loader.load(context);
    },
  };
};

const postBase = z.object({
  title: z.string(),
  date: z.coerce.date(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  lang: z.enum(['ko', 'en']).default('ko'),
  draft: z.boolean().default(false),
  cover: z.string().optional(),
});

const thoughts = defineCollection({
  loader: markdownLoader('thoughts'),
  schema: postBase,
});

const notes = defineCollection({
  loader: markdownLoader('notes'),
  schema: postBase.extend({
    domain: z.string().optional(),
  }),
});

const scripts = defineCollection({
  loader: markdownLoader('scripts'),
  schema: postBase.extend({
    video_url: z.string().url(),
    duration: z.string(),
    thumbnail: z.string().optional(),
  }),
});

const videoNotes = defineCollection({
  loader: markdownLoader('video-notes'),
  schema: postBase.extend({
    source_url: z.string().url(),
    source_name: z.string(),
    author: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: markdownLoader('projects'),
  schema: z.object({
    title: z.string(),
    year: z.string(),
    tag: z.enum(['web', 'tool', 'writing', 'other']).default('web'),
    stack: z.array(z.string()).default([]),
    links: z.object({
      live: z.string().url().optional(),
      github: z.string().url().optional(),
      post: z.string().optional(),
    }).default({}),
    description: z.string(),
    cover: z.string().optional(),
    order: z.number().default(0),
    lang: z.enum(['ko', 'en']).default('ko'),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  thoughts,
  notes,
  scripts,
  'video-notes': videoNotes,
  projects,
};
