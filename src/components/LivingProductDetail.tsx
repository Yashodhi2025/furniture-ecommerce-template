'use client';

import { EditableText, type ProductDetailItem } from '@deneb-ui/ui';
import { formatPrice } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';
import { contentObject, contentText, useSiteData } from '@/lib/siteDataContext';
import ProductPhotoGallery from './ProductPhotoGallery';
import ProductPurchaseActions from './ProductPurchaseActions';
import { collections, productCollection, type CollectionId } from '@/lib/collections';

export default function LivingProductDetail({ product, index, collectionId = productCollection(product?.category) }: { product?: ProductDetailItem; index: number; collectionId?: CollectionId }) {
  const siteData = useSiteData();
  const settings = contentObject(contentObject(siteData.content).productDetail);
  const text = (key: string, fallback: string) => key in settings ? contentText(settings[key]) : fallback;
  const collection = collections[collectionId];
  const backHref = withBasePath(`/collections/${collectionId}/`);
  return <div className="lr-detail-page">{product && <nav className="lr-breadcrumbs"><a href={withBasePath('/')} data-preview-static="detail-home-link">Home</a><span>/</span><a href={backHref} data-preview-static="detail-collection-link">{collection.label}</a><span>/</span><span aria-current="page" data-preview-field-path={`products[${index}].name`}>{product.name}</span></nav>}
    <div className="lr-detail-layout">{product && <ProductPhotoGallery key={String(product.id)} product={product} index={index} thumbnails />}
      <section className="lr-detail-info"><EditableText as="span" className="lr-brand" fieldPath="productDetail.brand" defaultValue={text('brand', 'LUMI LIVING')} />{product && <><EditableText as="h1" data-preview-field-path={`products[${index}].name`} defaultValue={product.name} /><EditableText as="p" className="lr-detail-category" data-preview-field-path={`products[${index}].category`} defaultValue={product.category} />
        <div className="lr-detail-prices"><EditableText as="p" data-preview-field-path={`products[${index}].price`} defaultValue={formatPrice(product.price)} />{product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && <EditableText as="s" data-preview-field-path={`products[${index}].compareAtPrice`} defaultValue={formatPrice(product.compareAtPrice)} />}</div>
        <EditableText as="p" className="lr-detail-description" data-preview-field-path={`products[${index}].description`} defaultValue={product.description} /></>}
        <ProductPurchaseActions key={String(product?.id ?? '')} product={product ?? { isAvailable: false }} />
        <div className="lr-enquiry"><span className="lr-enquiry-icon" aria-hidden="true">↗</span><div><EditableText as="h2" fieldPath="productDetail.enquiryHeading" defaultValue={text('enquiryHeading', 'Let’s make room for it.')} /><EditableText as="p" fieldPath="productDetail.enquiryText" defaultValue={text('enquiryText', 'Talk to us about this piece, finishes and your space.')} /><a href={withBasePath(text('enquiryButtonUrl', '/contact/'))} data-preview-field-path="productDetail.enquiryButtonUrl" className="lr-primary-button"><EditableText as="span" fieldPath="productDetail.enquiryButtonLabel" defaultValue={text('enquiryButtonLabel', 'Enquire about this piece')} /></a></div></div>
        <a href={backHref} className="lr-back-link" data-preview-static="detail-back-to-collection">← Back to the {collection.label.toLowerCase()} collection</a><p className="lr-sample-note" data-preview-static="sample-product-disclosure">Sample product and price. Additional views are AI-generated illustrations of this piece.</p>
      </section>
    </div>
  </div>;
}
