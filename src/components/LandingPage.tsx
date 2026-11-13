'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import HlsPlayer from './HlsPlayer';
import { BottomNav, BrandLogo, SiteFooter } from './SiteChrome';
import { logout } from '@/lib/clientSession';

/* ── TYPES ───────────────────────────────────────────────────── */
interface Episode {
  title: string;
  dur: string;
  videoUrl: string;
}

/**
 * A movie (single `videoUrl`) or, when `episodes` is set, a web series.
 * For a series `videoUrl` is episode 1 (used by banners / fallbacks).
 */
interface MediaItem {
  id: number;
  title: string;
  sub: string;
  hook?: string;
  tag: string;
  genre: string;
  dur: string;
  rating: string;
  year: string;
  accent: string;
  thumbnail: string;
  videoUrl: string;
  episodes?: Episode[];
}

interface RowData {
  label: string;
  desc: string;
  items: MediaItem[];
}

/* ── DATA ────────────────────────────────────────────────────── */
const SLIDES: MediaItem[] = [
  {
    id: 0,
    thumbnail: '/assets/thumbnails/glamour-thumnail.png',
    videoUrl:

  
      'https://vz-48d59760-133.b-cdn.net/f403dadc-0542-473f-814b-a07727b3053d/playlist.m3u8',
    tag: 'NO RULES. NO LIMITS.',
    title: 'Glamour',
    sub: 'Khubshoorti ka jawab nahi.',
    hook: 'Jahan har mulaqat ek naya raaz khol deti hai.',
    genre: 'Drama',
    dur: '1h 42m',
    rating: '9.2',
    year: '2025',
    accent: '#e11d48',
  },
  {
    id: 1,
    thumbnail:
      '/assets/thumbnails/kand-thumbnail.png',
    videoUrl:
      'https://vz-48d59760-133.b-cdn.net/12cd8054-2324-4498-b591-bc5807426b5b/playlist.m3u8',
    tag: 'TRENDING #1',
    title: 'Kand',
    sub: 'Mohabbat, junoon aur kuch aise raaz jo kabhi nahi khulte',
    hook: 'Ek kahani jo shuru hoti hai pyaar se, khatam hoti hai tabahi pe.',
    genre: 'Drama',
    dur: '2h 08m',
    rating: '8.4',
    year: '2025',
    accent: '#ec4899',
  },
  {
    id: 2,
    thumbnail: '/assets/thumbnails/mayaan-thumbnail.png',
    videoUrl:
      'https://vz-48d59760-133.b-cdn.net/b57c8e15-f95a-44c4-be60-64f7884910fd/playlist.m3u8',
    tag: 'PLAY. PAUSE. TEMPTATION.',
    title: 'Mayaan',
    sub: 'Har nazar ke peeche ek khamosh kahani chhupi hai',
    hook: 'Suspense jo saans rok de, har episode ke saath.',
    genre: 'Thriller',
    dur: '1h 55m',
    rating: '9.1',
    year: '2025',
    accent: '#f43f5e',
  },

  {
    id: 3,
    thumbnail: '/assets/thumbnails/pastry-thumbnail.png',
    videoUrl:
      'https://vz-48d59760-133.b-cdn.net/a4598302-47bd-4f39-8e97-702580d3a8e2/playlist.m3u8',
    tag: 'PLAY. PAUSE. TEMPTATION.',
    title: 'Pastry',
    sub: 'Har chehra ek sach chhupaye baitha hai',
    hook: 'Jitna meetha dikhta hai, utna hi khatarnak nikalta hai.',
    genre: 'Thriller',
    dur: '1h 55m',
    rating: '9.1',
    year: '2025',
    accent: '#f43f5e',
  },
];

const ROWS: RowData[] = [
  {
    label: 'Trending Now',
    desc: 'Sabse zyada dekhi jaane waali content — abhi is waqt',
    items: [
      {
        id: 1,
        tag: 'GLAMOUR',
        title: 'Glamour',
        sub: 'Khubshoorti ka jawab nahi.',
        genre: 'Drama',
        dur: '1h 42m',
        rating: '9.2',
        year: '2025',
        accent: '#e11d48',
        thumbnail:
          '/assets/thumbnails/glamour-thumnail.png',
        videoUrl:
          'https://vz-48d59760-133.b-cdn.net/f403dadc-0542-473f-814b-a07727b3053d/playlist.m3u8',
      },
      {
        id: 2,
        tag: 'KAND',
        title: 'Kand',
        sub: 'Junoon jab hadh se guzre toh sab kuch badal jaata hai',
        genre: 'Thriller',
        dur: '2h 08m',
        rating: '8.4',
        year: '2025',
        accent: '#ec4899',
        thumbnail:
          '/assets/thumbnails/kand-thumbnail.png',
        videoUrl:
          'https://vz-48d59760-133.b-cdn.net/12cd8054-2324-4498-b591-bc5807426b5b/playlist.m3u8',
      },
      {
        id: 3,
        tag: 'EXCLUSIVE DROP',
        title: 'Mayaan',
        sub: 'Mohabbat aur andhera ek saath chal rahe hain',
        genre: 'Drama',
        dur: '1h 55m',
        rating: '9.1',
        year: '2025',
        accent: '#f43f5e',
        thumbnail:
          '/assets/thumbnails/mayaan-thumbnail.png',
        videoUrl:
          'https://vz-48d59760-133.b-cdn.net/b57c8e15-f95a-44c4-be60-64f7884910fd/playlist.m3u8',
      },
      {
        id: 4,
        tag: 'PASTRY',
        title: 'Pastry',
        sub: 'Har chehra ek sach chhupaye baitha hai',
        genre: 'Mystery',
        dur: '1h 38m',
        rating: '8.7',
        year: '2024',
        accent: '#be123c',
        thumbnail:
          '/assets/thumbnails/pastry-thumbnail.png',
        videoUrl:
          'https://vz-48d59760-133.b-cdn.net/a4598302-47bd-4f39-8e97-702580d3a8e2/playlist.m3u8',
      },
    ],
  },
  {
    label: 'Web Series',
    desc: 'Episode dar episode — binge karne layak kahaniyan',
    items: [
      // DUMMY SERIES — the episode videos are placeholders (existing movie
      // streams). Replace each videoUrl with the real episode .m3u8 link.
      {
        id: 101,
        tag: 'NEW SERIES',
        title: 'Dr. Sakshi',
        sub: 'Dr. Sakshi is a gripping romantic drama that dives deep into the heart and mind of a woman',
        genre: 'Drama',
        dur: '2 Episodes',
        rating: '8.9',
        year: '2025',
        accent: '#8b5cf6',
        thumbnail: '/assets/thumbnails/Dr_Sakshi.png',
        videoUrl:
          'https://vz-48d59760-133.b-cdn.net/28bcea16-2daf-492e-b232-6fe2172fb9e8/playlist.m3u8',
        episodes: [
          {
            title: 'Pehla Din',
            dur: '24m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/28bcea16-2daf-492e-b232-6fe2172fb9e8/playlist.m3u8',
          },
          {
            title: 'Band Darwaze',
            dur: '27m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/fe92272d-65a0-4b15-8f95-9216089c631e/playlist.m3u8',
          },
        ],
      },
      {
        id: 102,
        tag: 'NEW SERIES',
        title: 'Gharwali Baharwali',
        sub: 'Ek ghar, chaar deewarein aur kuch raaz jo bahar nahi aa sakte',
        genre: 'Drama',
        dur: '4 Episodes',
        rating: '8.9',
        year: '2025',
        accent: '#8b5cf6',
        thumbnail: '/assets/thumbnails/Gharwali_Baharwali.png',
        videoUrl:
          'https://vz-48d59760-133.b-cdn.net/85f7c7a9-a7d5-4f62-b050-b8f136fa122f/playlist.m3u8',
        episodes: [
          {
            title: 'Pehla Din',
            dur: '24m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/85f7c7a9-a7d5-4f62-b050-b8f136fa122f/playlist.m3u8',
          },
          {
            title: 'Band Darwaze',
            dur: '27m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/2ac09459-286a-48ec-97ab-1c65e14022c9/playlist.m3u8',
          },
        ],
      },
      {
        id: 103,
        tag: 'NEW SERIES',
        title: 'Paying Guest',
        sub: 'Paying Guest is an engaging drama that unfolds within the walls of a shared living space',
        genre: 'Drama',
        dur: '2 Episodes',
        rating: '8.9',
        year: '2025',
        accent: '#8b5cf6',
        thumbnail: '/assets/thumbnails/Paying_Guest.png',
        videoUrl:
          'https://vz-48d59760-133.b-cdn.net/a361eeeb-87fa-4863-af32-f15aaa29f324/playlist.m3u8',
        episodes: [
          {
            title: 'New Beginnings',
            dur: '24m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/a361eeeb-87fa-4863-af32-f15aaa29f324/playlist.m3u8',
          },
          {
            title: 'Band Darwaze',
            dur: '27m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/5013ee54-a5c6-403f-b518-467b2d03b0f9/playlist.m3u8',
          }
        ],
      },
      {
        id: 104,
        tag: 'NEW SERIES',
        title: 'Resort',
        sub: 'Resort is a captivating drama that unfolds in a luxurious getaway where paradise meets hidden truths.',
        genre: 'Drama',
        dur: '4 Episodes',
        rating: '8.9',
        year: '2025',
        accent: '#8b5cf6',
        thumbnail: '/assets/thumbnails/Resort.png',
        videoUrl:
          'https://vz-48d59760-133.b-cdn.net/f717b31e-63b6-4a51-b015-c7748850cece/playlist.m3u8',
        episodes: [
          {
            title: 'Pehla Din',
            dur: '24m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/f717b31e-63b6-4a51-b015-c7748850cece/playlist.m3u8',
          },
          {
            title: 'Band Darwaze',
            dur: '27m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/11bd9f49-5c59-487d-93b8-b7648ef32e01/playlist.m3u8',
          },
          {
            title: 'Raat Ka Raaz',
            dur: '25m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/dd82b672-956b-4642-a0e7-64759743b1cf/playlist.m3u8',
          },
          {
            title: 'Aakhri Faisla',
            dur: '31m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/02f699cb-0784-4a6b-aeb2-2597af9809ba/playlist.m3u8',
          },
        ],
      },
      {
        id: 105,
        tag: 'NEW SERIES',
        title: 'Imli',
        sub: 'Imli is an intense romantic drama about a young woman',
        genre: 'Drama',
        dur: '4 Episodes',
        rating: '8.9',
        year: '2025',
        accent: '#8b5cf6',
        thumbnail: '/assets/thumbnails/Imli.png',
        videoUrl:
          'https://vz-48d59760-133.b-cdn.net/0975c95d-3759-41a7-aa38-b629e90fe6c1/playlist.m3u8',
        episodes: [
          {
            title: 'Pehla Din',
            dur: '24m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/0975c95d-3759-41a7-aa38-b629e90fe6c1/playlist.m3u8',
          },
          {
            title: 'Band Darwaze',
            dur: '27m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/5d38c9cc-942f-4c3d-a113-727814d913e0/playlist.m3u8',
          },
          {
            title: 'Raat Ka Raaz',
            dur: '25m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/5d8455b3-eba8-4042-8b3f-e4ac6e561604/playlist.m3u8',
          },
          {
            title: 'Aakhri Faisla',
            dur: '31m',
            videoUrl:
              'https://vz-48d59760-133.b-cdn.net/c3a0accf-44b8-4614-82ed-63d25da884be/playlist.m3u8',
          },
        ],
      },
    ],
  },
];

/* ── ICONS ───────────────────────────────────────────────────── */
const IconPlay = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
  </svg>
);
const IconChev = ({ dir }: { dir: 'l' | 'r' }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points={dir === 'l' ? '15,18 9,12 15,6' : '9,18 15,12 9,6'} />
  </svg>
);
const IconStar = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8L12 2.5Z" />
  </svg>
);

/* ── PLAYER PAGE ─────────────────────────────────────────────── */
function PlayerPage({ item, onBack }: { item: MediaItem; onBack: () => void }) {
  const episodes = item.episodes ?? [];
  const isSeries = episodes.length > 0;
  const [epIdx, setEpIdx] = useState(0);
  const ep = isSeries ? episodes[epIdx] : null;
  const hasNext = isSeries && epIdx < episodes.length - 1;
  const playNext = () => {
    if (hasNext) setEpIdx((i) => i + 1);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--bg)] flex flex-col md:flex-row overflow-hidden">
      {/* Video column */}
      <div className="relative flex flex-col md:flex-1 bg-black">
        <div className="absolute top-0 inset-x-0 z-10 flex items-center gap-3 px-3 sm:px-5 py-3 bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
          <button
            onClick={onBack}
            aria-label="Back"
            className="pointer-events-auto focus-ring w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur text-white transition-colors"
          >
            <IconChev dir="l" />
          </button>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-semibold text-white truncate">{item.title}</p>
            {ep && (
              <p className="text-[11px] text-white/60 truncate">
                Episode {epIdx + 1} · {ep.title}
              </p>
            )}
          </div>
        </div>
        <div className="relative w-full aspect-video md:aspect-auto md:flex-1">
          {/* key: remount the player when the episode changes */}
          <HlsPlayer key={ep?.videoUrl ?? item.videoUrl} url={ep?.videoUrl ?? item.videoUrl} onEnded={playNext} />
        </div>
      </div>

      {/* Details column */}
      <aside className="flex-1 md:flex-none md:w-[360px] lg:w-[400px] overflow-y-auto no-scrollbar border-t md:border-t-0 md:border-l border-white/[0.06]">
        <div className="p-4 sm:p-6 space-y-4">
          <div className="space-y-2">
            <span
              className="inline-block text-[10px] font-bold tracking-[0.16em] uppercase px-2 py-1 rounded-md"
              style={{ background: `${item.accent}22`, color: item.accent }}
            >
              {item.genre}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight">{item.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <IconStar /> {item.rating}
              </span>
              <span>{item.year}</span>
              <span className="w-1 h-1 rounded-full bg-white/25" />
              <span>{ep ? `E${epIdx + 1} · ${ep.dur}` : item.dur}</span>
            </div>
            <p className="text-sm text-white/65 leading-relaxed">{item.sub}</p>
          </div>

          {hasNext && (
            <button onClick={playNext} className="btn-primary w-full rounded-xl py-3 text-sm">
              <IconPlay s={14} /> Next episode
            </button>
          )}

          {isSeries && (
            <div className="space-y-2 pt-2">
              <p className="eyebrow">Episodes · {episodes.length}</p>
              <ol className="space-y-2">
                {episodes.map((e, i) => {
                  const active = i === epIdx;
                  return (
                    <li key={e.videoUrl + i}>
                      <button
                        onClick={() => setEpIdx(i)}
                        aria-current={active ? 'true' : undefined}
                        className={`focus-ring w-full flex items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                          active ? 'bg-white/[0.08] ring-1 ring-[var(--accent)]/60' : 'bg-white/[0.03] hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0 bg-white/5">
                          <Image src={item.thumbnail} alt="" fill sizes="96px" className="object-cover" />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                            {active ? (
                              <span className="flex gap-0.5 items-end h-3" aria-label="Now playing">
                                <span className="w-0.5 h-3 bg-white animate-pulse" />
                                <span className="w-0.5 h-2 bg-white animate-pulse [animation-delay:.2s]" />
                                <span className="w-0.5 h-2.5 bg-white animate-pulse [animation-delay:.4s]" />
                              </span>
                            ) : (
                              <IconPlay s={14} />
                            )}
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[10px] font-bold tracking-widest" style={{ color: item.accent }}>
                            EPISODE {i + 1}
                          </span>
                          <span className="block text-sm font-semibold truncate">{e.title}</span>
                          <span className="block text-[11px] text-white/45">{e.dur}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ── CARDS ────────────────────────────────────────────────────── */
function MovieCard({ item, rank, onPlay }: { item: MediaItem; rank: number; onPlay: (i: MediaItem) => void }) {
  return (
    <button
      onClick={() => onPlay(item)}
      className="group focus-ring snap-start shrink-0 w-[78vw] max-w-[340px] sm:w-[320px] text-left rounded-2xl"
      aria-label={`Play ${item.title}`}
    >
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/[0.08]">
        <Image
          src={item.thumbnail}
          alt=""
          fill
          sizes="(min-width: 640px) 320px, 78vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <span className="absolute top-2.5 left-2.5 text-[10px] font-bold tracking-[0.14em] px-2 py-1 rounded-md bg-black/55 backdrop-blur text-white">
          #{rank} TRENDING
        </span>
        <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-black/55 backdrop-blur text-amber-400">
          <IconStar /> {item.rating}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-3.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight truncate">{item.title}</p>
            <p className="text-[11px] text-white/60 mt-0.5">
              {item.genre} · {item.dur} · {item.year}
            </p>
          </div>
          <span className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white text-black shadow-lg transition-transform group-hover:scale-110">
            <IconPlay s={16} />
          </span>
        </div>
      </div>
    </button>
  );
}

function SeriesCard({ item, onPlay }: { item: MediaItem; onPlay: (i: MediaItem) => void }) {
  return (
    <button
      onClick={() => onPlay(item)}
      className="group focus-ring snap-start shrink-0 w-[38vw] max-w-[180px] sm:w-[170px] text-left rounded-2xl"
      aria-label={`Play ${item.title}`}
    >
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/[0.08]">
        <Image
          src={item.thumbnail}
          alt=""
          fill
          sizes="(min-width: 640px) 170px, 38vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute top-2 left-2 text-[9px] font-bold tracking-[0.14em] px-1.5 py-0.5 rounded bg-[var(--accent)] text-white">
          NEW
        </span>
        <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-white/90">
          {item.episodes?.length ?? 0} Episodes
        </span>
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="w-11 h-11 rounded-full flex items-center justify-center bg-white text-black shadow-lg">
            <IconPlay s={16} />
          </span>
        </span>
      </div>
      <p className="mt-2 text-[13px] font-semibold leading-tight truncate">{item.title}</p>
      <p className="text-[11px] text-white/45 mt-0.5">
        {item.genre} · {item.year}
      </p>
    </button>
  );
}

/* ── RAIL ─────────────────────────────────────────────────────── */
function Rail({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    check();
    el?.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      el?.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [check]);

  const scroll = (d: 'l' | 'r') => {
    const el = ref.current;
    if (el) el.scrollBy({ left: (d === 'r' ? 1 : -1) * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="anim-fade-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-end justify-between gap-4 mb-3 sm:mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h2>
          <p className="text-xs text-white/45 mt-0.5">{desc}</p>
        </div>
        <div className="hidden md:flex gap-2">
          {(['l', 'r'] as const).map((d) => (
            <button
              key={d}
              onClick={() => scroll(d)}
              disabled={d === 'l' ? !canL : !canR}
              aria-label={d === 'l' ? 'Scroll left' : 'Scroll right'}
              className="btn-ghost w-9 h-9 rounded-full disabled:opacity-30 disabled:cursor-default"
            >
              <IconChev dir={d} />
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <div
          ref={ref}
          className="no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-8 px-4 sm:px-8 pb-2"
        >
          {children}
        </div>
      </div>
    </section>
  );
}

/* ── MAIN PAGE ────────────────────────────────────────────────── */
type Filter = 'all' | 'movies' | 'series';
const SLIDE_MS = 7000;

export default function LandingPage() {
  const [slide, setSlide] = useState(0);
  const [nowPlaying, setNowPlaying] = useState<MediaItem | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [scrolled, setScrolled] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((d: number) => setSlide((s) => (s + d + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('mr_purchase') === '1') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    if (paused || nowPlaying) return;
    const t = setInterval(() => go(1), SLIDE_MS);
    return () => clearInterval(t);
  }, [go, paused, nowPlaying, slide]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cur = SLIDES[slide];
  const [movies, series] = ROWS;

  if (nowPlaying) return <PlayerPage item={nowPlaying} onBack={() => setNowPlaying(null)} />;

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[var(--bg)] text-white">
      <style>{`@keyframes heroProgress { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>

      {/* ══ HEADER ══ */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
          scrolled ? 'bg-[#07080d]/85 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-gradient-to-b from-black/70 to-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between gap-3">
          <BrandLogo />
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link href="/" className="focus-ring px-3 py-2 rounded-lg text-white font-semibold">
              Home
            </Link>
            <Link href="/subscription" className="focus-ring px-3 py-2 rounded-lg text-white/60 hover:text-white transition-colors">
              Plans
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              aria-label="My profile"
              className="focus-ring w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.disabled = true;
                void logout('/auth');
              }}
              aria-label="Sign out"
              title="Sign out"
              className="focus-ring hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/10 transition-colors disabled:opacity-60"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section
        className="relative w-full h-[72svh] min-h-[460px] max-h-[820px] md:h-[86vh] overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
        aria-roledescription="carousel"
        aria-label="Featured"
      >
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-[1200ms]"
            style={{ opacity: i === slide ? 1 : 0 }}
            aria-hidden={i !== slide}
          >
            <Image
              src={s.thumbnail}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover object-[center_20%] transition-transform duration-[8000ms] ease-linear ${
                i === slide ? 'scale-110' : 'scale-100'
              }`}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)]/80 via-transparent to-transparent hidden md:block" />

        <div className="absolute inset-x-0 bottom-0 z-10">
          <div key={slide} className="anim-fade-up max-w-7xl mx-auto px-4 sm:px-8 pb-6 sm:pb-12 md:pb-16">
            <div className="max-w-xl">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded-full mb-3"
                style={{ background: `${cur.accent}26`, color: '#fff', border: `1px solid ${cur.accent}66` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cur.accent }} />
                {cur.tag}
              </span>
              <h1 className="text-[42px] sm:text-6xl md:text-7xl font-extrabold leading-[0.95] tracking-tight">{cur.title}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs sm:text-sm text-white/70">
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <IconStar /> {cur.rating}
                </span>
                <span>{cur.year}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{cur.dur}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{cur.genre}</span>
              </div>
              <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed line-clamp-2">{cur.hook ?? cur.sub}</p>
              <div className="flex items-center gap-3 mt-5">
                <button onClick={() => setNowPlaying(cur)} className="btn-primary rounded-full px-6 sm:px-7 py-3 text-sm">
                  <IconPlay s={16} /> Watch now
                </button>
                <div className="flex items-center gap-1.5 ml-auto md:ml-4">
                  {SLIDES.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setSlide(i)}
                      aria-label={`Show ${s.title}`}
                      aria-current={i === slide}
                      className="focus-ring relative h-1.5 rounded-full overflow-hidden bg-white/20 transition-all duration-300"
                      style={{ width: i === slide ? 28 : 8 }}
                    >
                      {i === slide && (
                        <span
                          key={`p-${slide}-${paused}`}
                          className="absolute inset-0 origin-left bg-white"
                          style={{ animation: paused ? 'none' : `heroProgress ${SLIDE_MS}ms linear forwards` }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {(['l', 'r'] as const).map((d) => (
          <button
            key={d}
            onClick={() => go(d === 'r' ? 1 : -1)}
            aria-label={d === 'l' ? 'Previous' : 'Next'}
            className={`hidden md:flex absolute ${d === 'l' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 z-10 btn-ghost w-11 h-11 rounded-full backdrop-blur`}
          >
            <IconChev dir={d} />
          </button>
        ))}
      </section>

      {/* ══ FILTERS ══ */}
      <div className="sticky top-14 sm:top-16 z-40 bg-[var(--bg)]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {(
            [
              ['all', 'All'],
              ['movies', 'Movies'],
              ['series', 'Web Series'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={`focus-ring shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
                filter === id
                  ? 'bg-white text-black border-white'
                  : 'bg-white/[0.04] text-white/70 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ RAILS ══ */}
      <main className="relative z-10 space-y-8 sm:space-y-12 pt-3 pb-12 sm:pb-16">
        {filter !== 'series' && (
          <Rail title={movies.label} desc={movies.desc}>
            {movies.items.map((it, i) => (
              <MovieCard key={it.id} item={it} rank={i + 1} onPlay={setNowPlaying} />
            ))}
          </Rail>
        )}
        {filter !== 'movies' && (
          <Rail title={series.label} desc={series.desc}>
            {series.items.map((it) => (
              <SeriesCard key={it.id} item={it} onPlay={setNowPlaying} />
            ))}
          </Rail>
        )}
      </main>

      <SiteFooter withBottomNavSpace />
      <BottomNav active="home" />
    </div>
  );
}
