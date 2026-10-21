import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LivingRoomProducts from '@/components/LivingRoomProducts';
import { collections, type CollectionId } from '@/lib/collections';
import '@/app/furniture-collection.css';

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(collections).filter(collection => collection !== 'living-room').map(collection => ({ collection }));
}
type Props = { params: Promise<{ collection: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection } = await params;
  const config = collections[collection as CollectionId];
  return { title: config ? `${config.title} | LUMI LIVING` : 'Collection | LUMI LIVING', description: config?.description };
}
export default async function CollectionPage({ params }: Props) {
  const { collection } = await params;
  if (!Object.hasOwn(collections, collection)) notFound();
  return <LivingRoomProducts collectionId={collection as CollectionId} />;
}
