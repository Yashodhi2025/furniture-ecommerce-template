'use client';

import { useEffect, useState } from 'react';
import { PlatformProductDetail, isPreviewValidation } from '@deneb-ui/ui';
import { isTemplateValidation, useProducts, useSiteData } from '@/lib/siteDataContext';
import LivingProductDetail from '@/components/LivingProductDetail';
import { isCollectionId, productCollection } from '@/lib/collections';
import { withBasePath } from '@/lib/utils';
import '@/app/furniture-collection.css';

export default function ProductDetailPage() {
  const siteData = useSiteData();
  const products = useProducts();
  // Only serialized fixture data may affect SSR. Iframe/location detection
  // must wait until hydration, so the first client tree matches the export.
  const [preview, setPreview] = useState(() => isTemplateValidation(siteData));
  useEffect(() => { setPreview(isPreviewValidation(siteData)); }, [siteData]);
  const [requestedId, setRequestedId] = useState<string | null>(null);
  const [sourceCollection, setSourceCollection] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSourceCollection(params.get('collection'));
    setRequestedId(params.get('id'));
  }, []);
  const emptyPreview = preview && !products.length ? <LivingProductDetail index={-1} /> : undefined;
  return (
    <div data-preview-page-key="product_detail">
    <PlatformProductDetail
      productId={preview ? requestedId || products[0]?.id : undefined}
      notFoundFallback={emptyPreview}
      backHref={isCollectionId(sourceCollection) ? withBasePath(`/collections/${sourceCollection}/`) : withBasePath('/')}
      renderProduct={(product, context) => {
        const collectionId = productCollection(product.category, sourceCollection);
        // Keep the same editable gallery mounted, even when gallery is absent
        // or empty, so adding the first image never changes renderer/bindings.
        return <LivingProductDetail product={product} index={context.productIndex} collectionId={collectionId} />;
      }}
      loadingFallback={
        emptyPreview ?? <div
          role="status"
          className="mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center px-4 py-16 text-sm text-slate-400"
        >
          <span data-preview-static="product-detail-loading">Loading product…</span>
        </div>
      }
    />
    </div>
  );
}
