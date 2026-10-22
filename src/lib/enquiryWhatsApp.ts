import { contentObject, contentText, type SiteData } from '@/lib/siteDataContext';

/** Reuse the footer's live contact sources unless an enquiry override is set. */
export function enquiryWhatsAppContact(siteData: SiteData) {
  const content = contentObject(siteData.content);
  const enquiry = contentObject(content.enquiry);
  const contact = contentObject(content.contact);
  const common = contentObject(content.common);
  const business = contentObject(common.business);
  const shop = contentObject(siteData.shop);
  const shopContact = contentObject(shop.contact);
  const phone = shopContact.phone || shop.businessPhone || business.phone || common.phone || contact.phone;
  const number = contentText(enquiry.whatsappNumber).trim() || contentText(
    shopContact.whatsapp || shop.businessWhatsapp || shop.whatsappNumber || shop.whatsapp ||
    contact.whatsapp || contact.whatsappUrl || common.whatsapp || common.whatsappNumber ||
    business.whatsapp || phone,
  ).trim();
  let destination = number;
  if (/^(https?:|whatsapp:)/i.test(number)) {
    try {
      const url = new URL(number);
      destination = url.hostname === 'wa.me' || url.hostname === 'www.wa.me'
        ? url.pathname.split('/').filter(Boolean)[0] || ''
        : url.searchParams.get('phone') || '';
    } catch { destination = ''; }
  }
  const digits = destination.replace(/\D/g, '');
  return { number, digits, configured: /^[1-9]\d{6,14}$/.test(digits) };
}
