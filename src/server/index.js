import express from 'express'
import { URL } from 'url'
import { MCFAdapter as MCFAdapterClass } from './MCFadapter'
import { TCGAAdapter as TCGAAdapterClass } from './TCGAadapter'
import bodyParser from 'body-parser'
import MongoClient from 'mongodb'

const app = express()
const port = process.env.PORT || 8080
const mongoURL = process.env.MONGO_URL || 'mongodb://mongo'
const mongoDatabase = process.env.MONGO_DATABASE || 'genomedb'

const MCFAdapter = new MCFAdapterClass()
const TCGAAdapter = new TCGAAdapterClass()

let adapter // set by middleware
let mongodb

// set up db object
function connect() {
  return MongoClient.connect(mongoURL)
  .then(function (client) {
    console.log('Connected successfully to server')
    mongodb = client.db(mongoDatabase)
    })
    .catch(function (err) {
      console.log(err)
    })
}

app.use(bodyParser.json({ limit: '5mb' }))

app.use(function (req, res, next) {
  console.log('Incoming request:', req.url)
  next()
})

app.use(function (req, res, next) {
  if (req.query.study === 'mcf') {
    adapter = MCFAdapter
  } else if (req.query.study === 'tcga') {
    adapter = TCGAAdapter
  }
  next()
})

connect()
  .then(function () {
    app.listen(port, () => console.log('GenomeDB serving on', port))
  })
  .catch(function (err) {
    console.error(err)
    process.exit(1)
  })

// pass in db object to adapter
app.use(function (req, res, next) {
  if (adapter.setDB(mongodb) !== 0) {
    console.log('Error Setting Mongodb. Exiting..')
    process.exit(1)
  }
  next()
})

app.use(express.static('dist'))

app.get('/api/bellcurve', (req, res) => {
  adapter
    .bellCurve(req.query.sample, req.query.subsets, req.query.type)
    .then(function (results) {
      res.json(results)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})

app.get('/api/vertical', (req, res) => {
  adapter
    .vertical(req.query.gene, req.query.samples, req.query.subsets, req.query.type)
    .then(function (results) {
      res.json(results)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})

app.post('/api/heatmap', (req, res) => {
  const heatmap =
    req.body.type === 'fpkm'
      ? adapter.heatMap(req.body.genes)
      : adapter.intronAnalysisHeatmap(req.body.genes.toUpperCase())
  heatmap
    .then(function (results) {
      res.json(results)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})

app.get('/api/correlations', (req, res) => {
  adapter
    .correlations(req.query.table, req.query.gene, req.query.min, req.query.max)
    .then(function (results) {
      res.json(results)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})
