'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { EditableImage } from '@deneb-ui/ui';
import { contentText } from '@/lib/siteDataContext';
import { useFivoraEditMode } from '@/lib/useFivoraEditMode';
import './CartFurnitureDrop.css';

const DEFAULT_IMAGE_SIZE = 84;
const MIN_IMAGE_SIZE = 48;
const MAX_IMAGE_SIZE = 130;

const SLOT_CONFIG = [
  { key: 'animationFurniture1', role: 'sofa' },
  { key: 'animationFurniture2', role: 'chair' },
  { key: 'animationFurniture3', role: 'table' },
] as const;

type CartFurnitureDropProps = {
  settings: Record<string, unknown>;
};

function parseImageSize(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_IMAGE_SIZE;
  return Math.min(MAX_IMAGE_SIZE, Math.max(MIN_IMAGE_SIZE, Math.round(numeric)));
}

export default function CartFurnitureDrop({ settings }: CartFurnitureDropProps) {
  const editing = useFivoraEditMode();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(query.matches);
    syncMotion();
    query.addEventListener('change', syncMotion);

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setRunKey((value) => value + 1);
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      query.removeEventListener('change', syncMotion);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const enabled = settings.animationEnabled !== false && String(settings.animationEnabled) !== 'false';
  if (!enabled) return null;

  const sizePx = parseImageSize(settings.animationImageSize);
  const pieces = SLOT_CONFIG.map((slot) => ({
    ...slot,
    fieldPath: `cart.${slot.key}`,
    src: contentText(settings[slot.key]).trim(),
  })).filter((slot) => slot.src.length > 0);

  if (!pieces.length) return null;

  const isStatic = editing || reducedMotion;

  return (
    <div
      key={runKey}
      className="cart-drop-showcase"
      data-static={isStatic ? 'true' : 'false'}
      data-piece-count={pieces.length}
      style={{ '--cart-piece-size': `${sizePx}px` } as CSSProperties}
      aria-hidden="true"
    >
      <div className="cart-drop-stage">
        {pieces.map((piece, visibleIndex) => (
          <div
            key={piece.key}
            className={`cart-drop-slot cart-drop-slot--${piece.role}`}
            style={{ '--drop-delay': `${80 + visibleIndex * 200}ms` } as CSSProperties}
          >
            <span className="cart-drop-shadow" />
            <div className="cart-drop-piece">
              <EditableImage
                data-preview-field-path={piece.fieldPath}
                src={piece.src}
                alt=""
                fit="contain"
                loading="eager"
                decoding="async"
                draggable={false}
                className="cart-drop-image"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="cart-drop-baseline" />
    </div>
  );
}
