'use client';

import { EditableImage, EditableSection, EditableText } from '@deneb-ui/ui';
import { contentList, contentObject, contentText, useSiteData } from '@/lib/siteDataContext';
import { withBasePath } from '@/lib/utils';
import './about.css';

export default function OurStoryPage() {
  const siteData = useSiteData();
  const story = contentObject(contentObject(siteData.content).ourStory);
  const text = (key: string) => contentText(story[key]);
  const copy = (key: string, as: 'span' | 'p' | 'h1' | 'h2' = 'p', className?: string) => <EditableText as={as} fieldPath={`ourStory.${key}`} defaultValue={text(key)} className={className} />;

  return <div className="lumi-about" data-preview-page-key="about">
    <EditableSection name="our-story-hero" padding="none" className="lumi-about-hero">
      <div className="lumi-about-hero-copy" data-about-reveal>
        {copy('eyebrow', 'p', 'lumi-about-eyebrow')}
        {copy('heading', 'h1')}
        {copy('tagline', 'p', 'lumi-about-tagline')}
      </div>
      <div className="lumi-about-hero-media" data-about-reveal>
        <EditableImage data-preview-field-path="ourStory.imageUrl" src={text('imageUrl') || '/images/living-room.jpg'} alt={text('imageAlt')} fit="cover" loading="eager" />
      </div>
    </EditableSection>

    <EditableSection name="our-story-introduction" padding="none" className="lumi-about-introduction">
      <div data-about-reveal>{copy('storyHeading', 'h2')}</div>
      <div data-about-reveal>{copy('body')}</div>
    </EditableSection>

    <EditableSection name="our-story-values" padding="none" className="lumi-about-values" aria-labelledby="lumi-values-label">
      <span id="lumi-values-label" className="sr-only" data-preview-static="values-accessible-label">Our values</span>
      <div className="lumi-about-values-grid" data-preview-list-path="ourStory.values">
        {contentList(story.values).map((raw, index) => {
          const value = contentObject(raw);
          return <article key={index} className="lumi-about-value" data-preview-item-path={`ourStory.values[${index}]`} data-about-reveal>
            <span className="lumi-about-value-index" aria-hidden="true" data-preview-static="brand-value-index">{String(index + 1).padStart(2, '0')}</span>
            <EditableText as="h3" data-preview-field-path={`ourStory.values[${index}].title`} defaultValue={contentText(value.title)} />
            <EditableText as="p" data-preview-field-path={`ourStory.values[${index}].description`} defaultValue={contentText(value.description)} />
          </article>;
        })}
      </div>
    </EditableSection>

    <EditableSection name="our-story-collections" padding="none" className="lumi-about-collections">
      <div data-about-reveal>{copy('ctaHeading', 'h2')}</div>
      <a href={withBasePath(text('ctaUrl') || '/collections/living-room/')} data-preview-field-path="ourStory.ctaUrl" className="lumi-about-cta" data-about-reveal>
        {copy('ctaLabel', 'span')}<span aria-hidden="true">↗</span>
      </a>
    </EditableSection>
  </div>;
}
