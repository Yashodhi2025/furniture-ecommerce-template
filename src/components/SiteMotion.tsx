'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const revealTargets = [
  '.lr-heading > .lr-breadcrumbs', '.lr-collection-toolbar', '.lr-product-card',
  '.lr-detail-info > *',
  '.lumi-section-top', '.lumi-category-card', '.lumi-product-card',
  '.lumi-story-image', '.lumi-story-copy > *', '.lumi-value-card',
  '.lumi-home-story .lumi-story-copy',
  '.lumi-newsletter > *',
  '.lumi-home .lumi-look-scene', '.lumi-home .lumi-look-preview',
  '.lumi-home-values > .lumi-eyebrow', '.lumi-home-values > .lumi-heading',
  '.lumi-about [data-about-reveal]',
  '.lumi-wishlist-card', '.lumi-cart-heading', '.lumi-enquiry-page .lumi-cart-summary',
  '.lumi-contact .page-heading', '.lumi-contact .contact-grid > .card',
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
    let editingStorefront = shell.dataset.cardEditing === 'true';
    let seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const pendingHeadings = new Map<Element, Animation>();
    const headingRuns = new Map<Element, Animation[]>();
    const headingVisible = new Set<Element>();
    const repeatSelector = '.lumi-home .lumi-section-top,.lumi-home-story .lumi-story-image,.lumi-home-story .lumi-story-copy';
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    let feedbackFrame = 0;
    const stopAnimations = () => { animations.forEach(animation => animation.cancel()); animations.clear(); pendingHeadings.clear(); headingRuns.clear(); headingVisible.clear(); };
    const configure = () => {
      observer?.disconnect();
      stopAnimations();
      seen = new WeakSet<Element>();
      if (preference.matches || !('IntersectionObserver' in window)) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting || !entry.target.matches(repeatSelector)) return;
          headingVisible.delete(entry.target);
          headingRuns.get(entry.target)?.forEach(animation => animation.cancel());
          headingRuns.delete(entry.target);
          if (editingStorefront || pendingHeadings.has(entry.target) || entry.target.matches('.lumi-home-story .lumi-story-image')) return;
          const pending = entry.target.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'both' });
          pending.pause();
          pendingHeadings.set(entry.target, pending);
          animations.add(pending);
          pending.oncancel = () => animations.delete(pending);
        });
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
        visible.forEach((entry, order) => {
          const repeatHeading = entry.target.matches(repeatSelector);
          if (!repeatHeading) observer?.unobserve(entry.target);
          else if (headingVisible.has(entry.target)) return;
          const pending = pendingHeadings.get(entry.target);
          pending?.cancel();
          pendingHeadings.delete(entry.target);
          const subtle = entry.target.hasAttribute('data-about-reveal');
          const isHome = Boolean(entry.target.closest('.lumi-home'));
          if (editingStorefront || (isHome && editingHome) || (editingDetails && entry.target.closest('.lr-detail-page')) || entry.target.closest('dialog')) return;
          if (entry.target.matches('.lumi-home-story .lumi-story-image,.lumi-home-story .lumi-story-copy')) {
            headingVisible.add(entry.target);
            const run: Animation[] = [];
            headingRuns.set(entry.target, run);
            const play = (target: Element, keyframes: Keyframe[], duration: number, delay = 0) => {
              const animation = target.animate(keyframes, { duration, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
              animations.add(animation); run.push(animation);
              animation.onfinish = animation.oncancel = () => animations.delete(animation);
            };
            if (entry.target.matches('.lumi-story-image')) {
              play(entry.target, [
                { opacity: .8 },
                { opacity: 1 },
              ], 1300);
              const image = entry.target.querySelector('img');
              // Clip the child, never the observed container: clipping the observed
              // element can report an exit and cancel its own reveal repeatedly.
              if (image) play(image, [
                { scale: 1.08, translate: '-1% 0', clipPath: 'inset(0 12% 0 0)' },
                { scale: 1, translate: '0 0', clipPath: 'inset(0 0% 0 0)' },
              ], 1700);
            } else {
              [...entry.target.children].forEach((target, index) => play(target, [
                { opacity: 0, translate: '0 42px', clipPath: 'inset(0 0 100% 0)' },
                { opacity: 1, translate: '0 0', clipPath: 'inset(0 0 0% 0)' },
              ], 1050, 160 + index * 170));
            }
            return;
          }
          if (isHome && entry.target.matches('.lumi-section-top')) {
            headingVisible.add(entry.target);
            const run: Animation[] = [];
            headingRuns.set(entry.target, run);
            // Reveal each heading first, then its supporting copy, as the section arrives.
            entry.target.querySelectorAll('.lumi-eyebrow,.lumi-heading,.lumi-section-description,.lumi-collection-link').forEach((target, index) => {
              const heading = target.matches('.lumi-heading');
              const animation = target.animate([
                { opacity: 0, translate: `0 ${heading ? 60 : 28}px`, clipPath: 'inset(0 0 100% 0)' },
                { opacity: 1, translate: '0 0', clipPath: 'inset(0 0 0% 0)' },
              ], { duration: heading ? 1150 : 850, delay: Math.min(index, 3) * 170, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
              animations.add(animation);
              run.push(animation);
              animation.onfinish = animation.oncancel = () => animations.delete(animation);
            });
            return;
          }
          const stagger = Math.min(order, subtle ? 2 : 3) * 85;
          // Individual translate composes with card hover styles and editable transforms.
          const animation = entry.target.animate([
            { opacity: 0, translate: `0 ${subtle ? 14 : 26}px` },
            { opacity: 1, translate: '0 0' },
          ], { duration: subtle ? 550 : 700, delay: stagger, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
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
        // The story panel coordinates its own children to avoid double entrances.
        if (element.matches('.lumi-home-story .lumi-story-copy > *')) return;
        if (seen.has(element)) return;
        seen.add(element);
        if (!editingStorefront && element.matches(repeatSelector) && !element.matches('.lumi-home-story .lumi-story-image') && element.getBoundingClientRect().top >= window.innerHeight) {
          // A cancellable animation holds offscreen headings until their observer fires.
          // No permanent CSS hiding: reduced motion, Edit mode and teardown restore them.
          const pending = element.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'both' });
          pending.pause();
          pendingHeadings.set(element, pending);
          animations.add(pending);
          pending.oncancel = () => animations.delete(pending);
        }
        observer?.observe(element);
      });
    };
    const editing = (event: MessageEvent) => {
      if (event.source !== window.parent || !['FIVORA_PREVIEW_EDIT_MODE', 'MARKETPLACE_PREVIEW_EDIT_MODE'].includes(event.data?.type)) return;
      editingHome = Boolean(event.data.editMode);
      editingStorefront = Boolean(event.data.editMode);
      shell.dataset.cardEditing = String(Boolean(event.data.editMode));
      if (home) home.dataset.homeEditing = String(editingHome);
      const details = main.querySelector<HTMLElement>('.lr-detail-page');
      editingDetails = Boolean(event.data.editMode);
      if (details) details.dataset.detailEditing = String(editingDetails);
      const enquiry = main.querySelector<HTMLElement>('.lumi-enquiry-page');
      if (enquiry) enquiry.dataset.enquiryEditing = String(editingDetails);
      if (editingHome || editingDetails) stopAnimations();
    };
    const feedback = (event: MouseEvent) => {
      if (editingStorefront || preference.matches || !(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>('.lumi-product-heart,.lr-wishlist-button,.lr-quantity-selector button,.lumi-cart-quantity button');
      if (!button || button.disabled) return;
      cancelAnimationFrame(feedbackFrame);
      // Read the resulting pressed state/value after React handles the original click.
      feedbackFrame = requestAnimationFrame(() => {
        feedbackFrame = 0;
        if (editingStorefront || preference.matches || !button.isConnected) return;
        const heart = button.matches('.lumi-product-heart,.lr-wishlist-button');
        const target = heart ? button.querySelector('svg') : button.parentElement?.querySelector('input,output');
        if (!target) return;
        const selected = button.getAttribute('aria-pressed') === 'true';
        const animation = target.animate(heart ? [
          { scale: 1 }, { scale: selected ? 1.24 : .85, offset: .45 }, { scale: 1 },
        ] : [
          { opacity: .5, translate: '0 3px' }, { opacity: 1, translate: '0 0' },
        ], { duration: heart ? 380 : 240, easing: 'cubic-bezier(.22,1,.36,1)' });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
        animation.oncancel = () => animations.delete(animation);
      });
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
    main.addEventListener('click', feedback, true);
    preference.addEventListener('change', configure);
    return () => {
      observer?.disconnect(); mutations.disconnect(); stopAnimations();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(feedbackFrame);
      main.removeEventListener('click', feedback, true);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('message', editing);
      if (home) delete home.dataset.homeEditing;
      preference.removeEventListener('change', configure);
    };
  }, [pathname]);
  return null;
}
