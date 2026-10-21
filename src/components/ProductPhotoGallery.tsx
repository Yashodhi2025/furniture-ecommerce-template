'use client';

import { useId, useState } from 'react';
import { EditableImage, type ProductItem } from '@deneb-ui/ui';
import { productPhotos } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';

export default function ProductPhotoGallery({ product, index, href, thumbnails = false }: { product: Pick<ProductItem, 'name' | 'imageUrl' | 'gallery'>; index: number; href?: string; thumbnails?: boolean }) {
  const photos = productPhotos(product, index);
  const [selected, setSelected] = useState(0);
  const activeIndex = Math.min(selected, Math.max(0, photos.length - 1));
  const active = photos[activeIndex];
  const photoId = useId();
  const move = (direction: number) => setSelected((activeIndex + direction + photos.length) % photos.length);
  const image = active ? <EditableImage key={active.src} src={withBasePath(active.src)} alt={`${product.name ?? 'Furniture'} — photo ${activeIndex + 1} of ${photos.length}`} data-preview-field-path={active.path} fit={thumbnails ? 'contain' : 'cover'} loading="lazy" /> : <img src={withBasePath('/placeholder.svg')} alt="Product image not yet available" />;
  return <div className={`lr-gallery${thumbnails ? ' lr-gallery-detail' : ''}`}>
    <div className="lr-gallery-stage" id={photoId} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); if (photos.length > 1) move(event.key === 'ArrowRight' ? 1 : -1); } }}>
      {href ? <a className="lr-photo-link" href={withBasePath(href)} aria-label={`View ${product.name}`}>{image}<span className="lr-view-product" aria-hidden="true">View piece ↗</span></a> : <div className="lr-photo-main">{image}</div>}
      {photos.length > 1 && <><button className="lr-photo-arrow lr-photo-prev" type="button" aria-label={`Previous photo of ${product.name}`} aria-controls={photoId} onClick={() => move(-1)}>‹</button><button className="lr-photo-arrow lr-photo-next" type="button" aria-label={`Next photo of ${product.name}`} aria-controls={photoId} onClick={() => move(1)}>›</button></>}
      <span className="lr-photo-counter" aria-live="polite">{activeIndex + 1} / {Math.max(1, photos.length)}</span>
    </div>
    {photos.length > 1 && <div className={thumbnails ? 'lr-thumbnails' : 'lr-photo-dots'} aria-label={`Photos of ${product.name}`} data-preview-list-path={`products[${index}].gallery`}>
      {photos.map((photo, photoIndex) => <button key={photo.path} type="button" onClick={() => setSelected(photoIndex)} aria-label={`Show photo ${photoIndex + 1} of ${product.name}`} aria-pressed={activeIndex === photoIndex} aria-controls={photoId}>
        <EditableImage src={withBasePath(photo.src)} alt={`${product.name} view ${photoIndex + 1}`} data-preview-field-path={photo.path} loading="lazy" />
      </button>)}
    </div>}
  </div>;
}
