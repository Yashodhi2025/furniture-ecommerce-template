'use client';

import type { PointerEvent } from 'react';
import { EditableCard, EditableText, type ProductItem } from '@deneb-ui/ui';
import { withBasePath } from '@/lib/utils';
import { productHref } from '@/lib/living-room';
import { saleOriginalPrice, type CollectionId } from '@/lib/collections';
import { useFivoraEditMode } from '@/lib/useFivoraEditMode';
import ProductWishlistButton from './ProductWishlistButton';
import ProductPhotoGallery from './ProductPhotoGallery';
import CardCartAction from './CardCartAction';
import './FurnitureProductCard.css';

/** One card for home, collections, related pieces and saved products. */
export default function FurnitureProductCard({ product, index, compact = false, collectionId, onWishlistToggle }: {
  product: ProductItem; index: number; compact?: boolean; collectionId?: CollectionId; onWishlistToggle?: (saved: boolean) => void;
}) {
  const editing = useFivoraEditMode();
  const field = (key: string) => index >= 0 ? 'products[' + index + '].' + key : undefined;
  const url = product.ctaUrl ? String(product.ctaUrl) : productHref(product.id, collectionId);
  const contextualUrl = collectionId && url.startsWith('/products/detail/') && !/[?&]collection=/.test(url)
    ? url + (url.includes('?') ? '&' : '?') + 'collection=' + collectionId : url;
  const numericPrice = Number(product.price);
  const price = Number.isFinite(numericPrice) ? new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(numericPrice) : String(product.price ?? '');
  const original = saleOriginalPrice(product);
  const touch = (event: PointerEvent<HTMLElement>) => { if (event.pointerType === 'touch') event.currentTarget.focus({ preventScroll: true }); };
  const content = <>
    <>{index >= 0 ? <ProductPhotoGallery catalogue minimalControls product={product} index={index} href={contextualUrl}
      imageAction={<ProductWishlistButton product={product} onToggle={onWishlistToggle} />} /> : <div className="lr-gallery">
        <div className="lr-gallery-stage"><a href={withBasePath(contextualUrl)} className="lr-photo-link"><img className="product-card-snapshot" src={withBasePath(String(product.imageUrl || '/placeholder.svg'))} alt={String(product.name || 'Saved product')} /></a><ProductWishlistButton product={product} onToggle={onWishlistToggle} /></div>
        <div className="lr-card-thumbnail-row" />
      </div>}</>
    <div className="product-card-information">
      <div className="product-card-heading">
        <a href={withBasePath(contextualUrl)} data-preview-field-path={field('ctaUrl')} title={String(product.name ?? 'Product')} className="product-card-name-link">
          <EditableText as="h3" className="product-card-name" data-preview-field-path={field('name')} defaultValue={product.name} />
        </a>
        <div className="product-card-price">
          <div><span className="product-card-currency">{String(product.currency || 'LKR')} </span><EditableText as="span" data-preview-field-path={field('price')} defaultValue={price} /></div>
          {original !== undefined && <EditableText as="s" className="product-card-original" data-preview-field-path={field(product.compareAtPrice != null ? 'compareAtPrice' : 'originalPrice')} defaultValue={new Intl.NumberFormat('en-LK').format(original)} />}
        </div>
      </div>
      <div className="product-card-footer">
        <EditableText as="span" className="product-card-category" data-preview-field-path={field('category')} defaultValue={product.category || 'Furniture'} title={String(product.badge || '')} />
        <CardCartAction product={product} index={index} />
      </div>
      {editing && <div className="product-card-editor-fields">
        <EditableText as="p" data-preview-field-path={field('description')} defaultValue={product.description} />
        <EditableText as="span" data-preview-field-path={field('badge')} defaultValue={product.badge} />
        <EditableText as="span" data-preview-field-path={field('ctaLabel')} defaultValue={String(product.ctaLabel || '')} />
      </div>}
    </div>
  </>;
  return index >= 0 ? <EditableCard item={{}} itemPath={'products[' + index + ']'} data-preview-item-path={'products[' + index + ']'}
    className="product-card" as="article" tabIndex={0} data-compact={compact || undefined} onPointerDown={touch}>{content}</EditableCard>
    : <article className="product-card" tabIndex={0} onPointerDown={touch}><div className="editable-card-body">{content}</div></article>;
}
