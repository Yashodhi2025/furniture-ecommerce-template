'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { DENEB_PREVIEW_FOCUS_MESSAGE, PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE, EditableImage, EditableText } from '@deneb-ui/ui';
import { contentList, contentObject, contentText } from '@/lib/siteDataContext';
import { withBasePath } from '@/lib/utils';
import './HomeHeroShowcase.css';

const SLIDE_INTERVAL_MS = 3000;
const PENTAGON_VERTICES = [[0, .5], [.3455, .0245], [.9045, .2061], [.9045, .7939], [.3455, .9755]];
// Trim a small, equal fraction of each edge and soften the five tips.
const ROUNDED_PENTAGON_PATH = PENTAGON_VERTICES.map((point, index, points) => {
  const previous = points[(index + points.length - 1) % points.length];
  const next = points[(index + 1) % points.length];
  const before = point.map((value, axis) => value + (previous[axis] - value) * .04);
  const after = point.map((value, axis) => value + (next[axis] - value) * .04);
  return `${index ? 'L' : 'M'}${before.join(' ')} Q${point.join(' ')} ${after.join(' ')}`;
}).join(' ') + ' Z';

function updateWheel(stage: HTMLDivElement | null, position: number, count: number) {
  if (!stage || !count) return;
  stage.style.setProperty('--wheel-turn', `${-position * 360 / count}deg`);
  stage.querySelectorAll<HTMLElement>('.lumi-showcase-object').forEach((object, index) => {
    const offset = ((index - position) % count + count) % count;
    const distance = Math.min(offset, count - offset, 1);
    // A cosine ramp has a gentle slope at both the small and featured sizes.
    const focus = (1 + Math.cos(distance * Math.PI)) / 2;
    object.style.setProperty('--item-scale', String(.48 + .62 * focus));
  });
}

export default function HomeHeroShowcase({ slides: rawSlides }: { slides: unknown }) {
  const slides = contentList(rawSlides).map(contentObject);
  const pentagonClipId = `hero-pentagon-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const stage = useRef<HTMLDivElement>(null);
  const wheelPosition = useRef(0);
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [editing, setEditing] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [imagesReady, setImagesReady] = useState(false);
  const [interaction, setInteraction] = useState(0);
  const imageSources = slides.map(slide => contentText(slide.imageUrl)).join('\n');
  const active = slides.length ? selected % slides.length : 0;
  const playing = !paused && !reduced && !editing && inView && visible && imagesReady;

  // Decode the cutouts before starting the clock so each transition has an image.
  useEffect(() => {
    let cancelled = false;
    setImagesReady(false);
    const images = [...(stage.current?.querySelectorAll<HTMLImageElement>('.lumi-showcase-cutout') ?? [])];
    Promise.all(images.map(image => image.decode().catch(() => {}))).then(() => {
      if (!cancelled) setImagesReady(true);
    });
    return () => { cancelled = true; };
  }, [imageSources]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setReduced(preference.matches);
    const syncVisibility = () => setVisible(document.visibilityState === 'visible');
    const editMode = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      if (['FIVORA_PREVIEW_EDIT_MODE', 'MARKETPLACE_PREVIEW_EDIT_MODE'].includes(event.data?.type)) setEditing(Boolean(event.data.editMode));
      if ([PREVIEW_FOCUS_MESSAGE, DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE].includes(event.data?.type)) {
        const match = /^home\.heroSlides\[(\d+)\]/.exec(String(event.data.fieldPath));
        if (match) {
          wheelPosition.current = Number(match[1]);
          updateWheel(stage.current, wheelPosition.current, slides.length);
          setSelected(wheelPosition.current);
          setInteraction(value => value + 1);
        }
      }
    };
    syncPreference();
    syncVisibility();
    setEditing(document.documentElement.dataset.lumiHeroEditing === 'true');
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting)) : null;
    if (stage.current) observer?.observe(stage.current);
    if (!observer) setInView(true);
    preference.addEventListener('change', syncPreference);
    document.addEventListener('visibilitychange', syncVisibility);
    window.addEventListener('message', editMode);
    return () => {
      observer?.disconnect();
      preference.removeEventListener('change', syncPreference);
      document.removeEventListener('visibilitychange', syncVisibility);
      window.removeEventListener('message', editMode);
    };
  }, [slides.length]);

  useEffect(() => {
    if (!playing || slides.length < 2) return;
    let frame: number;
    let previousTime: number | undefined;
    const advance = (time: number) => {
      if (previousTime !== undefined) {
        // Always move, with the lowest speed at each featured position.
        // This positive cosine speed profile has no stationary dwell.
        const elapsed = Math.min(time - previousTime, 50);
        const phase = wheelPosition.current % 1;
        const speed = (.3 + 1.2 * (1 - Math.cos(phase * Math.PI * 2))) / .9;
        wheelPosition.current += elapsed / SLIDE_INTERVAL_MS * speed;
        updateWheel(stage.current, wheelPosition.current, slides.length);
        const nearest = Math.round(wheelPosition.current);
        setSelected(value => value === nearest ? value : nearest);
      }
      previousTime = time;
      frame = window.requestAnimationFrame(advance);
    };
    frame = window.requestAnimationFrame(advance);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, slides.length, interaction]);

  if (!slides.length) return null;
  const current = slides[active];
  const choose = (index: number) => {
    const nearest = Math.round(wheelPosition.current);
    wheelPosition.current = nearest + (index - nearest % slides.length + slides.length) % slides.length;
    updateWheel(stage.current, wheelPosition.current, slides.length);
    setSelected(wheelPosition.current);
    setInteraction(value => value + 1);
  };

  return (
    <div ref={stage} className="lumi-showcase" role="region" aria-roledescription="carousel" aria-label="Furniture inspiration" data-preview-static="furniture-showcase-interface"
      data-playing={playing} data-editing={editing} data-reduced={reduced} data-active-slide={active} data-images-ready={imagesReady}
      style={{ '--showcase-accent': contentText(current.color) || '#d8dfca' } as CSSProperties}
      onFocusCapture={event => {
        // Keyboard users can read a slide at rest. Play can restart it while focused.
        const target = event.target as HTMLElement;
        if (target.matches(':focus-visible') && !target.closest('.lumi-showcase-pause')) setPaused(true);
      }}
      onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        setPaused(true);
        choose(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : (active + (event.key === 'ArrowRight' ? 1 : slides.length - 1)) % slides.length);
      }}>
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id={pentagonClipId} clipPathUnits="objectBoundingBox">
            <path d={ROUNDED_PENTAGON_PATH} />
          </clipPath>
        </defs>
      </svg>
      <div className="lumi-showcase-blob" aria-hidden="true" style={{ clipPath: `url(#${pentagonClipId})` }} />
      <div className="lumi-showcase-orbit" aria-hidden="true" />
      <div className="lumi-showcase-spark" aria-hidden="true">✳</div>
      <div className="lumi-showcase-pebble lumi-showcase-pebble-one" aria-hidden="true" />
      <div className="lumi-showcase-pebble lumi-showcase-pebble-two" aria-hidden="true" />

      <div className="lumi-showcase-slides" data-preview-list-path="home.heroSlides" aria-live={playing ? 'off' : 'polite'}>
        {slides.map((slide, index) => {
          const offset = (index - active + slides.length) % slides.length;
          const position = offset === 0 ? 'active' : offset === 1 ? 'next' : offset === slides.length - 1 ? 'previous' : 'hidden';
          return <div key={index} className="lumi-showcase-slide" data-position={position} data-preview-item-path={`home.heroSlides[${index}]`}
            role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}: ${contentText(slide.label)}`} inert={index !== active}>
            <div className="lumi-showcase-words">
              <EditableText as="p" data-preview-field-path={`home.heroSlides[${index}].eyebrow`} defaultValue={contentText(slide.eyebrow)} className="lumi-showcase-eyebrow" />
              <EditableText as="p" data-preview-field-path={`home.heroSlides[${index}].headline`} defaultValue={contentText(slide.headline)} className="lumi-showcase-headline" />
            </div>
            <div className="lumi-showcase-object" style={{ '--item-angle': `${index * 360 / slides.length}deg` } as CSSProperties}>
              <EditableImage data-preview-field-path={`home.heroSlides[${index}].imageUrl`} src={contentText(slide.imageUrl)} alt={contentText(slide.imageAlt)} fit="contain"
                className="lumi-showcase-cutout" fetchPriority={index === 0 ? 'high' : 'auto'} draggable={false} />
            </div>
            <a className="lumi-showcase-link lumi-showcase-slide-link" href={withBasePath(contentText(slide.linkUrl) || '/#shop')} data-preview-field-path={`home.heroSlides[${index}].linkUrl`}>
              <span className="lumi-showcase-index" aria-hidden="true">{String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
              <EditableText as="span" data-preview-field-path={`home.heroSlides[${index}].label`} defaultValue={contentText(slide.label)} />
              <span aria-hidden="true">↗</span>
            </a>
          </div>;
        })}
      </div>

      <div className="lumi-showcase-footer">
        {slides.length > 1 && <div className="lumi-showcase-controls">
          <div className="lumi-showcase-dots" role="group" aria-label="Choose a furniture slide">
            {slides.map((slide, index) => <button key={index} type="button" onClick={() => choose(index)} aria-label={`Show ${contentText(slide.label)}`} aria-current={index === active ? 'true' : undefined}><span /></button>)}
          </div>
          <button className="lumi-showcase-pause" type="button" disabled={reduced || editing} onClick={() => setPaused(value => !value)} aria-pressed={paused}
            aria-label={paused || reduced || editing ? 'Play furniture animation' : 'Pause furniture animation'}>
            {paused || reduced || editing
              ? <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="m5 3 7 5-7 5Z" fill="currentColor" /></svg>
              : <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="2" /></svg>}
          </button>
        </div>}
      </div>
    </div>
  );
}
