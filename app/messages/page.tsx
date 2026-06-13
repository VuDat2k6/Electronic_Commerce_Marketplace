"use client";

import apiClient from "@/lib/api";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import toast from "react-hot-toast";

type ChatUser = {
  id: string;
  email: string;
  name?: string | null;
  shopName?: string | null;
};

type Conversation = {
  id: string;
  participantIds: string[];
  counterpart?: ChatUser;
  lastMessagePreview?: string;
  lastMessageAt?: string | null;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipientId = searchParams.get("recipientId");
  const productId = searchParams.get("productId");
  const userId = session?.user?.id;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const createdFromQuery = useRef(false);
  const { socket, connected } = useChatSocket(status === "authenticated");

  const loadConversations = useCallback(async () => {
    const response = await apiClient.get("/api/chat/conversations");
    if (!response.ok) throw new Error("Unable to load conversations");
    const data = await response.json();
    setConversations(data.conversations || []);
    return data.conversations || [];
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/messages");
      return;
    }
    if (status !== "authenticated") return;

    loadConversations()
      .then((items) => {
        if (!activeId && items[0]?.id) setActiveId(items[0].id);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [activeId, loadConversations, router, status]);

  useEffect(() => {
    if (!recipientId || status !== "authenticated" || createdFromQuery.current) return;
    createdFromQuery.current = true;

    apiClient
      .post("/api/chat/conversations", { recipientId, productId })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to start conversation");
        setActiveId(data.conversation.id);
        await loadConversations();
        router.replace("/messages");
      })
      .catch((error) => toast.error(error.message));
  }, [loadConversations, productId, recipientId, router, status]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    apiClient
      .get(`/api/chat/conversations/${activeId}/messages`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load messages");
        setMessages(data.messages || []);
        return apiClient.patch(`/api/chat/conversations/${activeId}/read`);
      })
      .catch((error) => toast.error(error.message));
  }, [activeId]);

  useEffect(() => {
    if (!socket) return;
    const receiveMessage = (message: ChatMessage) => {
      if (message.conversationId === activeId) {
        setMessages((current) =>
          current.some((item) => item.id === message.id) ? current : [...current, message],
        );
      }
      loadConversations().catch(() => undefined);
    };
    socket.on("chat:message", receiveMessage);
    return () => {
      socket.off("chat:message", receiveMessage);
    };
  }, [activeId, loadConversations, socket]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeId || sending) return;
    setSending(true);
    const clientMessageId = crypto.randomUUID();

    try {
      const message = await new Promise<ChatMessage>((resolve, reject) => {
        if (!socket?.connected) {
          apiClient
            .post(`/api/chat/conversations/${activeId}/messages`, { content, clientMessageId })
            .then(async (response) => {
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || "Unable to send message");
              resolve(data.message);
            })
            .catch(reject);
          return;
        }

        socket.emit(
          "chat:send",
          { conversationId: activeId, content, clientMessageId },
          (result: { ok: boolean; message?: ChatMessage; error?: string }) => {
            if (result.ok && result.message) resolve(result.message);
            else reject(new Error(result.error || "Unable to send message"));
          },
        );
      });

      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      );
      setDraft("");
      await loadConversations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  const activeConversation = conversations.find((item) => item.id === activeId);

  if (status === "loading" || loading) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-purple-600" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">
            {connected ? "Realtime connection active" : "Using secure fallback connection"}
          </p>
        </div>
      </div>

      <div className="grid min-h-[620px] overflow-hidden rounded-lg border border-gray-200 bg-white lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-gray-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
            Conversations
          </div>
          <div className="max-h-[570px] overflow-y-auto">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setActiveId(conversation.id)}
                className={`w-full border-b border-gray-100 px-4 py-4 text-left transition ${
                  activeId === conversation.id ? "bg-purple-50" : "hover:bg-gray-50"
                }`}
              >
                <p className="truncate text-sm font-semibold text-gray-950">
                  {conversation.counterpart?.shopName ||
                    conversation.counterpart?.name ||
                    conversation.counterpart?.email ||
                    "Marketplace user"}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {conversation.lastMessagePreview || "Start the conversation"}
                </p>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-gray-500">
                Start a conversation from a product page.
              </p>
            )}
          </div>
        </aside>

        <section className="flex min-h-[620px] flex-col">
          {activeConversation ? (
            <>
              <header className="border-b border-gray-200 px-5 py-4">
                <p className="font-semibold text-gray-950">
                  {activeConversation.counterpart?.shopName ||
                    activeConversation.counterpart?.name ||
                    activeConversation.counterpart?.email}
                </p>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-5 py-5">
                {messages.map((message) => {
                  const own = message.senderId === userId;
                  return (
                    <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-6 ${
                          own ? "bg-purple-600 text-white" : "border border-gray-200 bg-white text-gray-800"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={sendMessage} className="flex gap-3 border-t border-gray-200 p-4">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={2000}
                  placeholder="Write a message..."
                  className="h-11 flex-1 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  aria-label="Send message"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-purple-600 text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <MessageCircle className="h-11 w-11 text-purple-500" />
              <p className="mt-4 font-semibold text-gray-950">No conversation selected</p>
              <p className="mt-1 text-sm text-gray-500">Choose a conversation or contact a seller.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
