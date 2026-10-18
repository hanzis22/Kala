/**
 * Logika agenda (PRD §6). F4 baru memakai `assignLanes` untuk grid timetable;
 * `agendaFor` dan `markConflicts` menyusul di F2.
 */
import type { Minutes } from './types';

export interface Span {
  start: Minutes;
  /** Eksklusif. */
  end: Minutes;
}

export type WithLane<T> = T & { lane: number; laneCount: number };

/**
 * Membagi item yang bertumpuk ke kolom ("lane") agar tampil berdampingan.
 * Bentrok = irisan [mulai, selesai). Item yang hanya bersentuhan (08.30 selesai, 08.30 mulai) tidak bentrok.
 * Satu klaster = rangkaian item yang saling terhubung lewat irisan; semua item di klaster
 * mendapat `laneCount` yang sama. Urutan keluaran = urutan mulai, lalu selesai.
 */
export function assignLanes<T extends Span>(items: readonly T[]): WithLane<T>[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const result: WithLane<T>[] = [];

  let cluster: WithLane<T>[] = [];
  let laneEnds: Minutes[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    for (const item of cluster) item.laneCount = laneEnds.length;
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    if (item.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else {
      laneEnds[lane] = item.end;
    }
    cluster.push({ ...item, lane, laneCount: 0 });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flush();
  return result;
}
