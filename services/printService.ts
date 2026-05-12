import { Item } from '@/services/itemService';
import { getAppearanceSettings } from '@/services/appearanceService';
import QRCode from 'qrcode';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function printItemLabel(item: Item) {
  if (typeof window === 'undefined') {
    throw new Error('La impresion esta disponible solo en web/PC por ahora.');
  }

  const qrValue = item.qrCode || item.code;

  const [qrDataUrl, appearance] = await Promise.all([
    QRCode.toDataURL(qrValue, {
    width: 220,
    margin: 1,
    }),
    getAppearanceSettings(),
  ]);
  const printLogoUrl = appearance.showLogoOnPrints
    ? appearance.printLogoUrl || appearance.logoUrl || ''
    : '';

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Etiqueta ${escapeHtml(item.code)}</title>
        <style>
          @page {
            size: 60mm 40mm;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }

          .label {
            width: 60mm;
            height: 40mm;
            box-sizing: border-box;
            padding: 4mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          .qr {
            width: 22mm;
            height: 22mm;
          }

          .logo {
            max-width: 34mm;
            max-height: 7mm;
            object-fit: contain;
            margin-bottom: 1mm;
          }

          .code {
            font-size: 12px;
            font-weight: bold;
            margin-top: 2mm;
          }

          .line {
            font-size: 10px;
            margin-top: 1mm;
          }
        </style>
      </head>
      <body>
        <div class="label">
          ${printLogoUrl ? `<img class="logo" src="${escapeHtml(printLogoUrl)}" />` : ''}
          <img class="qr" src="${qrDataUrl}" />
          <div class="code">${escapeHtml(item.code)}</div>
          <div class="line">${escapeHtml(item.productTypeName || 'Sin tipo')}</div>
          <div class="line">Talla: ${escapeHtml(item.sizeName || 'Sin talla')}</div>
          <div class="line">Lote: ${escapeHtml(String(item.batchFolio || item.batchId || 'Sin lote'))}</div>
        </div>

        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=400,height=600');

  if (!printWindow) {
    throw new Error('No se pudo abrir la ventana de impresion.');
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

