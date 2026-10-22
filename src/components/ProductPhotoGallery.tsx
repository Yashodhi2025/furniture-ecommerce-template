'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { EditableImage, EditableText, DENEB_PREVIEW_FOCUS_MESSAGE, PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE, isPreviewValidation, useSiteData, type ProductItem } from '@deneb-ui/ui';
import { productPhotos } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';

export default function ProductPhotoGallery({ product, index, href, thumbnails = false, imageAction }: { product: Pick<ProductItem, 'name' | 'imageUrl' | 'gallery' | 'colors'>; index: number; href?: string; thumbnails?: boolean; imageAction?: ReactNode }) {
  const siteData = useSiteData();
  const photos = productPhotos(product, index);
  const colors = Array.isArray(product.colors) ? product.colors.flatMap((color, i) => typeof color === 'object' && color.hex && color.image ? [{ ...color, path: `products[${index}].colors[${i}].image` }] : []) : [];
  const slides = [...photos, ...colors.map(color => ({ src: color.image!, path: color.path }))];
  const [selected, setSelected] = useState(0);
  const [popupSelected, setPopupSelected] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gallery = useRef<HTMLDivElement>(null);
  const zoomSurface = useRef<HTMLDivElement>(null);
  const zoomFrame = useRef<number | null>(null);
  const visualEditing = useRef(false);
  const previousIndex = useRef({ card: 0, popup: 0 });
  const slideDirection = useRef(1);
  const photoId = useId();
  const titleId = useId();
  const activeIndex = Math.min(selected, Math.max(0, slides.length - 1));
  const popupIndex = Math.min(popupSelected, Math.max(0, slides.length - 1));
  const resetZoom = useCallback(() => {
    if (zoomFrame.current !== null) cancelAnimationFrame(zoomFrame.current);
    zoomFrame.current = null;
    zoomSurface.current?.removeAttribute('data-zoomed');
  }, []);
  const followCursor = (event: PointerEvent<HTMLDivElement>) => {
    if (!thumbnails || open || event.pointerType !== 'mouse' || visualEditing.current || isPreviewValidation(siteData) || !window.matchMedia('(min-width: 751px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches || document.querySelector('[data-fivora-edit-badge], [data-fivora-local-selected-target], [data-marketplace-local-selected-target]')) {
      resetZoom();
      return;
    }
    const surface = event.currentTarget;
    const bounds = surface.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = Math.min(100, Math.max(0, (event.clientX - bounds.left) / bounds.width * 100));
    const y = Math.min(100, Math.max(0, (event.clientY - bounds.top) / bounds.height * 100));
    if (zoomFrame.current !== null) cancelAnimationFrame(zoomFrame.current);
    zoomFrame.current = requestAnimationFrame(() => {
      surface.style.setProperty('--lr-zoom-x', `${x}%`);
      surface.style.setProperty('--lr-zoom-y', `${y}%`);
      surface.setAttribute('data-zoomed', 'true');
      zoomFrame.current = null;
    });
  };
  useEffect(() => {
    if (!thumbnails) return;
    const preference = window.matchMedia('(min-width: 751px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const editing = (event: MessageEvent) => {
      if (event.source !== window.parent || !['FIVORA_PREVIEW_EDIT_MODE', 'MARKETPLACE_PREVIEW_EDIT_MODE'].includes(event.data?.type)) return;
      visualEditing.current = Boolean(event.data.editMode);
      if (visualEditing.current) gallery.current?.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
      resetZoom();
    };
    preference.addEventListener('change', resetZoom);
    window.addEventListener('message', editing);
    return () => {
      preference.removeEventListener('change', resetZoom);
      window.removeEventListener('message', editing);
      resetZoom();
    };
  }, [thumbnails, resetZoom]);
  const move = (direction: number) => {
    slideDirection.current = direction;
    const update = open ? setPopupSelected : setSelected;
    update(value => (Math.min(value, Math.max(0, photos.length - 1)) + direction + photos.length) % Math.max(1, photos.length));
  };
  const choosePhoto = (value: number) => { slideDirection.current = 1; (open ? setPopupSelected : setSelected)(value); };
  useLayoutEffect(() => {
    resetZoom();
    const previous = previousIndex.current;
    previousIndex.current = { card: activeIndex, popup: popupIndex };
    if (visualEditing.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animations: Animation[] = [];
    gallery.current?.querySelectorAll('.lr-image-track').forEach(track => {
      const popup = track.getAttribute('data-gallery-view') === 'popup';
      const before = popup ? previous.popup : previous.card;
      const after = popup ? popupIndex : activeIndex;
      if (before === after) return;
      const outgoing = track.children[before];
      const incoming = track.children[after];
      const direction = slideDirection.current;
      const options: KeyframeAnimationOptions = { duration: 400, easing: 'ease-in-out' };
      if (outgoing) animations.push(outgoing.animate([
        { transform: 'translateX(0)', visibility: 'visible' },
        { transform: `translateX(${-direction * 100}%)`, visibility: 'visible' },
      ], options));
      if (incoming) animations.push(incoming.animate([
        { transform: `translateX(${direction * 100}%)` },
        { transform: 'translateX(0)' },
      ], options));
    });
    return () => animations.forEach(animation => animation.cancel());
  }, [activeIndex, popupIndex, open, resetZoom]);
  const close = () => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => { setOpen(false); setClosing(false); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240);
  };
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  useEffect(() => {
    if (!hovered || open || thumbnails || photos.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => { slideDirection.current = 1; setSelected(value => (value + 1) % photos.length); }, 1500);
    return () => clearInterval(timer);
  }, [hovered, open, thumbnails, photos.length]);
  useEffect(() => {
    if (!open || closing || photos.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Restart the countdown after an arrow or thumbnail selection as well.
    const timer = setTimeout(() => {
      slideDirection.current = 1;
      setPopupSelected(value => (value + 1) % photos.length);
    }, 3000);
    return () => clearTimeout(timer);
  }, [open, closing, photos.length, popupSelected]);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const opener = trigger.current;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; opener?.focus(); };
  }, [open]);
  useEffect(() => {
    const focusPhoto = (event: MessageEvent) => {
      if (event.source !== window.parent || ![DENEB_PREVIEW_FOCUS_MESSAGE, PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE].includes(event.data?.type)) return;
      const position = photos.findIndex(photo => photo.path === event.data.fieldPath);
      if (position < 0) return;
      setHovered(false);
      slideDirection.current = 1;
      (open ? setPopupSelected : setSelected)(position);
      resetZoom();
    };
    window.addEventListener('message', focusPhoto);
    return () => window.removeEventListener('message', focusPhoto);
  }, [photos, open, resetZoom]);
  const photoImage = (photo: (typeof slides)[number], value: number, popup = false, thumbnail = false) => {
    const imageProps = { src: withBasePath(photo.src), alt: thumbnail ? '' : `${product.name} — view ${value + 1}`, fit: !thumbnail && (popup || thumbnails) ? 'contain' as const : 'cover' as const, loading: popup && !thumbnail ? 'eager' as const : 'lazy' as const };
    const galleryIndex = Number(photo.path.match(/\[(\d+)\]$/)?.[1]);
    if (photo.path === `products[${index}].imageUrl`) return <EditableImage {...imageProps} data-preview-field-path={`products[${index}].imageUrl`} />;
    if (photo.path.includes('.gallery[')) return <EditableImage {...imageProps} data-preview-field-path={`products[${index}].gallery[${galleryIndex}]`} />;
    return <EditableImage {...imageProps} data-preview-field-path={photo.path} />;
  };
  const images = (popup = false) => <div className="lr-image-stack"><div className="lr-image-track" data-gallery-view={popup ? 'popup' : 'card'}>
    {slides.length ? slides.map((photo, value) => {
      const galleryIndex = Number(photo.path.match(/\[(\d+)\]$/)?.[1]);
      const className = `lr-image-layer${value === (popup ? popupIndex : activeIndex) ? ' is-active' : ''}`;
      return photo.path.includes('.gallery[')
        ? <div key={photo.path} data-preview-item-path={`products[${index}].gallery[${galleryIndex}]`} className={className}>{photoImage(photo, value, popup)}</div>
        : <div key={photo.path} className={className}>{photoImage(photo, value, popup)}</div>;
    }) : <EditableImage src={withBasePath('/placeholder.svg')} data-preview-field-path={`products[${index}].imageUrl`} alt="Product image not yet available" />}
  </div></div>;
  const swatches = (popup = false) => colors.length > 0 && <div className="lr-color-options" role="group" aria-label={`Color of ${product.name}`}>
    {colors.map((color, value) => <button type="button" key={color.path} style={{ backgroundColor: color.hex }} title={color.name} aria-label={color.name} aria-pressed={(popup ? popupIndex : activeIndex) === photos.length + value} onClick={() => choosePhoto(photos.length + value)} />)}
    <span>{(popup ? popupIndex : activeIndex) >= photos.length ? colors[(popup ? popupIndex : activeIndex) - photos.length]?.name : 'Choose color'}</span>
  </div>;
  const previews = (popup = false) => <div className={popup || thumbnails ? 'lr-thumbnails' : 'lr-photo-dots'}>
    {photos.map((photo, value) => <button type="button" key={photo.path} data-preview-item-path={photo.path.startsWith(`products[${index}].gallery[`) ? photo.path : undefined} onClick={() => choosePhoto(value)} aria-labelledby={`${photoId}-${popup ? 'popup' : 'card'}-${value}`} aria-pressed={(popup ? popupIndex : activeIndex) === value} aria-controls={popup ? undefined : photoId}>
      <small id={`${photoId}-${popup ? 'popup' : 'card'}-${value}`} className="sr-only" data-preview-static="gallery-thumbnail-action">Show photo {value + 1} of {product.name}</small>
      {photoImage(photo, value, popup, true)}
    </button>)}
  </div>;
  const arrows = <><button className="lr-photo-arrow lr-photo-prev" type="button" data-preview-static="gallery-previous-photo" aria-label={`Previous photo of ${product.name}`} onClick={() => move(-1)}>‹</button><button className="lr-photo-arrow lr-photo-next" type="button" data-preview-static="gallery-next-photo" aria-label={`Next photo of ${product.name}`} onClick={() => move(1)}>›</button></>;
  const keyboard = (event: KeyboardEvent) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } };
  return <div ref={gallery} className={`lr-gallery${thumbnails ? ' lr-gallery-detail' : ''}${imageAction ? ' lr-gallery-has-action' : ''}`} data-preview-list-path={`products[${index}].gallery`}>
    <div className="lr-gallery-stage" id={photoId} onPointerEnter={event => {
      if (event.pointerType !== 'mouse' || thumbnails || open || photos.length < 2) return;
      move(1);
      setHovered(true);
    }} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setHovered(false)} onKeyDown={keyboard}>
      {href ? <button ref={trigger} type="button" className="lr-photo-link" aria-labelledby={`${photoId}-view-label`} aria-haspopup="dialog" onClick={() => { setHovered(false); setPopupSelected(activeIndex); previousIndex.current.popup = activeIndex; setOpen(true); }}>{images()}<span id={`${photoId}-view-label`} className="lr-view-product" data-preview-static="gallery-view-action">View piece ↗</span></button> : <div ref={zoomSurface} className="lr-photo-main" onPointerEnter={followCursor} onPointerMove={followCursor} onPointerLeave={resetZoom} onPointerCancel={resetZoom} onPointerDown={resetZoom} onFocusCapture={resetZoom}>{images()}</div>}
      {imageAction}
      {photos.length > 1 && arrows}
      {/* Select the gallery list independently of the cover's scalar imageUrl field. */}
      <span className="lr-photo-counter" data-preview-list-path={`products[${index}].gallery`}><span data-preview-static="gallery-photo-count">{photos.length === 0 ? '0 / 0' : activeIndex < photos.length ? `${activeIndex + 1} / ${photos.length}` : colors[activeIndex - photos.length]?.name}</span></span>
    </div>
    {photos.length > 1 && previews()}
    {swatches()}
    <dialog ref={dialog} className={`lr-image-dialog${closing ? ' is-closing' : ''}`} aria-labelledby={titleId} onKeyDown={keyboard} onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    }}>
      <header><h2 id={titleId}><EditableText as="span" data-preview-field-path={`products[${index}].name`} defaultValue={product.name} /></h2><button type="button" aria-label="Close image gallery" data-preview-static="gallery-close-action" autoFocus onClick={close}>×</button></header>
      {open && <><div className="lr-popup-stage">{images(true)}{photos.length > 1 && arrows}</div><div className="lr-popup-footer"><span aria-live="polite" data-preview-list-path={`products[${index}].gallery`}><span data-preview-static="gallery-popup-photo-count">{photos.length === 0 ? '0 / 0' : popupIndex < photos.length ? `${popupIndex + 1} / ${photos.length}` : colors[popupIndex - photos.length]?.name}</span></span>{previews(true)}{swatches(true)}</div></>}
    </dialog>
  </div>;
}
