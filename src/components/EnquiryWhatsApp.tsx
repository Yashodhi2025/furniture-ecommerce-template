'use client';

import './enquiry.css';
import { useEffect, useState } from 'react';
import { EditableText } from '@deneb-ui/ui';
import { contentObject, contentText, isTemplateValidation, useSiteData } from '@/lib/siteDataContext';
import { productHref } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';
import { enquiryWhatsAppContact } from '@/lib/enquiryWhatsApp';

type EnquiryItem = { id: string; name?: string; price?: string | number; quantity?: number; currency?: unknown };

/** Share the website's WhatsApp destination across product and list enquiries. */
export default function EnquiryWhatsApp({ items, disabled = false, direct = false, contact = false }: { items: EnquiryItem[]; disabled?: boolean; direct?: boolean; contact?: boolean }) {
  const siteData = useSiteData();
  const settings = contentObject(contentObject(siteData.content).enquiry);
  const { number, digits, configured } = enquiryWhatsAppContact(siteData);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const edit = (event: MessageEvent) => {
      if (event.source === window.parent && ['FIVORA_PREVIEW_EDIT_MODE', 'MARKETPLACE_PREVIEW_EDIT_MODE'].includes(event.data?.type)) setEditing(Boolean(event.data.editMode));
    };
    window.addEventListener('message', edit);
    return () => window.removeEventListener('message', edit);
  }, []);
  const send = () => {
    if (!configured || !items.length || disabled) return;
    const lines = items.map((item, index) => {
      const value = item.price;
      const price = value === undefined || value === '' ? 'Price on enquiry' : `${item.currency || 'LKR'} ${typeof value === 'number' ? new Intl.NumberFormat('en-LK').format(value) : value}`;
      const link = new URL(withBasePath(productHref(item.id)), window.location.origin).href;
      return `${index + 1}. ${item.name || 'Product'}\n   Quantity: ${item.quantity || 1}\n   Unit price: ${price}\n   ${link}`;
    });
    const message = [contentText(settings.messageIntro) || 'Hello LUMI LIVING, I would like to enquire about these pieces:', '', ...lines, '', contentText(settings.messageClosing) || 'Please confirm availability, the final quotation and delivery options.'].join('\n');
    // Opening happens only after the customer clicks; WhatsApp never sends automatically.
    const popup = window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    if (popup) popup.opener = null;
  };
  return <div className="lumi-enquiry-send">
    <button type="button" className="lumi-whatsapp-button" disabled={disabled || !items.length || !configured} onClick={send}>
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.1-4.3A8.5 8.5 0 1 1 20 11.5Z"/><path d="M8 7c0 5 4 8 8 8l1-2-3-1-1 1c-2-1-3-2-3-3l1-1-1-2H8Z"/></svg>
      <EditableText as="span" fieldPath={`enquiry.${direct ? 'directLabel' : 'sendLabel'}`} defaultValue={contentText(settings[direct ? 'directLabel' : 'sendLabel']) || (direct ? 'Enquire on WhatsApp' : 'Send Enquiry via WhatsApp')} /><span aria-hidden="true">↗</span>
    </button>
    {contact && (configured || editing || isTemplateValidation(siteData)) && <div className="lumi-enquiry-contact"><EditableText as="span" fieldPath="enquiry.contactLabel" defaultValue={contentText(settings.contactLabel) || 'Business WhatsApp'} /><EditableText as="span" fieldPath="enquiry.whatsappNumber" defaultValue={number} placeholder="Set business number with country code" /></div>}
    {!configured && <p className="lumi-enquiry-help"><EditableText as="span" fieldPath="enquiry.unconfiguredText" defaultValue={contentText(settings.unconfiguredText) || 'WhatsApp enquiries are currently unavailable. Please contact us about your selection.'} /> <a href={withBasePath('/contact/')}>Contact us ↗</a></p>}
  </div>;
}
