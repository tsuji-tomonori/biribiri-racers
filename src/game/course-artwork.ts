import type { Gimmick, Track, Vec } from './types';
const polygon = (points: readonly Vec[]): string =>
  `M${points.map((p) => p.join(',')).join('L')}Z`;
const palette = {
  sky: ['#397ace', '#9ae9ff', '#457bab', '#d5f6ff'],
  jungle: ['#145f59', '#8fe48c', '#2f855d', '#e7f6a4'],
  factory: ['#232857', '#9b81f4', '#464177', '#d4d5ff'],
} as const;
export function gimmickArtwork(g: Gimmick): string {
  const transform = `translate(${g.x} ${g.y}) rotate(${(g.angle * 180) / Math.PI})`;
  if (g.kind === 'spin')
    return `<g transform="${transform}"><circle r="${g.radius}" fill="#fbd552" stroke="#70491c" stroke-width="4"/><path d="M-5 -22 Q0 6 -27 20 Q-3 30 5 8 Q14 29 29 20 Q9 5 5 -22Z" fill="#fff08d" stroke="#876121" stroke-width="3"/><path d="M-5 -23H5" stroke="#725336" stroke-width="7"/></g>`;
  const color = g.kind === 'wind' ? '#77eaff' : '#96ff85';
  return `<g transform="${transform}"><circle r="${g.radius}" fill="${g.kind === 'wind' ? '#127aa9' : '#237453'}" stroke="${color}" stroke-width="5"/>${[-35, 0, 35].map((x) => `<path d="M${x - 12} -32L${x + 12} 0L${x - 12} 32" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</g>`;
}
export function courseArtwork(t: Track): string {
  const size = t.worldSize ?? 1254,
    [bg, accent, island, road] = palette[t.theme!];
  const contour = polygon(t.outer) + t.holes.map(polygon).join('');
  const scenery: string[] = [];
  for (let y = 120; y < size; y += 290)
    for (let x = 120; x < size; x += 290) {
      const shift = Math.sin(x * 7 + y) * 50;
      const shape =
        t.theme === 'sky'
          ? '<path d="M-66 10Q-92-30-45-32Q-40-80 10-56Q52-70 58-22Q105-20 76 17Z" fill="#e4f9ff" opacity=".7"/>'
          : t.theme === 'jungle'
            ? '<path d="M-50 40L0-68L50 40Z" fill="#134f50"/><path d="M-45 10L0-92L45 10Z" fill="#64bf78"/><path d="M0 40V66" stroke="#795a43" stroke-width="15"/>'
            : '<rect x="-50" y="-45" width="100" height="100" rx="15" fill="#292d55" stroke="#847dcb" stroke-width="5"/><path d="M-25-20H25M-25 0H25M-25 20H25" stroke="#76e9ec" stroke-width="8"/>';
      scenery.push(`<g transform="translate(${x + shift} ${y})">${shape}</g>`);
    }
  const [fx, fy] = t.finish.a,
    end = t.finish.b;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${island}"/></linearGradient>
  <pattern id="tiles" width="72" height="72" patternUnits="userSpaceOnUse"><rect width="72" height="72" fill="${road}"/><path d="M0 0H36V36H72V72H36V36H0Z" fill="#ffffff" opacity=".17"/></pattern>
  <pattern id="finish" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#fff"/><path d="M0 0H16V16H32V32H16V16H0Z" fill="#203956"/></pattern>
  <clipPath id="scenery"><path d="M0 0H${size}V${size}H0Z${contour}" clip-rule="evenodd"/></clipPath></defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <g clip-path="url(#scenery)">${scenery.join('')}</g>
  <path d="${contour}" fill="#102c4b" fill-rule="evenodd" stroke="#102c4b" stroke-width="34" transform="translate(0 13)"/>
  <path d="${contour}" fill="url(#tiles)" fill-rule="evenodd" stroke="${accent}" stroke-width="24" stroke-linejoin="round"/>
  <path d="${contour}" fill="none" stroke="#efffff" stroke-width="5" stroke-linejoin="round"/>
  <path d="${contour}" fill="none" stroke="#fff" stroke-width="8" stroke-dasharray="4 65"/>
  <rect x="${fx + 12}" y="${fy - 16}" width="${end[0] - fx - 24}" height="32" fill="url(#finish)"/>
  <g fill="#fff" font-family="system-ui,sans-serif" font-weight="900" text-anchor="middle"><text x="${size / 2}" y="115" font-size="56">${t.name}</text><text x="300" y="${fy + 80}" fill="#203956" font-size="27">START / FINISH</text></g>
  ${(t.gimmicks ?? []).map(gimmickArtwork).join('')}
  </svg>`;
}
export const advancedCourseUrl = (t: Track): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(courseArtwork(t))}`;
