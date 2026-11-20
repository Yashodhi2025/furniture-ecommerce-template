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
export default function FurnitureProductCard({ product, index, compact = false, collectionId, saleBadge, onWishlistToggle }: {
  product: ProductItem; index: number; compact?: boolean; collectionId?: CollectionId; saleBadge?: string; onWishlistToggle?: (saved: boolean) => void;
}) {
  const editing = useFivoraEditMode();
  const url = product.ctaUrl ? String(product.ctaUrl) : productHref(product.id, collectionId);
  const contextualUrl = collectionId && url.startsWith('/products/detail/') && !/[?&]collection=/.test(url)
    ? url + (url.includes('?') ? '&' : '?') + 'collection=' + collectionId : url;
  const numericPrice = Number(product.price);
  const price = Number.isFinite(numericPrice) ? new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(numericPrice) : String(product.price ?? '');
  const original = saleOriginalPrice(product);
  const touch = (event: PointerEvent<HTMLElement>) => { if (event.pointerType === 'touch') event.currentTarget.focus({ preventScroll: true }); };
  const overlayActions = <>
    {saleBadge && <span className="sale-discount-badge" data-preview-static="sale-discount-badge">{saleBadge}</span>}
    <ProductWishlistButton product={product} onToggle={onWishlistToggle} />
  </>;
  const content = <>
    <>{index >= 0 ? <ProductPhotoGallery catalogue minimalControls product={product} index={index} href={contextualUrl}
      imageAction={overlayActions} /> : <div className="lr-gallery">
        <div className="lr-gallery-stage"><a href={withBasePath(contextualUrl)} className="lr-photo-link" data-preview-static="saved-product-link"><img className="product-card-snapshot" data-preview-static="saved-product-image" src={withBasePath(String(product.imageUrl || '/placeholder.svg'))} alt={String(product.name || 'Saved product')} /></a>{overlayActions}</div>
        <div className="lr-card-thumbnail-row" />
      </div>}</>
    <div className="product-card-information">
      <div className="product-card-heading">
        {index >= 0 ? (
          <a href={withBasePath(contextualUrl)} data-preview-field-path={`products[${index}].ctaUrl`} title={String(product.name ?? 'Product')} className="product-card-name-link">
            <EditableText as="h3" className="product-card-name" data-preview-field-path={`products[${index}].name`} defaultValue={product.name} />
          </a>
        ) : (
          <a href={withBasePath(contextualUrl)} data-preview-static="saved-product-name-link" title={String(product.name ?? 'Product')} className="product-card-name-link">
            <h3 className="product-card-name">{product.name}</h3>
          </a>
        )}
        <div className="product-card-price">
          <div><span className="product-card-currency" data-preview-static="product-currency">{String(product.currency || 'LKR')} </span>{index >= 0 ? <EditableText as="span" data-preview-field-path={`products[${index}].price`} defaultValue={price} /> : <span data-preview-static="saved-product-price">{price}</span>}</div>
          {original !== undefined && (index >= 0
            ? (product.compareAtPrice != null
              ? <EditableText as="s" className="product-card-original" data-preview-field-path={`products[${index}].compareAtPrice`} defaultValue={new Intl.NumberFormat('en-LK').format(original)} />
              : <EditableText as="s" className="product-card-original" data-preview-field-path={`products[${index}].originalPrice`} defaultValue={new Intl.NumberFormat('en-LK').format(original)} />)
            : <s className="product-card-original" data-preview-static="saved-product-original">{new Intl.NumberFormat('en-LK').format(original)}</s>)}
        </div>
      </div>
      <div className="product-card-footer">
        {index >= 0 ? <EditableText as="span" className="product-card-category" data-preview-field-path={`products[${index}].category`} defaultValue={product.category || 'Furniture'} title={String(product.badge || '')} /> : <span className="product-card-category" data-preview-static="saved-product-category">{product.category || 'Furniture'}</span>}
        <CardCartAction product={product} index={index} />
      </div>
      {editing && index >= 0 && <div className="product-card-editor-fields">
        <EditableText as="p" data-preview-field-path={`products[${index}].description`} defaultValue={product.description} />
        <EditableText as="span" data-preview-field-path={`products[${index}].badge`} defaultValue={product.badge} />
        <EditableText as="span" data-preview-field-path={`products[${index}].ctaLabel`} defaultValue={String(product.ctaLabel || '')} />
      </div>}
    </div>
  </>;
  return index >= 0 ? <EditableCard item={{}} itemPath={`products[${index}]`} data-preview-item-path={`products[${index}]`}
    className="product-card" as="article" tabIndex={0} data-compact={compact || undefined} onPointerDown={touch}>{content}</EditableCard>
    : <article className="product-card" tabIndex={0} onPointerDown={touch}><div className="editable-card-body">{content}</div></article>;
}
