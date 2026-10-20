'use client';

import { EditableCard, EditableText, EditableImage, type ProductItem } from '@deneb-ui/ui';
import { withBasePath } from '@/lib/utils';

/** Furniture presentation only; catalog state remains in SiteDataProvider. */
export default function FurnitureProductCard({ product, index }: {product: ProductItem; index: number}) {
  const money = (value: unknown) => typeof value === 'number' ? new Intl.NumberFormat('en-LK', {maximumFractionDigits:0}).format(value) : String(value ?? '');
  const url = String(product.ctaUrl ?? `/products/detail/?id=${encodeURIComponent(String(product.id))}`);
  return <EditableCard item={{}} itemPath={`products[${index}]`} data-preview-item-path={`products[${index}]`} className="lumi-product-card" as="article">
    <div className="deneb-product-card-media">
      <EditableImage id={`products[${index}].imageUrl`} data-preview-field-path={`products[${index}].imageUrl`} src={String(product.imageUrl ?? '')} alt={String(product.name ?? '')} loading="lazy" />
      <EditableText as="span" data-preview-field-path={`products[${index}].badge`} defaultValue={product.badge} className="lumi-product-badge" />
    </div>
    <div className="lumi-product-info">
      <EditableText as="p" data-preview-field-path={`products[${index}].category`} defaultValue={product.category} />
      <EditableText as="h3" data-preview-field-path={`products[${index}].name`} defaultValue={product.name} />
      <EditableText as="p" data-preview-field-path={`products[${index}].description`} defaultValue={product.description} placeholder="Add a product description" />
      <div className="lumi-product-prices">
        <span data-preview-static="product-currency">{product.currency}</span>
        <EditableText as="span" data-preview-field-path={`products[${index}].price`} defaultValue={money(product.price)} />
        <EditableText as="s" data-preview-field-path={`products[${index}].compareAtPrice`} defaultValue={money(product.compareAtPrice)} />
      </div>
      <a href={withBasePath(url)} data-preview-field-path={`products[${index}].ctaUrl`} className="lumi-product-link"><EditableText as="span" data-preview-field-path={`products[${index}].ctaLabel`} defaultValue={String(product.ctaLabel ?? 'View piece')} /><span aria-hidden="true">↗</span></a>
    </div>
  </EditableCard>;
}
