'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { EditableSection, EditableText } from '@deneb-ui/ui';
import { contentText } from '@/lib/siteDataContext';
import { collections, type CollectionId } from '@/lib/collections';
import { withBasePath } from '@/lib/utils';
import { useFivoraEditMode } from '@/lib/useFivoraEditMode';
import './CollectionHero.css';

const interiors: Record<CollectionId, { src: string; alt: string; position: string }> = {
  'living-room': { src: '/images/living-room.jpg', alt: 'Sunlit living room with a caramel sofa, lounge chairs and a coffee table', position: '58% 66%' },
  bedroom: { src: '/images/bed.jpg', alt: 'Furnished bedroom with an upholstered bed, bedside lamps and a bench', position: '50% 56%' },
  'kitchen-dining': { src: '/images/navigation/dining.jpg', alt: 'Dining room with a dressed table, upholstered chairs and pendant lighting', position: '50% 58%' },
  office: { src: '/images/navigation/office.jpg', alt: 'Modern office interior with glass rooms, lounge seating and warm pendant lights', position: '45% 55%' },
  'lighting-decor': { src: '/images/story.jpg', alt: 'Styled living interior with wall decor, natural textures and accent furniture', position: '50% 56%' },
  sale: { src: '/images/living-room.jpg', alt: 'Warm furnished living room with natural wood and upholstered seating', position: '58% 66%' },
};
const STRIP_COUNT = 12;

export default function CollectionHero({ collectionId, heading, headingPath }: {
  collectionId: CollectionId;
  heading: Record<string, unknown>;
  headingPath: string;
}) {
  const collection = collections[collectionId];
  const interior = interiors[collectionId];
  const image = useRef<HTMLImageElement>(null);
  const played = useRef(false);
  const editing = useFivoraEditMode();
  const [reveal, setReveal] = useState<'idle' | 'playing' | 'done'>('idle');

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (editing || preference.matches) { setReveal('done'); return; }
    if (played.current || !image.current) return;
    let cancelled = false;
    let decoded = false;
    let inView = false;
    const start = () => {
      if (cancelled || !decoded || !inView || played.current) return;
      played.current = true;
      setReveal('playing');
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      start();
    }, { threshold: .15 }) : null;
    if (observer) observer.observe(image.current);
    else inView = true;
    image.current.decode().then(() => { decoded = true; start(); }).catch(() => {
      if (!cancelled) setReveal('done');
    });
    const reduceMotion = () => { if (preference.matches) setReveal('done'); };
    preference.addEventListener('change', reduceMotion);
    return () => {
      cancelled = true;
      observer?.disconnect();
      preference.removeEventListener('change', reduceMotion);
    };
  }, [editing, interior.src]);

  return <EditableSection as="div" name={`${collectionId}-heading`} padding="none" className="collection-hero">
    <div className="collection-hero-copy">
      <p className="collection-hero-eyebrow" data-preview-static="collection-hero-signature">LUMI LIVING COLLECTION</p>
      <h1 id={`${collectionId}-title`} className="collection-hero-title">
        <EditableText as="span" fieldPath={`${headingPath}.title`} defaultValue={contentText(heading.title) || collection.title} />
      </h1>
      <EditableText as="p" className="collection-hero-description" fieldPath={`${headingPath}.description`} defaultValue={contentText(heading.description) || collection.description} />
      <a className="collection-hero-cta" href={`#${collectionId}-products`}>Shop the Collection <span aria-hidden="true">→</span></a>
    </div>
    <div className="collection-hero-media" data-reveal={reveal}>
      <img ref={image} className="collection-hero-image" src={withBasePath(interior.src)} alt={interior.alt} fetchPriority="high" decoding="async" style={{ objectPosition: interior.position }} />
      {reveal === 'playing' && <div className="collection-hero-strips" aria-hidden="true" style={{ '--strip-count': STRIP_COUNT } as CSSProperties}>
        {Array.from({ length: STRIP_COUNT }, (_, index) => <span key={index} className="collection-hero-strip" style={{ '--strip-index': index } as CSSProperties}
          onAnimationEnd={event => {
            if (index === STRIP_COUNT - 1 && event.target === event.currentTarget) setReveal('done');
          }}>
          <img src={withBasePath(interior.src)} alt="" draggable={false} style={{ objectPosition: interior.position }} />
        </span>)}
      </div>}
    </div>
  </EditableSection>;
}
