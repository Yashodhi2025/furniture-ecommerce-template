'use client';

import type { SiteData as EditableSiteData } from '@deneb-ui/ui';

/** Deneb's export fixtures, distinct from a shopper's preview or editor iframe. */
export function isTemplateValidation(siteData: EditableSiteData) {
  return siteData.project?.id === 'template-validation' || siteData.project?.slug === 'template-validation';
}

export {
  SiteDataProvider,
  ThemeStyles,
  useSiteData,
  useSyncedBranding,
  useCommon,
  useContact,
  useShop,
  useProducts,
  useServices,
  useReviews,
  useSiteCatalog,
  useSiteApi,
  createWhatsAppUrl,
  contentText,
  contentObject,
  contentList,
  PREVIEW_DATA_MESSAGE,
  LEGACY_PREVIEW_DATA_MESSAGE,
  PREVIEW_READY_MESSAGE,
  LEGACY_PREVIEW_READY_MESSAGE,
  PREVIEW_FOCUS_MESSAGE,
  LEGACY_PREVIEW_FOCUS_MESSAGE,
  PREVIEW_FIELD_ATTRIBUTE,
  platformProductDetailHref,
} from '@deneb-ui/ui';

export type {
  SiteData,
  SiteDataProviderProps,
  SiteDataApiConfig,
  SiteDataProject,
  SiteInstanceData,
  ProductItem,
  ServiceItem,
  TemplateTheme,
  SyncedBranding,
} from '@deneb-ui/ui';
