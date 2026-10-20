'use client';

import { useState, type ReactNode } from 'react';
import { useSiteData } from '@/lib/siteDataContext';
import { Footer, EditableDialog, getThemeCssProperties } from '@deneb-ui/ui';

import LumiNavbar from './LumiNavbar';

export default function SiteChrome({ children }: { children: ReactNode }) {
  const siteData = useSiteData();
  const [cartPreviewOpen, setCartPreviewOpen] = useState(false);
  const home = siteData.content?.home as Record<string, string> | undefined;
  const navigation = [
    {id:'home',label:'Home',route:'/'},
    {id:'services',label:'Shop',route:'/#shop'},
    {id:'about_us',label:'About',route:'/about_us/'},
    {id:'contact',label:'Contact',route:'/contact/'},
  ];
  const themeStyle = getThemeCssProperties(
    siteData?.template?.structure?.theme as any,
  );

  return (
    <div className="site-shell lumi-site" style={themeStyle}>
      <LumiNavbar onCartClick={() => setCartPreviewOpen(true)} />
      <main>{children}</main>
      <Footer defaultLinks={navigation} showNewsletter={false} />
      <EditableDialog open={cartPreviewOpen} onClose={() => setCartPreviewOpen(false)} title={home?.cartTitle ?? 'Your collection'} titleFieldPath="home.cartTitle" description={home?.cartDescription ?? 'Shopping features are coming in a later phase.'} descriptionFieldPath="home.cartDescription">
        <button className="lumi-button" type="button" onClick={() => setCartPreviewOpen(false)}>{home?.cartCloseLabel ?? 'Continue exploring'}</button>
      </EditableDialog>
    </div>
  );
}
