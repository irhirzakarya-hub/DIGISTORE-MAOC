import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getConfig, saveConfig, isBlobConfigured } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getConfig();
    return NextResponse.json(
      {
        success: true,
        data,
        isBlobConfigured: isBlobConfigured(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('[API /api/data GET error]:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Optional password verification
    const currentConfig = await getConfig();
    const storedPassword = currentConfig.storeInfo?.adminPassword || currentConfig.general?.adminPassword || 'admin';
    
    if (body.authPassword && body.authPassword !== storedPassword) {
      return NextResponse.json(
        { success: false, error: 'Mot de passe administrateur incorrect' },
        { status: 401 }
      );
    }

    const { authPassword, ...dataToSave } = body;
    const result = await saveConfig(dataToSave);

    // Invalidate Next.js cache so the homepage immediately reflects new changes
    try {
      revalidatePath('/', 'page');
      revalidatePath('/', 'layout');
    } catch (revalErr) {
      console.warn('Revalidation warning:', revalErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Données enregistrées avec succès',
      result,
      isBlobConfigured: isBlobConfigured(),
    });
  } catch (error) {
    console.error('[API /api/data POST error]:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
