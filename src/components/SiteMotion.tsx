'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const revealTargets = [
  '.lr-heading > .lr-breadcrumbs', '.lr-collection-toolbar', '.lr-product-card',
  '.lr-detail-info > *', '.lumi-hero-copy > *', '.lumi-hero-media',
  '.lumi-section-top', '.lumi-category-card', '.lumi-product-card',
  '.lumi-story-image', '.lumi-story-copy > *', '.lumi-value-card',
  '.lumi-newsletter > *',
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
          const animation = entry.target.animate([
            { opacity: 0, transform: subtle ? 'translateY(14px)' : 'translateY(36px) scale(.985)' },
            { opacity: 1, transform: 'translateY(0) scale(1)' },
          ], { duration: subtle ? 650 : 1000, delay: Math.min(order, subtle ? 2 : 5) * (subtle ? 60 : 100), easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
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
    preference.addEventListener('change', configure);
    return () => {
      observer?.disconnect(); mutations.disconnect(); stopAnimations();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateScroll);
      preference.removeEventListener('change', configure);
    };
  }, [pathname]);
  return null;
}
