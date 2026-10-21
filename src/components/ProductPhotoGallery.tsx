'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { EditableImage, type ProductItem } from '@deneb-ui/ui';
import { productPhotos } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';

export default function ProductPhotoGallery({ product, index, href, thumbnails = false }: { product: Pick<ProductItem, 'name' | 'imageUrl' | 'gallery' | 'colors'>; index: number; href?: string; thumbnails?: boolean }) {
  const photos = productPhotos(product, index);
  const colors = Array.isArray(product.colors) ? product.colors.flatMap((color, i) => typeof color === 'object' && color.hex && color.image ? [{ ...color, path: `products[${index}].colors[${i}].image` }] : []) : [];
  const slides = [...photos, ...colors.map(color => ({ src: color.image!, path: color.path }))];
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoId = useId();
  const titleId = useId();
  const activeIndex = Math.min(selected, Math.max(0, slides.length - 1));
  const move = (direction: number) => setSelected(value => (Math.min(value, Math.max(0, photos.length - 1)) + direction + photos.length) % Math.max(1, photos.length));
  const close = () => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => { setOpen(false); setClosing(false); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240);
  };
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  useEffect(() => {
    if (!hovered || open || thumbnails || photos.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setSelected(value => (value + 1) % photos.length), 2000);
    return () => clearInterval(timer);
  }, [hovered, open, thumbnails, photos.length]);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const opener = trigger.current;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; opener?.focus(); };
  }, [open]);
  const images = (popup = false) => <div className="lr-image-stack">
    {slides.length ? slides.map((photo, value) => <div key={`${photo.path}-${photo.src}`} className={`lr-image-layer${value === activeIndex ? ' is-active' : ''}`} aria-hidden={value !== activeIndex}>
      {popup ? <img src={withBasePath(photo.src)} alt={`${product.name} — view ${value + 1}`} /> : <EditableImage src={withBasePath(photo.src)} alt={`${product.name} — view ${value + 1}`} data-preview-field-path={photo.path} fit={thumbnails ? 'contain' : 'cover'} loading="lazy" />}
    </div>) : <img src={withBasePath('/placeholder.svg')} alt="Product image not yet available" />}
  </div>;
  const swatches = colors.length > 0 && <div className="lr-color-options" role="group" aria-label={`Color of ${product.name}`}>
    {colors.map((color, value) => <button type="button" key={color.path} style={{ backgroundColor: color.hex }} title={color.name} aria-label={color.name} aria-pressed={activeIndex === photos.length + value} onClick={() => setSelected(photos.length + value)} />)}
    <span>{activeIndex >= photos.length ? colors[activeIndex - photos.length]?.name : 'Choose color'}</span>
  </div>;
  const previews = (popup = false) => <div className={popup || thumbnails ? 'lr-thumbnails' : 'lr-photo-dots'} aria-label={`Photos of ${product.name}`}>
    {photos.map((photo, value) => <button type="button" key={photo.path} onClick={() => setSelected(value)} aria-label={`Show photo ${value + 1} of ${product.name}`} aria-pressed={activeIndex === value} aria-controls={popup ? undefined : photoId}>
      <img src={withBasePath(photo.src)} alt="" loading="lazy" />
    </button>)}
  </div>;
  const arrows = <><button className="lr-photo-arrow lr-photo-prev" type="button" aria-label={`Previous photo of ${product.name}`} onClick={() => move(-1)}>‹</button><button className="lr-photo-arrow lr-photo-next" type="button" aria-label={`Next photo of ${product.name}`} onClick={() => move(1)}>›</button></>;
  const keyboard = (event: KeyboardEvent) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } };
  return <div className={`lr-gallery${thumbnails ? ' lr-gallery-detail' : ''}`}>
    <div className="lr-gallery-stage" id={photoId} onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setHovered(false)} onKeyDown={keyboard}>
      {href ? <button ref={trigger} type="button" className="lr-photo-link" aria-label={`View images of ${product.name}`} aria-haspopup="dialog" onClick={() => { setHovered(false); setOpen(true); }}>{images()}<span className="lr-view-product">View piece ↗</span></button> : <div className="lr-photo-main">{images()}</div>}
      {photos.length > 1 && arrows}
      <span className="lr-photo-counter">{activeIndex < photos.length ? `${activeIndex + 1} / ${photos.length}` : colors[activeIndex - photos.length]?.name}</span>
    </div>
    {photos.length > 1 && previews()}
    {swatches}
    <dialog ref={dialog} className={`lr-image-dialog${closing ? ' is-closing' : ''}`} aria-labelledby={titleId} onKeyDown={keyboard} onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    }}>
      <header><h2 id={titleId}>{product.name}</h2><button type="button" aria-label="Close image gallery" autoFocus onClick={close}>×</button></header>
      {open && <><div className="lr-popup-stage">{images(true)}{photos.length > 1 && arrows}</div><div className="lr-popup-footer"><span aria-live="polite">{activeIndex < photos.length ? `${activeIndex + 1} / ${photos.length}` : colors[activeIndex - photos.length]?.name}</span>{previews(true)}{swatches}</div></>}
    </dialog>
  </div>;
}
