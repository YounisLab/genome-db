const express = require('express')
const { URL } = require('url')
const adapter = require('./adapter')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 8080
const dbURL = (new URL(process.env.DATABASE_URL || 'postgres://genomedb:genomedb@postgres:5432/genomedb'))

app.use(bodyParser.json({ limit: '5mb' }))

app.use(function (req, res, next) {
  console.log('Incoming request:', req.url)
  next()
})

adapter.connect(dbURL)
  .then(function () {
    app.listen(port, () => console.log('GenomeDB serving on', port))
  })
  .catch(function (err) {
    console.error(err)
    process.exit(1)
  })

app.use(express.static('dist'))

app.get('/api/bellcurve', (req, res) => {
  adapter.bellCurve(req.query.sample)
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

app.get('/api/rbprvalue', (req, res) => {
  adapter.rbpRvalues(req.query.gene, req.query.min, req.query.max)
    .then(function (results) {
      console.log(typeof (results))
      res.json(results)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})
