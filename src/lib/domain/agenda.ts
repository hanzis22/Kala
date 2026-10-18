/**
 * Logika agenda (PRD §6). Grid timetable F4 memakai `groupOverlaps`; `assignLanes` disiapkan
 * untuk tampilan Hari (F2/F5). `agendaFor` dan `markConflicts` menyusul di F2.
 */
import type { Minutes } from './types';

export interface Span {
  start: Minutes;
  /** Eksklusif. */
  end: Minutes;
}

export type WithLane<T> = T & { lane: number; laneCount: number };

export interface OverlapGroup<T extends Span> extends Span {
  /** Urut mulai, lalu selesai. Lebih dari satu item = bentrok. */
  items: T[];
}

/**
 * Mengelompokkan item yang saling bertumpuk (langsung atau berantai) menjadi satu grup selebar
 * rentang gabungannya. Item yang hanya bersentuhan (08.30 selesai, 08.30 mulai) tidak bentrok.
 * Dipakai grid Minggu: di kolom ±45 px, sesi bentrok tampil sebagai satu blok "N sesi" (PRD §F4).
 */
export function groupOverlaps<T extends Span>(items: readonly T[]): OverlapGroup<T>[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const groups: OverlapGroup<T>[] = [];
  for (const item of sorted) {
    const last = groups.at(-1);
    if (last && item.start < last.end) {
      last.items.push(item);
      last.end = Math.max(last.end, item.end);
    } else {
      groups.push({ start: item.start, end: item.end, items: [item] });
    }
  }
  return groups;
}

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
