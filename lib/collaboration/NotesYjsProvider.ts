import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { b64ToUint8, uint8ToB64 } from "./b64";

type SyncResponse = {
  data: {
    snapshot?: { yDocStateB64?: string; seqUntil: number } | null;
    updates: { seq: number; updateB64: string }[];
    latestClock: number;
  };
};

type ProviderStatus = "disconnected" | "connecting" | "connected" | "synced";

type ProviderEvents = {
  status: (e: { status: ProviderStatus }) => void;
  synced: () => void;
};

export class NotesYjsProvider {
  public readonly document: Y.Doc;
  public readonly awareness: Awareness;

  private readonly apiBaseUrl: string;
  private readonly wsBaseUrl: string;
  private readonly noteId: string;
  private readonly token: string;
  private readonly clientId: string;
  private readonly debug: boolean;

  private ws: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private status: ProviderStatus = "disconnected";
  private isSyncedInternal = false;
  private pendingUpdateB64: string[] = [];
  private connectAttempt = 0;
  private latestSeq = -1;

  private listeners: Partial<Record<keyof ProviderEvents, Set<any>>> = {};

  constructor(opts: {
    apiBaseUrl: string; // e.g. https://api.example.com/_gateway_/notes
    wsBaseUrl: string; // e.g. ws://localhost:3010
    noteId: string;
    token: string;
    document: Y.Doc;
    clientId: string;
    debug?: boolean;
  }) {
    this.apiBaseUrl = opts.apiBaseUrl.replace(/\/$/, "");
    this.wsBaseUrl = opts.wsBaseUrl.replace(/\/$/, "");
    this.noteId = opts.noteId;
    this.token = opts.token;
    this.document = opts.document;
    this.clientId = opts.clientId;
    this.debug = opts.debug ?? process.env.NEXT_PUBLIC_NOTES_DEBUG === "true";
    this.awareness = new Awareness(this.document);
  }

  get isSynced() {
    return this.isSyncedInternal;
  }

  on<K extends keyof ProviderEvents>(event: K, cb: ProviderEvents[K]) {
    if (!this.listeners[event]) this.listeners[event] = new Set<any>();
    this.listeners[event]!.add(cb as any);
  }

  off<K extends keyof ProviderEvents>(event: K, cb: ProviderEvents[K]) {
    this.listeners[event]?.delete(cb as any);
  }

  private emit<K extends keyof ProviderEvents>(event: K, ...args: Parameters<ProviderEvents[K]>) {
    this.listeners[event]?.forEach((cb) => {
      try {
        (cb as any)(...args);
      } catch {
        // ignore listener errors
      }
    });
  }

  private setStatus(status: ProviderStatus) {
    if (this.status === status) return;
    this.status = status;
    if (this.debug) {
      console.debug("[notes-yjs] status", {
        status,
        noteId: this.noteId,
        ws: this.ws ? this.ws.readyState : null,
      });
    }
    this.emit("status", { status });
  }

  private async fetchAndApplySince(sinceSeq: number) {
    const url = `${this.apiBaseUrl}/notes/${this.noteId}/sync?sinceSeq=${sinceSeq}&limit=5000`;
    if (this.debug) {
      console.debug("[notes-yjs] sync:since", { sinceSeq, url });
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) {
      if (this.debug) {
        let body: string | undefined;
        try {
          body = await res.text();
        } catch {
          body = undefined;
        }
        console.error("[notes-yjs] sync:since-failed", { sinceSeq, status: res.status, body });
      }
      return;
    }
    const json = (await res.json()) as SyncResponse;
    const updates = json?.data?.updates ?? [];
    updates.forEach((u) => {
      try {
        Y.applyUpdate(this.document, b64ToUint8(u.updateB64), "remote");
        this.latestSeq = Math.max(this.latestSeq, Number(u.seq) || this.latestSeq);
      } catch (e) {
        if (this.debug) console.error("[notes-yjs] sync:since-apply-failed", { seq: u.seq, error: e });
      }
    });
    if (typeof json?.data?.latestClock === "number") {
      this.latestSeq = Math.max(this.latestSeq, json.data.latestClock);
    }
    if (this.debug) {
      console.debug("[notes-yjs] sync:since-ok", {
        requestedSince: sinceSeq,
        received: updates.length,
        latestSeq: this.latestSeq,
      });
    }
  }

  async connect() {
    if (this.destroyed) return;
    if (this.ws) return;

    this.connectAttempt += 1;
    this.setStatus("connecting");

    // 1) Initial REST sync (snapshot + updates)
    const syncUrl = `${this.apiBaseUrl}/notes/${this.noteId}/sync?sinceSeq=-1&limit=5000`;
    if (this.debug) {
      console.debug("[notes-yjs] connect:start", {
        attempt: this.connectAttempt,
        noteId: this.noteId,
        apiBaseUrl: this.apiBaseUrl,
        wsBaseUrl: this.wsBaseUrl,
        syncUrl,
        clientId: this.clientId,
        hasToken: !!this.token,
      });
    }
    const res = await fetch(
      syncUrl,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    if (!res.ok) {
      this.setStatus("disconnected");
      if (this.debug) {
        let body: string | undefined;
        try {
          body = await res.text();
        } catch {
          body = undefined;
        }
        console.error("[notes-yjs] sync:failed", { status: res.status, body });
      }
      throw new Error(`Notes sync failed: HTTP ${res.status}`);
    }
    const json = (await res.json()) as SyncResponse;
    const snapshotB64 = json.data.snapshot?.yDocStateB64;
    if (snapshotB64) Y.applyUpdate(this.document, b64ToUint8(snapshotB64), "remote");
    json.data.updates.forEach((u) => Y.applyUpdate(this.document, b64ToUint8(u.updateB64), "remote"));
    this.latestSeq = typeof json.data.latestClock === "number"
      ? json.data.latestClock
      : json.data.updates.reduce((max, u) => Math.max(max, Number(u.seq) || -1), -1);
    if (this.debug) {
      console.debug("[notes-yjs] sync:ok", {
        snapshot: !!snapshotB64,
        updates: json.data.updates?.length ?? 0,
        latestClock: json.data.latestClock,
        latestSeq: this.latestSeq,
      });
    }

    // 2) Realtime WS fanout
    const wsUrl = `${this.wsBaseUrl}/ws/notes?noteId=${encodeURIComponent(
      this.noteId
    )}&token=${encodeURIComponent(this.token)}`;
    if (this.debug) console.debug("[notes-yjs] ws:connecting", { wsUrl });
    this.ws = new WebSocket(wsUrl);

    const onLocalUpdate = (update: Uint8Array, origin: any) => {
      if (origin === "remote") return;
      const updateB64 = uint8ToB64(update);
      const payload = JSON.stringify({
        type: "yjsUpdate",
        updateB64,
        clientId: this.clientId,
      });
      const ws = this.ws;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        this.pendingUpdateB64.push(payload);
        if (this.debug) {
          console.debug("[notes-yjs] ws:queue-update", {
            queued: this.pendingUpdateB64.length,
            bytes: update.byteLength,
          });
        }
        return;
      }
      ws.send(payload);
      if (this.debug) {
        console.debug("[notes-yjs] ws:sent-update", { bytes: update.byteLength });
      }
    };
    this.document.on("update", onLocalUpdate);

    this.ws.onopen = () => {
      if (this.destroyed) return;
      this.setStatus("connected");
      if (this.debug) console.debug("[notes-yjs] ws:open");
      // Flush any updates created before WS opened
      if (this.pendingUpdateB64.length > 0) {
        const ws = this.ws;
        if (ws && ws.readyState === WebSocket.OPEN) {
          if (this.debug) console.debug("[notes-yjs] ws:flush", { count: this.pendingUpdateB64.length });
          this.pendingUpdateB64.forEach((p) => {
            try {
              ws.send(p);
            } catch {
              // ignore
            }
          });
          this.pendingUpdateB64 = [];
        }
      }
      this.pingTimer = setInterval(() => {
        const ws = this.ws;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: "ping" }));
      }, 20000);
    };

    this.ws.onmessage = (ev) => {
      if (this.destroyed) return;
      let msg: any;
      try {
        msg = JSON.parse(ev.data as string);
      } catch {
        if (this.debug) console.warn("[notes-yjs] ws:bad-json", { data: ev.data });
        return;
      }
      if (this.debug && msg?.type !== "ping") {
        const approxBytes = typeof ev.data === "string" ? ev.data.length : undefined;
        console.debug("[notes-yjs] ws:recv", { type: msg?.type, approxBytes, seq: msg?.seq });
      }

      if (msg?.type === "ready") {
        this.isSyncedInternal = true;
        this.setStatus("synced");
        this.emit("synced");
        return;
      }

      if (msg?.type === "yjsUpdate" && msg?.updateB64) {
        const msgSeq = Number(msg?.seq);
        // Authoritative catch-up: fetch by seq to ensure we never miss data.
        if (Number.isFinite(msgSeq) && msgSeq >= 0) {
          void this.fetchAndApplySince(msgSeq - 1);
          return;
        }

        // Fallback: apply the WS update payload directly if seq isn't present.
        try {
          const decoded = b64ToUint8(msg.updateB64);
          Y.applyUpdate(this.document, decoded, "remote");
          if (this.debug) {
            console.debug("[notes-yjs] ws:applied-update", {
              seq: msg?.seq,
              bytes: decoded.byteLength,
              noteId: msg?.noteId,
              latestSeq: this.latestSeq,
            });
          }
        } catch (e) {
          if (this.debug) {
            console.error("[notes-yjs] ws:apply-failed", {
              seq: msg?.seq,
              noteId: msg?.noteId,
              error: e,
            });
          }
        }
      }
    };

    const cleanup = () => {
      this.document.off("update", onLocalUpdate);
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.pingTimer = null;
      if (this.debug) {
        console.warn("[notes-yjs] ws:cleanup", {
          readyState: this.ws ? this.ws.readyState : null,
        });
      }
      this.ws = null;
      this.isSyncedInternal = false;
      this.pendingUpdateB64 = [];
      this.setStatus("disconnected");
    };

    this.ws.onclose = (e) => {
      if (this.debug) console.warn("[notes-yjs] ws:close", { code: e.code, reason: e.reason, wasClean: e.wasClean });
      cleanup();
    };
    this.ws.onerror = (e) => {
      if (this.debug) console.error("[notes-yjs] ws:error", e);
      cleanup();
    };
  }

  destroy() {
    this.destroyed = true;
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
    this.ws = null;
    this.listeners = {};
  }
}

