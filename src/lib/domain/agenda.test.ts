import { describe, expect, it } from 'vitest';
import { assignLanes } from './agenda';

const span = (id: string, start: number, end: number) => ({ id, start, end });
const lanes = (items: ReturnType<typeof assignLanes<ReturnType<typeof span>>>) =>
  items.map((i) => `${i.id}:${i.lane}/${i.laneCount}`);

describe('assignLanes', () => {
  it('kosong', () => {
    expect(assignLanes([])).toEqual([]);
  });

  it('tanpa bentrok: semua lane 0 dari 1', () => {
    expect(lanes(assignLanes([span('b', 600, 660), span('a', 420, 510)]))).toEqual(['a:0/1', 'b:0/1']);
  });

  it('bersentuhan bukan bentrok', () => {
    expect(lanes(assignLanes([span('a', 420, 510), span('b', 510, 600)]))).toEqual(['a:0/1', 'b:0/1']);
  });

  it('dua item bentrok berdampingan', () => {
    expect(lanes(assignLanes([span('a', 420, 510), span('b', 450, 540)]))).toEqual(['a:0/2', 'b:1/2']);
  });

  it('lane dipakai ulang di dalam klaster yang sama', () => {
    // a dan b bentrok, c mulai setelah a selesai tapi masih beririsan dengan b.
    const result = assignLanes([span('a', 420, 480), span('b', 450, 540), span('c', 480, 520)]);
    expect(lanes(result)).toEqual(['a:0/2', 'b:1/2', 'c:0/2']);
  });

  it('klaster terpisah punya laneCount sendiri', () => {
    const result = assignLanes([
      span('a', 420, 480),
      span('b', 430, 470),
      span('c', 440, 460),
      span('d', 600, 660)
    ]);
    expect(lanes(result)).toEqual(['a:0/3', 'b:1/3', 'c:2/3', 'd:0/1']);
  });

  it('tidak mengubah input', () => {
    const input = [span('a', 420, 510)];
    assignLanes(input);
    expect(input).toEqual([{ id: 'a', start: 420, end: 510 }]);
  });
});
