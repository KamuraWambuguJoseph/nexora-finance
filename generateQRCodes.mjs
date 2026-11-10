import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, 'src/assets/payments');

const wallets = [
  { name: 'qr-btc.jpg', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
  { name: 'qr-eth.jpg', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
  { name: 'qr-usdt-tron.jpg', address: 'TQn9Y2khDD95J42FQtQTdwVVRZqiTqJoUB' },
  { name: 'qr-usdt-eth.jpg', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
  { name: 'qr-bnb.jpg', address: '0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285' },
  { name: 'qr-solana.jpg', address: 'FwSqnqvBSY1fiNRiXyvmF3AcBAVHHYQKVZSoatN8zeBM' },
];

async function generateQRCodes() {
  try {
    for (const wallet of wallets) {
      const outputPath = path.join(outputDir, wallet.name);
      await QRCode.toFile(outputPath, wallet.address, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
      console.log(`✓ Generated ${wallet.name}`);
    }
    console.log('\n✓ All QR codes generated successfully!');
  } catch (err) {
    console.error('Error generating QR codes:', err);
    process.exit(1);
  }
}

generateQRCodes();
