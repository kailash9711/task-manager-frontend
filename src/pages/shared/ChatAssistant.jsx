import React, { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import DashBoardLayout from '../../components/layouts/DashBoardLayout';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useUserAuth } from '../../hooks/useUserAuth';

const ChatAssistant = () => {
  useUserAuth();

  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const askAssistant = async () => {
    const question = message.trim();
    if (!question || loading) return;

    const userEntry = { role: 'user', message: question };
    setHistory((prev) => [...prev, userEntry]);
    setMessage('');

    try {
      setLoading(true);
      const response = await axiosInstance.post(API_PATHS.AI.CHAT, {
        message: question,
      });

      const answer = response?.data?.answer || 'No response received.';
      const nextSteps = Array.isArray(response?.data?.nextSteps) ? response.data.nextSteps : [];

      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          message: answer,
          nextSteps,
        },
      ]);
    } catch (error) {
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          message: error?.response?.data?.message || 'Unable to fetch assistant response.',
          nextSteps: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashBoardLayout activeMenu="assistant">
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chat Assistant</h1>
          <p className="text-slate-600 dark:text-slate-300">Ask for solutions, implementation ideas, or task execution advice.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {history.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
                Start by asking: "How should I finish this task faster?"
              </div>
            )}

            {history.map((entry, index) => (
              <div
                key={`${entry.role}-${index}`}
                className={`rounded-xl px-4 py-3 text-sm ${
                  entry.role === 'user'
                    ? 'ml-auto max-w-[85%] bg-blue-600 text-white'
                    : 'mr-auto max-w-[90%] border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                }`}
              >
                <p className="font-semibold">{entry.role === 'user' ? 'You' : 'Assistant'}</p>
                <p className="mt-1 leading-6">{entry.message}</p>

                {entry.role === 'assistant' && Array.isArray(entry.nextSteps) && entry.nextSteps.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <Sparkles className="size-3.5" />
                      Suggested next steps
                    </p>
                    {entry.nextSteps.map((step) => (
                      <p key={step} className="text-xs text-slate-600 dark:text-slate-300">- {step}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  askAssistant();
                }
              }}
              placeholder="Ask assistant to find a solution..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950/40"
            />
            <button
              type="button"
              onClick={askAssistant}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? <Bot className="size-4 animate-pulse" /> : <Send className="size-4" />}
              {loading ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </DashBoardLayout>
  );
};

export default ChatAssistant;
