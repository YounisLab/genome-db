import express from 'express'
import { URL } from 'url'
import { MCFAdapter as MCFAdapterClass } from './MCFadapter'
import { TCGAAdapter as TCGAAdapterClass } from './TCGAadapter'
import bodyParser from 'body-parser'
import Pool from 'pg-pool'
import MongoClient from 'mongodb'

const app = express()
const port = process.env.PORT || 8080
const dbURL = new URL(
  process.env.DATABASE_URL || 'postgres://genomedb:genomedb@postgres:5432/genomedb'
)
const mongodbURL = process.env.MONGODB_URL
const mongodbDB = process.env.MONGO_DATABASE

const MCFAdapter = new MCFAdapterClass()
const TCGAAdapter = new TCGAAdapterClass()

let adapter // set by middleware
let pool
let mongodb

// set up db object
function connect() {
  const host = dbURL.host
  console.log('Connecting to postgres at', host)
  pool = new Pool({
    connectionString: dbURL.href
  })
  return pool.query('SELECT NOW() as now').then(function () {
    MongoClient.connect(mongodbURL, function(err, client) {
      console.log("Connected successfully to server")
      mongodb = client.db(mongodbDB)
    })
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
  if (adapter.setPool(pool, mongodb) !== 0) {
    console.log('Error Setting Pool. Exiting..')
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
