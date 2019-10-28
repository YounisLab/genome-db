const express = require('express')
const { URL } = require('url')
const MCFadapter = require('./MCFadapter')
const TCGAadapter = require('./TCGAadapter')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 8080
const dbURL = (new URL(process.env.DATABASE_URL || 'postgres://genomedb:genomedb@postgres:5432/genomedb'))
const { Pool } = require('pg')

var adapter //set by middleware
var pool

//set up db object
function connect () {
  var host = dbURL.host
  console.log('Connecting to postgres at', host)
  pool = new Pool({
        connectionString: dbURL.href
      })
  return pool.query('SELECT NOW() as now')
    .then(function (res) {
      console.log('Connected to postgres on', res.rows[0].now)
    })
}

app.use(bodyParser.json({ limit: '5mb' }))

app.use(function (req, res, next) {
  console.log('Incoming request:', req.url)
  next()
})

app.use(function (req, res, next) {
  if (req.query.study == 'mcf') {
    adapter = MCFadapter
  }
  else if (req.query.study == 'tcga') {
    adapter = TCGAadapter
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

//pass in db object to adapter
app.use(function (req, res, next) {
  if (adapter.setPool(pool) != 0) {
    console.log('Error Setting Pool. Exiting..')
    process.exit(1)
  }
  next()
})

app.use(express.static('dist'))

app.get('/api/bellcurve', (req, res) => {
  adapter.bellCurve(req.query.sample, req.query.subsets, req.query.type)
    .then(function (results) {
      res.json(results)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})

app.get('/api/vertical', (req, res) => {
  adapter.vertical(req.query.gene)
    .then(function (results) {
      res.json(results.rows)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})

app.post('/api/heatmap', (req, res) => {
  adapter.heatMap(req.body.genes)
    .then(function (results) {
      res.json(results.rows)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})

app.get('/api/correlations', (req, res) => {
  adapter.correlations(req.query.table, req.query.gene, req.query.min, req.query.max)
    .then(function (results) {
      res.json(results)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})

app.get('/api/intron-analysis-heatmap', (req, res) => {
  adapter.intronAnalysisHeatmap(req.query.gene)
    .then(function (results) {
      res.json(results.rows)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})

app.get('/api/intron-analysis-bellcurve', (req, res) => {
  adapter.intronAnalysisBellCurve(req.query.sample)
    .then(function (results) {
      res.json(results)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})

app.get('/api/intron-analysis-vertical', (req, res) => {
  adapter.intronAnalysisVertical(req.query.gene)
    .then(function (results) {
      res.json(results.rows)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})
