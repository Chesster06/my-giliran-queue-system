import QRCode from 'qrcode';

export async function generateQrDataUrl(text, options = {}) {
  try {
    return await QRCode.toDataURL(text, {
      width: options.width || 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch {
    return '';
  }
}
