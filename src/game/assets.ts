import { TRACKS } from './tracks';
import { advancedCourseUrl } from './course-artwork';
import type { Track } from './types';
declare const __BUILD_SHA__: string;

export const assetUrl = (file: string): string =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/assets/${file}?v=${encodeURIComponent(__BUILD_SHA__)}`;
export const courseUrl = (t: Track): string =>
  t.theme ? advancedCourseUrl(t) : assetUrl(`course-${t.id}.webp`);
export interface Assets {
  courses: HTMLImageElement[];
  racers: HTMLImageElement;
}
export async function loadAssets(): Promise<Assets> {
  const urls = [...TRACKS.map(courseUrl), assetUrl('racers.webp')];
  const images = await Promise.all(
    urls.map(async (src) => {
      const image = new Image();
      image.src = src;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          image.decode(),
          new Promise<never>(
            (_, reject) =>
              (timeout = setTimeout(
                () => reject(new Error('画像の読み込みがタイムアウトしました')),
                15000,
              )),
          ),
        ]);
      } finally {
        clearTimeout(timeout);
      }
      return image;
    }),
  );
  return {
    courses: images.slice(0, TRACKS.length),
    racers: images[TRACKS.length]!,
  };
}
