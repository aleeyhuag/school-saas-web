import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as aiApi from '../api/ai';
import { BRAND } from '../config/brand';

const STARTERS = [
  'How do I add a student?',
  'How do I record attendance?',
  'What can my role access?',
];

function Message({ item }) {
  const isUser = item.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-bg text-ink border border-border rounded-bl-md'
        }`}
      >
        {item.content}
      </div>
    </div>
  );
}

export default function SkulagAIAssistant({ onClose }) {
  const { user, school, roles } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.name?.split(' ')[0] || 'there'} 👋 I’m ${BRAND.productName} AI. I can help with Skulag procedures and, where your role allows it, answer questions from your school records.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function send(text = input) {
    const message = text.trim();
    if (!message || sending) return;

    const nextMessages = [...messages, { role: 'user', content: message }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setSending(true);

    try {
      const history = nextMessages.slice(-10).map(({ role, content }) => ({ role, content }));
      const data = await aiApi.askSkulagAi(message, history.slice(0, -1));
      setMessages((current) => [...current, {
        role: 'assistant',
        content: data.answer || 'I could not produce an answer for that request.',
      }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Skulag AI is temporarily unavailable. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/30" onClick={onClose}>
      <section
        className="w-full max-w-xl h-full bg-surface border-l border-border shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        aria-label="Ask Skulag AI"
      >
        <header className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center overflow-hidden">
            <img src={BRAND.faviconPath} alt="" className="w-7 h-7 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-ink">Ask Skulag AI</h2>
            <p className="text-xs text-muted truncate">
              {school?.name || 'Skulag'} · {roles?.join(', ') || 'authenticated user'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg text-muted hover:bg-bg hover:text-ink"
            aria-label="Close Ask Skulag AI"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((item, index) => <Message key={`${item.role}-${index}`} item={item} />)}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-bg border border-border rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm text-muted">
                Skulag AI is thinking…
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 text-danger text-sm p-3">
              {error}
            </div>
          )}

          {messages.length === 1 && (
            <div className="pt-2 space-y-2">
              <p className="text-xs text-muted">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => send(starter)}
                    className="text-xs px-3 py-2 rounded-full border border-border text-ink hover:bg-bg"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="border-t border-border p-3 shrink-0"
          onSubmit={(e) => { e.preventDefault(); send(); }}
        >
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              maxLength={4000}
              placeholder="Ask about Skulag, your school or how to use a feature…"
              className="flex-1 resize-none rounded-xl border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/30"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-xl bg-primary text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {sending ? '…' : 'Ask'}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Read-only assistant. It does not change school records.
          </p>
        </form>
      </section>
    </div>
  );
}
