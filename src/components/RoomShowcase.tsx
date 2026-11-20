'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { EditableCard, EditableImage, EditableText, PREVIEW_FOCUS_MESSAGE, DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE } from '@deneb-ui/ui';
import { contentList, contentObject, contentText } from '@/lib/siteDataContext';
import { useFivoraEditMode } from '@/lib/useFivoraEditMode';
import { withBasePath } from '@/lib/utils';
import './RoomShowcase.css';

function offsetOf(index: number, active: number, length: number) {
  const offset = (index - active + length) % length;
  return offset > Math.floor(length / 2) ? offset - length : offset;
}

export default function RoomShowcase({ rooms }: { rooms: unknown }) {
  const items = contentList(rooms).map(contentObject);
  const [selected, setSelected] = useState(0);
  const [entered, setEntered] = useState(false);
  const editing = useFivoraEditMode();
  const stage = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLElement | null)[]>([]);
  const wrapAnimations = useRef<WeakMap<HTMLElement, Animation>>(new WeakMap());
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const introPlayed = useRef(false);
  const active = items.length ? ((selected % items.length) + items.length) % items.length : 0;

  const choose = (index: number, keyboard = false) => {
    if (!items.length) return;
    const next = ((index % items.length) + items.length) % items.length;
    if (next === active) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!editing && !reduced) panels.current.forEach((panel, position) => {
      if (!panel) return;
      const distance = Math.abs(offsetOf(position, active, items.length) - offsetOf(position, next, items.length));
      // Hide the wrapping rearmost panel while it crosses behind, then fade it back in softly.
      if (distance > items.length / 2) {
        wrapAnimations.current.get(panel)?.cancel();
        const anim = panel.animate(
          [
            { opacity: 0, offset: 0 },
            { opacity: 0, offset: 0.62 },
            { opacity: 0.9, offset: 1 },
          ],
          { duration: 760, easing: 'ease-out' }
        );
        wrapAnimations.current.set(panel, anim);
      }
    });
    setSelected(next);
    if (keyboard) requestAnimationFrame(() => panels.current[next]?.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true }));
  };

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const playIntro = () => {
      setEntered(true);
      if (introPlayed.current || editing || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      introPlayed.current = true;
      panels.current.forEach((positionEl, index) => {
        const card = positionEl?.querySelector<HTMLElement>('.room-panel');
        if (!card) return;
        const dist = Math.abs(offsetOf(index, active, items.length));
        if (dist > 2) return;
        card.animate(
          [
            { opacity: 0, translate: '0 22px' },
            { opacity: 1, translate: '0 0' },
          ],
          { duration: 760, delay: dist * 85, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
        );
      });
    };
    if (!('IntersectionObserver' in window)) { playIntro(); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { playIntro(); observer.disconnect(); }
    }, { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
    // Intentionally triggers once on initial viewport entry for the initial layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  useEffect(() => {
    const focus = (event: MessageEvent) => {
      if (event.source !== window.parent || ![PREVIEW_FOCUS_MESSAGE, DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE].includes(event.data?.type)) return;
      const match = /^home\.categories\[(\d+)\]/.exec(String(event.data.fieldPath || '').replace(/^content\./, ''));
      if (match && Number(match[1]) < items.length) setSelected(Number(match[1]));
    };
    window.addEventListener('message', focus);
    return () => window.removeEventListener('message', focus);
  }, [items.length]);

  if (!items.length) return null;
  panels.current.length = items.length;

  const endGesture = (event: PointerEvent<HTMLDivElement>) => {
    if (!gesture.current) return;
    const dx = event.clientX - gesture.current.x;
    const dy = event.clientY - gesture.current.y;
    gesture.current = null;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.1) {
      swiped.current = true;
      choose(active + (dx < 0 ? 1 : -1));
    }
  };

  return <div className="room-showcase" role="region" aria-roledescription="carousel" aria-label="Shop by Room" data-editing={editing}
    onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      choose(event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : active + (event.key === 'ArrowRight' ? 1 : -1), true);
    }}>
    <div ref={stage} className="room-showcase-stage" data-entered={entered} data-preview-list-path="home.categories"
      onPointerDown={event => {
        swiped.current = false;
        if (event.pointerType === 'touch') gesture.current = { x: event.clientX, y: event.clientY };
      }} onPointerUp={endGesture} onPointerCancel={() => { gesture.current = null; }}
      onClickCapture={event => { if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; } }}>
      {items.map((item, index) => {
        const path = `home.categories[${index}]`;
        const offset = offsetOf(index, active, items.length);
        const isActive = index === active;
        return <div key={contentText(item.id) || index} ref={element => { panels.current[index] = element; }} className="room-panel-position"
          data-offset={offset} aria-hidden={Math.abs(offset) > 2 || undefined} style={{ '--room-order': index } as CSSProperties}>
          <EditableCard item={{}} itemPath={path} data-preview-item-path={path} className="room-panel" as="article">
            <a className="room-panel-link" href={withBasePath(contentText(item.linkUrl))} data-preview-field-path={`${path}.linkUrl`}
              aria-current={isActive ? 'true' : undefined} tabIndex={isActive ? 0 : -1}
              onClick={event => {
                if (editing) { event.preventDefault(); return; }
                if (!isActive && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                  event.preventDefault();
                  choose(index);
                }
              }}>
              <EditableImage id={`${path}.imageUrl`} className="room-panel-image" src={contentText(item.imageUrl)} alt={contentText(item.title)} data-preview-field-path={`${path}.imageUrl`} fit="cover" decoding="async" />
              <div className="room-panel-caption">
                <EditableText as="h3" className="room-panel-title" data-preview-field-path={`${path}.title`} defaultValue={contentText(item.title)} />
                <div className="room-panel-details">
                  <div className="room-panel-details-inner">
                    <EditableText as="p" className="room-panel-description" data-preview-field-path={`${path}.description`} defaultValue={contentText(item.description)} />
                    <span className="room-panel-cta-wrap">
                      <EditableText as="span" className="room-panel-cta" data-preview-field-path={`${path}.linkLabel`} defaultValue={contentText(item.linkLabel)} />
                      <span className="room-panel-cta-arrow" aria-hidden="true" data-preview-static="room-cta-arrow">&#8599;</span>
                    </span>
                  </div>
                </div>
              </div>
            </a>
          </EditableCard>
        </div>;
      })}
    </div>
    <div className="room-showcase-controls">
      <button type="button" data-preview-static="room-carousel-previous" aria-label="Previous room" onClick={() => choose(active - 1)} disabled={items.length < 2}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
      </button>
      <button type="button" data-preview-static="room-carousel-next" aria-label="Next room" onClick={() => choose(active + 1)} disabled={items.length < 2}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
      </button>
      <span className="sr-only" role="status" aria-live="polite" data-preview-static="room-carousel-status">{contentText(items[active].title)}, {active + 1} of {items.length}</span>
    </div>
  </div>;
}
