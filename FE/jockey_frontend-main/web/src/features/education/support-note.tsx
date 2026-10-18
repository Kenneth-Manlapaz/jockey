'use client';
import { useState, type FormEvent } from 'react';

export function SupportNote() {
  const [ready, setReady] = useState(false);
  function download(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const content = `JOCKEY support note\nTopic: ${values.get('topic')}\nPage or race reference: ${values.get('reference')}\n\n${values.get('message')}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'jockey-support-note.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setReady(true);
  }
  return <form className="guide-support-form" onSubmit={download}><label>Topic<select name="topic"><option>Guide correction</option><option>Race record correction</option><option>Website feedback</option><option>Account question</option></select></label><label>Page URL or race reference<input name="reference" maxLength={500} placeholder="For example: the race date, venue and race number" /></label><label>Your note<textarea name="message" required minLength={10} maxLength={5000} rows={6} placeholder="Describe what you saw and what needs correcting. Include a publication source if you have one." /></label><p className="guide-small">Do not include passwords, payment details or private documents. This downloads a note to your device; it does not send a message to JOCKEY.</p><button className="app-button primary" type="submit">Download support note</button>{ready && <p role="status">Your support note is ready to save. No message has been sent.</p>}</form>;
}
