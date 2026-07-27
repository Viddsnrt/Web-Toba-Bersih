import { NextRequest, NextResponse } from 'next/server';

// Beberapa mirror Overpass API — kalau yang utama gagal/sibuk, otomatis coba yang berikutnya
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

const REQUEST_HEADERS = {
  'Content-Type': 'text/plain',
  'Accept': 'application/json, text/plain, */*',
  // Overpass API menolak request tanpa User-Agent yang jelas (dianggap bot kasar)
  'User-Agent': 'TobaBersih-App/1.0 (contact: dlhtoba@gmail.com)',
};

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

  let lastError = '';

  // Coba tiap endpoint secara berurutan sampai ada yang berhasil
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: REQUEST_HEADERS,
        body: body.query,
        // Batasi waktu tunggu per endpoint supaya tidak menggantung lama
        signal: AbortSignal.timeout(20000),
      });

      const text = await res.text();

      if (!res.ok) {
        lastError = `Overpass HTTP ${res.status} (${endpoint}): ${text.slice(0, 300)}`;
        console.warn(lastError);
        continue; // coba endpoint berikutnya
      }

      // Berhasil — langsung kembalikan hasilnya
      return new NextResponse(text, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      lastError = `Gagal menghubungi ${endpoint}: ${err?.message || 'unknown error'}`;
      console.warn(lastError);
      continue; // coba endpoint berikutnya
    }
  }

  // Semua endpoint gagal
  console.error('Semua endpoint Overpass gagal:', lastError);
  return NextResponse.json(
    { error: `Gagal menghubungi semua server Overpass. Detail terakhir: ${lastError}` },
    { status: 502 }
  );
}