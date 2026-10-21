'use client';

import { EditableText, type ProductDetailItem } from '@deneb-ui/ui';
import { formatPrice } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';
import ProductPhotoGallery from './ProductPhotoGallery';

export default function LivingProductDetail({ product, index }: { product: ProductDetailItem; index: number }) {
  return <div className="lr-detail-page" data-preview-page-key="product_detail"><nav className="lr-breadcrumbs" aria-label="Breadcrumb"><a href={withBasePath('/')}>Home</a><span>/</span><a href={withBasePath('/collections/living-room/')}>Living Room</a><span>/</span><span aria-current="page">{product.name}</span></nav>
    <div className="lr-detail-layout"><ProductPhotoGallery key={String(product.id)} product={product} index={index} thumbnails />
      <section className="lr-detail-info"><span className="lr-brand">LUMI LIVING</span><EditableText as="h1" data-preview-field-path={`products[${index}].name`} defaultValue={product.name} /><EditableText as="p" className="lr-detail-category" data-preview-field-path={`products[${index}].category`} defaultValue={product.category} />
        <div className="lr-detail-prices"><EditableText as="p" data-preview-field-path={`products[${index}].price`} defaultValue={formatPrice(product.price)} />{product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && <EditableText as="s" data-preview-field-path={`products[${index}].compareAtPrice`} defaultValue={formatPrice(product.compareAtPrice)} />}</div>
        <EditableText as="p" className="lr-detail-description" data-preview-field-path={`products[${index}].description`} defaultValue={product.description} />
        <div className="lr-enquiry"><span className="lr-enquiry-icon" aria-hidden="true">↗</span><div><h2>Let’s make room for it.</h2><p>Talk to us about this piece, finishes and your space.</p><a href={withBasePath('/contact/')} className="lr-primary-button">Enquire about this piece</a></div></div>
        <a href={withBasePath('/collections/living-room/')} className="lr-back-link">← Back to the living room collection</a><p className="lr-sample-note">Sample product and price. Additional views are AI-generated illustrations of this piece.</p>
      </section>
    </div>
  </div>;
}
