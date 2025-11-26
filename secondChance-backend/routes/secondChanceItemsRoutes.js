const express = require('express')
const multer = require('multer')
const router = express.Router()
const connectToDatabase = require('../models/db')
const logger = require('../logger')

const directoryPath = 'public/images'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath) 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage: storage })

const collectionName = 'secondChanceItems'

router.get('/', async (req, res, next) => {
  logger.info('/ called')
  try {
    const db = await connectToDatabase()

    const collection = db.collection(collectionName)

    const secondChanceItems = await collection.find({}).toArray()

    res.json(secondChanceItems)
  } catch (e) {
    logger.console.error('oops something went wrong', e)
    next(e)
  }
})

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const db = await connectToDatabase()

    const collection = await db.collection(collectionName)
    let newItem = req.body

    const lastItem = collection.find().sort({ id: -1 }).limit(1)
    await lastItem.forEach(item => {
      newItem.id = (parseInt(item.id) + 1).toString()
    })
    
    const dateAdded = Math.floor(new Date().getTime() / 1000)
    newItem.date_added = dateAdded

    newItem = await collection.insertOne(newItem)

    res.status(201).json(newItem)
  } catch (e) {
    next(e)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const db = await connectToDatabase()

    const collection = await db.collection(collectionName)

    const secondChanceItem = await collection.findOne({ id: id })

    if (!secondChanceItem) return res.status(404).json('Item not found.')
    res.json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const db = await connectToDatabase()

    const collection = await db.collection(collectionName)
    const item = await collection.findOne({ id: id })

    if (!item) 
      return res.status(404).json('Item not found.')
    
    item.category = req.body.category
    item.condition = req.body.condition
    item.age_days = req.body.age_days
    item.description = req.body.description
    item.age_years = Number((req.body.age_days / 365).toFixed(1))
    item.updatedAt = new Date()

    const updatedItem = await collection.findOneAndUpdate(
      { id: id },
      { $set: item },
      { returnDocument: 'after' }
    )
    if (updatedItem) 
      res.json({ uploaded: 'success' })
    else 
      res.json({ uploaded: 'failed' })
  } catch (e) {
    next(e)
  }
})

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const db = await connectToDatabase()
    const collection = await db.collection(collectionName)
    const item = await collection.findOne({ id: id })
    if (!item) {
      logger.error('secondChanceItem not found')
      return res.status(404).json({ error: 'secondChanceItem not found' })
    }
    await collection.deleteOne(item)
    res.json({ deleted: 'success' })
  } catch (e) {
    next(e)
  }
})

module.exports = router
