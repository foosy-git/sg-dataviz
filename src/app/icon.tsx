import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  const imgPath = join(process.cwd(), 'public', 'merlion-bg.jpg');
  const imgBuffer = readFileSync(imgPath);
  const imgBase64 = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', background: '#FBF9F5', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
        <img src={imgBase64} width={32} height={32} style={{ objectFit: 'cover' }} />
      </div>
    ),
    { ...size }
  );
}
