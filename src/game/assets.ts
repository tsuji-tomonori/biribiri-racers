export const assetUrl = (file: string): string =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/assets/${file}`;
export interface Assets {
  courses: HTMLImageElement[];
  racers: HTMLImageElement;
}
export async function loadAssets(): Promise<Assets> {
  const urls = [
    ...Array.from({ length: 5 }, (_, i) => assetUrl(`course-${i}.webp`)),
    assetUrl('racers.webp'),
  ];
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
  return { courses: images.slice(0, 5), racers: images[5]! };
}
