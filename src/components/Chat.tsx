import { useEffect, useState } from "react";
import {
  type Credentials,
  type NotificationReceipt,
  sendMessage,
  deleteNotification,
  checkAccount,
  pollNotifications,
} from "../api/greenApi";

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
      const existingMessages = prev[senderChatId]?.messages || [];
      const newMessage: Message = { text, fromMe: false };

      return {
        ...prev,
        [senderChatId]: {
          chatId: senderChatId,
          phone: senderChatId.replace("@c.us", ""),
          messages: [...existingMessages, newMessage],
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
    <div className="flex h-screen bg-gray-100">
      <aside className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold mb-2">New Chat</h2>
          <div className="flex gap-2">
            <input
              className="border p-2 rounded flex-1"
              placeholder="Phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button onClick={handleCreateChat} className="bg-blue-600 text-white px-3 rounded">
              +
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {Object.values(chats).map((chat) => (
            <button
              key={chat.chatId}
              onClick={() => setActiveChatId(chat.chatId)}
              className={`w-full text-left p-3 border-b hover:bg-gray-50 ${
                activeChatId === chat.chatId ? "bg-blue-50" : ""
              }`}
            >
              <div className="font-medium">{chat.phone}</div>
              <div className="text-sm text-gray-500 truncate">{chat.messages.at(-1)?.text ?? "No messages yet"}</div>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            <header className="p-4 border-b bg-white">
              <h2 className="font-semibold">{activeChat.phone}</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeChat.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-xs p-2 rounded ${
                    msg.fromMe ? "bg-blue-500 text-white ml-auto" : "bg-white border"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <footer className="p-4 bg-white border-t flex gap-2">
              <input
                className="flex-1 border p-2 rounded"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button onClick={handleSend} className="bg-blue-600 text-white px-4 rounded">
                Send
              </button>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">Select or create a chat</div>
        )}
      </main>
    </div>
  );
}
