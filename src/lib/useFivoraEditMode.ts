'use client';

import { useEffect, useState } from 'react';

/** Explicit mode takes precedence over selection markers left behind by the editor. */
export function readFivoraEditMode() {
  if (typeof document === 'undefined') return false;
  if (document.documentElement.dataset.fivoraLocalEditMode === 'true') return true;
  if (document.documentElement.dataset.lumiHeroEditing === 'true') return true;
  const mode = document.querySelector<HTMLElement>('.lumi-site')?.dataset.cardEditing;
  if (mode !== undefined) return mode === 'true';
  return Boolean(document.querySelector('[data-fivora-edit-badge], [data-fivora-local-selected-target], [data-marketplace-local-selected-target]'));
}

/** Explicit edit mode only; an ordinary preview iframe is still shopping mode. */
export function useFivoraEditMode() {
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const sync = (event: MessageEvent) => {
      if (event.source !== window.parent || !['FIVORA_PREVIEW_EDIT_MODE', 'MARKETPLACE_PREVIEW_EDIT_MODE'].includes(event.data?.type)) return;
      const shell = document.querySelector<HTMLElement>('.lumi-site');
      if (shell) shell.dataset.cardEditing = String(Boolean(event.data.editMode));
      setEditing(Boolean(event.data.editMode));
    };
    const syncAttr = () => setEditing(readFivoraEditMode());
    const observer = new MutationObserver(syncAttr);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-fivora-local-edit-mode', 'data-lumi-hero-editing'],
    });
    window.addEventListener('message', sync);
    setEditing(readFivoraEditMode());
    return () => {
      observer.disconnect();
      window.removeEventListener('message', sync);
    };
  }, []);
  return editing;
}
