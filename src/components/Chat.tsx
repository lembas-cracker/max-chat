import { useEffect, useState } from "react";
import {
  type Credentials,
  type NotificationReceipt,
  sendMessage,
  deleteNotification,
  checkAccount,
  pollNotifications,
} from "../api/greenApi";

import { Send, ArrowLeft, MessageCircle, Plus } from "lucide-react";

interface Message {
  text: string;
  fromMe: boolean;
}

interface Chat {
  chatId: string;
  phone: string;
  messages: Message[];
}

interface ChatProps {
  credentials: Credentials;
}

export default function Chat({ credentials }: ChatProps) {
  const [chats, setChats] = useState<Record<string, Chat>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [inputText, setInputText] = useState("");

  function formatPhone(raw: string | number | undefined): string {
    if (raw === undefined || raw === null) return "";
    const digits = String(raw).replace(/\D/g, "");
    if (!digits) return "";
    return `+${digits}`;
  }

  const activeChat: Chat | null = (activeChatId && chats[activeChatId]) || null;

  const handleCreateChat = async () => {
    if (!phoneNumber) return;

    const phoneInt = parseInt(phoneNumber.replace(/[^0-9]/g, ""), 10);

    const account = await checkAccount(credentials, phoneInt);
    const chatId = account?.chatId;

    if (!account?.exist || !chatId) {
      console.error("This phone number does not have a MAX account.");
      return;
    }

    setChats((prev) => ({
      ...prev,
      [chatId]: {
        chatId,
        phone: phoneNumber,
        messages: prev[chatId]?.messages || [],
      },
    }));

    setActiveChatId(chatId);
    setPhoneNumber("");
  };

  const handleSend = async () => {
    if (!inputText.trim() || !activeChatId) {
      return;
    }

    const text = inputText;
    const chatId = activeChatId;

    setInputText("");
    setChats((prev) => ({
      ...prev,
      [chatId]: {
        ...prev[chatId],
        messages: [...prev[chatId].messages, { text, fromMe: true }],
      },
    }));

    await sendMessage(credentials, chatId, text);
  };

  const handleIncomingNotification = (notification: NotificationReceipt) => {
    const body = notification.body;
    if (body.typeWebhook !== "incomingMessageReceived") return;

    const text =
      body.messageData?.textMessageData?.textMessage ?? body.messageData?.extendedTextMessageData?.text ?? null;
    if (!text) return;

    const senderChatId = body.senderData?.chatId;
    if (!senderChatId) return;

    setChats((prev) => {
      const existing = prev[senderChatId];
      const newMessage: Message = { text, fromMe: false };

      const phone =
        existing?.phone ??
        body.senderData?.senderPhoneNumber?.toString() ??
        body.senderData?.senderName ??
        senderChatId.replace("@c.us", "");

      return {
        ...prev,
        [senderChatId]: {
          chatId: senderChatId,
          phone,
          messages: [...(existing?.messages ?? []), newMessage],
        },
      };
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    async function listenToNotifications() {
      for await (const notification of pollNotifications(credentials, controller.signal)) {
        handleIncomingNotification(notification);
        await deleteNotification(credentials, notification.receiptId);
      }
    }

    listenToNotifications();

    return () => {
      controller.abort();
    };
  }, [credentials]);

  return (
    <div className="flex h-screen overflow-hidden bg-max-bg text-max-text">
      <aside
        className={`h-full w-full flex-col bg-max-panel md:flex md:w-85 md:border-r md:border-max-border ${
          activeChat ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="text-lg font-semibold text-max-text">Чаты</h2>
        </div>

        {/* new chat */}
        <div className="px-3 pb-3">
          <div className="flex gap-2">
            <input
              className="w-full rounded-lg border border-transparent bg-max-panel-2 py-2 px-3 text-sm text-max-text placeholder:text-max-text-dim/70 outline-none transition focus:border-max-accent/60"
              placeholder="Номер телефона 7XXXXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button
              onClick={handleCreateChat}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-max-accent text-white transition hover:bg-max-accent-hover"
              aria-label="Create chat"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* chat list */}
        <div className="flex-1 overflow-y-auto">
          {Object.values(chats).length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-max-text-dim">Чатов пока нет</p>
          )}
          {Object.values(chats).map((chat) => {
            const active = chat.chatId === activeChatId;
            const last = chat.messages.at(-1)?.text ?? "Сообщений пока нет";
            return (
              <button
                key={chat.chatId}
                onClick={() => setActiveChatId(chat.chatId)}
                className={`w-full px-4 py-3 text-left transition ${active ? "bg-max-hover" : "hover:bg-max-hover/60"}`}
              >
                <div className="truncate text-sm font-medium text-max-text">{formatPhone(chat.phone)}</div>
                <div className="mt-0.5 truncate text-xs text-max-text-dim">{last}</div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* main */}
      <main className={`h-full flex-1 flex-col bg-max-bg ${activeChat ? "flex" : "hidden md:flex"}`}>
        {activeChat ? (
          <>
            <header className="flex items-center gap-3 border-b border-max-border bg-max-panel px-3 py-2.5 md:px-5">
              <button
                onClick={() => setActiveChatId(null)}
                className="rounded-full p-2 text-max-text-dim transition hover:bg-max-hover hover:text-max-text md:hidden"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-max-text">{formatPhone(activeChat.phone)}</p>
              </div>
            </header>

            {/* messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 md:px-6">
              <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
                {activeChat.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-snug md:max-w-[65%] ${
                        msg.fromMe
                          ? "rounded-br-md bg-max-bubble-out text-white"
                          : "rounded-bl-md bg-max-bubble-in text-max-text ring-1 ring-white/5"
                      }`}
                    >
                      <p className="whitespace-pre-wrap wrap-break-word">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* input + submit */}
            <footer className="border-t border-max-border bg-max-panel px-3 py-3 md:px-5">
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                <div className="flex flex-1 items-end rounded-2xl border border-max-border bg-max-panel-2 px-3 py-1.5 transition focus-within:border-max-accent/60">
                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Сообщение"
                    className="max-h-35 w-full resize-none bg-transparent py-1.5 text-sm text-max-text placeholder:text-max-text-dim/70 outline-none"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-max-accent text-white transition hover:bg-max-accent-hover disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex h-full flex-1 flex-col items-center justify-center bg-max-bg text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-max-accent/10 ring-1 ring-max-accent/20">
              <MessageCircle className="h-8 w-8 text-max-accent" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-max-text-dim">Выберите чат или создайте новый</p>
          </div>
        )}
      </main>
    </div>
  );
}
