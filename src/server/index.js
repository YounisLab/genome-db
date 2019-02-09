const express = require('express')
const { URL } = require('url')
const adapter = require('./adapter')
const app = express()
const port = 8080
const dbURL = (new URL('postgres://genomedb:genomedb@postgres:5432/genomedb'))

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

app.get('/', (req, res) => {
  res.send('Hello world\n')
})

app.get('/bellcurve', (req, res) => {
  adapter.bellCurve(req.query.gene)
    .then(function (results) {
      res.json(results.rows)
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ status: 'Error' })
    })
})
