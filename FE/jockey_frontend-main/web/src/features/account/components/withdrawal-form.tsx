'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Check, ChevronRight, CircleDollarSign, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { makeQrMatrix } from '@web/lib/qr-code';

const methods = [
  { id: 'gcash', title: 'GCash', description: 'Send your payout to a GCash number', Icon: Smartphone },
  { id: 'bpi', title: 'BPI bank transfer', description: 'Withdraw to a BPI account', Icon: CreditCard },
  { id: 'other', title: 'Other bank or e-wallet', description: 'Choose another supported provider', Icon: CircleDollarSign },
  { id: 'cash', title: 'Cash pickup with QR code', description: 'Show your demo pickup QR code', Icon: CircleDollarSign },
] as const;

export function WithdrawalForm({ balance }: { balance: number }) {
  const [method, setMethod] = useState<(typeof methods)[number]['id']>('gcash');
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [cashReference, setCashReference] = useState('');
  const validAmount = Number(amount) > 0 && Number(amount) <= balance;

  return <main className="app-page withdrawal-page">
    <Link href="/profile" className="withdraw-back"><ArrowLeft size={17} /> Back to profile</Link>
    <header className="app-page-heading">
      <span>WALLET</span>
      <h1>Withdraw money</h1>
      <p>Choose a payout method and enter the account details.</p>
    </header>

    <section className="withdraw-balance">
      <span><Wallet size={20} /></span>
      <div><small>AVAILABLE DEMO BALANCE</small><strong>₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></div>
    </section>

    <form className="withdraw-form" onSubmit={(event) => { event.preventDefault(); if (method === 'cash') setCashReference(`JPH-CASH-${Math.random().toString(36).slice(2, 10).toUpperCase()}`); setSubmitted(true); }}>
      <fieldset className="withdraw-methods">
        <legend>Payout method</legend>
        {methods.map(({ id, title, description, Icon }) => <button key={id} type="button" className={`withdraw-method${method === id ? ' selected' : ''}`} aria-pressed={method === id} onClick={() => { setMethod(id); setSubmitted(false); }}>
          <span className="withdraw-method-icon"><Icon size={20} /></span>
          <span className="withdraw-method-copy"><strong>{title}</strong><small>{description}</small></span>
          <span className="withdraw-method-check">{method === id ? <Check size={14} /> : null}</span>
        </button>)}
      </fieldset>

      <section className="withdraw-details">
        <label>Amount (PHP)<input required inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value.replace(/[^0-9.]/g, '')); setSubmitted(false); }} placeholder="Enter amount" /></label>
        {method !== 'cash' ? <>
          <label>Account holder name<input required autoComplete="name" value={accountName} onChange={(event) => { setAccountName(event.target.value); setSubmitted(false); }} placeholder="Name on payout account" /></label>
          <label>{method === 'gcash' ? 'GCash mobile number' : 'Account number or wallet ID'}<input required value={accountDetails} onChange={(event) => { setAccountDetails(event.target.value); setSubmitted(false); }} placeholder={method === 'gcash' ? '09XX XXX XXXX' : 'Enter account details'} /></label>
        </> : <p>A demo QR code will be created for your cash pickup request.</p>}
        <p>This demo does not move money or connect to payout providers.</p>
      </section>

      {submitted && method === 'cash' && cashReference && <section className="withdraw-qr" role="status">
        <strong>Cash pickup QR code</strong>
        <svg viewBox="-2 -2 25 25" role="img" aria-label="Demo cash pickup QR code" shapeRendering="crispEdges">
          <rect x="-2" y="-2" width="25" height="25" fill="white" />
          {makeQrMatrix(cashReference).flatMap((row, y) => row.map((dark, x) => dark ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#092f2d" /> : null))}
        </svg>
        <span>Demo pickup reference: {cashReference}</span>
        <small>This QR is for a demo request only. It cannot be redeemed for cash.</small>
      </section>}
      {submitted && <div className="withdraw-success" role="status"><strong>Demo request saved</strong><span>No money was moved. A verified payout service is required for real withdrawals.</span></div>}
      {amount && !validAmount && <p className="withdraw-error" role="alert">Enter an amount up to ₱{balance.toLocaleString('en-PH')}.</p>}
      <button className="withdraw-submit" type="submit" disabled={!validAmount || (method !== 'cash' && (!accountName.trim() || !accountDetails.trim()))}>Request withdrawal <ChevronRight size={18} /></button>
    </form>
  </main>;
}
