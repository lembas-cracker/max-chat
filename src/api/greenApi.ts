import { sleep } from "../utils";

const BASE_URL = "https://3100.api.green-api.com";

export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface NotificationReceipt {
  receiptId: number;
  body: NotificationBody;
}

export interface NotificationBody {
  typeWebhook: string;
  instanceData?: {
    idInstance: number;
    wid: string;
    typeInstance: string;
  };
  timestamp?: number;
  idMessage?: string;
  senderData?: {
    chatId: string;
    sender: string;
    senderName?: string;
    senderPhoneNumber?: string | number;
    chatName?: string;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: {
      textMessage: string;
    };
    extendedTextMessageData?: {
      text: string;
    };
  };
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId: string;
  fromCache: boolean;
}

async function makeApiRequest(
  idInstance: string,
  endpoint: string,
  method: "GET" | "POST" | "DELETE",
  body?: any,
  signal?: AbortSignal,
): Promise<any> {
  const url = `${BASE_URL}/waInstance${idInstance}/${endpoint}`;

  const response = await fetch(url, {
    method,
    signal,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json().catch(() => null);
}

export async function checkAccount(
  { idInstance, apiTokenInstance }: Credentials,
  phoneNumber: number,
): Promise<CheckAccountResponse | null> {
  return makeApiRequest(idInstance, `checkAccount/${apiTokenInstance}`, "POST", { phoneNumber, force: true });
}

export async function sendMessage(
  { idInstance, apiTokenInstance }: Credentials,
  chatId: string,
  message: string,
): Promise<SendMessageResponse | null> {
  return makeApiRequest(idInstance, `sendMessage/${apiTokenInstance}`, "POST", { chatId, message });
}

export async function receiveNotification(
  { idInstance, apiTokenInstance }: Credentials,
  signal: AbortSignal,
): Promise<NotificationReceipt | null> {
  return makeApiRequest(idInstance, `receiveNotification/${apiTokenInstance}`, "GET", undefined, signal);
}

export async function* pollNotifications(
  credentials: Credentials,
  signal: AbortSignal,
): AsyncGenerator<NotificationReceipt> {
  while (!signal.aborted) {
    const throttle = sleep(5000);
    const notification = await receiveNotification(credentials, signal);

    if (notification) {
      // TODO: Abort timeout to prevent them from accumulating when getting a lot of notifications.
      yield notification;
    } else {
      // Sometimes the endpoint responds immediately without waiting 5 seconds.
      // We can wait client-side as a safety measure against spamming requests.
      await throttle;
    }
  }
}

export async function deleteNotification(
  { idInstance, apiTokenInstance }: Credentials,
  receiptId: number,
): Promise<{ result: boolean }> {
  return makeApiRequest(idInstance, `deleteNotification/${apiTokenInstance}/${receiptId}`, "DELETE");
}
