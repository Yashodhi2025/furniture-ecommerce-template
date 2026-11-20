'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { withBasePath } from '@/lib/utils';
import './FooterSofaDivider.css';

export default function FooterSofaDivider() {
  const pathname = usePathname();
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const mover = moverRef.current;
    if (!section || !track || !mover) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isEditing =
      document.querySelector<HTMLElement>('.lumi-site')?.dataset.cardEditing === 'true';
    let hasPlayed = false;

    const measureTrack = () => {
      const travel = Math.max(0, track.clientWidth - mover.offsetWidth);
      section.style.setProperty('--sofa-travel', `${travel.toFixed(2)}px`);
    };

    const setState = (state: 'idle' | 'active' | 'static') => {
      section.dataset.state = state;
    };

    const resetToIdle = () => {
      hasPlayed = false;
      setState('idle');
    };

    const triggerJourney = () => {
      if (hasPlayed) return;
      measureTrack();
      hasPlayed = true;
      setState('active');
    };

    const syncMode = () => {
      measureTrack();
      if (motionQuery.matches || isEditing) {
        hasPlayed = true;
        setState('static');
        return;
      }
      const rect = section.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const inView = rect.top < viewportH && rect.bottom > 0;
      if (inView) {
        triggerJourney();
      } else if (rect.top >= viewportH) {
        resetToIdle();
      }
    };

    measureTrack();

    let enterObserver: IntersectionObserver | null = null;
    let exitObserver: IntersectionObserver | null = null;

    if (typeof IntersectionObserver !== 'undefined') {
      // Trigger the journey once when the footer divider enters the viewport.
      enterObserver = new IntersectionObserver(
        (entries) => {
          if (motionQuery.matches || isEditing) return;
          for (const entry of entries) {
            if (entry.isIntersecting) {
              triggerJourney();
            }
          }
        },
        { threshold: 0.2 },
      );

      // Reset only when the user scrolls back up above the section
      // (so the divider leaves completely below the bottom of the viewport).
      exitObserver = new IntersectionObserver(
        (entries) => {
          if (motionQuery.matches || isEditing) return;
          for (const entry of entries) {
            if (
              !entry.isIntersecting &&
              entry.boundingClientRect.top >= (window.innerHeight || 0)
            ) {
              resetToIdle();
            }
          }
        },
        { threshold: 0 },
      );

      enterObserver.observe(section);
      exitObserver.observe(section);
    }

    syncMode();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            measureTrack();
          })
        : null;

    resizeObserver?.observe(track);
    resizeObserver?.observe(mover);

    const handleEditMode = (event: MessageEvent) => {
      if (
        event.source !== window.parent ||
        !['FIVORA_PREVIEW_EDIT_MODE', 'MARKETPLACE_PREVIEW_EDIT_MODE'].includes(
          event.data?.type,
        )
      ) {
        return;
      }
      isEditing = Boolean(event.data.editMode);
      syncMode();
    };

    window.addEventListener('resize', measureTrack, { passive: true });
    window.addEventListener('message', handleEditMode);
    motionQuery.addEventListener('change', syncMode);

    return () => {
      enterObserver?.disconnect();
      exitObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measureTrack);
      window.removeEventListener('message', handleEditMode);
      motionQuery.removeEventListener('change', syncMode);
    };
  }, [pathname]);

  return (
    <div
      ref={sectionRef}
      className="footer-sofa-divider"
      data-state="idle"
      aria-hidden="true"
      data-preview-static="footer-sofa-divider"
    >
      <div className="footer-sofa-lane">
        <div ref={trackRef} className="footer-sofa-track">
          <div ref={moverRef} className="footer-sofa-mover">
            <span className="footer-sofa-shadow" />
            <div className="footer-sofa-body">
              <img
                src={withBasePath('/images/hero/sofa.webp')}
                alt=""
                width={1100}
                height={563}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="footer-sofa-image"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="footer-sofa-rule">
        <span className="footer-sofa-trail" />
      </div>
    </div>
  );
}
