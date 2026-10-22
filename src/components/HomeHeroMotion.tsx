'use client';

import { useLayoutEffect, useRef } from 'react';
import { withBasePath } from '@/lib/utils';
import './HomeHeroMotion.css';

// Runs as the server HTML is parsed, before the hero can paint. Without JS the
// marker is absent, so the normal, fully visible server-rendered hero is retained.
const startup = `(() => {
  const root = document.documentElement;
  const skip = () => { root.dataset.lumiHeroEntrance = 'skipped'; };
  root.dataset.lumiHeroEntrance = !matchMedia('(prefers-reduced-motion: reduce)').matches &&
    'animate' in Element.prototype && 'IntersectionObserver' in window && 'ResizeObserver' in window ? 'pending' : 'skipped';
  const editing = event => {
    if (event.source !== window.parent || !['FIVORA_PREVIEW_EDIT_MODE', 'MARKETPLACE_PREVIEW_EDIT_MODE'].includes(event.data?.type)) return;
    root.dataset.lumiHeroEditing = String(Boolean(event.data.editMode));
    if (event.data.editMode) skip();
  };
  const failed = event => { if (event.target?.tagName === 'SCRIPT') skip(); };
  window.addEventListener('message', editing);
  window.addEventListener('error', failed, true);
  window.addEventListener('lumi-hero-ready', () => {
    window.removeEventListener('message', editing);
    window.removeEventListener('error', failed, true);
  }, { once: true });
})();`;

export function HomeHeroStartup() {
  return <script data-preview-static="hero-motion-startup" dangerouslySetInnerHTML={{ __html: startup }} />;
}

/** One hero controller owns entrances and composited image movement. */
export default function HomeHeroMotion({ title }: { title: string }) {
  const cue = useRef<HTMLAnchorElement>(null);
  const editing = useRef(false);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const hero = cue.current?.closest<HTMLElement>('.lumi-hero');
    const heading = hero?.querySelector<HTMLElement>('[data-preview-field-path="home.heroTitle"]');
    const reveal = hero?.querySelector<HTMLElement>('.lumi-hero-heading-reveal');
    const media = hero?.querySelector<HTMLElement>('.lumi-hero-media');
    const image = media?.querySelector<HTMLImageElement>('.lumi-hero-image');
    if (!hero || !heading || !reveal || !media || !image || !('animate' in Element.prototype) || !('IntersectionObserver' in window) || !('ResizeObserver' in window)) {
      root.dataset.lumiHeroEntrance = 'skipped';
      return;
    }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1025px) and (hover: hover) and (pointer: fine)');
    editing.current = root.dataset.lumiHeroEditing === 'true' || hero.closest<HTMLElement>('.lumi-home')?.dataset.homeEditing === 'true';
    const animations = new Set<Animation>();
    const titleAnimations = new Set<Animation>();
    const originalOpacity = heading.style.opacity;
    const entrance = root.dataset.lumiHeroEntrance === 'pending';
    let mounted = true, fontsReady = document.fonts.status === 'loaded', copyPlayed = !entrance, imagePlayed = !entrance;
    const visible = (element: HTMLElement) => { const rect = element.getBoundingClientRect(); return rect.bottom > 0 && rect.top < window.innerHeight; };
    let heroVisible = visible(hero), mediaVisible = visible(media), dirty = true, frame = 0;
    let bounds = media.getBoundingClientRect();
    let pointerX = 0, pointerY = 0, currentX = 0, currentY = 0;
    let headingWidth = heading.offsetWidth;
    const allowed = () => !preference.matches && !editing.current;
    const animate = (element: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      const animation = element.animate(keyframes, { easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards', ...options });
      animations.add(animation);
      animation.onfinish = animation.oncancel = () => animations.delete(animation);
      return animation;
    };
    const clearTitle = () => {
      titleAnimations.forEach(animation => animation.cancel());
      titleAnimations.clear();
      heading.style.opacity = originalOpacity;
      reveal.replaceChildren();
    };
    const revealTitle = () => {
      const range = document.createRange();
      range.selectNodeContents(heading);
      const tops = [...new Set([...range.getClientRects()].filter(rect => rect.width).map(rect => Math.round(rect.top)))];
      if (!tops.length) return 0;
      const style = getComputedStyle(heading);
      const lineHeight = parseFloat(style.lineHeight);
      if (!Number.isFinite(lineHeight)) return 0;
      const { width, height } = heading.getBoundingClientRect();
      headingWidth = heading.offsetWidth;
      const finished: Promise<Animation>[] = [];
      tops.forEach((_, index) => {
        const mask = document.createElement('span');
        mask.className = 'lumi-hero-line-mask';
        Object.assign(mask.style, { top: `${index * lineHeight}px`, width: `${width}px`, height: `${lineHeight}px` });
        const copy = document.createElement('span');
        copy.className = heading.className;
        copy.style.cssText = heading.style.cssText;
        Object.assign(copy.style, { display: 'block', position: 'absolute', top: `${-index * lineHeight}px`, left: '0', width: `${width}px`, height: `${height}px`, maxWidth: 'none', margin: '0', textWrap: style.textWrap, clipPath: `inset(${index * lineHeight}px 0 ${Math.max(0, height - (index + 1) * lineHeight)}px 0)` });
        copy.textContent = heading.textContent;
        mask.append(copy);
        reveal.append(mask);
        const animation = animate(copy, [{ opacity: 0, translate: `0 ${lineHeight}px` }, { opacity: 1, translate: '0 0' }], { duration: 950, delay: 100 + index * 150 });
        titleAnimations.add(animation);
        finished.push(animation.finished);
      });
      heading.style.opacity = '0';
      Promise.all(finished).then(() => { if (mounted) clearTitle(); }).catch(() => {});
      return tops.length;
    };
    const playCopy = () => {
      if (copyPlayed || !fontsReady || !heroVisible || !allowed()) return;
      copyPlayed = true;
      const lines = revealTitle();
      const targets: [string, number][] = [
        ['.lumi-hero-copy > .lumi-eyebrow', 0],
        ['.lumi-hero-description', 220 + lines * 80],
        ['.lumi-actions', 330 + lines * 80],
        ['.lumi-hero-footnote', 440 + lines * 80],
        ['.lumi-hero-scroll', 520 + lines * 80],
      ];
      targets.forEach(([selector, delay]) => {
        const element = hero.querySelector(selector);
        if (element) animate(element, [{ opacity: 0, translate: '0 20px' }, { opacity: 1, translate: '0 0' }], { duration: 850, delay });
      });
      // All backwards-filled animations now own the same first frame as the CSS.
      root.dataset.lumiHeroEntrance = 'running';
    };
    const playImage = () => {
      if (imagePlayed || !mediaVisible || !allowed()) return;
      imagePlayed = true;
      animate(image, [{ scale: '1.14' }, { scale: '1.06' }], { duration: 1800 });
      delete hero.dataset.heroImageIntro;
    };
    const tick = () => {
      frame = 0;
      if (!allowed() || !mediaVisible) return;
      if (dirty) { bounds = media.getBoundingClientRect(); dirty = false; }
      const limit = bounds.height * .018;
      const parallax = Math.max(-limit, Math.min(limit, (window.innerHeight * .25 - bounds.top) * .04));
      const targetX = desktop.matches ? pointerX : 0;
      const targetY = parallax + (desktop.matches ? pointerY : 0);
      currentX += (targetX - currentX) * .14;
      currentY += (targetY - currentY) * .14;
      image.style.setProperty('--hero-pan-x', `${currentX.toFixed(2)}px`);
      image.style.setProperty('--hero-pan-y', `${currentY.toFixed(2)}px`);
      if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > .03) frame = requestAnimationFrame(tick);
    };
    const schedule = () => { if (!frame && allowed() && mediaVisible) frame = requestAnimationFrame(tick); };
    const scrolled = () => { dirty = true; schedule(); };
    const pointer = (event: PointerEvent) => {
      if (!allowed() || !desktop.matches || event.pointerType !== 'mouse') return;
      pointerX = ((event.clientX - bounds.left) / bounds.width - .5) * 12;
      pointerY = ((event.clientY - bounds.top) / bounds.height - .5) * 8;
      schedule();
    };
    const resetPointer = () => { pointerX = pointerY = 0; schedule(); };
    const syncMotion = () => {
      hero.dataset.heroMotion = allowed() ? 'enabled' : 'disabled';
      if (!allowed()) {
        root.dataset.lumiHeroEntrance = 'skipped';
        copyPlayed = imagePlayed = true;
        delete hero.dataset.heroImageIntro;
        clearTitle();
        animations.forEach(animation => animation.cancel());
        animations.clear();
        cancelAnimationFrame(frame); frame = 0;
        currentX = currentY = pointerX = pointerY = 0;
        image.style.removeProperty('--hero-pan-x'); image.style.removeProperty('--hero-pan-y');
      } else { dirty = true; schedule(); }
    };
    const editMode = (event: MessageEvent) => {
      if (event.source !== window.parent || !['FIVORA_PREVIEW_EDIT_MODE', 'MARKETPLACE_PREVIEW_EDIT_MODE'].includes(event.data?.type)) return;
      editing.current = Boolean(event.data.editMode);
      root.dataset.lumiHeroEditing = String(editing.current);
      copyPlayed = imagePlayed = true;
      syncMotion();
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.target === hero) {
          heroVisible = entry.isIntersecting;
          hero.dataset.heroInView = String(heroVisible);
          playCopy();
        } else {
          mediaVisible = entry.isIntersecting;
          if (mediaVisible && allowed()) {
            playImage();
            dirty = true; schedule();
          } else { cancelAnimationFrame(frame); frame = 0; }
        }
      });
    }, { threshold: 0 });
    const resize = new ResizeObserver(() => {
      if (heading.offsetWidth !== headingWidth) { clearTitle(); headingWidth = heading.offsetWidth; }
      scrolled();
    });
    if (entrance) hero.dataset.heroImageIntro = 'pending';
    syncMotion();
    hero.dataset.heroInView = String(heroVisible);
    playImage(); playCopy();
    observer.observe(hero); observer.observe(media); resize.observe(heading); resize.observe(media);
    document.fonts.ready.then(() => { if (mounted) { fontsReady = true; playCopy(); } });
    window.addEventListener('scroll', scrolled, { passive: true });
    window.addEventListener('resize', scrolled, { passive: true });
    window.addEventListener('message', editMode);
    window.dispatchEvent(new Event('lumi-hero-ready'));
    media.addEventListener('pointermove', pointer, { passive: true });
    media.addEventListener('pointerleave', resetPointer);
    media.addEventListener('pointercancel', resetPointer);
    preference.addEventListener('change', syncMotion);
    desktop.addEventListener('change', resetPointer);
    return () => {
      mounted = false; clearTitle(); observer.disconnect(); resize.disconnect();
      animations.forEach(animation => animation.cancel()); cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scrolled); window.removeEventListener('resize', scrolled); window.removeEventListener('message', editMode);
      media.removeEventListener('pointermove', pointer); media.removeEventListener('pointerleave', resetPointer); media.removeEventListener('pointercancel', resetPointer);
      preference.removeEventListener('change', syncMotion); desktop.removeEventListener('change', resetPointer);
      image.style.removeProperty('--hero-pan-x'); image.style.removeProperty('--hero-pan-y');
      delete hero.dataset.heroMotion; delete hero.dataset.heroInView; delete hero.dataset.heroImageIntro;
    };
  }, [title]);

  return <a ref={cue} className="lumi-hero-scroll" href={withBasePath('/#categories')} data-preview-static="hero-scroll-indicator" onClick={event => {
    const target = document.getElementById('categories');
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: editing.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }}><span className="lumi-hero-scroll-cue" aria-hidden="true" /><span>Scroll to explore</span></a>;
}
