// Actual localhost HTTP transport for adapter tests. External AI calls in the
// caller are isolated test doubles, NOT evidence of a working provider runtime.
import type { Express } from "express";
import type { AddressInfo } from "node:net";
import { once } from "node:events";

type HttpResult = { status: number; body: any; headers: Headers };

export default function request(app: Express) {
  const execute = async (method: string, route: string, body?: unknown): Promise<HttpResult> => {
    const server = app.listen(0, "127.0.0.1");
    try {
      // listen() binds asynchronously: wait for the real socket before using its port.
      await once(server, "listening");
      const port = (server.address() as AddressInfo).port;
      const response = await fetch(`http://127.0.0.1:${port}${route}`, {
        method,
        headers: { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      const raw = await response.text();
      let parsed;
      try { parsed = JSON.parse(raw); } catch { parsed = raw; }
      return { status: response.status, body: parsed, headers: response.headers };
    } finally {
      if (server.listening) {
        await new Promise<void>((resolve, reject) => {
          server.close(error => error ? reject(error) : resolve());
        });
      }
    }
  };
  return {
    get: (path: string) => execute("GET", path),
    delete: (path: string) => execute("DELETE", path),
    post: (path: string) => ({ send: (body: unknown) => execute("POST", path, body) }),
  };
}
