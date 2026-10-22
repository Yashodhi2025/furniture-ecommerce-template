'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { EditableImage, EditableText, type ProductDetailItem } from '@deneb-ui/ui';
import { contentObject, contentText, useSiteData } from '@/lib/siteDataContext';
import { formatPrice, productHref } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';
import type { SavedProduct } from '@/lib/shoppingStorage';
import EnquiryWhatsApp from './EnquiryWhatsApp';
import './enquiry-drawer.css';

const numericPrice = (value: unknown) => {
  if (value === undefined || value === null || value === '') return NaN;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  return cleaned ? Number(cleaned) : NaN;
};
const priceLabel = (value: unknown) => Number.isFinite(numericPrice(value)) ? formatPrice(numericPrice(value)) : 'Price on enquiry';
const quantityOf = (item: SavedProduct) => Number.isSafeInteger(item.quantity) && Number(item.quantity) > 0 ? Number(item.quantity) : 1;

/** Presentation of the existing shared list; never owns or writes shopping state. */
export default function EnquiryDrawer({ open, onClose, product, productIndex, quantity, items, listError, editing }: {
  open: boolean; onClose: () => void; product: ProductDetailItem; productIndex: number;
  quantity: number; items: SavedProduct[]; listError: boolean; editing: boolean;
}) {
  const siteData = useSiteData();
  const settings = contentObject(contentObject(siteData.content).productDetail);
  const enquiry = contentObject(contentObject(siteData.content).enquiry);
  const configured = /^[1-9]\d{6,14}$/.test(contentText(enquiry.whatsappNumber).replace(/\D/g, ''));
  const copy = (key: string, fallback: string) => <EditableText as="span" fieldPath={`productDetail.${key}`} defaultValue={key in settings ? contentText(settings[key]) : fallback} />;
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [closing, setClosing] = useState(false);
  const titleId = useId();
  const count = items.reduce((sum, item) => sum + quantityOf(item), 0);
  const total = items.reduce((sum, item) => sum + Math.round(numericPrice(item.price) * 100) * quantityOf(item), 0) / 100;
  const close = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!open) { setClosing(false); return; }
    const element = dialog.current;
    if (!element) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    const padding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    element.showModal();
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = padding;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!closing || !open) return;
    const timer = window.setTimeout(onClose, editing || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280);
    return () => window.clearTimeout(timer);
  }, [closing, open, onClose, editing]);

  return <dialog ref={dialog} className={`lumi-enquiry-drawer${closing ? ' is-closing' : ''}`} aria-labelledby={titleId} data-drawer-editing={editing} onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  }}>
    {/* Page layout markers apply display:flex; keep them off the native dialog. */}
    <div className="lumi-drawer-content" data-preview-page-key="product_detail">
    <header className="lumi-drawer-header"><span className="lumi-drawer-eyebrow">{copy('drawerEyebrow', 'YOUR FURNITURE EDIT')}</span><button ref={closeButton} type="button" className="lumi-drawer-close" aria-label="Close enquiry drawer" onClick={close}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button></header>
    <div className="lumi-drawer-scroll">
      <section className="lumi-drawer-success"><span className="lumi-drawer-check" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m5 12 4 4L19 6" /></svg></span><h2 id={titleId}>{copy('drawerHeading', 'Added to your enquiry list')}</h2><p>{copy('drawerIntro', 'A little closer to your perfect space.')}</p></section>
      <article className="lumi-drawer-added">
        <div className="lumi-drawer-image"><EditableImage src={withBasePath(product.imageUrl || '/placeholder.svg')} alt={product.name || 'Added furniture'} data-preview-field-path={`products[${productIndex}].imageUrl`} fit="contain" /></div>
        <div><span className="lumi-drawer-eyebrow">{copy('drawerJustAdded', 'JUST ADDED')}</span><h3><EditableText as="span" data-preview-field-path={`products[${productIndex}].name`} defaultValue={product.name} /></h3><p>{copy('drawerQuantityLabel', 'Quantity added')} <strong>{quantity}</strong></p><p><EditableText as="span" data-preview-field-path={`products[${productIndex}].price`} defaultValue={priceLabel(product.price)} /> <small>{copy('drawerEachLabel', 'each')}</small></p></div>
      </article>
      <section className="lumi-drawer-selection" aria-label="Selected furniture"><div className="lumi-drawer-selection-heading"><h3>{copy('drawerSelectionHeading', 'In your enquiry list')}</h3><span>{count} {copy('drawerPiecesLabel', 'pieces')}</span></div>
        {listError ? <p role="alert">Your saved list could not be loaded. Please allow browser storage and try again.</p> : <ul>{items.map(item => <li key={item.id}><a className="lumi-drawer-mini-image" href={withBasePath(productHref(item.id))} tabIndex={-1} aria-hidden="true"><img src={withBasePath(item.imageUrl || '/placeholder.svg')} alt="" loading="lazy" /></a><div><a href={withBasePath(productHref(item.id))}>{item.name || 'Product'}</a><span>{copy('drawerQuantityShort', 'Qty')} {quantityOf(item)} <span aria-hidden="true">·</span> {priceLabel(item.price)} {copy('drawerEachLabel', 'each')}</span></div></li>)}</ul>}
      </section>
    </div>
    <footer className="lumi-drawer-footer"><div className="lumi-drawer-total"><span>{copy('drawerTotalLabel', 'Estimated total')}</span><strong>{listError || !Number.isFinite(total) ? copy('drawerConfirmPrice', 'Price on enquiry') : formatPrice(total)}</strong></div><p>{copy('drawerTotalNote', 'Availability and delivery confirmed with your quotation.')}</p><a className="lumi-drawer-primary" href={withBasePath('/cart/')}>{copy('drawerViewLabel', 'View Enquiry List')}<span aria-hidden="true">↗</span></a>{configured && <EnquiryWhatsApp items={items} disabled={listError || !items.length} />}<button type="button" className="lumi-drawer-continue" onClick={close}>{copy('drawerContinueLabel', 'Continue Shopping')} <span aria-hidden="true">↗</span></button></footer>
    </div>
  </dialog>;
}
