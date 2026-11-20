'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { EditableImage, EditableSection, EditableText } from '@deneb-ui/ui';
import { contentText } from '@/lib/siteDataContext';
import { collections, type CollectionId } from '@/lib/collections';
import { withBasePath } from '@/lib/utils';
import { useFivoraEditMode } from '@/lib/useFivoraEditMode';
import './CollectionHero.css';

const interiors: Record<CollectionId, { src: string; alt: string; position: string }> = {
  'living-room': { src: '/images/living-room.jpg', alt: 'Sunlit living room with a caramel sofa, lounge chairs and a coffee table', position: '58% 66%' },
  bedroom: { src: '/images/bed.jpg', alt: 'Furnished bedroom with an upholstered bed, bedside lamps and a bench', position: '50% 56%' },
  'kitchen-dining': { src: '/images/navigation/dining.jpg', alt: 'Dining room with a dressed table, upholstered chairs and pendant lighting', position: '50% 58%' },
  office: { src: '/images/navigation/office.jpg', alt: 'Modern office interior with glass rooms, lounge seating and warm pendant lights', position: '45% 55%' },
  'lighting-decor': { src: '/images/story.jpg', alt: 'Styled living interior with wall decor, natural textures and accent furniture', position: '50% 56%' },
  sale: { src: '/images/living-room.jpg', alt: 'Warm furnished living room with natural wood and upholstered seating', position: '58% 66%' },
};
const STRIP_COUNT = 12;

function isFlagOn(value: unknown, fallback = true): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return String(value) !== 'false';
}

export default function CollectionHero({ collectionId, heading, headingPath, maxDiscount }: {
  collectionId: CollectionId;
  heading: Record<string, unknown>;
  headingPath: string;
  maxDiscount?: number;
}) {
  const collection = collections[collectionId];
  const interior = interiors[collectionId];
  const isSale = collectionId === 'sale';

  // Sale-specific editable controls (other collection pages stay completely untouched)
  const saleImageUrl = isSale ? contentText(heading.bannerImageUrl) || interior.src : interior.src;
  const saleAnimationsOn = !isSale || isFlagOn(heading.animationsEnabled, true);
  const stripRevealOn = !isSale || (saleAnimationsOn && isFlagOn(heading.heroStripRevealEnabled, true));
  const showWatermark = !isSale || isFlagOn(heading.showWatermark, true);
  const watermarkText = contentText(heading.watermarkText) || '%';
  const showHeroBadge = !isSale || isFlagOn(heading.showHeroBadge, true);
  const showCornerRibbon = !isSale || isFlagOn(heading.showCornerRibbon, true);
  const discountOverride = isSale ? contentText(heading.maxDiscountOverride).trim() : '';
  const hasDiscountClaim = isSale && (Boolean(discountOverride) || (typeof maxDiscount === 'number' && maxDiscount > 0));
  const offerPillText = discountOverride || (maxDiscount ? `${maxDiscount}% OFF` : '');
  const ribbonNumberText = discountOverride
    ? discountOverride.replace(/\s*off\s*$/i, '').trim()
    : maxDiscount
      ? `${maxDiscount}%`
      : '';
  const ctaUrl = isSale ? contentText(heading.ctaUrl) || `#${collectionId}-products` : `#${collectionId}-products`;
  const resolvedCtaHref = ctaUrl.startsWith('#') ? ctaUrl : withBasePath(ctaUrl);

  const mediaRef = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  const editing = useFivoraEditMode();
  const [reveal, setReveal] = useState<'idle' | 'playing' | 'done'>('idle');

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (editing || preference.matches || !stripRevealOn) { setReveal('done'); return; }
    if (played.current || !mediaRef.current) return;
    const imgEl = mediaRef.current.querySelector<HTMLImageElement>('.collection-hero-image');
    if (!imgEl) { setReveal('done'); return; }
    let cancelled = false;
    let decoded = false;
    let inView = false;
    const start = () => {
      if (cancelled || !decoded || !inView || played.current) return;
      played.current = true;
      setReveal('playing');
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      start();
    }, { threshold: .15 }) : null;
    if (observer) observer.observe(imgEl);
    else inView = true;
    imgEl.decode().then(() => { decoded = true; start(); }).catch(() => {
      if (!cancelled) setReveal('done');
    });
    const reduceMotion = () => { if (preference.matches) setReveal('done'); };
    preference.addEventListener('change', reduceMotion);
    return () => {
      cancelled = true;
      observer?.disconnect();
      preference.removeEventListener('change', reduceMotion);
    };
  }, [editing, saleImageUrl, stripRevealOn]);

  const saleHeroStyle = isSale
    ? ({
        '--sale-banner-start': contentText(heading.bannerBgStart) || '#4a2a19',
        '--sale-banner-mid': contentText(heading.bannerBgMid) || '#633820',
        '--sale-banner-end': contentText(heading.bannerBgEnd) || '#8b5431',
        '--sale-cta-bg': contentText(heading.ctaBgColor) || '#FAF0E4',
        '--sale-cta-text': contentText(heading.ctaTextColor) || '#3D2B20',
        '--sale-ribbon-start': contentText(heading.ribbonBgStart) || '#c65041',
        '--sale-ribbon-end': contentText(heading.ribbonBgEnd) || '#943226',
        '--sale-ribbon-text': contentText(heading.ribbonTextColor) || '#fff8f2',
      } as CSSProperties)
    : undefined;

  return <EditableSection as="div" name={`${collectionId}-heading`} padding="none" className={`collection-hero${isSale ? ' collection-hero-sale' : ''}`} style={saleHeroStyle}>
    {isSale && showWatermark && <div className="sale-hero-decor" aria-hidden="true" data-preview-static="sale-hero-decoration">
      <span className="sale-hero-watermark">{watermarkText}</span>
      <svg className="sale-hero-flourish" viewBox="0 0 360 140" fill="none" preserveAspectRatio="none">
        <path d="M 10 132 C 95 62, 170 124, 260 66 C 302 38, 336 26, 358 10" stroke="#e5b887" strokeWidth="1.25" strokeOpacity="0.45" />
      </svg>
    </div>}
    <div className="collection-hero-copy">
      {isSale
        ? <p className="sale-hero-eyebrow-pill sale-hero-anim-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></svg>
            <EditableText as="span" fieldPath={`${headingPath}.eyebrowLabel`} defaultValue={contentText(heading.eyebrowLabel) || 'LIMITED-TIME OFFERS'} />
          </p>
        : <p className="collection-hero-eyebrow" data-preview-static="collection-hero-signature">LUMI LIVING COLLECTION</p>}
      <div className={isSale ? 'sale-hero-title-row sale-hero-anim-2' : undefined}>
        <h1 id={`${collectionId}-title`} className="collection-hero-title">
          <EditableText as="span" fieldPath={`${headingPath}.title`} defaultValue={contentText(heading.title) || collection.title} />
        </h1>
        {isSale && showHeroBadge && <span className="sale-hero-badge">
          <EditableText as="span" fieldPath={`${headingPath}.badgeLabel`} defaultValue={contentText(heading.badgeLabel) || 'SALE'} />
          <svg className="sale-hero-sparks" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M5 11L2 5M11 8L12 2M14 13L19 11" />
          </svg>
        </span>}
      </div>
      {hasDiscountClaim && <p className="sale-hero-offer sale-hero-anim-3">
        <EditableText as="span" fieldPath={`${headingPath}.offerPrefix`} defaultValue={contentText(heading.offerPrefix) || 'Up to'} />
        <span className="sale-hero-offer-pill" data-preview-static="sale-hero-offer-pill">{offerPillText}</span>
        <EditableText as="span" fieldPath={`${headingPath}.offerSuffix`} defaultValue={contentText(heading.offerSuffix) || 'on selected pieces.'} />
      </p>}
      <EditableText as="p" className={`collection-hero-description${isSale ? ' sale-hero-anim-3' : ''}`} fieldPath={`${headingPath}.description`} defaultValue={contentText(heading.description) || collection.description} />
      {isSale ? (
        <a className="collection-hero-cta sale-hero-anim-4" href={resolvedCtaHref} data-preview-field-path={`${headingPath}.ctaUrl`}>
          <EditableText as="span" fieldPath={`${headingPath}.ctaLabel`} defaultValue={contentText(heading.ctaLabel) || 'Shop the Collection'} />
          <span aria-hidden="true">→</span>
        </a>
      ) : (
        <a className="collection-hero-cta" href={`#${collectionId}-products`}>Shop the Collection <span aria-hidden="true">→</span></a>
      )}
    </div>
    <div ref={mediaRef} className="collection-hero-media" data-reveal={reveal}>
      {isSale ? (
        <EditableImage
          id={`${headingPath}.bannerImageUrl`}
          data-preview-field-path={`${headingPath}.bannerImageUrl`}
          className="collection-hero-image"
          src={saleImageUrl}
          alt={interior.alt}
          fetchPriority="high"
          decoding="async"
          style={{ objectPosition: interior.position }}
        />
      ) : (
        <img className="collection-hero-image" src={withBasePath(interior.src)} alt={interior.alt} fetchPriority="high" decoding="async" style={{ objectPosition: interior.position }} />
      )}
      {reveal === 'playing' && <div className="collection-hero-strips" aria-hidden="true" style={{ '--strip-count': STRIP_COUNT } as CSSProperties}>
        {Array.from({ length: STRIP_COUNT }, (_, index) => <span key={index} className="collection-hero-strip" style={{ '--strip-index': index } as CSSProperties}
          onAnimationEnd={event => {
            if (index === STRIP_COUNT - 1 && event.target === event.currentTarget) setReveal('done');
          }}>
          <img src={withBasePath(saleImageUrl)} alt="" draggable={false} style={{ objectPosition: interior.position }} />
        </span>)}
      </div>}
    </div>
    {hasDiscountClaim && showCornerRibbon && <div className="sale-hero-ribbon">
      <div className="sale-hero-ribbon-inner">
        <div className="sale-hero-ribbon-content">
          <EditableText as="span" fieldPath={`${headingPath}.ribbonKicker`} defaultValue={contentText(heading.ribbonKicker) || 'UP TO'} className="sale-hero-ribbon-kicker" />
          <span className="sale-hero-ribbon-value" data-preview-static="sale-hero-ribbon-value">{ribbonNumberText}</span>
          <EditableText as="span" fieldPath={`${headingPath}.ribbonSubLabel`} defaultValue={contentText(heading.ribbonSubLabel) || 'OFF'} className="sale-hero-ribbon-sub" />
        </div>
      </div>
    </div>}
  </EditableSection>;
}
