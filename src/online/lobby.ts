import { Client } from './client';
import { TRACKS } from '../game/tracks';
import type { Room } from './protocol';
const el = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
export function mountOnline(
  racing: (client: Client, room: Room) => void,
  home: () => void,
): Client {
  const client = new Client();
  const failure = (error: unknown) => {
    el('online-error').textContent =
      error instanceof Error ? error.message : String(error);
  };
  const run = (work: () => Promise<unknown>) => {
    el('online-error').textContent = '';
    void work().catch(failure);
  };
  const body = () => ({
    name: el<HTMLInputElement>('online-name').value,
    color: Number(el<HTMLSelectElement>('online-color').value),
  });
  const enter = () => {
    el('menu').hidden = true;
    el('online').hidden = false;
  };
  el('online-open').onclick = () => {
    enter();
    run(() => client.restore());
  };
  el('online-home').onclick = () => {
    run(async () => {
      try {
        if (client.credentials) await client.leave();
      } finally {
        el('room-panel').hidden = true;
        el('online-entry').hidden = false;
        el('online').hidden = true;
        home();
      }
    });
  };
  el('create-room').onsubmit = (e) => {
    e.preventDefault();
    run(() =>
      client.enter({
        ...body(),
        mode: el<HTMLSelectElement>('create-mode').value,
      }),
    );
  };
  el('join-room').onsubmit = (e) => {
    e.preventDefault();
    run(() =>
      client.enter(
        body(),
        el<HTMLInputElement>('join-code').value.trim().toUpperCase(),
      ),
    );
  };
  el('room-ready').onclick = () =>
    run(() =>
      client.command({
        type: 'ready',
        ready: !client.room?.players.find(
          (p) => p.id === client.credentials?.playerId,
        )?.ready,
      }),
    );
  el('room-start').onclick = () => run(() => client.command({ type: 'start' }));
  el('room-next').onclick = () => run(() => client.command({ type: 'next' }));
  el('room-save').onclick = () =>
    run(() =>
      client.command({
        type: 'settings',
        mode: 'free',
        course: Number(el<HTMLSelectElement>('room-course').value),
      }),
    );
  const leave = () =>
    run(async () => {
      try {
        await client.leave();
      } finally {
        el('room-panel').hidden = true;
        el('online-entry').hidden = false;
        home();
        enter();
      }
    });
  el('room-leave').onclick = leave;
  el('online-exit').onclick = leave;
  el('room-invite').onclick = () =>
    run(async () => {
      const u = new URL(location.href);
      u.searchParams.set('room', client.room!.code);
      await navigator.clipboard.writeText(u.href);
      client.status('招待リンクをコピーしました。');
    });
  client.status = (text) => {
    el('online-status').textContent = text;
    el('online-race-status').textContent = text;
  };
  client.changed = (room) => {
    el('online-entry').hidden = true;
    el('room-panel').hidden = false;
    el('room-code').textContent = room.code;
    el('room-mode').textContent =
      `${room.mode === 'free' ? 'フリー対戦' : 'グランプリ'} · ${TRACKS[room.course]!.name}${room.mode === 'grand-prix' ? ` · ${room.round}/${TRACKS.length}戦` : ''}`;
    const host = room.hostId === client.credentials?.playerId;
    el('room-settings').hidden =
      !host || room.mode !== 'free' || room.phase !== 'lobby';
    const list = el('room-members');
    list.replaceChildren();
    for (const p of room.players) {
      const li = document.createElement('li');
      li.textContent = `${p.name}${p.id === room.hostId ? '（ホスト）' : ''} · ${p.active ? (p.ready ? '準備完了' : '準備中') : '退出'} · ${p.score}pt`;
      list.append(li);
    }
    const mine = room.players.find(
      (p) => p.id === client.credentials?.playerId,
    );
    el('room-ready').textContent = mine?.ready ? '準備を取り消す' : '準備完了';
    el('room-ready').hidden = room.phase !== 'lobby';
    el('room-start').hidden = !host || room.phase !== 'lobby';
    el<HTMLButtonElement>('room-start').disabled =
      room.players.filter((p) => p.active).length < 2 ||
      room.players.some((p) => p.active && !p.ready);
    el('room-next').hidden =
      !host || !['results', 'complete'].includes(room.phase);
    if (room.raceId) racing(client, room);
  };
  const code = new URL(location.href).searchParams.get('room');
  if (code) {
    enter();
    el<HTMLInputElement>('join-code').value = code;
  }
  if (sessionStorage.getItem('biribiri-room')) {
    enter();
    run(() => client.restore());
  }
  return client;
}
