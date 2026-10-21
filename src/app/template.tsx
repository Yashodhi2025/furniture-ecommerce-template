import type { ReactNode } from 'react';

export default function Template({ children }: { children: ReactNode }) {
  return <div className="lumi-route-content">{children}</div>;
}
