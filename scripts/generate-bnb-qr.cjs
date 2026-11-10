// Generates the BNB (BEP20) deposit QR code image.
// Run: node scripts/generate-bnb-qr.js
const ADDRESS = '0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285'
const OUT = 'src/assets/payments/qr-bnb.jpg'

const QRCode = require('qrcode')

QRCode.toFile(
  OUT,
  ADDRESS,
  {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 512,
    color: { dark: '#000000', light: '#FFFFFF' },
  },
  (err) => {
    if (err) {
      console.error('Failed to generate QR:', err)
      process.exit(1)
    }
    console.log('QR written to', OUT)
  },
)
