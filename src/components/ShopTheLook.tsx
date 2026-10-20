'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE, PREVIEW_FOCUS_MESSAGE, EditableBox, EditableImage, EditableSection, EditableText } from '@deneb-ui/ui';
import { contentList, contentObject, contentText, useProducts, useSiteData } from '@/lib/siteDataContext';
import FurnitureProductCard from './FurnitureProductCard';

const percent = (value: unknown) => Math.max(4, Math.min(96, Number.isFinite(Number(value)) ? Number(value) : 50));

/** Hotspots reference the shared catalog by stable ID; no copied prices or inventory state. */
export default function ShopTheLook() {
  const siteData = useSiteData();
  const look = contentObject(contentObject(contentObject(siteData.content).home).look);
  const hotspots = contentList(look.hotspots).map(contentObject);
  const products = useProducts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIndex = Math.max(0, hotspots.findIndex(item => contentText(item.id) === selectedId));
  const selected = hotspots[selectedIndex];
  const productIndex = selected ? products.findIndex(product => String(product.id) === contentText(selected.productId)) : -1;
  const product = products[productIndex];
  const root = useRef<HTMLDivElement>(null);
  const previewId = useId();
  const text = (key: string) => contentText(look[key]);

  useEffect(() => {
    const revealField = (event: MessageEvent) => {
      if (event.source !== window.parent || !event.data || ![PREVIEW_FOCUS_MESSAGE, DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE].includes(event.data.type)) return;
      const match = typeof event.data.fieldPath === 'string' && /^home\.look\.hotspots\[(\d+)\]/.exec(event.data.fieldPath);
      const item = match && hotspots[Number(match[1])];
      if (item) setSelectedId(contentText(item.id));
    };
    window.addEventListener('message', revealField);
    return () => window.removeEventListener('message', revealField);
  }, [hotspots]);

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
    if (!direction || !hotspots.length) return;
    event.preventDefault();
    const next = (index + direction + hotspots.length) % hotspots.length;
    setSelectedId(contentText(hotspots[next].id));
    root.current?.querySelectorAll<HTMLButtonElement>('.lumi-hotspot-button')[next]?.focus();
  };

  return <EditableSection name="shop-the-look" padding="none" className="lumi-section lumi-look">
    <div className="lumi-section-top">
      <div><EditableText as="p" fieldPath="home.look.eyebrow" defaultValue={text('eyebrow')} className="lumi-eyebrow" /><EditableText as="h2" fieldPath="home.look.title" defaultValue={text('title')} className="lumi-heading" /></div>
      <EditableText as="p" fieldPath="home.look.summary" defaultValue={text('summary')} className="lumi-section-description" />
    </div>
    <div className="lumi-look-grid" ref={root}>
      <figure className="lumi-look-scene">
        <div className="lumi-look-image">
          <EditableImage id="home.look.imageUrl" src={text('imageUrl')} alt={text('imageAlt')} loading="lazy" />
          <div className="lumi-hotspots" data-preview-list-path="home.look.hotspots">
            {hotspots.map((item, index) => <EditableBox key={contentText(item.id) || index} data-preview-item-path={`home.look.hotspots[${index}]`} className={`lumi-hotspot${selectedIndex === index ? ' is-selected' : ''}${percent(item.x) > 68 ? ' is-right' : percent(item.x) < 30 ? ' is-left' : ''}`} style={{ left:`${percent(item.x)}%`, top:`${percent(item.y)}%` }}>
              <button type="button" className="lumi-hotspot-button" data-preview-field-path={`home.look.hotspots[${index}].label`} aria-label={contentText(item.label) || `Furniture ${index + 1}`} aria-pressed={selectedIndex === index} aria-controls={previewId} onClick={() => setSelectedId(contentText(item.id))} onFocus={() => setSelectedId(contentText(item.id))} onKeyDown={event => moveFocus(event,index)}>
                <span aria-hidden="true" data-preview-static="hotspot-index">{String(index + 1).padStart(2,'0')}</span>
                <EditableText as="span" data-preview-field-path={`home.look.hotspots[${index}].label`} defaultValue={contentText(item.label)} className="lumi-hotspot-label" placeholder="Explore this piece" />
              </button>
            </EditableBox>)}
          </div>
        </div>
        <figcaption><EditableText as="span" fieldPath="home.look.caption" defaultValue={text('caption')} /><EditableText as="span" fieldPath="home.look.note" defaultValue={text('note')} /></figcaption>
      </figure>
      <div className="lumi-look-preview" id={previewId}>
        <EditableText as="p" fieldPath="home.look.previewLabel" defaultValue={text('previewLabel')} className="lumi-eyebrow" />
        <div className="lumi-look-product" data-preview-list-path="products">
          {product ? <FurnitureProductCard key={String(product.id)} product={product} index={productIndex} compact /> : <EditableText as="p" fieldPath="home.look.emptyMessage" defaultValue={text('emptyMessage')} />}
        </div>
        <span role="status" className="lumi-look-status" data-preview-static="hotspot-selection-announcement">{product ? contentText(selected?.label) : text('emptyMessage')}</span>
      </div>
    </div>
  </EditableSection>;
}
