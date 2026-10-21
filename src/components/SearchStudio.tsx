'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { EditableDialog, EditableIcon, EditableImage, EditableText } from '@deneb-ui/ui';
import { contentList, contentObject, contentText, useProducts, useSiteData } from '@/lib/siteDataContext';
import { formatPrice, productHref } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';
import './SearchStudio.css';

export default function SearchStudio({ open, onClose, id }: { open: boolean; onClose: () => void; id: string }) {
  const siteData = useSiteData();
  const navigation = contentObject(contentObject(siteData.content).navigation);
  const text = (key: string, fallback = '') => key in navigation ? contentText(navigation[key]) : fallback;
  const copy = (key: string, fallback: string, as: 'span' | 'p' | 'h3' = 'span') => <EditableText as={as} fieldPath={`navigation.${key}`} defaultValue={text(key, fallback)} />;
  const products = useProducts();
  const catalog = products.map((product, index) => ({ product, index })).filter(({ product }) => product.id != null && String(product.id).trim());
  const rooms = contentList(navigation.categories).map((value, index) => ({ room: contentObject(value), index })).filter(({ room }) => contentText(room.id) !== 'sale');
  const [query, setQuery] = useState('');
  const [closing, setClosing] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputId = useId();
  const resultsId = useId();
  const roomsId = useId();
  const term = query.trim().toLowerCase();
  const matches = catalog.filter(({ product }) => `${product.name} ${product.category ?? ''}`.toLowerCase().includes(term));
  const suggested = catalog.filter(({ product }) => product.imageUrl && !String(product.imageUrl).includes('placeholder') && product.isAvailable !== false).slice(0, 3);
  const displayed = term ? matches : suggested;

  const close = () => {
    if (closeTimer.current !== null) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      onClose();
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280);
  };

  useLayoutEffect(() => {
    if (!open) {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
      closeTimer.current = null;
      setClosing(false);
      setQuery('');
      return;
    }
    const frame = requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
    // Deneb owns the modal and scroll lock; keep the surrounding page out of
    // keyboard navigation without moving editable content outside its theme.
    const portal = body.current?.closest('[role="dialog"]');
    const siblings = [...(portal?.parentElement?.children ?? [])].filter((element): element is HTMLElement => element instanceof HTMLElement && element !== portal);
    const previous = siblings.map(element => ({ element, inert: element.inert }));
    siblings.forEach(element => { element.inert = true; });
    return () => {
      cancelAnimationFrame(frame);
      previous.forEach(({ element, inert }) => { element.inert = inert; });
    };
  }, [open]);
  useEffect(() => () => { if (closeTimer.current !== null) clearTimeout(closeTimer.current); }, []);

  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const links = [...(body.current?.querySelectorAll<HTMLAnchorElement>('.lumi-studio-product') ?? [])];
    if (event.key === 'Enter' && target === input.current && links[0]) {
      event.preventDefault(); links[0].click();
    }
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && (target === input.current || target.matches('.lumi-studio-product'))) {
      event.preventDefault();
      const position = links.indexOf(target as HTMLAnchorElement);
      if (target === input.current) (event.key === 'ArrowDown' ? links[0] : links.at(-1))?.focus();
      else if (event.key === 'ArrowUp' && position === 0) input.current?.focus();
      else (links[position + (event.key === 'ArrowDown' ? 1 : -1)] ?? input.current)?.focus();
    }
    if (event.key !== 'Tab') return;
    const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]')].filter(element => element.getClientRects().length > 0 && !element.closest('[inert]'));
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  return <EditableDialog id={id} open={open} onClose={close} title={text('searchTitle', 'Search Studio')} titleFieldPath="navigation.searchTitle" aria-label={text('searchTitle', 'Search Studio')} className={`lumi-search-studio${closing ? ' is-closing' : ''}`} onKeyDown={keyboard}>
    <div ref={body} className="lumi-studio-body">
      <div className="lumi-studio-input-panel">
        {copy('searchDescription', 'Find the pieces that make your space feel like you.', 'p')}
        <label className="lumi-studio-label" htmlFor={inputId}>{copy('searchLabel', 'Search furniture')}</label>
        <div className="lumi-studio-input-wrap">
          <EditableIcon name="search" size={23} strokeWidth={1.3} aria-hidden="true" />
          <input ref={input} id={inputId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={text('searchPlaceholder', 'Search sofas, chairs, tables...')} data-preview-field-path="navigation.searchPlaceholder" autoComplete="off" enterKeyHint="search" aria-controls={resultsId} />
          {query && <button type="button" onClick={() => { setQuery(''); input.current?.focus(); }} aria-label="Clear search" data-preview-static="clear-search"><span aria-hidden="true">×</span></button>}
        </div>
      </div>

      {!term && <section className="lumi-studio-rooms" aria-labelledby={roomsId}>
        <h3 id={roomsId}>{copy('searchRoomsTitle', 'Explore by Room')}</h3>
        <div className="lumi-studio-room-grid" data-preview-list-path="navigation.categories">
          {rooms.map(({ room, index }) => {
            const photos = contentList(room.items);
            const photo = contentObject(photos[0]);
            const path = `navigation.categories[${index}]`;
            return <Link key={contentText(room.id) || index} href={contentText(room.browseUrl) || '/#shop'} onClick={close} className="lumi-studio-room" data-preview-item-path={path} data-preview-field-path={`${path}.browseUrl`}>
              {photos.length ? <EditableImage src={contentText(photo.imageUrl) || '/placeholder.svg'} alt="" data-preview-field-path={`${path}.items[0].imageUrl`} loading="lazy" /> : <img src={withBasePath('/placeholder.svg')} alt="" data-preview-static="empty-room-image" />}
              <EditableText as="span" fieldPath={`${path}.label`} defaultValue={contentText(room.label)} />
              <span aria-hidden="true">↗</span>
            </Link>;
          })}
        </div>
      </section>}

      <section id={resultsId} className="lumi-studio-results" aria-labelledby={`${resultsId}-heading`}>
        <div className="lumi-studio-results-heading">
          <h3 id={`${resultsId}-heading`}>{term ? copy('searchResultsTitle', 'Matching pieces') : copy('searchSuggestionsTitle', 'A few favourites')}</h3>
          <span role="status" aria-live="polite" aria-atomic="true" data-preview-static="search-result-count">{term ? `${matches.length} ${matches.length === 1 ? 'piece found' : 'pieces found'}` : ''}</span>
        </div>
        {displayed.length ? <div className="lumi-studio-products" data-preview-list-path="products">
          {displayed.map(({ product, index }) => <Link href={productHref(product.id)} key={String(product.id)} onClick={close} className="lumi-studio-product" data-preview-item-path={`products[${index}]`}>
            <div className="lumi-studio-product-image"><EditableImage src={String(product.imageUrl || '/placeholder.svg')} alt="" data-preview-field-path={`products[${index}].imageUrl`} loading="lazy" /></div>
            <div className="lumi-studio-product-copy"><EditableText as="span" className="lumi-studio-product-name" fieldPath={`products[${index}].name`} defaultValue={product.name} /><EditableText as="span" className="lumi-studio-product-category" fieldPath={`products[${index}].category`} defaultValue={product.category} /></div>
            <EditableText as="span" className="lumi-studio-product-price" fieldPath={`products[${index}].price`} defaultValue={formatPrice(product.price)} />
            <span className="lumi-studio-product-arrow" aria-hidden="true">↗</span>
          </Link>)}
        </div> : <div className="lumi-studio-empty">
          <span className="lumi-studio-empty-icon"><EditableIcon name="search" size={30} strokeWidth={1.2} aria-hidden="true" /></span>
          {copy('searchEmptyTitle', 'A little more room to explore.', 'h3')}
          {term && <p className="lumi-studio-query" data-preview-static="search-query">“{query.trim()}”</p>}
          {copy('searchEmpty', 'No matching pieces. Try another search.', 'p')}
          {query && <button type="button" onClick={() => { setQuery(''); input.current?.focus(); }}>{copy('searchResetLabel', 'Explore the collection')}<span aria-hidden="true">↗</span></button>}
        </div>}
      </section>
      <p className="lumi-studio-keyboard-note" data-preview-static="search-keyboard-help"><span><kbd>↑</kbd><kbd>↓</kbd> to explore</span><span><kbd>Enter</kbd> to view</span><span><kbd>Esc</kbd> to close</span></p>
    </div>
  </EditableDialog>;
}
