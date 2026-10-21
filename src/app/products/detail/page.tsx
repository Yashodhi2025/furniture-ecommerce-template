'use client';

import { EditableProductDetail, PlatformProductDetail } from '@deneb-ui/ui';
import LivingProductDetail from '@/components/LivingProductDetail';
import '@/app/furniture-collection.css';

export default function ProductDetailPage() {
  return (
    <PlatformProductDetail
      backHref="/"
      renderProduct={(product, context) => product.gallery?.length ? <LivingProductDetail product={product} index={context.productIndex} /> : <EditableProductDetail product={product} sectionPath={context.sectionPath} />}
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
