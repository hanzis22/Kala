import type { City } from './types';

/** Jarak lingkaran besar (km). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function nearestCity(lat: number, lng: number, cities: readonly City[]): City {
  if (cities.length === 0) throw new RangeError('daftar kota kosong');
  let best = cities[0];
  let bestDist = Infinity;
  for (const c of cities) {
    const d = distanceKm({ lat, lng }, c);
    if (d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

/**
 * Privasi: koordinat dari Geolocation dibulatkan ke 2 desimal (~1 km) sebelum disimpan.
 * Cukup untuk waktu sholat (selisih jauh di bawah 1 menit).
 */
export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100 + 0;
}
