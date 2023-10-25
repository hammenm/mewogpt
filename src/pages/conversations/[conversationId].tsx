import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Message from '@/components/Message';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
};

export default function ConversationPage() {
  const router = useRouter();
  const { conversationId } = router.query;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingInit, setLoadingInit] = useState<boolean>(true);
  const [errorInit, setErrorInit] = useState<Error | null>(null);
  const [loadingResponse, setLoadingResponse] = useState<boolean>(false);
  const [errorResponse, setErrorResponse] = useState<Error | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    // Fetch /api/conversations
    fetch(`/api/conversations/${conversationId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages);
        setLoadingInit(false);
      })
      .catch((err) => {
        setErrorInit(err);
        setLoadingInit(false);
      });
  }, [router.isReady, conversationId]);

  const disabledForm = loadingResponse || !!errorResponse;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input || disabledForm) return;

    setLoadingResponse(true);
    setErrorResponse(null);

    // POST /api/conversations/:conversationId
    fetch(`/api/conversations/${conversationId}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: input }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoadingResponse(false);
        setMessages((messagesPrev) => {
          console.log(messagesPrev);
          console.log(data.messages);
          return [...messagesPrev, ...data.messages];
        });
        setInput('');
      })
      .catch((err) => {
        setLoadingResponse(false);
        setErrorResponse(err);
      });
  };

  return (
    <main className="flex flex-col h-full w-full bg-gray-200 dark:bg-gray-800">
      <div className="flex-1 overflow-y-auto">
        {loadingInit && <p>Loading...</p>}
        {errorInit && <p>Error: {errorInit.message}</p>}
        {messages.map((message) => (
          <Message
            key={message.id}
            content={message.content}
            role={message.role}
          />
        ))}
      </div>
      <form className="flex w-full p-4" onSubmit={onSubmit}>
        <input
          disabled={disabledForm}
          className="w-full h-12 px-4 md:px-6 text-sm md:text-base bg-gray-100 dark:bg-gray-900 border border-transparent dark:border-white/20 md:dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-white/20 dark:focus:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          disabled={disabledForm}
          className="ml-4 px-4 py-2 text-sm md:text-base bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-blue-500 disabled:hover:bg-blue-500"
          type="submit"
        >
          Send
        </button>
      </form>
    </main>
  );
}