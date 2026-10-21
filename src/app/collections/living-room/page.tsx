import type { Metadata } from 'next';
import LivingRoomProducts from '@/components/LivingRoomProducts';
import '@/app/furniture-collection.css';

export const metadata: Metadata = { title: 'Living Room Furniture | LUMI LIVING', description: 'Explore the LUMI LIVING living room collection. Sofas, accent chairs, storage and lighting for everyday living.' };
export default function LivingRoomPage() { return <LivingRoomProducts />; }
