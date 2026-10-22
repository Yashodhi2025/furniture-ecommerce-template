'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE, PREVIEW_FOCUS_MESSAGE } from '@deneb-ui/ui';

export default function ProductDetailAccordion({ title, children, initiallyOpen = false }: { title: ReactNode; children: ReactNode; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const focus = (event: MessageEvent) => {
      if (event.source !== window.parent || ![DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE, PREVIEW_FOCUS_MESSAGE].includes(event.data?.type)) return;
      if ([...root.current?.querySelectorAll<HTMLElement>('[data-preview-field-path]') || []].some(element => element.dataset.previewFieldPath === event.data.fieldPath)) setOpen(true);
    };
    window.addEventListener('message', focus);
    return () => window.removeEventListener('message', focus);
  }, []);
  return <div ref={root} className={`lr-detail-accordion${open ? ' is-open' : ''}`}>
    <button type="button" aria-expanded={open} aria-controls={id} id={`${id}-label`} onClick={() => setOpen(value => !value)}>{title}<span aria-hidden="true">+</span></button>
    <div id={id} role="region" aria-labelledby={`${id}-label`} className="lr-accordion-panel" inert={!open}><div><div className="lr-accordion-copy">{children}</div></div></div>
  </div>;
}
