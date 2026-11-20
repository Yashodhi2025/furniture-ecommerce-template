'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  DENEB_PREVIEW_FOCUS_MESSAGE,
  EditableImage,
  EditableText,
  LEGACY_PREVIEW_FOCUS_MESSAGE,
  PREVIEW_FOCUS_MESSAGE,
  type ProductDetailItem,
  type ProductItem,
} from '@deneb-ui/ui';
import { saleOriginalPrice } from '@/lib/collections';
import { productHref } from '@/lib/living-room';
import { addProductToCart, CART_KEY, readSavedProducts, type SavedProduct } from '@/lib/shoppingStorage';
import { readFivoraEditMode, useFivoraEditMode } from '@/lib/useFivoraEditMode';
import { withBasePath } from '@/lib/utils';
import EnquiryDrawer from './EnquiryDrawer';
import ProductWishlistButton from './ProductWishlistButton';
import './NewArrivalsCarousel.css';

interface ArrivalEntry {
  product: ProductItem;
  index: number;
}

const CUTOUT_BY_ID: Record<string, { src: string; defaultPhoto: string; scaleBias: number }> = {
  'sora-sofa': { src: '/images/arrivals/sora-sofa.webp', defaultPhoto: '/images/sofa.jpg', scaleBias: 1.12 },
  'nola-chair': { src: '/images/arrivals/nola-chair.webp', defaultPhoto: '/images/chair.jpg', scaleBias: 1.0 },
  'elio-table': { src: '/images/arrivals/elio-table.webp', defaultPhoto: '/images/navigation/office.jpg', scaleBias: 1.1 },
  'mira-storage': { src: '/images/arrivals/mira-storage.webp', defaultPhoto: '/images/storage.jpg', scaleBias: 0.94 },
};

function resolveCutout(product: ProductItem) {
  const id = String(product.id ?? '');
  const mapped = CUTOUT_BY_ID[id];
  const currentUrl = String(product.imageUrl ?? '');
  // Use the transparent cutout unless the merchant replaced the image with a custom photo in the editor.
  if (mapped && (!currentUrl || currentUrl === mapped.defaultPhoto)) {
    return { src: mapped.src, scaleBias: mapped.scaleBias };
  }
  return { src: currentUrl || '/placeholder.svg', scaleBias: 1 };
}

function formatPrice(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(numeric)
    : String(value ?? '');
}

export default function NewArrivalsCarousel({ items }: { items: ArrivalEntry[] }) {
  const count = items.length;
  // Default to Nola Lounge Chair in front when present so the initial 4-piece orbit matches the showcase order.
  const initialIndex = Math.max(0, items.findIndex(({ product }) => String(product.id) === 'nola-chair'));
  const [active, setActive] = useState(initialIndex);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState<SavedProduct[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const editing = useFivoraEditMode();

  const stageRef = useRef<HTMLDivElement>(null);
  const itemNodes = useRef<(HTMLDivElement | null)[]>([]);
  const targetPos = useRef(initialIndex);
  const currentPos = useRef(initialIndex);
  const rafRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number | null>(null);
  const wheelAccum = useRef(0);
  const wheelLockUntil = useRef(0);
  const wheelBudget = useRef({ used: 0, dir: 0, resetTimer: 0 });
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const applyOrbitLayout = useCallback((position: number) => {
    const stageEl = stageRef.current;
    if (!stageEl || !count) return;
    const stageW = stageEl.clientWidth || 1000;
    const isMobile = stageW <= 680;
    const isTablet = stageW > 680 && stageW <= 980;

    // Invisible 3D circular/elliptical orbit radii scaled cleanly to container width.
    const radiusX = isMobile ? Math.min(stageW * 0.34, 145) : isTablet ? Math.min(stageW * 0.31, 265) : Math.min(stageW * 0.32, 365);
    const backY = isMobile ? -76 : isTablet ? -96 : -110;
    const frontY = isMobile ? 32 : isTablet ? 40 : 44;
    const minScale = isMobile ? 0.42 : 0.46;

    itemNodes.current.forEach((node, idx) => {
      if (!node || idx >= count) return;
      const theta = ((idx - position) / count) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      // depth: 0 = directly behind center (smallest), 0.5 = left/right flanks, 1 = front center (largest)
      const depth = (cosT + 1) / 2;
      const x = sinT * radiusX;
      const y = backY + (frontY - backY) * Math.pow(depth, 1.08);
      const scale = minScale + (1 - minScale) * Math.pow(depth, 1.06);
      const opacity = 0.7 + 0.3 * Math.pow(depth, 0.85);
      const zIndex = Math.round(10 + depth * 30);
      const shadowY = Math.round(10 + depth * 14);
      const shadowBlur = Math.round(10 + depth * 14);
      const shadowAlpha = (0.11 + depth * 0.12).toFixed(3);

      node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      node.style.opacity = opacity.toFixed(3);
      node.style.zIndex = String(zIndex);
      node.style.setProperty('--arrival-shadow', `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(61, 37, 25, ${shadowAlpha}))`);
    });
  }, [count]);

  const startOrbitLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    lastFrameTime.current = null;

    const tick = (now: number) => {
      const reduced = editing || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        currentPos.current = targetPos.current;
        applyOrbitLayout(currentPos.current);
        rafRef.current = null;
        return;
      }

      const prev = lastFrameTime.current ?? now;
      lastFrameTime.current = now;
      const dt = Math.min((now - prev) / 1000, 0.05);
      const diff = targetPos.current - currentPos.current;

      if (Math.abs(diff) < 0.0008) {
        currentPos.current = targetPos.current;
        applyOrbitLayout(currentPos.current);
        rafRef.current = null;
        return;
      }

      // Smooth frame-rate-independent exponential glide around the 3D circle.
      const factor = 1 - Math.exp(-dt * 8.2);
      currentPos.current += diff * factor;
      applyOrbitLayout(currentPos.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [applyOrbitLayout, editing]);

  const rotateBy = useCallback((delta: number) => {
    if (count < 2) return;
    targetPos.current += delta;
    const normalized = ((Math.round(targetPos.current) % count) + count) % count;
    setActive(normalized);
    startOrbitLoop();
  }, [count, startOrbitLoop]);

  const goToIndex = useCallback((index: number) => {
    if (count < 2) return;
    const currentNormalized = ((Math.round(targetPos.current) % count) + count) % count;
    let delta = index - currentNormalized;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    if (delta === 0) return;
    rotateBy(delta);
  }, [count, rotateBy]);

  // Initial layout + responsive recalculation on stage resize.
  useEffect(() => {
    applyOrbitLayout(currentPos.current);
    const stageEl = stageRef.current;
    if (!stageEl || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => applyOrbitLayout(currentPos.current));
    observer.observe(stageEl);
    return () => {
      observer.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [applyOrbitLayout]);

  // Smooth mouse wheel / trackpad 3D rotation inside the carousel stage.
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl || count < 2) return;
    const budget = wheelBudget.current;

    const resetBudget = () => {
      budget.used = 0;
      budget.dir = 0;
    };

    const onWheel = (event: WheelEvent) => {
      if (editing) return;
      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      if (absX < 2 && absY < 2) return;

      const horizontal = absX > absY;
      const rawDelta = horizontal ? event.deltaX : event.deltaY;
      const direction = rawDelta > 0 ? 1 : -1;

      if (!horizontal) {
        // Vertical wheel rotates smoothly through the arrivals while over the stage,
        // then yields naturally back to page scrolling after a full pass so users are never trapped.
        if (budget.dir !== direction) {
          budget.dir = direction;
          budget.used = 0;
        }
        window.clearTimeout(budget.resetTimer);
        budget.resetTimer = window.setTimeout(resetBudget, 1100);
        if (budget.used >= count - 1) return;
      }

      event.preventDefault();
      const now = performance.now();
      if (now < wheelLockUntil.current) return;

      wheelAccum.current += rawDelta;
      if (Math.abs(wheelAccum.current) >= 34) {
        const step = wheelAccum.current > 0 ? 1 : -1;
        wheelAccum.current = 0;
        wheelLockUntil.current = now + 260;
        if (!horizontal) budget.used += 1;
        rotateBy(step);
      }
    };

    stageEl.addEventListener('wheel', onWheel, { passive: false });
    stageEl.addEventListener('pointerleave', resetBudget);
    return () => {
      stageEl.removeEventListener('wheel', onWheel);
      stageEl.removeEventListener('pointerleave', resetBudget);
      window.clearTimeout(budget.resetTimer);
    };
  }, [count, editing, rotateBy]);

  // Sync active product when focused from the Fivora / Deneb visual editor.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.source !== window.parent ||
        ![PREVIEW_FOCUS_MESSAGE, DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE].includes(event.data?.type)
      ) {
        return;
      }
      const match = /^products\[(\d+)\]/.exec(String(event.data.fieldPath || '').replace(/^content\./, ''));
      if (!match) return;
      const catalogIndex = Number(match[1]);
      const found = items.findIndex(entry => entry.index === catalogIndex);
      if (found >= 0) goToIndex(found);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [goToIndex, items]);

  if (!count) return null;
  itemNodes.current.length = count;

  const safeActive = ((active % count) + count) % count;
  const activeEntry = items[safeActive];
  const activeProduct = activeEntry.product;
  const activeCatalogIndex = activeEntry.index;
  const field = (key: string) => `products[${activeCatalogIndex}].${key}`;
  const activeUrl = activeProduct.ctaUrl ? String(activeProduct.ctaUrl) : productHref(activeProduct.id);
  const formattedPrice = formatPrice(activeProduct.price);
  const originalPrice = saleOriginalPrice(activeProduct);
  const unavailable = activeProduct.isAvailable === false || activeProduct.id == null || String(activeProduct.id) === '';

  const handleTouchEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!gesture.current) return;
    const dx = event.clientX - gesture.current.x;
    const dy = event.clientY - gesture.current.y;
    gesture.current = null;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.1) {
      swiped.current = true;
      rotateBy(dx < 0 ? 1 : -1);
    }
  };

  const handleAddToCart = () => {
    if (readFivoraEditMode() || unavailable) return;
    try {
      addProductToCart({
        id: String(activeProduct.id),
        name: activeProduct.name,
        price: activeProduct.price,
        currency: activeProduct.currency,
        imageUrl: activeProduct.imageUrl,
      });
      setCartItems(readSavedProducts(CART_KEY));
      setStatusMessage(`${activeProduct.name || 'Product'} added to your cart.`);
      setDrawerOpen(true);
    } catch {
      setStatusMessage('Could not save your cart. Please allow browser storage and try again.');
    }
  };

  return (
    <div
      className="arrivals-showcase"
      role="region"
      aria-roledescription="carousel"
      aria-label="New Arrivals"
      data-editing={editing}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          rotateBy(-1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          rotateBy(1);
        }
      }}
    >
      <div
        ref={stageRef}
        className="arrivals-orbit-stage"
        data-preview-list-path="products"
        data-home-collection="new-arrivals"
        onPointerDown={event => {
          swiped.current = false;
          if (event.pointerType === 'touch') gesture.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={handleTouchEnd}
        onPointerCancel={() => { gesture.current = null; }}
        onClickCapture={event => {
          if (swiped.current) {
            event.preventDefault();
            event.stopPropagation();
            swiped.current = false;
          }
        }}
      >
        <div className="arrivals-orbit-items">
          {items.map(({ product, index: catalogIndex }, slotIndex) => {
            const isFront = slotIndex === safeActive;
            const cutout = resolveCutout(product);
            const href = product.ctaUrl ? String(product.ctaUrl) : productHref(product.id);
            return (
              <div
                key={String(product.id ?? catalogIndex)}
                ref={el => { itemNodes.current[slotIndex] = el; }}
                className="arrivals-orbit-item"
                data-front={isFront}
                data-product-id={String(product.id ?? '')}
                data-preview-item-path={`products[${catalogIndex}]`}
              >
                <a
                  href={withBasePath(href)}
                  className="arrivals-orbit-link"
                  tabIndex={isFront ? 0 : -1}
                  aria-current={isFront ? 'true' : undefined}
                  aria-label={isFront ? `View ${String(product.name || 'product')}` : `Focus ${String(product.name || 'product')}`}
                  onClick={event => {
                    if (editing) {
                      event.preventDefault();
                      return;
                    }
                    if (!isFront && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                      event.preventDefault();
                      goToIndex(slotIndex);
                    }
                  }}
                >
                  <EditableImage
                    id={`products[${catalogIndex}].imageUrl`}
                    data-preview-field-path={`products[${catalogIndex}].imageUrl`}
                    src={cutout.src}
                    alt={String(product.name || 'Furniture piece')}
                    fit="contain"
                    className="arrivals-cutout-img"
                    style={{ '--cutout-scale': cutout.scaleBias } as React.CSSProperties}
                    draggable={false}
                    decoding="async"
                  />
                </a>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="arrivals-arrow arrivals-arrow-prev"
          data-preview-static="arrivals-carousel-prev"
          aria-label="Previous new arrival"
          disabled={count < 2}
          onClick={() => rotateBy(-1)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <button
          type="button"
          className="arrivals-arrow arrivals-arrow-next"
          data-preview-static="arrivals-carousel-next"
          aria-label="Next new arrival"
          disabled={count < 2}
          onClick={() => rotateBy(1)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {count > 1 && (
        <div className="arrivals-dots" role="tablist" aria-label="Choose a new arrival" data-preview-static="arrivals-carousel-dots">
          {items.map(({ product, index: catalogIndex }, slotIndex) => (
            <button
              key={String(product.id ?? catalogIndex)}
              type="button"
              role="tab"
              aria-selected={slotIndex === safeActive}
              aria-label={`Show ${String(product.name || `product ${slotIndex + 1}`)}`}
              className="arrivals-dot"
              data-active={slotIndex === safeActive}
              onClick={() => goToIndex(slotIndex)}
            />
          ))}
        </div>
      )}

      <div
        key={String(activeProduct.id ?? activeCatalogIndex)}
        className="arrivals-active-details"
        data-preview-item-path={`products[${activeCatalogIndex}]`}
      >
        <a
          href={withBasePath(activeUrl)}
          data-preview-field-path={field('ctaUrl')}
          className="arrivals-active-name-link"
          onClick={event => { if (editing) event.preventDefault(); }}
        >
          <EditableText
            as="h3"
            className="arrivals-active-name"
            data-preview-field-path={field('name')}
            defaultValue={activeProduct.name}
          />
        </a>

        <EditableText
          as="p"
          className="arrivals-active-category"
          data-preview-field-path={field('category')}
          defaultValue={activeProduct.category || 'Furniture'}
        />

        <div className="arrivals-active-pricing">
          <span className="arrivals-active-price">
            <span className="arrivals-active-currency">{String(activeProduct.currency || 'LKR')} </span>
            <EditableText as="span" data-preview-field-path={field('price')} defaultValue={formattedPrice} />
          </span>
          {originalPrice !== undefined && (
            <EditableText
              as="s"
              className="arrivals-active-compare"
              data-preview-field-path={field(activeProduct.compareAtPrice != null ? 'compareAtPrice' : 'originalPrice')}
              defaultValue={formatPrice(originalPrice)}
            />
          )}
        </div>

        <div className="arrivals-active-actions">
          <button
            type="button"
            className="arrivals-cart-btn"
            data-preview-static="arrivals-add-to-cart"
            disabled={unavailable}
            aria-label={`${unavailable ? 'Unavailable' : 'Add to Cart'}: ${activeProduct.name || 'product'}`}
            onClick={handleAddToCart}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>{unavailable ? 'Unavailable' : 'Add to Cart'}</span>
          </button>

          <div className="arrivals-wishlist-slot">
            <ProductWishlistButton product={activeProduct} />
          </div>
        </div>

        {editing && (
          <div className="arrivals-editor-fields">
            <EditableText as="p" data-preview-field-path={field('description')} defaultValue={activeProduct.description} />
            <EditableText as="span" data-preview-field-path={field('badge')} defaultValue={activeProduct.badge} />
            <EditableText as="span" data-preview-field-path={field('ctaLabel')} defaultValue={String(activeProduct.ctaLabel || '')} />
          </div>
        )}
      </div>

      <span className="sr-only" role="status" aria-live="polite" data-preview-static="arrivals-live-status">
        {statusMessage || `${String(activeProduct.name || 'Product')}, ${safeActive + 1} of ${count}`}
      </span>

      {drawerOpen && createPortal(
        <EnquiryDrawer
          open
          onClose={closeDrawer}
          product={activeProduct as ProductDetailItem}
          productIndex={activeCatalogIndex}
          quantity={1}
          items={cartItems}
          listError={false}
          editing={false}
        />,
        document.body
      )}
    </div>
  );
}
