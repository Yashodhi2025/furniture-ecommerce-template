'use client';

import { useEffect, useState } from 'react';
import { DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE, PREVIEW_FOCUS_MESSAGE, EditableAnnouncementBar, EditableIcon, SiteDataContext, contentList, contentObject, contentText, useSiteData } from '@deneb-ui/ui';
import './RotatingAnnouncementBar.css';

export default function RotatingAnnouncementBar() {
  const siteData = useSiteData();
  const settings = contentObject(contentObject(siteData.content).announcements);
  const messages = contentList(settings.messages).map(contentObject).map((message, index) => ({ message, index })).filter(({ message }) => contentText(message.text));
  const enabled = settings.enabled !== false;
  const [selected, setSelected] = useState(0);
  const active = selected % Math.max(1, messages.length);

  useEffect(() => {
    if (!enabled || messages.length < 2) return;
    const timer = window.setInterval(() => setSelected(value => (value + 1) % messages.length), 3000);
    return () => window.clearInterval(timer);
  }, [enabled, messages.length]);
  useEffect(() => {
    const revealMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || ![PREVIEW_FOCUS_MESSAGE, DENEB_PREVIEW_FOCUS_MESSAGE, LEGACY_PREVIEW_FOCUS_MESSAGE].includes(event.data?.type)) return;
      const match = /^announcements\.messages\[(\d+)\]/.exec(String(event.data?.fieldPath ?? ''));
      if (!match) return;
      const position = messages.findIndex(({ index }) => index === Number(match[1]));
      if (position >= 0) setSelected(position);
    };
    window.addEventListener('message', revealMessage);
    return () => window.removeEventListener('message', revealMessage);
  }, [messages]);

  return <div className="lumi-announcements" role="region" aria-label="Store announcements" aria-roledescription="carousel" style={!enabled || !messages.length ? { display: 'none' } : undefined}>
    <div className="lumi-announcement-messages" data-preview-list-path="announcements.messages" aria-live="off">
      {messages.map(({ message, index }, position) => {
        // Deneb 2.0.125's announcement reads { siteData }, while its provider
        // exposes the data directly. Keep this compatibility bridge local.
        const announcementData = { ...siteData, siteData: { content: { site: { announcement: { enabled: true, text: contentText(message.text), badge: '', linkText: '', linkUrl: '' } } } } };
        return <div className={`lumi-announcement-slide${position === active ? ' is-active' : ''}`} key={index} data-preview-item-path={`announcements.messages[${index}]`} aria-hidden={position !== active} inert={position !== active}>
          <EditableIcon className="lumi-announcement-icon" name={contentText(message.icon) || 'sparkles'} fieldPath={`announcements.messages[${index}].icon`} size={22} strokeWidth={1.6} aria-hidden="true" />
          <SiteDataContext.Provider value={announcementData}>
            <EditableAnnouncementBar fieldPath={`announcements.messages[${index}]`} defaultBadge="" dismissible={false} style={{ backgroundColor: 'transparent', color: '#3f2c1f', padding: '4px 0', fontSize: '20px', lineHeight: '1.5', minHeight: '36px', zIndex: 1 }} />
          </SiteDataContext.Provider>
        </div>;
      })}
    </div>
  </div>;
}
