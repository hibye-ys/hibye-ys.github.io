export const SITE = {
  name: "HYINN",
  description: "HYINN's Blog",
  author: "HYINN's Blog",
  githubUrl: "https://github.com/hibye-ys",
  githubLabel: "github.com/hibye-ys",
  email: "heunwhite@gmail.com",
  siteUrl: "https://hibye-ys.github.io",
};

export type Lang = "ko" | "en";

export const DEFAULT_LANG: Lang = "ko";

export function localizedPath(path: string, lang: Lang = DEFAULT_LANG) {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (lang === DEFAULT_LANG) {
    return normalized;
  }

  return normalized === "/" ? "/en/" : `/en${normalized}`;
}

export function canonicalPath(path: string) {
  const cleanPath = path.replace(/\/index\.html$/, "/");
  return cleanPath.replace(/^\/en(?=\/|$)/, "") || "/";
}

export function switchLocalePath(path: string, lang: Lang) {
  return localizedPath(canonicalPath(path), lang);
}

export function baseSlug(slug: string) {
  return slug.replace(/\.(ko|en)$/u, "");
}

export function formatDate(date: Date, lang: Lang = DEFAULT_LANG) {
  return new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
