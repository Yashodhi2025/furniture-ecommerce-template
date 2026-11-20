'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { EditableCard, EditableImage, EditableText, PREVIEW_FOCUS_MESSAGE, DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE } from '@deneb-ui/ui';
import { contentList, contentObject, contentText } from '@/lib/siteDataContext';
import { useFivoraEditMode } from '@/lib/useFivoraEditMode';
import { withBasePath } from '@/lib/utils';
import './RoomShowcase.css';

function offsetOf(index: number, active: number, length: number) {
  const offset = (index - active + length) % length;
  return offset > Math.floor(length / 2) ? offset - length : offset;
}

const INTRO_EASING = 'cubic-bezier(.16,1,.3,1)';
const STAGE_STAGGER_MS = 275;
const FLOAT_TIMINGS = [
  { duration: '4.6s', delay: '0s' },
  { duration: '5.1s', delay: '0.35s' },
  { duration: '5.6s', delay: '0.75s' },
  { duration: '5.35s', delay: '0.5s' },
  { duration: '4.85s', delay: '0.2s' },
];

const ROOM_TONES: Record<string, { tintTop: string; tintMid: string; tintBottom: string; glow: string }> = {
  'living-room': {
    tintTop: 'rgba(236, 198, 148, 0.22)',
    tintMid: 'rgba(138, 86, 44, 0.16)',
    tintBottom: 'rgba(72, 41, 20, 0.72)',
    glow: 'rgba(228, 191, 134, 0.46)',
  },
  bedroom: {
    tintTop: 'rgba(244, 222, 198, 0.24)',
    tintMid: 'rgba(150, 106, 76, 0.14)',
    tintBottom: 'rgba(84, 52, 36, 0.70)',
    glow: 'rgba(236, 207, 168, 0.45)',
  },
  'kitchen-dining': {
    tintTop: 'rgba(226, 174, 132, 0.22)',
    tintMid: 'rgba(148, 84, 48, 0.17)',
    tintBottom: 'rgba(78, 39, 24, 0.74)',
    glow: 'rgba(224, 182, 132, 0.46)',
  },
  office: {
    tintTop: 'rgba(216, 188, 154, 0.20)',
    tintMid: 'rgba(112, 76, 50, 0.16)',
    tintBottom: 'rgba(58, 37, 23, 0.76)',
    glow: 'rgba(218, 186, 140, 0.44)',
  },
  'lighting-decor': {
    tintTop: 'rgba(246, 214, 162, 0.26)',
    tintMid: 'rgba(166, 114, 56, 0.15)',
    tintBottom: 'rgba(80, 50, 22, 0.70)',
    glow: 'rgba(240, 208, 148, 0.50)',
  },
};
const FALLBACK_TONES = Object.values(ROOM_TONES);

export default function RoomShowcase({ rooms }: { rooms: unknown }) {
  const items = contentList(rooms).map(contentObject);
  const carouselLabelId = useId();
  const [selected, setSelected] = useState(0);
  const [entered, setEntered] = useState(false);
  const [floating, setFloating] = useState(false);
  const editing = useFivoraEditMode();
  const stage = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLElement | null)[]>([]);
  const wrapAnimations = useRef<WeakMap<HTMLElement, Animation>>(new WeakMap());
  const introAnimations = useRef<Set<Animation>>(new Set());
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const revealed = useRef(false);
  const introRunId = useRef(0);
  const active = items.length ? ((selected % items.length) + items.length) % items.length : 0;
  const activeRef = useRef(active);
  activeRef.current = active;

  const stopIntro = () => {
    introRunId.current += 1;
    introAnimations.current.forEach(animation => animation.cancel());
    introAnimations.current.clear();
  };

  const choose = (index: number, keyboard = false) => {
    if (!items.length) return;
    const next = ((index % items.length) + items.length) % items.length;
    if (next === active) return;
    stopIntro();
    revealed.current = true;
    setEntered(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!editing && !reduced) setFloating(true);
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
    const stageEl = stage.current;
    if (!stageEl) return;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (editing || motionQuery.matches || !('IntersectionObserver' in window)) {
      stopIntro();
      revealed.current = true;
      setEntered(true);
      setFloating(false);
      return;
    }

    const track = (animation: Animation) => {
      introAnimations.current.add(animation);
      const cleanup = () => introAnimations.current.delete(animation);
      animation.onfinish = cleanup;
      animation.oncancel = cleanup;
      return animation;
    };

    const getVisibleTargets = () => {
      const compact = window.innerWidth <= 960;
      const maxDist = compact ? 1 : 2;
      const currentActive = activeRef.current;
      return panels.current
        .map((positionEl, index) => {
          const card = positionEl?.querySelector<HTMLElement>('.room-panel') ?? null;
          const offset = offsetOf(index, currentActive, items.length);
          return { card, offset, dist: Math.abs(offset) };
        })
        .filter((entry): entry is { card: HTMLElement; offset: number; dist: number } => Boolean(entry.card) && entry.dist <= maxDist);
    };

    // Hold cards at opacity 0 via cancellable WAAPI while offscreen so every viewport entry starts cleanly.
    const holdOffscreen = () => {
      stopIntro();
      revealed.current = false;
      setEntered(false);
      setFloating(false);
      panels.current.forEach(positionEl => {
        const card = positionEl?.querySelector<HTMLElement>('.room-panel');
        if (!card) return;
        const hold = track(card.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'both' }));
        hold.pause();
      });
      if (controls.current) {
        const hold = track(controls.current.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'both' }));
        hold.pause();
      }
    };

    const playIntro = () => {
      if (revealed.current) return;
      revealed.current = true;
      stopIntro();
      const runId = introRunId.current;
      setEntered(true);
      setFloating(false);
      if (editing || motionQuery.matches) return;

      const compact = window.innerWidth <= 960;
      const mobile = window.innerWidth <= 750;
      const adjacentSlide = mobile ? 84 : 96;
      const outerSlide = 118;
      const finishedPromises: Promise<unknown>[] = [];

      getVisibleTargets().forEach(({ card, offset, dist }) => {
        let anim: Animation;
        if (dist === 0) {
          // Stage 1: Reveal center card first with a clear scale-up and fade-in.
          anim = track(card.animate(
            [
              { opacity: 0, scale: '0.82', translate: '0 26px' },
              { opacity: 1, scale: '1', translate: '0 0' },
            ],
            { duration: 820, delay: 0, easing: INTRO_EASING, fill: 'backwards' }
          ));
        } else {
          const direction = offset < 0 ? -1 : 1;
          if (dist === 1) {
            // Stage 2: Slide the two adjacent cards in from opposite sides.
            anim = track(card.animate(
              [
                { opacity: 0, translate: `${direction * adjacentSlide}px 18px`, scale: '0.92' },
                { opacity: 1, translate: '0 0', scale: '1' },
              ],
              { duration: 860, delay: STAGE_STAGGER_MS, easing: INTRO_EASING, fill: 'backwards' }
            ));
          } else {
            // Stage 3: Slide the two outer cards in from the left and right.
            anim = track(card.animate(
              [
                { opacity: 0, translate: `${direction * outerSlide}px 22px`, scale: '0.9' },
                { opacity: 1, translate: '0 0', scale: '1' },
              ],
              { duration: 880, delay: STAGE_STAGGER_MS * 2, easing: INTRO_EASING, fill: 'backwards' }
            ));
          }
        }
        finishedPromises.push(anim.finished.catch(() => {}));
      });

      if (controls.current) {
        track(controls.current.animate(
          [
            { opacity: 0, translate: '0 14px' },
            { opacity: 1, translate: '0 0' },
          ],
          { duration: 600, delay: compact ? 420 : 650, easing: INTRO_EASING, fill: 'backwards' }
        ));
      }

      // Start subtle continuous floating only after all card entrance animations finish.
      Promise.all(finishedPromises).then(() => {
        if (introRunId.current === runId && revealed.current && !editing && !motionQuery.matches) {
          setFloating(true);
        }
      });
    };

    holdOffscreen();

    let sawInitialStageCheck = false;
    const onMotionChange = () => {
      if (motionQuery.matches) {
        stopIntro();
        revealed.current = true;
        setEntered(true);
        setFloating(false);
      }
    };

    // Trigger when the cards meaningfully enter the viewport; avoid firing on initial load above the fold.
    const stageObserver = new IntersectionObserver(([entry]) => {
      if (!sawInitialStageCheck) {
        sawInitialStageCheck = true;
        if (entry.isIntersecting && window.scrollY > 0) {
          playIntro();
        } else if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // If the page loaded with cards already centered on a very tall screen, don't leave them hidden.
          playIntro();
        }
        return;
      }
      if (entry.isIntersecting && !revealed.current) {
        playIntro();
      }
    }, { threshold: 0.22 });

    // Reset only once the carousel cards have fully left the viewport (above or below).
    // A small bottom inset (-48px) accounts for top stage padding when scrolled back to the hero on 900px+ screens.
    const resetObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && revealed.current) {
        holdOffscreen();
      }
    }, { threshold: 0, rootMargin: '0px 0px -48px 0px' });

    stageObserver.observe(stageEl);
    resetObserver.observe(stageEl);
    motionQuery.addEventListener('change', onMotionChange);
    return () => {
      stageObserver.disconnect();
      resetObserver.disconnect();
      motionQuery.removeEventListener('change', onMotionChange);
      stopIntro();
    };
  }, [editing, items.length]);

  useEffect(() => {
    const focus = (event: MessageEvent) => {
      if (event.source !== window.parent || ![PREVIEW_FOCUS_MESSAGE, DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE].includes(event.data?.type)) return;
      const match = /^home\.categories\[(\d+)\]/.exec(String(event.data.fieldPath || '').replace(/^content\./, ''));
      if (match && Number(match[1]) < items.length) setSelected(Number(match[1]));
    };
    window.addEventListener('message', focus);
    return () => window.removeEventListener('message', focus);
  }, [items.length]);

  if (!items.length) {
    return (
      <div className="room-showcase" data-editing={editing}>
        <div className="room-showcase-stage sr-only" data-preview-list-path="home.categories" />
      </div>
    );
  }
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

  return <div className="room-showcase" role="region" aria-roledescription="carousel" aria-labelledby={carouselLabelId} data-editing={editing}
    onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      choose(event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : active + (event.key === 'ArrowRight' ? 1 : -1), true);
    }}>
    <span id={carouselLabelId} className="sr-only" data-preview-static="room-carousel-label">Shop by Room</span>
    <div ref={stage} className="room-showcase-stage" data-entered={entered} data-floating={floating} data-preview-list-path="home.categories"
      onPointerDown={event => {
        swiped.current = false;
        if (event.pointerType === 'touch') gesture.current = { x: event.clientX, y: event.clientY };
      }} onPointerUp={endGesture} onPointerCancel={() => { gesture.current = null; }}
      onClickCapture={event => { if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; } }}>
      {items.map((item, index) => {
        const roomId = contentText(item.id);
        const offset = offsetOf(index, active, items.length);
        const isActive = index === active;
        const floatTiming = FLOAT_TIMINGS[index % FLOAT_TIMINGS.length];
        const tone = ROOM_TONES[roomId] ?? FALLBACK_TONES[index % FALLBACK_TONES.length];
        return <div key={roomId || index} ref={element => { panels.current[index] = element; }} className="room-panel-position"
          data-offset={offset} data-room-id={roomId || undefined} aria-hidden={Math.abs(offset) > 2 || undefined}
          style={{
            '--room-order': index,
            '--float-duration': floatTiming.duration,
            '--float-delay': floatTiming.delay,
            '--room-tint-top': tone.tintTop,
            '--room-tint-mid': tone.tintMid,
            '--room-tint-bottom': tone.tintBottom,
            '--room-glow': tone.glow,
          } as CSSProperties}>
          <EditableCard item={{}} itemPath={`home.categories[${index}]`} data-preview-item-path={`home.categories[${index}]`} className="room-panel" as="article">
            <a className="room-panel-link" href={withBasePath(contentText(item.linkUrl))} data-preview-field-path={`home.categories[${index}].linkUrl`}
              aria-current={isActive ? 'true' : undefined} tabIndex={isActive ? 0 : -1}
              onClick={event => {
                if (editing) { event.preventDefault(); return; }
                if (!isActive && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                  event.preventDefault();
                  choose(index);
                }
              }}>
              <EditableImage id={`home.categories[${index}].imageUrl`} className="room-panel-image" src={contentText(item.imageUrl)} alt={contentText(item.title)} data-preview-field-path={`home.categories[${index}].imageUrl`} fit="cover" decoding="async" />
              <div className="room-panel-caption">
                <EditableText as="h3" className="room-panel-title" data-preview-field-path={`home.categories[${index}].title`} defaultValue={contentText(item.title)} />
                <div className="room-panel-details">
                  <div className="room-panel-details-inner">
                    <EditableText as="p" className="room-panel-description" data-preview-field-path={`home.categories[${index}].description`} defaultValue={contentText(item.description)} />
                    <span className="room-panel-cta-wrap">
                      <EditableText as="span" className="room-panel-cta" data-preview-field-path={`home.categories[${index}].linkLabel`} defaultValue={contentText(item.linkLabel)} />
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
    <div ref={controls} className="room-showcase-controls">
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
