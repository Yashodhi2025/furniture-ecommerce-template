'use client';

import { EditableText, EditableImage, EditableSection, EditableCard, EditableIcon } from '@deneb-ui/ui';
import { contentList, contentObject, contentText, useSiteData, useProducts } from '@/lib/siteDataContext';
import { withBasePath } from '@/lib/utils';
import NewsletterSection from '@/components/NewsletterSection';
import FurnitureProductCard from '@/components/FurnitureProductCard';
import ShopTheLook from '@/components/ShopTheLook';
import './home-collections.css';

export default function HomePage() {
  const data = useSiteData();
  const home = contentObject(contentObject(data.content).home);
  const categories = contentList(home.categories);
  const features = contentList(home.features);
  const products = useProducts();
  // Keep the original catalog index in every field binding after filtering.
  const indexedProducts = products.map((product, index) => ({ product, index }));
  const newArrivals = indexedProducts.filter(({ product }) => contentText(product.homeCollection) !== 'best-sellers');
  const bestSellers = indexedProducts.filter(({ product }) => contentText(product.homeCollection) === 'best-sellers');
  const selectedPages = data.requirements?.requiredPages ?? data.template?.structure?.pages ?? [];
  const text = (key: string) => contentText(home[key]);
  return (
    <div className="lumi-home" data-preview-page-key="home">
      <EditableSection name="home-hero" padding="none" className="lumi-hero">
        <div className="lumi-hero-copy">
          <EditableText as="p" fieldPath="home.heroEyebrow" defaultValue={text('heroEyebrow')} className="lumi-eyebrow" />
          <EditableText as="h1" fieldPath="home.heroTitle" defaultValue={text('heroTitle')} className="lumi-display" />
          <EditableText as="p" fieldPath="home.heroSummary" defaultValue={text('heroSummary')} className="lumi-hero-description" />
          <div className="lumi-actions">
            <a href={withBasePath(text('primaryCtaUrl') || '/#shop')} data-preview-field-path="home.primaryCtaUrl" className="lumi-button"><EditableText as="span" fieldPath="home.primaryCtaLabel" defaultValue={text('primaryCtaLabel')} placeholder="Shop the collection" /><span aria-hidden="true">↗</span></a>
            <a href={withBasePath(text('secondaryCtaUrl') || '/#our-story')} data-preview-field-path="home.secondaryCtaUrl" className="lumi-text-link"><EditableText as="span" fieldPath="home.secondaryCtaLabel" defaultValue={text('secondaryCtaLabel')} placeholder="Our story" /></a>
          </div>
          <p className="lumi-hero-footnote" data-preview-static="decorative-brand-signature"><span /> CONSIDERED DESIGN, EVERY DAY</p>
        </div>
        <div className="lumi-hero-media">
          <EditableImage id="home.bannerImageUrl" src={text('bannerImageUrl')} alt={text('heroImageAlt')} className="lumi-hero-image" fetchPriority="high" />
          <div className="lumi-image-caption">
            <span className="lumi-caption-number" data-preview-static="image-index">01 /</span>
            <div><EditableText as="p" fieldPath="home.heroCaption" defaultValue={text('heroCaption')} /><EditableText as="p" fieldPath="home.heroCaptionDetail" defaultValue={text('heroCaptionDetail')} /></div>
            <span aria-hidden="true">↗</span>
          </div>
        </div>
      </EditableSection>

      <EditableSection name="categories" padding="none" className="lumi-section lumi-categories lumi-rooms">
        <div className="lumi-section-top">
          <div><EditableText as="p" fieldPath="home.categoriesEyebrow" defaultValue={text('categoriesEyebrow')} className="lumi-eyebrow" /><EditableText as="h2" fieldPath="home.categoriesTitle" defaultValue={text('categoriesTitle')} className="lumi-heading" /></div>
          <EditableText as="p" fieldPath="home.categoriesSummary" defaultValue={text('categoriesSummary')} className="lumi-section-description" />
        </div>
        <div className="lumi-category-grid" data-preview-list-path="home.categories">
          {categories.map((raw, index) => {
            const item = contentObject(raw); const itemPath = `home.categories[${index}]`;
            return <EditableCard key={contentText(item.id) || index} itemPath={itemPath} data-preview-item-path={`home.categories[${index}]`} item={{}} className="lumi-category-card" as="article">
              <div className="lumi-category-image"><EditableImage id={`${itemPath}.imageUrl`} data-preview-field-path={`home.categories[${index}].imageUrl`} src={contentText(item.imageUrl)} alt={contentText(item.title)} loading="lazy" /><span className="lumi-room-number" data-preview-static="room-index">0{index + 1}</span></div>
              <EditableText as="h3" data-preview-field-path={`home.categories[${index}].title`} defaultValue={contentText(item.title)} />
              <EditableText as="p" data-preview-field-path={`home.categories[${index}].description`} defaultValue={contentText(item.description)} />
              <a href={withBasePath(contentText(item.linkUrl))} data-preview-field-path={`home.categories[${index}].linkUrl`} className="lumi-category-link"><EditableText as="span" data-preview-field-path={`home.categories[${index}].linkLabel`} defaultValue={contentText(item.linkLabel)} /><span aria-hidden="true">↗</span></a>
            </EditableCard>;
          })}
        </div>
      </EditableSection>

      <EditableSection name="shop" padding="none" className="lumi-section lumi-shop lumi-arrivals">
        <div className="lumi-section-top">
          <div><EditableText as="p" fieldPath="home.productsEyebrow" defaultValue={text('productsEyebrow')} className="lumi-eyebrow" /><EditableText as="h2" fieldPath="home.productsHeading" defaultValue={text('productsHeading')} className="lumi-heading" /></div>
          <EditableText as="p" fieldPath="home.productsSummary" defaultValue={text('productsSummary')} className="lumi-section-description" />
        </div>
        <div className="lumi-product-grid" data-preview-list-path="products" data-home-collection="new-arrivals">
          {newArrivals.map(({ product, index }) => <FurnitureProductCard key={product.id ?? index} product={product} index={index} />)}
        </div>
        <EditableText as="p" fieldPath="home.sampleNote" defaultValue={text('sampleNote')} className="lumi-sample-note" />
      </EditableSection>

      <EditableSection name="best-sellers" padding="none" className="lumi-section lumi-best-sellers">
        <div className="lumi-section-top">
          <div><EditableText as="p" fieldPath="home.bestSellersEyebrow" defaultValue={text('bestSellersEyebrow')} className="lumi-eyebrow" /><EditableText as="h2" fieldPath="home.bestSellersHeading" defaultValue={text('bestSellersHeading')} className="lumi-heading" /></div>
          <div className="lumi-collection-intro"><EditableText as="p" fieldPath="home.bestSellersSummary" defaultValue={text('bestSellersSummary')} className="lumi-section-description" /><a href={withBasePath(text('bestSellersLinkUrl') || '/#shop-the-look')} data-preview-field-path="home.bestSellersLinkUrl" className="lumi-collection-link"><EditableText as="span" fieldPath="home.bestSellersLinkLabel" defaultValue={text('bestSellersLinkLabel')} /><span aria-hidden="true">&#8599;</span></a></div>
        </div>
        <div className="lumi-product-grid" data-preview-list-path="products" data-home-collection="best-sellers">
          {bestSellers.map(({ product, index }) => <FurnitureProductCard key={product.id ?? index} product={product} index={index} />)}
        </div>
      </EditableSection>

      <ShopTheLook />

      <EditableSection name="our-story" padding="none" className="lumi-story lumi-home-story">
        <div className="lumi-story-image"><EditableImage id="home.storyImage" src={text('storyImage')} alt={text('storyImageAlt')} loading="lazy" /></div>
        <div className="lumi-story-copy">
          <EditableText as="p" fieldPath="home.storyEyebrow" defaultValue={text('storyEyebrow')} className="lumi-eyebrow" />
          <EditableText as="h2" fieldPath="home.introTitle" defaultValue={text('introTitle')} className="lumi-heading" />
          <EditableText as="p" fieldPath="home.introBody" defaultValue={text('introBody')} className="lumi-story-description" />
          <a href={selectedPages.includes('about_us') ? withBasePath(text('storyCtaUrl') || '/about_us/') : undefined} aria-disabled={!selectedPages.includes('about_us')} data-preview-field-path="home.storyCtaUrl" className="lumi-text-link"><EditableText as="span" fieldPath="home.storyCtaLabel" defaultValue={text('storyCtaLabel')} placeholder="Get to know LUMI" /><span aria-hidden="true">↗</span></a>
        </div>
      </EditableSection>
      <EditableSection name="why-lumi" padding="none" className="lumi-section lumi-values lumi-home-values">
        <EditableText as="p" fieldPath="home.featuresEyebrow" defaultValue={text('featuresEyebrow')} className="lumi-eyebrow" />
        <EditableText as="h2" fieldPath="home.featuresHeading" defaultValue={text('featuresHeading')} className="lumi-heading" />
        <div className="lumi-values-grid" data-preview-list-path="home.features">
          {features.map((raw, index) => {const item = contentObject(raw); const itemPath = `home.features[${index}]`; return <EditableCard key={index} itemPath={itemPath} data-preview-item-path={`home.features[${index}]`} item={{}} className="lumi-value-card">
            <span className="lumi-value-number" data-preview-static="value-number">0{index + 1}</span>
            <span className="lumi-value-symbol" aria-hidden="true" data-preview-static="decorative-service-symbol"><EditableIcon name={['check-circle', 'map-pin', 'message-circle'][index % 3]} size={26} strokeWidth={1.2} /></span>
            <EditableText as="h3" data-preview-field-path={`home.features[${index}].title`} defaultValue={contentText(item.title)} />
            <EditableText as="p" data-preview-field-path={`home.features[${index}].body`} defaultValue={contentText(item.body)} />
          </EditableCard>;})}
        </div>
      </EditableSection>
      <NewsletterSection />
    </div>
  );
}
