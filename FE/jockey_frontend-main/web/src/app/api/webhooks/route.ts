import { NextResponse } from 'next/server';

/** Placeholder webhook handler until the Django API contract is connected. */
export async function POST() {
  return NextResponse.json({ received: true, mode: 'demo' }, { status: 202 });
}
