'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { DENEB_PREVIEW_FOCUS_MESSAGE, PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE, EditableImage, EditableText } from '@deneb-ui/ui';
import { contentList, contentObject, contentText } from '@/lib/siteDataContext';
import { withBasePath } from '@/lib/utils';
import './HomeHeroShowcase.css';

const SLIDE_INTERVAL_MS = 3000;

export default function HomeHeroShowcase({ slides: rawSlides }: { slides: unknown }) {
  const slides = contentList(rawSlides).map(contentObject);
  const stage = useRef<HTMLDivElement>(null);
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
        if (match) { setSelected(Number(match[1])); setInteraction(value => value + 1); }
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
  }, []);

  useEffect(() => {
    if (!playing || slides.length < 2) return;
    const timer = window.setTimeout(() => setSelected(value => value + 1), SLIDE_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, active, slides.length, interaction]);

  if (!slides.length) return null;
  const current = slides[active];
  const choose = (index: number) => {
    setSelected(value => value + (index - value % slides.length + slides.length) % slides.length);
    setInteraction(value => value + 1);
  };

  return (
    <div ref={stage} className="lumi-showcase" role="region" aria-roledescription="carousel" aria-label="Furniture inspiration" data-preview-static="furniture-showcase-interface"
      data-playing={playing} data-editing={editing} data-reduced={reduced} data-active-slide={active} data-images-ready={imagesReady}
      style={{ '--showcase-accent': contentText(current.color) || '#d8dfca', '--wheel-turn': `${-selected * 360 / slides.length}deg` } as CSSProperties}
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
      <div className="lumi-showcase-blob" aria-hidden="true" />
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
