import { NextRequest, NextResponse } from 'next/server';

// Timeout: configured in netlify.toml [functions] section (10s Starter / 26s paid)
// maxDuration is Vercel-specific and is ignored on Netlify

const CATBOX_API = 'https://catbox.moe/user/api.php';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'File diperlukan' }, { status: 400 });
        }

        // Validate file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            return NextResponse.json(
                { error: 'Format file tidak didukung. Gunakan JPG/PNG/WEBP untuk gambar atau MP4/MOV/WEBM untuk video.' },
                { status: 400 }
            );
        }

        // Max 200MB for Catbox (but Netlify limited to 6MB)
        const maxSize = 200 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'Ukuran file terlalu besar. Maksimal 200MB (limit serverless 6MB).' },
                { status: 400 }
            );
        }

        // Upload to Catbox.moe
        const catboxForm = new FormData();
        catboxForm.append('reqtype', 'fileupload');
        
        // Convert to Blob to ensure standard compatibility
        const fileContent = await file.arrayBuffer();
        const blob = new Blob([fileContent], { type: file.type });
        catboxForm.append('fileToUpload', blob, file.name || 'upload');

        const response = await fetch(CATBOX_API, {
            method: 'POST',
            body: catboxForm,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('[Upload] Catbox error:', response.status, text);
            return NextResponse.json(
                { error: `Upload ke server gagal (${response.status}). Jika file > 6MB, ini adalah limit server. Coba gunakan link URL langsung.` },
                { status: 502 }
            );
        }

        const url = await response.text();

        if (!url || !url.startsWith('https://')) {
            console.error('[Upload] Invalid Catbox response:', url);
            return NextResponse.json(
                { error: 'Upload gagal — response tidak valid dari penyimpanan.' },
                { status: 502 }
            );
        }

        return NextResponse.json({ url: url.trim() });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload gagal total. Coba gunakan link URL langsung.' },
            { status: 500 }
        );
    }
}
