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
export default function HomeHeroMotion({ title, brandName, imageSrc }: { title: string; brandName: string; imageSrc: string }) {
  const cue = useRef<HTMLAnchorElement>(null);
  const editing = useRef(false);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const hero = cue.current?.closest<HTMLElement>('.lumi-hero');
    const heading = hero?.querySelector<HTMLElement>('[data-preview-field-path="home.heroTitle"]');
    const reveal = hero?.querySelector<HTMLElement>('.lumi-hero-heading-reveal');
    const media = hero?.querySelector<HTMLElement>('.lumi-hero-media');
    const image = media?.querySelector<HTMLImageElement>('.lumi-hero-image');
    const brand = media?.querySelector<HTMLElement>('.lumi-hero-brand-text');
    const brandRule = media?.querySelector<HTMLElement>('.lumi-hero-brand-rule');
    const light = media?.querySelector<HTMLElement>('.lumi-hero-film-light');
    if (!hero || !heading || !reveal || !media || !image || !('animate' in Element.prototype) || !('IntersectionObserver' in window) || !('ResizeObserver' in window)) {
      root.dataset.lumiHeroEntrance = 'skipped';
      return;
    }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compact = window.matchMedia('(max-width: 767px)');
    editing.current = root.dataset.lumiHeroEditing === 'true' || hero.closest<HTMLElement>('.lumi-home')?.dataset.homeEditing === 'true';
    const animations = new Set<Animation>();
    const titleAnimations = new Set<Animation>();
    const originalOpacity = heading.style.opacity;
    const entrance = ['pending', 'running'].includes(root.dataset.lumiHeroEntrance || '');
    let mounted = true, fontsReady = document.fonts.status === 'loaded', imageReady = image.complete && image.naturalWidth > 0, copyPlayed = !entrance, imagePlayed = !entrance;
    const visible = (element: HTMLElement) => { const rect = element.getBoundingClientRect(); return rect.bottom > 0 && rect.top < window.innerHeight; };
    let heroVisible = visible(hero), mediaVisible = visible(media);
    let headingWidth = heading.offsetWidth;
    let mediaWidth = media.offsetWidth, mediaHeight = media.offsetHeight;
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
        ['.lumi-hero-description', 420 + lines * 90],
        ['.lumi-actions', 650 + lines * 90],
        ['.lumi-hero-footnote', 800 + lines * 90],
        ['.lumi-hero-scroll', 900 + lines * 90],
      ];
      targets.forEach(([selector, delay]) => {
        const element = hero.querySelector(selector);
        if (element) animate(element, [{ opacity: 0, translate: '0 20px' }, { opacity: 1, translate: '0 0' }], { duration: 850, delay });
      });
      // All backwards-filled animations now own the same first frame as the CSS.
      root.dataset.lumiHeroEntrance = 'running';
    };
    const playImage = () => {
      if (imagePlayed || !mediaVisible || !fontsReady || !imageReady || !allowed()) return;
      imagePlayed = true;
      const mobile = compact.matches;
      // Every camera position remains inside the overscan of this single flat photo.
      const camera = animate(image, mobile ? [
        { scale: '1.14', translate: '-3% 1.5%', offset: 0 },
        { scale: '1.19', translate: '1.5% -2%', offset: .42 },
        { scale: '1.10', translate: '-.5% .5%', offset: .8 },
        { scale: '1.04', translate: '0 0', offset: 1 },
      ] : [
        { scale: '1.18', translate: '-4.5% 2%', offset: 0 },
        { scale: '1.24', translate: '2.2% -2.8%', offset: .42 },
        { scale: '1.14', translate: '-.9% .6%', offset: .8 },
        { scale: '1.08', translate: '0 0', offset: 1 },
      ], { duration: mobile ? 3800 : 4600, easing: 'cubic-bezier(.45,0,.2,1)' });
      if (brand) animate(brand, [
        { clipPath: 'inset(0 100% 0 0)', opacity: 0, translate: '0 12px' },
        { clipPath: 'inset(0 0% 0 0)', opacity: 1, translate: '0 0' },
      ], { duration: 1500, delay: 300, easing: 'cubic-bezier(.22,1,.36,1)' });
      if (brandRule) animate(brandRule, [{ scale: '0 1' }, { scale: '1 1' }], { duration: 1400, delay: 500 });
      if (light) animate(light, [
        { opacity: 0, translate: '-35% 0' },
        { opacity: .22, translate: '0 0', offset: .45 },
        { opacity: 0, translate: '35% 0' },
      ], { duration: mobile ? 3000 : 3800 });
      delete hero.dataset.heroImageIntro;
      camera.finished.then(() => { if (mounted) root.dataset.lumiHeroEntrance = 'complete'; }).catch(() => {});
    };
    const syncMotion = () => {
      hero.dataset.heroMotion = allowed() ? 'enabled' : 'disabled';
      if (!allowed()) {
        root.dataset.lumiHeroEntrance = 'skipped';
        copyPlayed = imagePlayed = true;
        delete hero.dataset.heroImageIntro;
        clearTitle();
        animations.forEach(animation => animation.cancel());
        animations.clear();
      }
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
          if (!heroVisible && allowed()) {
            // Re-arm only after leaving the whole hero; never loop in place.
            clearTitle();
            animations.forEach(animation => animation.cancel());
            animations.clear();
            copyPlayed = imagePlayed = false;
            delete hero.dataset.heroImageIntro;
            root.dataset.lumiHeroEntrance = 'complete';
            return;
          }
          playCopy();
          if (heroVisible) playImage();
        } else {
          mediaVisible = entry.isIntersecting;
          if (mediaVisible && allowed()) {
            playImage();
          }
        }
      });
    }, { threshold: 0 });
    const resize = new ResizeObserver(() => {
      if (heading.offsetWidth !== headingWidth) { clearTitle(); headingWidth = heading.offsetWidth; }
      if (media.offsetWidth !== mediaWidth || media.offsetHeight !== mediaHeight) {
        mediaWidth = media.offsetWidth; mediaHeight = media.offsetHeight;
        if (imagePlayed) { animations.forEach(animation => animation.cancel()); clearTitle(); }
      }
    });
    if (entrance) hero.dataset.heroImageIntro = 'pending';
    syncMotion();
    hero.dataset.heroInView = String(heroVisible);
    playImage(); playCopy();
    observer.observe(hero); observer.observe(media); resize.observe(heading); resize.observe(media);
    document.fonts.ready.then(() => { if (mounted) { fontsReady = true; playCopy(); playImage(); } });
    const loaded = () => { if (mounted) { imageReady = true; playImage(); } };
    const failedImage = () => {
      if (!mounted) return;
      imagePlayed = true;
      delete hero.dataset.heroImageIntro;
    };
    if (imageReady) playImage();
    else if (typeof image.decode === 'function') image.decode().then(loaded).catch(() => { if (image.complete) failedImage(); });
    image.addEventListener('load', loaded);
    image.addEventListener('error', failedImage);
    window.addEventListener('message', editMode);
    window.dispatchEvent(new Event('lumi-hero-ready'));
    preference.addEventListener('change', syncMotion);

    return () => {
      mounted = false; clearTitle(); observer.disconnect(); resize.disconnect();
      animations.forEach(animation => animation.cancel());
      window.removeEventListener('message', editMode);
      image.removeEventListener('load', loaded); image.removeEventListener('error', failedImage);
      preference.removeEventListener('change', syncMotion);
      delete hero.dataset.heroMotion; delete hero.dataset.heroInView; delete hero.dataset.heroImageIntro;
    };
  }, [title, brandName, imageSrc]);

  return <a ref={cue} className="lumi-hero-scroll" href={withBasePath('/#categories')} data-preview-static="hero-scroll-indicator" onClick={event => {
    const target = document.getElementById('categories');
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: editing.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }}><span className="lumi-hero-scroll-cue" aria-hidden="true" /><span>Scroll to explore</span></a>;
}
