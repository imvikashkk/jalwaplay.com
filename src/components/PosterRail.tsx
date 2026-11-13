import Image from 'next/image';

/** Auto-scrolling row of small poster cards (styles live in globals.css). */

export type Poster = { src: string; portrait?: boolean };
const T = '/assets/thumbnails/';

export const ROW_TOP: Poster[] = [
  { src: `${T}Dr_Sakshi.png`, portrait: true },
  { src: `${T}kand-thumbnail.png` },
  { src: `${T}agentmona.png` },
  { src: `${T}Imli.png`, portrait: true },
  { src: `${T}Night in LA.png` },
  { src: `${T}muse.png` },
  { src: `${T}Resort.png`, portrait: true },
  { src: `${T}dhund.png` },
  { src: `${T}glamour-thumnail.png` },
];

export const ROW_BOTTOM: Poster[] = [
  { src: `${T}mayaan-thumbnail.png` },
  { src: `${T}Gharwali_Baharwali.png`, portrait: true },
  { src: `${T}gun_point.png` },
  { src: `${T}love lust.png` },
  { src: `${T}Paying_Guest.png`, portrait: true },
  { src: `${T}Kinaya.png` },
  { src: `${T}pastry-thumbnail.png` },
  { src: `${T}9oclock.png` },
  { src: `${T}in_laws.png` },
];

export function PosterRail({ posters, direction, priority = false }: { posters: Poster[]; direction: 'left' | 'right'; priority?: boolean }) {
  // Rendered twice so translateX(-50%) loops seamlessly.
  const loop = [...posters, ...posters];
  return (
    <div className="rail w-full overflow-hidden py-2" aria-hidden="true">
      <div className={`rail-track ${direction}`}>
        {loop.map((p, i) => (
          <div key={`${p.src}-${i}`} className={`poster ${p.portrait ? 'portrait' : 'landscape'}`}>
            <Image
              src={p.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 240px, (min-width: 640px) 200px, 150px"
              className="object-cover"
              priority={priority && i < 4}
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
