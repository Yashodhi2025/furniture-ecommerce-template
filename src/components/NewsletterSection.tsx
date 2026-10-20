'use client';

import { useState } from 'react';
import { EditableSection, EditableText } from '@deneb-ui/ui';
import { contentObject, contentText, useSiteData } from '@/lib/siteDataContext';

export default function NewsletterSection() {
  const data = useSiteData();
  const home = contentObject(contentObject(data.content).home);
  const [submitted, setSubmitted] = useState(false);
  const text = (key: string) => contentText(home[key]);
  return <EditableSection name="newsletter" padding="none" className="lumi-newsletter">
    <div><EditableText as="p" fieldPath="home.newsletterEyebrow" defaultValue={text('newsletterEyebrow')} className="lumi-eyebrow" /><EditableText as="h2" fieldPath="home.newsletterTitle" defaultValue={text('newsletterTitle')} className="lumi-heading" /></div>
    <div className="lumi-newsletter-content">
      <EditableText as="p" fieldPath="home.newsletterDescription" defaultValue={text('newsletterDescription')} />
      <form onSubmit={event => {event.preventDefault(); setSubmitted(true);}} data-fivora-contact-disabled>
        <label htmlFor="lumi-newsletter-email"><EditableText as="span" fieldPath="home.newsletterLabel" defaultValue={text('newsletterLabel')} /></label>
        <div className="lumi-email-row"><input id="lumi-newsletter-email" type="email" name="email" autoComplete="email" required placeholder={text('newsletterPlaceholder')} data-preview-field-path="home.newsletterPlaceholder" /><button type="submit"><EditableText as="span" fieldPath="home.newsletterButton" defaultValue={text('newsletterButton')} /><span aria-hidden="true">↗</span></button></div>
      </form>
      <EditableText as="p" fieldPath="home.newsletterNote" defaultValue={text('newsletterNote')} className="lumi-newsletter-note" />
      {submitted && <p role="status" className="lumi-preview-notice">{text('newsletterPreviewMessage')}</p>}
    </div>
  </EditableSection>;
}
