export type ImageCache = Map<string, HTMLImageElement>;

export function preloadImages(sources: Record<string, string> | string[]): ImageCache {
  const entries = Array.isArray(sources)
    ? sources.map((source) => [source, source] as const)
    : Object.entries(sources);
  const cache: ImageCache = new Map();

  entries.forEach(([key, source]) => {
    const image = new Image();
    image.src = source;
    cache.set(key, image);
  });

  return cache;
}

export function loadedImage(cache: ImageCache, key: string): HTMLImageElement | null {
  const image = cache.get(key);
  return image && image.complete && image.naturalWidth > 0 ? image : null;
}
