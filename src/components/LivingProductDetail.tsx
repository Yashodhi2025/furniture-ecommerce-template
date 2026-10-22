'use client';

import { EditableText, type ProductDetailItem } from '@deneb-ui/ui';
import { formatPrice } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';
import { contentObject, contentText, useSiteData, useProducts } from '@/lib/siteDataContext';
import ProductDetailAccordion from './ProductDetailAccordion';
import HomeProductCarousel from './HomeProductCarousel';
import FurnitureProductCard from './FurnitureProductCard';
import ProductPhotoGallery from './ProductPhotoGallery';
import ProductPurchaseActions from './ProductPurchaseActions';
import { collections, productCollection, type CollectionId } from '@/lib/collections';

export default function LivingProductDetail({ product, index, collectionId = productCollection(product?.category) }: { product?: ProductDetailItem; index: number; collectionId?: CollectionId }) {
  const siteData = useSiteData();
  const products = useProducts();
  const related = products.map((item, position) => ({ item, position })).filter(({ item }) => String(item.id) !== String(product?.id)).sort((a, b) => Number(b.item.category === product?.category) - Number(a.item.category === product?.category)).slice(0, 8);
  const specificationKeys = ['dimensions', 'materials', 'material', 'finish'];
  const specifications = specificationKeys.flatMap(key => typeof product?.[key] === 'string' && product[key] ? [{ key, value: String(product[key]) }] : []);
  const originalKey = product?.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) ? 'compareAtPrice' : product?.originalPrice && Number(product.originalPrice) > Number(product.price) ? 'originalPrice' : null;
  const settings = contentObject(contentObject(siteData.content).productDetail);
  const text = (key: string, fallback: string) => key in settings ? contentText(settings[key]) : fallback;
  const copy = (key: string, fallback: string, as: 'span' | 'p' | 'h2' | 'h3' = 'span') => <EditableText as={as} fieldPath={`productDetail.${key}`} defaultValue={text(key, fallback)} />;
  const specList = <dl className="lr-furniture-specs">{specifications.map(spec => <div key={spec.key}><dt>{copy(`${spec.key}Label`, spec.key.charAt(0).toUpperCase() + spec.key.slice(1))}</dt><dd><EditableText as="span" data-preview-field-path={`products[${index}].${spec.key}`} defaultValue={spec.value} /></dd></div>)}{product?.specs?.map((spec, position) => <div key={position}><dt><EditableText as="span" data-preview-field-path={`products[${index}].specs[${position}].label`} defaultValue={spec.label} /></dt><dd><EditableText as="span" data-preview-field-path={`products[${index}].specs[${position}].value`} defaultValue={spec.value} /></dd></div>)}</dl>;
  const collection = collections[collectionId];
  const backHref = withBasePath(`/collections/${collectionId}/`);
  return <div className="lr-detail-page">{product && <nav className="lr-breadcrumbs"><a href={withBasePath('/')} data-preview-static="detail-home-link">Home</a><span>/</span><a href={backHref} data-preview-static="detail-collection-link">{collection.label}</a><span>/</span><span aria-current="page" data-preview-field-path={`products[${index}].name`}>{product.name}</span></nav>}
    <div className="lr-detail-layout">{product && <ProductPhotoGallery key={String(product.id)} product={product} index={index} thumbnails />}
      <section className="lr-detail-info"><EditableText as="span" className="lr-brand" fieldPath="productDetail.brand" defaultValue={text('brand', 'LUMI LIVING')} />{product && <><EditableText as="h1" data-preview-field-path={`products[${index}].name`} defaultValue={product.name} /><EditableText as="p" className="lr-detail-category" data-preview-field-path={`products[${index}].category`} defaultValue={product.category} />
        <div className="lr-detail-prices"><EditableText as="p" data-preview-field-path={`products[${index}].price`} defaultValue={formatPrice(product.price)} />{originalKey && <EditableText as="s" data-preview-field-path={`products[${index}].${originalKey}`} defaultValue={formatPrice(product[originalKey])} />}{originalKey && Number(product.price) > 0 && <span className="lr-discount-badge">{copy('savingLabel', 'Save')} {Math.round((1 - Number(product.price) / Number(product[originalKey])) * 100)}%</span>}</div>
        <EditableText as="p" className="lr-detail-description" data-preview-field-path={`products[${index}].description`} defaultValue={product.description} /></>}
        {product && <div className={`lr-availability${product.isAvailable === false ? ' is-unavailable' : ''}`} data-preview-field-path={`products[${index}].isAvailable`}><span aria-hidden="true" />{product.isAvailable === false ? copy('unavailableLabel', 'Currently unavailable') : product.isAvailable === true ? copy('availableLabel', 'Available for enquiry') : copy('availabilityLabel', 'Ask us about availability')}</div>}
        <ProductPurchaseActions productIndex={index} key={String(product?.id ?? '')} product={product ?? { isAvailable: false }} />
        <div className="lr-detail-services">
          <div><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M3 6h11v12H3zM14 10h4l3 4v4h-7M3 10h11"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg><div>{copy('deliveryHeading', 'Plan your delivery', 'h3')}{copy('deliveryText', 'Ask about timing and delivery to your address.', 'p')}</div></div>
          <div><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="m12 3 8 4v6c0 4-8 8-8 8S4 17 4 13V7l8-4Z"/><path d="m8 12 3 3 5-6"/></svg><div>{copy('supportHeading', 'A little expert guidance', 'h3')}{copy('supportText', 'Talk finishes, proportions and care with us.', 'p')}</div></div>
        </div>
        {(specifications.length > 0 || !!product?.specs?.length) && specList}
        {product && <div className="lr-detail-accordions">
          <ProductDetailAccordion initiallyOpen={typeof product.details === 'string' && product.details !== product.description} title={copy('detailsHeading', 'Product Details')}><EditableText as="p" data-preview-field-path={`products[${index}].${typeof product.details === 'string' && product.details ? 'details' : 'description'}`} defaultValue={typeof product.details === 'string' && product.details ? product.details : product.description} /></ProductDetailAccordion>
          <ProductDetailAccordion title={copy('careHeading', 'Materials & Care')}>
            {specifications.filter(spec => spec.key !== 'dimensions').map(spec => <p key={spec.key}><strong>{copy(`${spec.key}Label`, spec.key.charAt(0).toUpperCase() + spec.key.slice(1))}: </strong><EditableText as="span" data-preview-field-path={`products[${index}].${spec.key}`} defaultValue={spec.value} /></p>)}
            {typeof product.care === 'string' && product.care ? <EditableText as="p" data-preview-field-path={`products[${index}].care`} defaultValue={product.care} /> : copy('careText', 'Ask us about the materials, available finishes and care guidance for this piece.', 'p')}
          </ProductDetailAccordion>
          <ProductDetailAccordion title={copy('deliveryDetailsHeading', 'Delivery & Enquiries')}>
            {product.shippingReturns || product.shippingSummary ? <EditableText as="p" data-preview-field-path={`products[${index}].${product.shippingReturns ? 'shippingReturns' : 'shippingSummary'}`} defaultValue={product.shippingReturns || product.shippingSummary} /> : copy('deliveryDetailsText', 'Share your location and any access requirements with your enquiry. We will confirm delivery options, timing and the final quotation with you.', 'p')}
            {copy('enquiryHelp', 'Collect your favourite pieces in an Enquiry List and send them together on WhatsApp. Our team can help you plan the next step.', 'p')}
          </ProductDetailAccordion>
        </div>}
        <div className="lr-enquiry"><span className="lr-enquiry-icon" aria-hidden="true">↗</span><div><EditableText as="h2" fieldPath="productDetail.enquiryHeading" defaultValue={text('enquiryHeading', 'Let’s make room for it.')} /><EditableText as="p" fieldPath="productDetail.enquiryText" defaultValue={text('enquiryText', 'Talk to us about this piece, finishes and your space.')} /><a href={withBasePath(text('enquiryButtonUrl', '/contact/'))} data-preview-field-path="productDetail.enquiryButtonUrl" className="lr-primary-button"><EditableText as="span" fieldPath="productDetail.enquiryButtonLabel" defaultValue={text('enquiryButtonLabel', 'Enquire about this piece')} /></a></div></div>
        <a href={backHref} className="lr-back-link" data-preview-static="detail-back-to-collection">← Back to the {collection.label.toLowerCase()} collection</a><p className="lr-sample-note" data-preview-static="sample-product-disclosure">Sample product and price. Additional views are AI-generated illustrations of this piece.</p>
      </section>
    </div>
    {!!related.length && <section className="lr-related" aria-labelledby="lumi-best-sellers-label"><div className="lumi-section-top"><div><span className="lr-brand">{copy('relatedEyebrow', 'CONTINUE YOUR EDIT')}</span><h2 id="lumi-best-sellers-label">{copy('relatedHeading', 'Room for something more.')}</h2></div><a href={backHref}>{copy('relatedLinkLabel', 'Explore the collection')} <span aria-hidden="true">&#8599;</span></a></div><HomeProductCarousel label="related pieces" related>{related.map(({ item, position }) => <FurnitureProductCard key={String(item.id)} product={item} index={position} compact />)}</HomeProductCarousel></section>}
  </div>;
}
