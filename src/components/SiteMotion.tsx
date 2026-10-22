'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const revealTargets = [
  '.lr-heading > .lr-breadcrumbs', '.lr-collection-toolbar', '.lr-product-card',
  '.lr-detail-info > *',
  '.lumi-section-top', '.lumi-category-card', '.lumi-product-card',
  '.lumi-story-image', '.lumi-story-copy > *', '.lumi-value-card',
  '.lumi-newsletter > *',
  '.lumi-home .lumi-look-scene', '.lumi-home .lumi-look-preview',
  '.lumi-home-values > .lumi-eyebrow', '.lumi-home-values > .lumi-heading',
  '.lumi-about [data-about-reveal]',
].join(',');

/** Animate existing elements without adding wrappers or affecting layout. */
export default function SiteMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.lumi-site');
    const main = shell?.querySelector('main');
    if (!shell || !main) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const home = main.querySelector<HTMLElement>('.lumi-home');
    let editingHome = false;
    let editingDetails = false;
    let seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    const stopAnimations = () => { animations.forEach(animation => animation.cancel()); animations.clear(); };
    const configure = () => {
      observer?.disconnect();
      stopAnimations();
      seen = new WeakSet<Element>();
      if (preference.matches || !('IntersectionObserver' in window)) return;
      observer = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
        visible.forEach((entry, order) => {
          observer?.unobserve(entry.target);
          const subtle = entry.target.hasAttribute('data-about-reveal');
          const isHome = Boolean(entry.target.closest('.lumi-home'));
          if ((isHome && editingHome) || (editingDetails && entry.target.closest('.lr-detail-page'))) return;
          const stagger = Math.min(order, isHome ? 3 : subtle ? 2 : 5) * (isHome ? 90 : subtle ? 60 : 100);
          const animation = entry.target.animate(isHome ? [
            { opacity: 0, translate: '0 30px' },
            { opacity: 1, translate: '0 0' },
          ] : [
            { opacity: 0, transform: subtle ? 'translateY(14px)' : 'translateY(36px) scale(.985)' },
            { opacity: 1, transform: 'translateY(0) scale(1)' },
          ], { duration: isHome ? 800 : subtle ? 650 : 1000, delay: stagger, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
          animation.oncancel = () => animations.delete(animation);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -25px 0px' });
      discover();
    };
    const discover = () => {
      if (preference.matches) return;
      main.querySelectorAll(revealTargets).forEach(element => {
        if (seen.has(element)) return;
        seen.add(element);
        observer?.observe(element);
      });
    };
    const editing = (event: MessageEvent) => {
      if (event.source !== window.parent || !['FIVORA_PREVIEW_EDIT_MODE', 'MARKETPLACE_PREVIEW_EDIT_MODE'].includes(event.data?.type)) return;
      editingHome = Boolean(event.data.editMode);
      if (home) home.dataset.homeEditing = String(editingHome);
      const details = main.querySelector<HTMLElement>('.lr-detail-page');
      editingDetails = Boolean(event.data.editMode);
      if (details) details.dataset.detailEditing = String(editingDetails);
      const enquiry = main.querySelector<HTMLElement>('.lumi-enquiry-page');
      if (enquiry) enquiry.dataset.enquiryEditing = String(editingDetails);
      if (editingHome || editingDetails) stopAnimations();
    };
    const updateScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        shell.dataset.scrolled = String(window.scrollY > 30);
        frame = 0;
      });
    };
    configure();
    const mutations = new MutationObserver(discover);
    mutations.observe(main, { childList: true, subtree: true });
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('message', editing);
    preference.addEventListener('change', configure);
    return () => {
      observer?.disconnect(); mutations.disconnect(); stopAnimations();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('message', editing);
      if (home) delete home.dataset.homeEditing;
      preference.removeEventListener('change', configure);
    };
  }, [pathname]);
  return null;
}
