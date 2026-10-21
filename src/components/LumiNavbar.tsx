'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE, PREVIEW_FOCUS_MESSAGE, EditableCard, EditableIcon, EditableImage, EditableSection, EditableText } from '@deneb-ui/ui';
import { contentList, contentObject, contentText, useSiteData } from '@/lib/siteDataContext';
import { withBasePath } from '@/lib/utils';
import './LumiNavbar.css';
import RotatingAnnouncementBar from './RotatingAnnouncementBar';
import SearchStudio from './SearchStudio';

/** Presentation-only navigation. Collection destinations and imagery belong to site data. */
export default function LumiNavbar() {
  const pathname = usePathname();
  const siteData = useSiteData();
  const content = contentObject(siteData.content);
  const common = contentObject(content.common);
  const navigation = contentObject(content.navigation);
  const categories = contentList(navigation.categories).map(contentObject);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const [previews, setPreviews] = useState<Record<number, number>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const hamburger = useRef<HTMLButtonElement>(null);
  const utilityOpener = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLinkFocus = useRef<{ index: number; last: boolean } | null>(null);
  const menuId = useId();
  const text = (key: string, fallback = '') => contentText(navigation[key]) || fallback;
  const isCurrentPage = (url: string) => {
    if (url.includes('#')) return false;
    const normalize = (path: string) => withBasePath(path).replace(/\/+$/, '') || '/';
    return normalize(pathname) === normalize(url.split('?')[0]);
  };
  const closeMenus = () => { if (closeTimer.current) clearTimeout(closeTimer.current); pendingLinkFocus.current = null; setOpenCategory(null); setMobileOpen(false); };
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const selectCategory = (index: number) => { cancelClose(); setOpenCategory(index); };
  const isDesktopHover = () => window.matchMedia('(min-width: 960px) and (hover: hover)').matches;

  useEffect(() => {
    const request = pendingLinkFocus.current;
    if (openCategory === null || request?.index !== openCategory) return;
    // The panel must have committed its open/inert state before accepting focus.
    let focusFrame = 0;
    const frame = requestAnimationFrame(() => {
      focusFrame = requestAnimationFrame(() => {
        const links = header.current?.querySelector(`[data-category-index="${openCategory}"]`)?.closest('li')?.querySelectorAll<HTMLAnchorElement>('.lumi-mega-link');
        (request.last ? links?.[links.length - 1] : links?.[0])?.focus();
        pendingLinkFocus.current = null;
      });
    });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(focusFrame); };
  }, [openCategory]);

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) {
        setOpenCategory(null); setMobileOpen(false);
      }
    };
    const desktop = window.matchMedia('(min-width: 960px)');
    const resize = () => { setOpenCategory(null); setMobileOpen(false); };
    // Reveal the target before Deneb scrolls to a field selected in the Inspector.
    const focusField = (event: MessageEvent) => {
      if (event.source !== window.parent || !event.data || ![PREVIEW_FOCUS_MESSAGE, DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE].includes(event.data.type)) return;
      const fieldPath = typeof event.data.fieldPath === 'string' ? event.data.fieldPath : '';
      if (fieldPath.startsWith('navigation.search')) {
        setOpenCategory(null); setMobileOpen(false); setSearchOpen(true);
        utilityOpener.current = header.current?.querySelector<HTMLButtonElement>('[data-preview-static="search-dialog-trigger"]') ?? null;
        return;
      }
      const match = /^navigation\.categories\[(\d+)\](?:\.items\[(\d+)\])?/.exec(fieldPath)
        || /^navigation-dropdown-(\d+)\.section/.exec(fieldPath)
        || (fieldPath === 'navigation.dropdownBackgroundColor' ? ['shared-dropdown', '0'] : null);
      if (!match) return;
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setMobileOpen(!desktop.matches); setOpenCategory(Number(match[1]));
      if (match[2]) setPreviews(previous => ({ ...previous, [Number(match[1])]: Number(match[2]) }));
    };
    document.addEventListener('pointerdown', outside);
    desktop.addEventListener('change', resize);
    window.addEventListener('message', focusField);
    return () => {
      document.removeEventListener('pointerdown', outside);
      desktop.removeEventListener('change', resize);
      window.removeEventListener('message', focusField);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const closeSearchStudio = () => {
    setSearchOpen(false);
    requestAnimationFrame(() => utilityOpener.current?.focus());
  };
  const openSearchStudio = (opener: HTMLElement) => {
    closeMenus(); utilityOpener.current = opener; setSearchOpen(true);
  };

  const handleKeys = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (event.key === 'Escape') {
      event.preventDefault(); cancelClose();
      if (openCategory !== null) {
        setOpenCategory(null);
        header.current?.querySelector<HTMLElement>(`[data-category-index="${openCategory}"]`)?.focus();
      } else { setMobileOpen(false); hamburger.current?.focus(); }
    }
    if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && target.closest('[data-nav-trigger]')) {
      event.preventDefault();
      const triggers = [...(header.current?.querySelectorAll<HTMLElement>('[data-nav-trigger]') ?? [])];
      const index = triggers.indexOf(target.closest<HTMLElement>('[data-nav-trigger]')!);
      const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + triggers.length) % triggers.length;
      setOpenCategory(null); triggers[next]?.focus();
    }
  };

  return <>
    <header className="lumi-navbar" ref={header} onKeyDown={handleKeys} data-preview-field-path="navigation.dropdownBackgroundColor" style={{ '--lumi-dropdown-background': text('dropdownBackgroundColor', '#eee7dd') } as CSSProperties}>
      <div className="lumi-navbar-top">
        <button ref={hamburger} className="lumi-nav-icon lumi-hamburger" type="button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls={menuId} onClick={() => { cancelClose(); setMobileOpen(!mobileOpen); setOpenCategory(null); }} data-preview-static="navigation-disclosure">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{mobileOpen ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M3 6h18M3 12h18M3 18h18" />}</svg>
        </button>
        <a className="lumi-nav-brand" href={withBasePath(text('homeUrl', '/'))} data-preview-field-path="navigation.homeUrl" onClick={closeMenus} aria-label={contentText(common.websiteTitle)}>
          <EditableImage id="common.logoUrl" src={contentText(common.logoUrl)} alt="" />
          <EditableText as="span" fieldPath="common.websiteTitle" defaultValue={contentText(common.websiteTitle)} placeholder="LUMI LIVING" />
        </a>
        <RotatingAnnouncementBar />
        <div className="lumi-nav-utilities">
          <button className="lumi-nav-icon" type="button" aria-label={text('searchLabel', 'Search')} aria-haspopup="dialog" aria-expanded={searchOpen} aria-controls={`${menuId}-search-studio`} onClick={event => openSearchStudio(event.currentTarget)} data-preview-static="search-dialog-trigger"><EditableIcon name="search" size={21} strokeWidth={1.5} aria-hidden="true" /></button>
          <Link href="/wishlist/" className="lumi-nav-icon" aria-label={text('wishlistLabel', 'Wishlist')} aria-current={isCurrentPage('/wishlist/') ? 'page' : undefined} onClick={closeMenus} data-preview-static="wishlist-page-link"><EditableIcon name="heart" size={21} strokeWidth={1.5} aria-hidden="true" /></Link>
          <Link href="/cart/" className="lumi-nav-icon" aria-label={text('cartLabel', 'Cart')} aria-current={isCurrentPage('/cart/') ? 'page' : undefined} onClick={closeMenus} data-preview-static="cart-page-link"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7ZM9 8V6a3 3 0 0 1 6 0v2" /></svg></Link>
        </div>
      </div>
      <nav className={`lumi-navbar-menu${mobileOpen ? ' is-mobile-open' : ''}`} id={menuId}>
        <a className="lumi-nav-home" data-nav-trigger href={withBasePath(text('homeUrl', '/'))} aria-current={isCurrentPage(text('homeUrl', '/')) ? 'page' : undefined} data-preview-field-path="navigation.homeUrl" onClick={closeMenus}><EditableText as="span" fieldPath="navigation.homeLabel" defaultValue={text('homeLabel', 'Home')} /></a>
        <ul className="lumi-nav-categories" data-preview-list-path="navigation.categories">
          {categories.map((category, categoryIndex) => {
            const items = contentList(category.items).map(contentObject);
            const isOpen = openCategory === categoryIndex;
            const selected = Math.min(previews[categoryIndex] ?? 0, Math.max(0, items.length - 1));
            const panelId = `${menuId}-category-${categoryIndex}`;
            return <li className={`lumi-nav-category${isOpen ? ' is-open' : ''}`} key={contentText(category.id) || categoryIndex} data-preview-item-path={`navigation.categories[${categoryIndex}]`}
              onMouseEnter={() => { if (isDesktopHover()) selectCategory(categoryIndex); }}
              onMouseLeave={event => {
                if (!isDesktopHover()) return;
                // Keep the selected dropdown visible while adjusting its colour in Local Lab.
                if (event.currentTarget.querySelector('[data-fivora-local-selected-target], [data-marketplace-local-selected-target]')) return;
                cancelClose(); closeTimer.current = setTimeout(() => setOpenCategory(null), 160);
              }}
              onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpenCategory(current => current === categoryIndex ? null : current); }}>
              <Link href={contentText(category.browseUrl) || '/#shop'} aria-current={isCurrentPage(contentText(category.browseUrl) || '/#shop') ? 'page' : undefined} className={`lumi-nav-trigger${contentText(category.id) === 'sale' ? ' lumi-nav-sale' : ''}`} data-preview-field-path={`navigation.categories[${categoryIndex}].browseUrl`} data-nav-trigger data-category-index={categoryIndex} id={`${panelId}-trigger`} aria-expanded={isOpen} aria-controls={panelId}
                onClick={closeMenus}
                onKeyDown={event => {
                  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                  event.preventDefault();
                  const last = event.key === 'ArrowUp';
                  if (isOpen) {
                    const links = document.getElementById(panelId)?.querySelectorAll<HTMLAnchorElement>('.lumi-mega-link');
                    (last ? links?.[links.length - 1] : links?.[0])?.focus();
                  } else {
                    pendingLinkFocus.current = { index: categoryIndex, last };
                    selectCategory(categoryIndex);
                  }
                }}>
                <EditableText as="span" data-preview-field-path={`navigation.categories[${categoryIndex}].label`} defaultValue={contentText(category.label)} placeholder="Collection" />
                <svg className="lumi-nav-chevron" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
              </Link>
              <button type="button" className="lumi-category-toggle" aria-label={`Show ${contentText(category.label)} subcategories`} aria-expanded={isOpen} aria-controls={panelId} onClick={() => { cancelClose(); setOpenCategory(isOpen ? null : categoryIndex); }}><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg></button>
              <EditableSection as="div" name={`navigation-dropdown-${categoryIndex}`} padding="none" className="lumi-mega-panel" id={panelId} inert={!isOpen} aria-labelledby={`${panelId}-trigger`}>
                <div className="lumi-mega-surface" data-preview-field-path="navigation.dropdownBackgroundColor">
                <div className="lumi-mega-copy">
                  <EditableText as="p" className="lumi-mega-description" data-preview-field-path={`navigation.categories[${categoryIndex}].description`} defaultValue={contentText(category.description)} />
                  <ul className="lumi-mega-items" data-preview-list-path={`navigation.categories[${categoryIndex}].items`}>
                    {items.map((item, itemIndex) => <li className={selected === itemIndex ? 'is-current' : ''} key={contentText(item.id) || itemIndex} data-preview-item-path={`navigation.categories[${categoryIndex}].items[${itemIndex}]`}>
                      <a className="lumi-mega-link" href={withBasePath(contentText(item.url) || '/#shop')} data-preview-field-path={`navigation.categories[${categoryIndex}].items[${itemIndex}].url`} onPointerEnter={() => setPreviews(previous => ({ ...previous, [categoryIndex]: itemIndex }))} onFocus={() => setPreviews(previous => ({ ...previous, [categoryIndex]: itemIndex }))} onClick={closeMenus}>
                        <EditableText as="span" data-preview-field-path={`navigation.categories[${categoryIndex}].items[${itemIndex}].label`} defaultValue={contentText(item.label)} placeholder="Furniture" />
                        <span aria-hidden="true">&#8599;</span>
                      </a>
                      <button type="button" className="lumi-subcategory-preview" aria-label={`Preview ${contentText(item.label)}`} aria-pressed={selected === itemIndex} onClick={() => setPreviews(previous => ({ ...previous, [categoryIndex]: itemIndex }))} data-preview-static="subcategory-preview-control"><EditableIcon name="camera" size={17} strokeWidth={1.5} aria-hidden="true" /></button>
                    </li>)}
                  </ul>
                  <a className="lumi-mega-browse" href={withBasePath(contentText(category.browseUrl) || '/#shop')} data-preview-field-path={`navigation.categories[${categoryIndex}].browseUrl`} onClick={closeMenus}><EditableText as="span" data-preview-field-path={`navigation.categories[${categoryIndex}].browseLabel`} defaultValue={contentText(category.browseLabel)} placeholder="Explore the collection" /><span aria-hidden="true">&#8594;</span></a>
                </div>
                <div className="lumi-mega-imagery" data-preview-list-path={`navigation.categories[${categoryIndex}].items`}>
                  {items.map((item, itemIndex) => <EditableCard as="figure" itemPath={`navigation.categories[${categoryIndex}].items[${itemIndex}]`} item={{}} radius="lg" padding="none" className={`lumi-mega-figure${selected === itemIndex ? ' is-current' : ''}`} key={contentText(item.id) || itemIndex} data-preview-item-path={`navigation.categories[${categoryIndex}].items[${itemIndex}]`} inert={selected !== itemIndex}>
                    <EditableImage data-preview-field-path={`navigation.categories[${categoryIndex}].items[${itemIndex}].imageUrl`} src={contentText(item.imageUrl)} alt={contentText(item.label)} loading="eager" />
                    <figcaption><EditableText as="span" data-preview-field-path={`navigation.categories[${categoryIndex}].items[${itemIndex}].label`} defaultValue={contentText(item.label)} /></figcaption>
                  </EditableCard>)}
                </div>
                </div>
              </EditableSection>
            </li>;
          })}
        </ul>
      </nav>
    </header>
    <SearchStudio open={searchOpen} onClose={closeSearchStudio} id={`${menuId}-search-studio`} />
  </>;
}
