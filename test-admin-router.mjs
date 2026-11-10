import express from 'express'
import admin from './server/routes/admin.js'

const app = express()
app.use(express.json())
app.use('/api/admin', admin)

const server = app.listen(5000, () => {
  console.log('Test server on 5000')
  
  // Make a test request
  setTimeout(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/test')
      console.log('Status:', res.status)
      const text = await res.text()
      console.log('Response:', text.substring(0, 100))
    } finally {
      process.exit(0)
    }
  }, 500)
})
