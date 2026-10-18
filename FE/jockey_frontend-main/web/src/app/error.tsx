'use client';

import { useEffect } from 'react';
import { getApiErrorMessage } from '@/lib/api/errors';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error('Website route error', error), [error]);
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-[#f4f0e6] px-5 py-12">
      <section role="alert" className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-700">We couldn’t load this page</p>
        <p className="mt-3 whitespace-pre-line text-base leading-7 text-slate-700">{getApiErrorMessage(error)}</p>
        <button onClick={reset} className="mt-6 rounded-full bg-[#042f2e] px-6 py-3 font-semibold text-white">Try again</button>
      </section>
    </main>
  );
}
