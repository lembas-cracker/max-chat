import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { sleep } from "../utils";
import { pollNotifications } from "./greenApi";

jest.mock("../utils", () => ({
  sleep: jest.fn(() => Promise.resolve()),
}));

const sleepMock = sleep as jest.MockedFunction<typeof sleep>;

const creds = { idInstance: "1", apiTokenInstance: "t" };

function jsonResponse(data: unknown): Response {
  return { json: async () => data } as Response;
}

describe("pollNotifications", () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("yields notifications as they arrive", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ receiptId: 1, body: { typeWebhook: "a" } }))
      .mockResolvedValueOnce(jsonResponse({ receiptId: 2, body: { typeWebhook: "b" } }))
      .mockImplementation(() => new Promise(() => {}));

    const controller = new AbortController();
    const gen = pollNotifications(creds, controller.signal);

    const first = await gen.next();
    const second = await gen.next();

    expect(first.value.receiptId).toBe(1);
    expect(second.value.receiptId).toBe(2);

    controller.abort();
    await gen.return(undefined);
  });

  it("does not yield when the API returns null", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(null))
      .mockResolvedValueOnce(jsonResponse({ receiptId: 99, body: {} }))
      .mockImplementation(() => new Promise(() => {}));

    const controller = new AbortController();
    const gen = pollNotifications(creds, controller.signal);

    const result = await gen.next();
    expect(result.value.receiptId).toBe(99);

    controller.abort();
    await gen.return(undefined);
  });

  it("waits client-side when the API returns null (throttle safety)", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(null))
      .mockResolvedValueOnce(jsonResponse({ receiptId: 1, body: {} }))
      .mockImplementation(() => new Promise(() => {}));

    const controller = new AbortController();
    const gen = pollNotifications(creds, controller.signal);

    await gen.next();

    expect(sleepMock).toHaveBeenCalledWith(5000);

    controller.abort();
    await gen.return(undefined);
  });
});
