"use client";

import { useSearchParams } from 'next/navigation';
import { RaceMode } from '@/components/RaceMode';
import { Suspense } from 'react';

function RacePageContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || undefined;

  return <RaceMode initialCode={code} />;
}

export default function RacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <RacePageContent />
    </Suspense>
  );
}
