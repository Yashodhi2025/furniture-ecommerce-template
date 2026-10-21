'use client';

import { useEffect, useState } from 'react';
import { PlatformProductDetail } from '@deneb-ui/ui';
import LivingProductDetail from '@/components/LivingProductDetail';
import { isCollectionId, productCollection } from '@/lib/collections';
import { withBasePath } from '@/lib/utils';
import '@/app/furniture-collection.css';

export default function ProductDetailPage() {
  const [sourceCollection, setSourceCollection] = useState<string | null>(null);
  useEffect(() => { setSourceCollection(new URLSearchParams(window.location.search).get('collection')); }, []);
  return (
    <PlatformProductDetail
      backHref={isCollectionId(sourceCollection) ? withBasePath(`/collections/${sourceCollection}/`) : withBasePath('/')}
      renderProduct={(product, context) => {
        const collectionId = productCollection(product.category, sourceCollection);
        // Keep the same editable gallery mounted, even when gallery is absent
        // or empty, so adding the first image never changes renderer/bindings.
        return <LivingProductDetail product={product} index={context.productIndex} collectionId={collectionId} />;
      }}
      loadingFallback={
        <div
          role="status"
          className="mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center px-4 py-16 text-sm text-slate-400"
        >
          <span data-preview-static="product-detail-loading">Loading product…</span>
        </div>
      }
    />
  );
}
