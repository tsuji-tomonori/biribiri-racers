import { afterEach, expect, it, vi } from 'vitest';
import { setTimeout as settleIO } from 'node:timers/promises';
import { serve, type Store, type StoredRoom } from '../../src/sites/rooms';
import type { Client } from '../../src/online/client';

const clients: Client[] = [];
afterEach(() => {
  clients.splice(0).forEach((client) => client.stop());
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});
it('別々のクライアントが参加・準備・開始・移動をHTTPで共有する', async () => {
  vi.useFakeTimers();
  vi.stubEnv('PUBLIC_API_BASE', '/api');
  vi.resetModules();
  const data = new Map<string, StoredRoom>(),
    saved = new Map<string, string>();
  const store: Store = {
    async get(code) {
      return structuredClone(data.get(code) ?? null);
    },
    async put(room, previous) {
      const old = data.get(room.code);
      if (previous === null ? !!old : old?.version !== previous) return false;
      data.set(room.code, structuredClone(room));
      return true;
    },
    async rate() {
      return true;
    },
  };
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
    removeItem: (key: string) => saved.delete(key),
  });
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) =>
    serve(new Request(new URL(url, 'https://race.test'), init), store),
  );
  const { Client } = await import('../../src/online/client');
  const a = new Client(),
    b = new Client();
  clients.push(a, b);
  await a.enter({ name: '青', color: 0, mode: 'free' });
  await b.enter({ name: '桃', color: 1 }, a.room!.code);
  await settleIO(20);
  await vi.advanceTimersByTimeAsync(1100);
  await settleIO(20);
  expect(a.room!.players.map((p) => p.name)).toEqual(['青', '桃']);
  await a.command({ type: 'ready', ready: true });
  await b.command({ type: 'ready', ready: true });
  await a.command({ type: 'start' });
  await vi.advanceTimersByTimeAsync(3200);
  await settleIO(20);
  expect(b.room!.phase).toBe('racing');
  expect(a.room!.raceId).toBe(b.room!.raceId);
  const before = b.room!.players[0]!.racer!.x;
  await a.command({
    type: 'input',
    raceId: a.room!.raceId,
    seq: 1,
    frames: [{ ticks: 24, input: { steer: 0, push: false, assist: true } }],
  });
  await vi.advanceTimersByTimeAsync(500);
  await settleIO(20);
  expect(b.room!.players[0]!.ticks).toBe(24);
  expect(b.room!.players[0]!.racer!.x).not.toBe(before);
});
