'use client';

import { Children, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE, PREVIEW_FOCUS_MESSAGE } from '@deneb-ui/ui';

/** Native scrolling keeps the existing editable cards, links and touch gestures intact. */
export default function HomeProductCarousel({ children, label }: { children: ReactNode; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const id = useId();
  const count = Children.count(children);
  const [range, setRange] = useState({ start: 1, end: Math.min(count, 4), previous: false, next: count > 4 });

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const card = element.firstElementChild as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
      const step = (card?.offsetWidth ?? 0) + gap;
      if (!step) return;
      const start = Math.round(element.scrollLeft / step) + 1;
      const visible = Math.max(1, Math.round((element.clientWidth + gap) / step));
      const next = { start, end: Math.min(count, start + visible - 1), previous: element.scrollLeft > 2, next: element.scrollLeft < element.scrollWidth - element.clientWidth - 2 };
      setRange(current => current.start === next.start && current.end === next.end && current.previous === next.previous && current.next === next.next ? current : next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    const focusField = (event: MessageEvent) => {
      if (event.source !== window.parent || ![PREVIEW_FOCUS_MESSAGE, DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE].includes(event.data?.type)) return;
      const target = [...element.querySelectorAll<HTMLElement>('[data-preview-field-path]')].find(item => item.dataset.previewFieldPath === event.data.fieldPath);
      target?.closest('article')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    };
    element.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('message', focusField);
    update();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); element.removeEventListener('scroll', schedule); window.removeEventListener('message', focusField); };
  }, [children, count]);

  const move = (direction: number, edge?: 'start' | 'end') => {
    const element = track.current;
    if (!element) return;
    const distance = element.clientWidth + (parseFloat(getComputedStyle(element).columnGap) || 0);
    element.scrollTo({ left: edge === 'start' ? 0 : edge === 'end' ? element.scrollWidth : element.scrollLeft + direction * distance, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1, event.key === 'Home' ? 'start' : event.key === 'End' ? 'end' : undefined);
  };

  return <div className="lumi-home-carousel" role="region" aria-roledescription="carousel" aria-label={label || 'Featured products'} data-product-count={count}>
    <div ref={track} id={id} className="lumi-product-grid lumi-carousel-track" data-preview-list-path="products" data-home-collection="best-sellers" tabIndex={0} aria-label="Browse products with the arrow keys" onKeyDown={keyboard}>
      {children}
    </div>
    {count > 2 && <div className="lumi-carousel-controls" data-preview-static="home-carousel-controls">
      <span role="status" aria-live="polite" aria-atomic="true">{range.start}–{range.end} / {count}</span>
      <div>
        <button type="button" aria-label={`Previous ${label || 'products'}`} aria-controls={id} disabled={!range.previous} onClick={() => move(-1)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg></button>
        <button type="button" aria-label={`Next ${label || 'products'}`} aria-controls={id} disabled={!range.next} onClick={() => move(1)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg></button>
      </div>
    </div>}
  </div>;
}
