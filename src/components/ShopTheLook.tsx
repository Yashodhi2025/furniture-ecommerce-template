'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  DENEB_PREVIEW_FOCUS_MESSAGE,
  EditableBox,
  EditableImage,
  EditableSection,
  EditableText,
  LEGACY_PREVIEW_FOCUS_MESSAGE,
  PREVIEW_FOCUS_MESSAGE,
  type ProductDetailItem,
  type ProductItem,
} from '@deneb-ui/ui';
import { saleDiscountPercent, saleOriginalPrice } from '@/lib/collections';
import { productHref } from '@/lib/living-room';
import { addProductToCart, CART_KEY, readSavedProducts, type SavedProduct } from '@/lib/shoppingStorage';
import { contentList, contentObject, contentText, useProducts, useSiteData } from '@/lib/siteDataContext';
import { readFivoraEditMode, useFivoraEditMode } from '@/lib/useFivoraEditMode';
import { withBasePath } from '@/lib/utils';
import EnquiryDrawer from './EnquiryDrawer';
import ProductWishlistButton from './ProductWishlistButton';
import './ShopTheLook.css';

const AUTOPLAY_MS = 5000;
const EXIT_DURATION_MS = 380;

const CUTOUT_BY_ID: Record<
  string,
  { src: string; defaultPhoto: string; scaleBias: number; shadowWidth: string; shadowBottom: string }
> = {
  'sora-sofa': {
    src: '/images/arrivals/sora-sofa.webp',
    defaultPhoto: '/images/sofa.jpg',
    scaleBias: 1.06,
    shadowWidth: '76%',
    shadowBottom: '8%',
  },
  'nola-chair': {
    src: '/images/arrivals/nola-chair.webp',
    defaultPhoto: '/images/chair.jpg',
    scaleBias: 0.96,
    shadowWidth: '58%',
    shadowBottom: '2%',
  },
  'elio-table': {
    src: '/images/arrivals/elio-table.webp',
    defaultPhoto: '/images/navigation/office.jpg',
    scaleBias: 1.04,
    shadowWidth: '74%',
    shadowBottom: '5%',
  },
  'mira-storage': {
    src: '/images/arrivals/mira-storage.webp',
    defaultPhoto: '/images/storage.jpg',
    scaleBias: 0.94,
    shadowWidth: '52%',
    shadowBottom: '2%',
  },
};

function resolveCutout(product: ProductItem) {
  const id = String(product.id ?? '');
  const mapped = CUTOUT_BY_ID[id];
  const currentUrl = String(product.imageUrl ?? '');
  // Use the transparent cutout unless the merchant replaced the image in Fivora.
  if (mapped && (!currentUrl || currentUrl === mapped.defaultPhoto)) {
    return mapped;
  }
  return {
    src: currentUrl || '/placeholder.svg',
    defaultPhoto: '',
    scaleBias: 1,
    shadowWidth: '64%',
    shadowBottom: '4%',
  };
}

function formatPrice(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(numeric)
    : String(value ?? '');
}

const percent = (value: unknown) =>
  Math.max(4, Math.min(96, Number.isFinite(Number(value)) ? Number(value) : 50));

type ShowcasePhase = 'waiting' | 'entering' | 'exiting';

/** Hotspots reference the shared catalog by stable ID; no copied prices or inventory state. */
export default function ShopTheLook() {
  const siteData = useSiteData();
  const look = contentObject(contentObject(contentObject(siteData.content).home).look);
  const hotspots = contentList(look.hotspots).map(contentObject);
  const products = useProducts();
  const editing = useFivoraEditMode();
  const previewId = useId();
  const text = (key: string) => contentText(look[key]);
  const count = hotspots.length;

  const [displayIndex, setDisplayIndex] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [phase, setPhase] = useState<ShowcasePhase>('waiting');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [animKey, setAnimKey] = useState(0);
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [inView, setInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState<SavedProduct[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  const rootRef = useRef<HTMLDivElement>(null);
  const hasEnteredRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  const displayIndexRef = useRef(0);
  displayIndexRef.current = displayIndex;

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const transitionToIndex = useCallback(
    (targetIndex: number, dir: 1 | -1, isManual: boolean) => {
      if (!count) return;
      const normalized = ((targetIndex % count) + count) % count;
      if (isManual) {
        setTimerResetKey((value) => value + 1);
      }

      if (normalized === displayIndexRef.current && phase !== 'exiting') {
        setHighlightedIndex(normalized);
        return;
      }

      clearExitTimer();
      setDirection(dir);
      setHighlightedIndex(normalized);

      if (reducedMotion || editing) {
        setDisplayIndex(normalized);
        setPhase('entering');
        setAnimKey((value) => value + 1);
        return;
      }

      setPhase('exiting');
      exitTimerRef.current = window.setTimeout(() => {
        exitTimerRef.current = null;
        setDisplayIndex(normalized);
        setPhase('entering');
        setAnimKey((value) => value + 1);
      }, EXIT_DURATION_MS);
    },
    [clearExitTimer, count, editing, phase, reducedMotion],
  );

  // Sync reduced motion and tab visibility
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(query.matches);
    const syncVisibility = () => setPageVisible(document.visibilityState === 'visible');
    syncMotion();
    syncVisibility();
    query.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      query.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  // Scroll-triggered entrance & replay on scroll away + return
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (reducedMotion || editing || typeof IntersectionObserver === 'undefined') {
      hasEnteredRef.current = true;
      setInView(true);
      setPhase('entering');
      return;
    }

    const enterObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (!hasEnteredRef.current) {
              hasEnteredRef.current = true;
              clearExitTimer();
              setDirection(1);
              setPhase('entering');
              setAnimKey((value) => value + 1);
              setTimerResetKey((value) => value + 1);
            }
          }
        }
      },
      { threshold: 0.22 },
    );

    const exitObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            setInView(false);
            hasEnteredRef.current = false;
            clearExitTimer();
            setPhase('waiting');
          }
        }
      },
      { threshold: 0 },
    );

    enterObserver.observe(el);
    exitObserver.observe(el);

    return () => {
      enterObserver.disconnect();
      exitObserver.disconnect();
      clearExitTimer();
    };
  }, [clearExitTimer, editing, reducedMotion]);

  // Autoplay every 5 seconds when active, visible, and not paused
  const autoplayActive =
    count > 1 &&
    inView &&
    pageVisible &&
    !isHovered &&
    !isFocused &&
    !reducedMotion &&
    !editing &&
    !drawerOpen &&
    phase !== 'waiting';

  useEffect(() => {
    if (!autoplayActive) return;
    const timer = window.setInterval(() => {
      transitionToIndex(displayIndexRef.current + 1, 1, false);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [autoplayActive, timerResetKey, transitionToIndex]);

  // Fivora inspector focus sync
  useEffect(() => {
    const revealField = (event: MessageEvent) => {
      if (
        event.source !== window.parent ||
        !event.data ||
        ![PREVIEW_FOCUS_MESSAGE, DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE].includes(
          event.data.type,
        )
      ) {
        return;
      }
      const fieldPath = String(event.data.fieldPath || '').replace(/^content\./, '');
      const hotspotMatch = /^home\.look\.hotspots\[(\d+)\]/.exec(fieldPath);
      if (hotspotMatch) {
        const idx = Number(hotspotMatch[1]);
        if (idx >= 0 && idx < hotspots.length) {
          transitionToIndex(idx, 1, true);
          return;
        }
      }
      const productMatch = /^products\[(\d+)\]/.exec(fieldPath);
      if (productMatch) {
        const targetProduct = products[Number(productMatch[1])];
        if (targetProduct) {
          const idx = hotspots.findIndex(
            (item) => contentText(item.productId) === String(targetProduct.id),
          );
          if (idx >= 0) transitionToIndex(idx, 1, true);
        }
      }
    };
    window.addEventListener('message', revealField);
    return () => window.removeEventListener('message', revealField);
  }, [hotspots, products, transitionToIndex]);

  const safeDisplayIndex = count ? ((displayIndex % count) + count) % count : 0;
  const safeHighlightIndex = count ? ((highlightedIndex % count) + count) % count : 0;
  const selected = hotspots[safeDisplayIndex];
  const productIndex = selected
    ? products.findIndex((item) => String(item.id) === contentText(selected.productId))
    : -1;
  const product = productIndex >= 0 ? products[productIndex] : undefined;

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = ['ArrowRight', 'ArrowDown'].includes(event.key)
      ? 1
      : ['ArrowLeft', 'ArrowUp'].includes(event.key)
        ? -1
        : 0;
    if (!step || !count) return;
    event.preventDefault();
    const next = (index + step + count) % count;
    transitionToIndex(next, step as 1 | -1, true);
    rootRef.current?.querySelectorAll<HTMLButtonElement>('.lumi-hotspot-button')[next]?.focus();
  };

  const handleSelectHotspot = (index: number) => {
    const dir: 1 | -1 = index < safeDisplayIndex ? -1 : 1;
    transitionToIndex(index, dir, true);
  };

  const handleStep = (step: 1 | -1) => {
    transitionToIndex(safeHighlightIndex + step, step, true);
  };

  const field = (key: string) => (productIndex >= 0 ? `products[${productIndex}].${key}` : undefined);
  const cutout = product ? resolveCutout(product) : null;
  const productUrl = product
    ? product.ctaUrl
      ? String(product.ctaUrl)
      : productHref(product.id)
    : '#';
  const formattedPrice = product ? formatPrice(product.price) : '';
  const originalPrice = product ? saleOriginalPrice(product) : undefined;
  const discountPct = product ? saleDiscountPercent(product) : undefined;
  const unavailable =
    !product || product.isAvailable === false || product.id == null || String(product.id) === '';

  const handleAddToCart = () => {
    if (!product || readFivoraEditMode() || unavailable) return;
    try {
      addProductToCart({
        id: String(product.id),
        name: product.name,
        price: product.price,
        currency: product.currency,
        imageUrl: product.imageUrl,
      });
      setCartItems(readSavedProducts(CART_KEY));
      setStatusMessage(`${product.name || 'Product'} added to your cart.`);
      setDrawerOpen(true);
    } catch {
      setStatusMessage('Could not save your cart. Please allow browser storage and try again.');
    }
  };

  const isStatic = editing || reducedMotion;

  return (
    <EditableSection name="shop-the-look" padding="none" className="lumi-section lumi-look">
      <div className="lumi-section-top">
        <div>
          <EditableText
            as="p"
            fieldPath="home.look.eyebrow"
            defaultValue={text('eyebrow')}
            className="lumi-eyebrow"
          />
          <EditableText
            as="h2"
            fieldPath="home.look.title"
            defaultValue={text('title')}
            className="lumi-heading"
          />
        </div>
        <EditableText
          as="p"
          fieldPath="home.look.summary"
          defaultValue={text('summary')}
          className="lumi-section-description"
        />
      </div>

      <div
        className="lumi-look-grid"
        ref={rootRef}
        data-look-phase={isStatic ? 'static' : phase}
        data-look-dir={direction}
        data-autoplay-running={autoplayActive ? 'true' : 'false'}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <figure className="lumi-look-scene">
          <div className="lumi-look-image">
            <EditableImage
              id="home.look.imageUrl"
              src={text('imageUrl')}
              alt={text('imageAlt')}
              loading="lazy"
            />
            <div className="lumi-hotspots" data-preview-list-path="home.look.hotspots">
              {hotspots.map((item, index) => {
                const isSelected = safeHighlightIndex === index;
                return (
                  <EditableBox
                    key={contentText(item.id) || index}
                    data-preview-item-path={`home.look.hotspots[${index}]`}
                    className={`lumi-hotspot${isSelected ? ' is-selected' : ''}${
                      percent(item.x) > 68 ? ' is-right' : percent(item.x) < 30 ? ' is-left' : ''
                    }`}
                    style={{ left: `${percent(item.x)}%`, top: `${percent(item.y)}%` }}
                  >
                    <button
                      type="button"
                      className="lumi-hotspot-button"
                      data-preview-field-path={`home.look.hotspots[${index}].label`}
                      aria-label={contentText(item.label) || `Furniture ${index + 1}`}
                      aria-pressed={isSelected}
                      aria-controls={previewId}
                      onClick={() => handleSelectHotspot(index)}
                      onKeyDown={(event) => moveFocus(event, index)}
                    >
                      <span className="lumi-hotspot-pulse" aria-hidden="true" />
                      <span className="lumi-hotspot-ring" aria-hidden="true" />
                      <span
                        className="lumi-hotspot-index"
                        aria-hidden="true"
                        data-preview-static="hotspot-index"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <EditableText
                        as="span"
                        data-preview-field-path={`home.look.hotspots[${index}].label`}
                        defaultValue={contentText(item.label)}
                        className="lumi-hotspot-label"
                        placeholder="Explore this piece"
                      />
                    </button>
                  </EditableBox>
                );
              })}
            </div>
          </div>
          <figcaption>
            <EditableText as="span" fieldPath="home.look.caption" defaultValue={text('caption')} />
            <EditableText as="span" fieldPath="home.look.note" defaultValue={text('note')} />
          </figcaption>
        </figure>

        <div
          className="lumi-look-preview look-showroom"
          id={previewId}
          onFocusCapture={() => setIsFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsFocused(false);
            }
          }}
        >
          <div className="look-showroom-header">
            <EditableText
              as="p"
              fieldPath="home.look.previewLabel"
              defaultValue={text('previewLabel')}
              className="lumi-eyebrow"
            />
            {count > 1 && (
              <span className="look-showroom-counter" data-preview-static="look-counter" aria-hidden="true">
                {String(safeHighlightIndex + 1).padStart(2, '0')}
                <span className="look-showroom-counter-sep"> / </span>
                {String(count).padStart(2, '0')}
              </span>
            )}
          </div>

          <div className="lumi-look-product look-showroom-body" data-preview-list-path="products">
            {product && cutout ? (
              <div
                key={`${String(product.id ?? productIndex)}-${animKey}`}
                className="look-active-piece"
                data-preview-item-path={`products[${productIndex}]`}
                data-product-id={String(product.id ?? '')}
              >
                <div
                  className="look-stage-viewport"
                  style={
                    {
                      '--look-shadow-width': cutout.shadowWidth,
                      '--look-shadow-bottom': cutout.shadowBottom,
                    } as CSSProperties
                  }
                >
                  <div className="look-stage-aura" aria-hidden="true" />
                  <span
                    className="look-ground-shadow"
                    aria-hidden="true"
                    data-preview-static="look-ground-shadow"
                  />
                  <div className="look-entrance-layer">
                    <div className="look-float-layer">
                      <a
                        href={withBasePath(productUrl)}
                        className="look-cutout-link"
                        aria-label={`View ${String(product.name || 'product')}`}
                        onClick={(event) => {
                          if (editing) event.preventDefault();
                        }}
                      >
                        <EditableImage
                          id={`products[${productIndex}].imageUrl`}
                          data-preview-field-path={`products[${productIndex}].imageUrl`}
                          src={cutout.src}
                          alt={String(product.name || 'Furniture piece')}
                          fit="contain"
                          className="look-cutout-image"
                          style={{ '--look-cutout-scale': cutout.scaleBias } as CSSProperties}
                          draggable={false}
                          decoding="async"
                        />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="look-details-panel">
                  <div className="look-detail-item look-detail-meta">
                    <EditableText
                      as="span"
                      className="look-detail-category"
                      data-preview-field-path={field('category')}
                      defaultValue={product.category || 'Furniture'}
                    />
                    {discountPct !== undefined && (
                      <span className="look-discount-pill" data-preview-static="look-discount-pill">
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>

                  <div className="look-detail-item look-detail-title-wrap">
                    <a
                      href={withBasePath(productUrl)}
                      data-preview-field-path={field('ctaUrl')}
                      className="look-detail-name-link"
                      onClick={(event) => {
                        if (editing) event.preventDefault();
                      }}
                    >
                      <EditableText
                        as="h3"
                        className="look-detail-name"
                        data-preview-field-path={field('name')}
                        defaultValue={product.name}
                      />
                    </a>
                  </div>

                  <div className="look-detail-item look-detail-pricing">
                    <span className="look-detail-price">
                      <span className="look-detail-currency">
                        {String(product.currency || 'LKR')}{' '}
                      </span>
                      <EditableText
                        as="span"
                        data-preview-field-path={field('price')}
                        defaultValue={formattedPrice}
                      />
                    </span>
                    {originalPrice !== undefined && (
                      <EditableText
                        as="s"
                        className="look-detail-original"
                        data-preview-field-path={field(
                          product.compareAtPrice != null ? 'compareAtPrice' : 'originalPrice',
                        )}
                        defaultValue={formatPrice(originalPrice)}
                      />
                    )}
                  </div>

                  <div className="look-detail-item look-detail-actions">
                    <button
                      type="button"
                      className="look-cart-btn"
                      data-preview-static="look-add-to-cart"
                      disabled={unavailable}
                      aria-label={`${unavailable ? 'Unavailable' : 'Add to Cart'}: ${
                        product.name || 'product'
                      }`}
                      onClick={handleAddToCart}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                        <path d="M3 6h18" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      <span>{unavailable ? 'Unavailable' : 'Add to Cart'}</span>
                    </button>

                    <a
                      href={withBasePath(productUrl)}
                      className="look-view-link"
                      data-preview-static="look-view-details"
                      onClick={(event) => {
                        if (editing) event.preventDefault();
                      }}
                    >
                      <span>View Piece</span>
                      <span aria-hidden="true">↗</span>
                    </a>

                    <div className="look-wishlist-wrap">
                      <ProductWishlistButton product={product} />
                    </div>
                  </div>

                  {editing && (
                    <div className="look-editor-fields">
                      <EditableText
                        as="p"
                        data-preview-field-path={field('description')}
                        defaultValue={product.description}
                      />
                      <EditableText
                        as="span"
                        data-preview-field-path={field('badge')}
                        defaultValue={product.badge}
                      />
                      <EditableText
                        as="span"
                        data-preview-field-path={field('ctaLabel')}
                        defaultValue={String(product.ctaLabel || '')}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EditableText
                as="p"
                fieldPath="home.look.emptyMessage"
                defaultValue={text('emptyMessage')}
                className="look-empty-message"
              />
            )}
          </div>

          {count > 1 && (
            <div className="look-controls" data-preview-static="look-showroom-controls">
              <button
                type="button"
                className="look-nav-btn look-nav-prev"
                aria-label="Previous featured piece"
                onClick={() => handleStep(-1)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <div className="look-progress-dots" role="tablist" aria-label="Featured room pieces">
                {hotspots.map((item, index) => {
                  const isActiveDot = safeHighlightIndex === index;
                  return (
                    <button
                      key={contentText(item.id) || index}
                      type="button"
                      role="tab"
                      aria-selected={isActiveDot}
                      aria-label={contentText(item.label) || `Show piece ${index + 1}`}
                      className="look-progress-dot"
                      data-active={isActiveDot ? 'true' : 'false'}
                      onClick={() => handleSelectHotspot(index)}
                    >
                      {isActiveDot && (
                        <span
                          key={`${safeHighlightIndex}-${timerResetKey}`}
                          className="look-progress-fill"
                          style={{ '--look-autoplay-ms': `${AUTOPLAY_MS}ms` } as CSSProperties}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="look-nav-btn look-nav-next"
                aria-label="Next featured piece"
                onClick={() => handleStep(1)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}

          <span
            role="status"
            className="lumi-look-status"
            data-preview-static="hotspot-selection-announcement"
          >
            {statusMessage || (product ? contentText(selected?.label) : text('emptyMessage'))}
          </span>
        </div>
      </div>

      {drawerOpen &&
        product &&
        createPortal(
          <EnquiryDrawer
            open
            onClose={closeDrawer}
            product={product as ProductDetailItem}
            productIndex={productIndex}
            quantity={1}
            items={cartItems}
            listError={false}
            editing={false}
          />,
          document.body,
        )}
    </EditableSection>
  );
}
