import express from 'express'
import { URL } from 'url'
import { MCFAdapter as MCFAdapterClass } from './MCFadapter'
import { TCGAAdapter as TCGAAdapterClass } from './TCGAadapter'
import bodyParser from 'body-parser'
import Pool from 'pg-pool'

const app = express()
const port = process.env.PORT || 8080
const dbURL = new URL(
  process.env.DATABASE_URL || 'postgres://genomedb:genomedb@postgres:5432/genomedb'
)

const MCFAdapter = new MCFAdapterClass()
const TCGAAdapter = new TCGAAdapterClass()

let adapter // set by middleware
let pool

// set up db object
function connect() {
  const host = dbURL.host
  console.log('Connecting to postgres at', host)
  pool = new Pool({
    connectionString: dbURL.href
  })
  return pool.query('SELECT NOW() as now').then(function (res) {
    console.log('Connected to postgres on', res.rows[0].now)
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
  if (adapter.setPool(pool) !== 0) {
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
      res.json(results.rows)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})

app.post('/api/heatmap', (req, res) => {
  adapter
    .heatMap(req.body.genes)
    .then(function (results) {
      res.json(results.rows)
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

app.get('/api/intron-analysis-heatmap', (req, res) => {
  adapter
    .intronAnalysisHeatmap(req.query.gene)
    .then(function (results) {
      res.json(results.rows)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})
