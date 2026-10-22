'use client';

import { useEffect, useState } from 'react';

/** Explicit edit mode only; an ordinary preview iframe is still shopping mode. */
export function useFivoraEditMode() {
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.lumi-site');
    setEditing(shell?.dataset.cardEditing === 'true' || Boolean(document.querySelector('[data-fivora-edit-badge], [data-fivora-local-selected-target], [data-marketplace-local-selected-target]')));
    const sync = (event: MessageEvent) => {
      if (event.source !== window.parent || !['FIVORA_PREVIEW_EDIT_MODE', 'MARKETPLACE_PREVIEW_EDIT_MODE'].includes(event.data?.type)) return;
      setEditing(Boolean(event.data.editMode));
    };
    window.addEventListener('message', sync);
    return () => window.removeEventListener('message', sync);
  }, []);
  return editing;
}
