import { HttpRequestError, type Transport } from "viem";
import { type Mock, expect, test, vi } from "vitest";
import { dynamicRateLimit } from "./dynamicRateLimit.js";

let request: Mock;

const createMockTransport = () => {
  request = vi.fn(() => Promise.resolve());
  const mockTransport = (() => ({
    request,
  })) as unknown as Transport;

  return { request, mockTransport };
};

test("sends a request", async () => {
  const { request, mockTransport } = createMockTransport();

  const transport = dynamicRateLimit(mockTransport, {
    browser: false,
  })({});

  await transport.request({ method: "eth_chainId" });

  expect(request).toHaveBeenCalledTimes(1);
});

test("handles a 429", async () => {
  const { request, mockTransport } = createMockTransport();

  const transport = dynamicRateLimit(mockTransport, {
    browser: false,
  })({ retryCount: 3 });

  request.mockRejectedValueOnce(
    new HttpRequestError({ status: 429, url: "rpc.ponder.sh" }),
  );

  await transport.request({ method: "eth_chainId" });

  expect(request).toHaveBeenCalledTimes(2);
});
