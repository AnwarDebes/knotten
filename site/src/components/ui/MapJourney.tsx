"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import Src from "./Source";
import { MAP, MAP_ORDER, mapCount } from "@/lib/content/maps";

/**
 * The maps behind the plan, from the coast down to the plot: the map stays on one side while the steps scroll past
 * and switch it. The same eight steps as the Klassisk front page (src/lib/content/maps.ts). One IntersectionObserver,
 * images lazy, opacity only.
 */
export default function MapJourney({ locale }: { locale: Locale }) {
  const [i, setI] = useState(0);
  // a map is fetched when the step before it is reached, not all eight at once (the same pictures, fewer bytes)
  const [reach, setReach] = useState(1);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const k = Number((e.target as HTMLElement).dataset.i);
      setI(k);
      setReach((r) => Math.max(r, k + 1));
    }), { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const no = locale === "no";
  return (
    <div className="journey">
      <div className="jsteps">
        {MAP_ORDER.map((key, k) => {
          const m = MAP[key];
          return (
            <div key={key} ref={(el) => { refs.current[k] = el; }} data-i={k} className={`jstep ${i === k ? "on" : ""}`}>
              <span className="jnum">{mapCount(k, locale)}</span>
              <h3>{m.title[locale]}</h3>
              <p className="text-[15.5px] text-ink-2 max-w-[46ch]">{m.text[locale]} <Src id={m.source} locale={locale} /></p>
              {k === MAP_ORDER.length - 1 && <Link className="btn btn-ghost btn-sm mt-4 no-underline" href={`/${locale}/omradet#kart`}>{no ? "Alle kartene i full størrelse" : "All the maps in full size"}</Link>}
            </div>
          );
        })}
      </div>
      <div className="jstage">
        <div className="jframe">
          {MAP_ORDER.map((key, k) => {
            const m = MAP[key];
            return (
              <div key={key} className={`jimg ${i === k ? "on" : ""}`}>
                {k <= reach && <Image src={m.src} alt={m.alt[locale]} width={m.w} height={m.h} sizes="(max-width: 900px) 100vw, 56vw" quality={92} unoptimized={m.w < 900} />}
              </div>
            );
          })}
          <div className="jcap">{MAP[MAP_ORDER[i]].credit[locale]}</div>
        </div>
      </div>
    </div>
  );
}
