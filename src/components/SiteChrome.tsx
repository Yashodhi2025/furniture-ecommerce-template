'use client';

import type { ReactNode } from 'react';
import { useSiteData } from '@/lib/siteDataContext';
import { Footer, getThemeCssProperties } from '@deneb-ui/ui';

import LumiNavbar from './LumiNavbar';
import SiteMotion from './SiteMotion';

export default function SiteChrome({ children }: { children: ReactNode }) {
  const siteData = useSiteData();
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
      <SiteMotion />
      <LumiNavbar />
      <main>{children}</main>
      <Footer defaultLinks={navigation} showNewsletter={false} />
    </div>
  );
}
