require('dotenv').config()
const secondChanceItemsroutes = require('./routes/secondChanceItemsRoutes.js')
const searchRoutes = require('./routes/searchRoutes.js')
const authRoutes = require('./routes/authRoutes.js')
const express = require('express')
const cors = require('cors')
const pinoLogger = require('./logger')
const path = require('path')
const connectToDatabase = require('./models/db')

const app = express()
app.use('*', cors())
const port = 3060

connectToDatabase().then(() => {
  pinoLogger.info('Connected to DB')
})
  .catch((e) => console.error('Failed to connect to DB', e))

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
// Route files
app.use('/api/secondchance/items', secondChanceItemsroutes)

app.use('/api/auth', authRoutes)

app.use('/api/secondchance/search', searchRoutes)

const pinoHttp = require('pino-http')
const logger = require('./logger')

app.use(pinoHttp({ logger }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).send('Internal Server Error')
})

app.get('/', (req, res) => {
  res.send('Inside the server')
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
