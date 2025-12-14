const isOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

export const buildWebSocketUrl = (pathOverride) => {
  if (typeof window === "undefined") {
    throw new Error("buildWebSocketUrl must be used in a browser environment");
  }

  const isSecure = window.location.protocol === "https:";
  const protocol = isSecure ? "wss" : "ws";

  const envHost = import.meta.env.VITE_WS_HOST;
  const envPort = import.meta.env.VITE_WS_PORT;
  const envPath = import.meta.env.VITE_WS_PATH;

  const host = envHost || window.location.hostname;
  const port =
    envPort ||
    window.location.port || 
    (isSecure ? "443" : "80");

  const path = pathOverride || envPath || "/ws/sensors/";

  const base = port ? `${protocol}://${host}:${port}` : `${protocol}://${host}`;
  console.log("WebSocket URL:", `${base}${path}`);  
  return `${base}${path}`;
};

export const createWebSocket = ({
  path,
  onMessage,
  onOpen,
  onClose,
  onError,
  autoReconnect = true,
  reconnectDelay = 2000,
} = {}) => {
  let ws = null;
  let closedManually = false;

  const connect = () => {
    if (isOffline()) {
      console.warn("Skipping WebSocket connect: offline");
      if (autoReconnect && !closedManually) {
        setTimeout(connect, reconnectDelay);
      }
      return;
    }

    const url = buildWebSocketUrl(path);
    ws = new WebSocket(url);

    ws.onopen = (event) => {
      onOpen && onOpen(event);
    };

    ws.onmessage = (event) => {
      if (onMessage) {
        try {
          const data = JSON.parse(event.data);
          onMessage(data, event);
        } catch (e) {
          console.error("Failed to parse WS message as JSON", e);
          onMessage(event.data, event); 
        }
      }
    };

    ws.onerror = (event) => {
      onError && onError(event);
    };

    ws.onclose = (event) => {
      onClose && onClose(event);
      if (autoReconnect && !closedManually) {
        setTimeout(connect, reconnectDelay);
      }
    };
  };

  connect();

  const close = () => {
    closedManually = true;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };

  const sendJson = (payload) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  };

  return { close, sendJson };
};
