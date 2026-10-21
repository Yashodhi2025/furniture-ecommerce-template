'use client';

import { EditableText, type ProductDetailItem } from '@deneb-ui/ui';
import { formatPrice } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';
import ProductPhotoGallery from './ProductPhotoGallery';
import { collections, productCollection, type CollectionId } from '@/lib/collections';

export default function LivingProductDetail({ product, index, collectionId = productCollection(product.category) }: { product: ProductDetailItem; index: number; collectionId?: CollectionId }) {
  const collection = collections[collectionId];
  const backHref = withBasePath(`/collections/${collectionId}/`);
  return <div className="lr-detail-page" data-preview-page-key="product_detail"><nav className="lr-breadcrumbs" aria-label="Breadcrumb"><a href={withBasePath('/')}>Home</a><span>/</span><a href={backHref}>{collection.label}</a><span>/</span><span aria-current="page">{product.name}</span></nav>
    <div className="lr-detail-layout"><ProductPhotoGallery key={String(product.id)} product={product} index={index} thumbnails />
      <section className="lr-detail-info"><span className="lr-brand">LUMI LIVING</span><EditableText as="h1" data-preview-field-path={`products[${index}].name`} defaultValue={product.name} /><EditableText as="p" className="lr-detail-category" data-preview-field-path={`products[${index}].category`} defaultValue={product.category} />
        <div className="lr-detail-prices"><EditableText as="p" data-preview-field-path={`products[${index}].price`} defaultValue={formatPrice(product.price)} />{product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && <EditableText as="s" data-preview-field-path={`products[${index}].compareAtPrice`} defaultValue={formatPrice(product.compareAtPrice)} />}</div>
        <EditableText as="p" className="lr-detail-description" data-preview-field-path={`products[${index}].description`} defaultValue={product.description} />
        <div className="lr-enquiry"><span className="lr-enquiry-icon" aria-hidden="true">↗</span><div><h2>Let’s make room for it.</h2><p>Talk to us about this piece, finishes and your space.</p><a href={withBasePath('/contact/')} className="lr-primary-button">Enquire about this piece</a></div></div>
        <a href={backHref} className="lr-back-link">← Back to the {collection.label.toLowerCase()} collection</a><p className="lr-sample-note">Sample product and price. Additional views are AI-generated illustrations of this piece.</p>
      </section>
    </div>
  </div>;
}
