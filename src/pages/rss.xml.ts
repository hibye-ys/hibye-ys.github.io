import rss from '@astrojs/rss';
import { getPosts } from '../lib/content';
import { SITE, baseSlug } from '../lib/site';

export async function GET(context: { site: URL }) {
  const all = await getPosts('ko');

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.siteUrl,
    items: all
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.excerpt ?? '',
        link: `/posts/${baseSlug(post.id)}/`,
      })),
  });
}
