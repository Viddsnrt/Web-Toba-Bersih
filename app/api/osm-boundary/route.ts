import { NextRequest, NextResponse } from 'next/server';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

const REQUEST_HEADERS = {
  'Content-Type': 'text/plain',
  'Accept': 'application/json, text/plain, */*',
  'User-Agent': 'TobaBersih-App/1.0 (contact: dlhtoba@gmail.com)',
};

// Timeout per endpoint dipersingkat — endpoint publik yang butuh >10 detik
// biasanya memang sedang bermasalah, mending cepat gagal & lanjut ke yang lain
const TIMEOUT_MS = 18000;

// Cache sederhana in-memory: query yang sama tidak perlu hit Overpass berulang.
// Boundary administratif (kecamatan/desa) nyaris tidak pernah berubah,
// jadi cache 1 jam sudah cukup aman.
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 jam
const cache = new Map<string, { data: string; expiresAt: number }>();

function getFromCache(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: string) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function fetchFromEndpoint(endpoint: string, query: string): Promise<string> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: REQUEST_HEADERS,
    body: query,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Overpass HTTP ${res.status} (${endpoint}): ${text.slice(0, 300)}`);
  }

  return text;
}

export async function POST(req: NextRequest) {
  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
  }

  if (!body.query) {
    return NextResponse.json({ error: 'Query kosong' }, { status: 400 });
  }

  const cacheKey = body.query.trim();

  // Cek cache dulu — kalau ada, langsung balikin tanpa hit Overpass sama sekali
  const cached = getFromCache(cacheKey);
  if (cached) {
    return new NextResponse(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  // Jalankan semua endpoint SECARA PARALEL, ambil yang pertama berhasil.
  // Ini jauh lebih cepat dibanding berurutan — total waktu tunggu = waktu
  // endpoint tercepat, bukan jumlah semua endpoint yang gagal.
  const results = await Promise.allSettled(
    OVERPASS_ENDPOINTS.map((endpoint) => fetchFromEndpoint(endpoint, body.query!))
  );

  const success = results.find(
    (r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled'
  );

  if (success) {
    setCache(cacheKey, success.value);
    return new NextResponse(success.value, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  }

  // Semua endpoint gagal — kumpulkan pesan errornya untuk logging
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason?.message || 'unknown error');

  const lastError = errors.join(' | ');
  console.error('Semua endpoint Overpass gagal:', lastError);

  return NextResponse.json(
    { error: `Gagal menghubungi semua server Overpass. Detail: ${lastError}` },
    { status: 502 }
  );
}