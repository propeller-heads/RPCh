import { createLogger, createApiUrl } from "./utils";
import WebSocketHelper from "./ws-helper";
import type { onEventType } from "./ws-helper";

const log = createLogger(["hoprd"]);

/**
 * Send a segment to a HOPRd node.
 */
export const sendMessage = async ({
  apiEndpoint,
  apiToken,
  message,
  destination,
  path,
  hops,
}: {
  apiEndpoint: string;
  apiToken: string | undefined;
  message: string;
  destination: string;
  path?: string[];
  hops?: number;
}): Promise<void | string> => {
  const [url, headers] = createApiUrl(
    "http",
    apiEndpoint,
    "/api/v2/messages",
    apiToken
  );

  const body: {
    body: string;
    recipient: string;
    path?: string[];
    hops?: number;
  } = {
    body: message,
    recipient: destination,
    path,
    hops,
  };

  log.verbose(
    "sending message to HOPRd node",
    message,
    destination,
    "with path",
    path && path.length > 0
      ? path.join("-")
      : path && path.length === 0
      ? "direct"
      : "auto-path"
  );

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const genericLogInfo = [
    message,
    destination,
    "with path",
    path && path.length > 0
      ? path.join("-")
      : path && path.length === 0
      ? "direct"
      : "auto-path",
  ].join(" ");
  if (response.status === 202) {
    log.verbose("sent message to HOPRd node", genericLogInfo);
    const text = await response.text();
    return text;
  } else {
    let errorMessage = await response.text();
    log.error(
      "failed to send message to HOPRd node",
      genericLogInfo,
      response.status,
      errorMessage
    );
    throw new Error(
      `HOPRd node responsed with error "${errorMessage}" when sending message: ${genericLogInfo}`
    );
  }
};

/**
 * Subscribes to the HOPRd endpoint for incoming messages.
 * @param onEvent called everytime a websocket event happens
 *        ("message", data) - incoming message from HOPRd
 * @returns websocket listener
 */
export const createMessageListener = async (
  apiEndpoint: string,
  apiToken: string,
  onEvent: onEventType,
  options?: {
    maxTimeWithoutPing?: number;
    attemptToReconnect?: boolean;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
  }
) => {
  const [url] = createApiUrl(
    "ws",
    apiEndpoint,
    "/api/v2/messages/websocket",
    apiToken
  );
  return new WebSocketHelper(new URL(url), onEvent, {
    maxTimeWithoutPing: options?.maxTimeWithoutPing ?? 60e3,
    reconnectDelay: options?.reconnectDelay ?? 100,
    maxReconnectAttempts: options?.maxReconnectAttempts ?? 3,
  });
};

/**
 * Send a segment to a HOPRd node.
 */
export const fetchPeerId = async ({
  apiEndpoint,
  apiToken,
}: {
  apiEndpoint: string;
  apiToken: string | undefined;
}): Promise<void | string> => {
  const [url, headers] = createApiUrl(
    "http",
    apiEndpoint,
    "/api/v2/account/addresses",
    apiToken
  );

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (response.status === 200) {
    log.verbose("received addresses from HOPRd node");
    const result = (await response.json()) as { native: string; hopr: string };
    return result.hopr;
  } else {
    log.error(
      "failed to get addresses from HOPRd node",
      response.status,
      await response.text()
    );
  }
};
