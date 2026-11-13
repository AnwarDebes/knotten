"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MAP, MAP_ORDER, mapCount } from "@/lib/content/maps";
import { kHref } from "@/lib/klassisk/locale";
import { Src } from "./Source";

/**
 * "Fra kysten til tomten": the owner's real maps, zooming in step by step as the visitor scrolls. The map stays put
 * on one side; the text steps scroll past and switch the image. The same eight steps as the Moderne front page
 * (src/lib/content/maps.ts), in Norwegian or English.
 */
export default function MapJourney({ locale = "no" }: { locale?: "no" | "en" }) {
  const [i, setI] = useState(0);
  // a map is fetched when the step before it is reached, not all eight at once (the same pictures, fewer bytes)
  const [reach, setReach] = useState(1);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        const k = Number((e.target as HTMLElement).dataset.i);
        setI(k);
        setReach((r) => Math.max(r, k + 1));
      }),
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const en = locale === "en";
  return (
    <div className="journey">
      <div className="jsteps">
        {MAP_ORDER.map((key, k) => {
          const m = MAP[key];
          return (
            <div key={key} ref={(el) => { refs.current[k] = el; }} data-i={k} className={`jstep${i === k ? " on" : ""}`}>
              <span className="jnum">{mapCount(k, locale)}</span>
              <h3>{m.title[locale]}</h3>
              <p>{m.text[locale]} <Src id={m.source} label={en ? "Source" : "Kilde"} /></p>
              {k === MAP_ORDER.length - 1 && <div className="cta-row" style={{ marginTop: 14 }}><Link className="btn ghost sm" href={kHref("/kart", locale)}>{en ? "All the maps in full size" : "Alle kart i full størrelse"}</Link></div>}
            </div>
          );
        })}
      </div>
      <div className="jstage">
        <div className="jframe">
          {MAP_ORDER.map((key, k) => {
            const m = MAP[key];
            return (
              <div key={key} className={`jimg${i === k ? " on" : ""}`}>
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
