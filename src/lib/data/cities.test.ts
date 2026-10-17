import { describe, expect, it } from 'vitest';
import { CITIES, PROVINCE_CAPITAL_IDS } from './cities';

describe('cities (data kota offline)', () => {
  it('minimal 100 entri (PRD §F1.2), id unik', () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(100);
    expect(new Set(CITIES.map((c) => c.id)).size).toBe(CITIES.length);
  });

  it('38 provinsi, semua ibu kota provinsi ada', () => {
    expect(new Set(CITIES.map((c) => c.province)).size).toBe(38);
    expect(PROVINCE_CAPITAL_IDS).toHaveLength(38);
    const ids = new Set(CITIES.map((c) => c.id));
    for (const id of PROVINCE_CAPITAL_IDS) expect(ids.has(id), id).toBe(true);
    const capitalProvinces = new Set(
      PROVINCE_CAPITAL_IDS.map((id) => CITIES.find((c) => c.id === id)!.province)
    );
    expect(capitalProvinces.size).toBe(38);
  });

  it('koordinat di dalam batas Indonesia', () => {
    for (const c of CITIES) {
      expect(c.lat, c.name).toBeGreaterThanOrEqual(-11.5);
      expect(c.lat, c.name).toBeLessThanOrEqual(6.5);
      expect(c.lng, c.name).toBeGreaterThanOrEqual(94.5);
      expect(c.lng, c.name).toBeLessThanOrEqual(141.5);
    }
  });

  it('satu zona waktu per provinsi, sesuai pembagian WIB/WITA/WIT', () => {
    const byProvince = new Map<string, Set<string>>();
    for (const c of CITIES)
      byProvince.set(c.province, (byProvince.get(c.province) ?? new Set()).add(c.timeZone));
    for (const [p, zones] of byProvince) expect(zones.size, p).toBe(1);
    const zoneOf = (p: string) => [...byProvince.get(p)!][0];
    expect(zoneOf('DKI Jakarta')).toBe('Asia/Jakarta');
    expect(zoneOf('Kalimantan Tengah')).toBe('Asia/Jakarta');
    expect(zoneOf('Bali')).toBe('Asia/Makassar');
    expect(zoneOf('Kalimantan Selatan')).toBe('Asia/Makassar');
    expect(zoneOf('Maluku Utara')).toBe('Asia/Jayapura');
    expect(zoneOf('Papua Pegunungan')).toBe('Asia/Jayapura');
  });

  it('kota acuan uji akurasi tersedia lewat kode Kemendagri', () => {
    for (const code of ['3173', '3578', '7371'])
      expect(
        CITIES.some((c) => c.code === code),
        code
      ).toBe(true);
  });
});
