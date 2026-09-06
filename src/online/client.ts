import type { Credentials, Room, Response } from './protocol';
const base = import.meta.env.PUBLIC_API_BASE as string | undefined;
export class Client {
  credentials: Credentials | null = null;
  room: Room | null = null;
  changed: (room: Room) => void = () => {};
  status: (text: string) => void = () => {};
  private ws: WebSocket | null = null;
  private heartbeat: ReturnType<typeof setInterval> | undefined;
  private reconnect: ReturnType<typeof setTimeout> | undefined;
  private stopped = false;
  private config: { websocketUrl: string; httpHost: string } | null = null;
  private heartBusy = false;
  async request(path: string, body?: object): Promise<Response> {
    if (!base) throw new Error('オンライン対戦の接続先が未設定です。');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.credentials)
      headers['Authorization'] = `Bearer ${this.credentials.token}`;
    const result = await fetch(base + path, {
      method: body ? 'POST' : 'GET',
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(8000),
    });
    if (!result.ok) {
      const error = (await result
        .json()
        .catch(() => ({ detail: '通信エラー' }))) as { detail?: unknown };
      throw new Error(
        typeof error.detail === 'string'
          ? error.detail
          : `通信エラー (${result.status})`,
      );
    }
    return result.json() as Promise<Response>;
  }
  accept(room: Room): void {
    if (!this.credentials || room.code !== this.credentials.code) return;
    if (!this.room || room.version > this.room.version) {
      this.room = room;
      this.changed(room);
    }
  }
  async enter(body: object, code?: string): Promise<void> {
    const response = await this.request(
      code ? `/rooms/${encodeURIComponent(code)}/join` : '/rooms',
      body,
    );
    if (!response.credentials) throw new Error('参加情報がありません。');
    this.credentials = response.credentials;
    sessionStorage.setItem('biribiri-room', JSON.stringify(this.credentials));
    this.stopped = false;
    this.accept(response.room);
    await this.connect();
  }
  async restore(): Promise<void> {
    const saved = sessionStorage.getItem('biribiri-room');
    if (!saved) return;
    this.credentials = JSON.parse(saved) as Credentials;
    try {
      this.accept((await this.request(`/rooms/${this.credentials.code}`)).room);
      await this.connect();
    } catch (error) {
      this.stop();
      throw error;
    }
  }
  async command(body: object): Promise<Room> {
    if (!this.credentials) throw new Error('ルームに参加してください。');
    const response = await this.request(
      `/rooms/${this.credentials.code}/commands`,
      { requestId: crypto.randomUUID(), ...body },
    );
    this.accept(response.room);
    return response.room;
  }
  async leave(): Promise<void> {
    try {
      await this.command({ type: 'leave' });
    } finally {
      this.stop();
    }
  }
  stop(): void {
    this.stopped = true;
    clearInterval(this.heartbeat);
    clearTimeout(this.reconnect);
    this.ws?.close();
    this.ws = null;
    this.credentials = null;
    this.room = null;
    sessionStorage.removeItem('biribiri-room');
  }
  private async connect(): Promise<void> {
    if (!base || !this.credentials) return;
    const response = await fetch(base + '/config', {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('接続設定を取得できません。');
    this.config = (await response.json()) as {
      websocketUrl: string;
      httpHost: string;
    };
    this.stopped = false;
    clearTimeout(this.reconnect);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }
    this.socket();
    clearInterval(this.heartbeat);
    this.heartbeat = setInterval(() => {
      if (this.heartBusy || this.stopped) return;
      this.heartBusy = true;
      void this.command({ type: 'heartbeat' })
        .catch((e) => this.status(String(e)))
        .finally(() => {
          this.heartBusy = false;
        });
    }, 2000);
  }
  private socket(): void {
    if (this.stopped || !this.credentials || !this.config) return;
    const authorization = {
      Authorization: `${this.credentials.code}:${this.credentials.token}`,
      host: this.config.httpHost,
    };
    const header = btoa(JSON.stringify(authorization))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const url = new URL(this.config.websocketUrl, location.href);
    url.protocol =
      url.protocol === 'http:'
        ? 'ws:'
        : url.protocol === 'https:'
          ? 'wss:'
          : url.protocol;
    const ws = new WebSocket(url, ['aws-appsync-event-ws', `header-${header}`]);
    this.ws = ws;
    this.status('リアルタイム接続中…');
    const code = this.credentials.code;
    ws.onopen = () => ws.send(JSON.stringify({ type: 'connection_init' }));
    ws.onmessage = (event) => {
      try {
        const m = JSON.parse(String(event.data)) as {
          type: string;
          event?: string | string[];
        };
        if (m.type === 'connection_ack')
          ws.send(
            JSON.stringify({
              type: 'subscribe',
              id: 'room',
              channel: `/rooms/${code}`,
              authorization,
            }),
          );
        if (m.type === 'subscribe_success') {
          this.status('リアルタイム接続中');
          void this.command({ type: 'heartbeat' }).catch((e) =>
            this.status(String(e)),
          );
        }
        if (m.type === 'data' && m.event)
          for (const item of Array.isArray(m.event) ? m.event : [m.event])
            this.accept(JSON.parse(item) as Room);
        if (m.type.includes('error')) {
          this.status('再接続中…');
          ws.close();
        }
      } catch {
        this.status('配信データを確認できません。');
      }
    };
    ws.onclose = () => {
      if (!this.stopped) {
        this.status('再接続中…');
        this.reconnect = setTimeout(
          () => this.socket(),
          1000 + Math.random() * 1000,
        );
      }
    };
  }
}
