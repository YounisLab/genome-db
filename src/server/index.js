const express = require('express')
const { URL } = require('url')
const adapter = require('./adapter')
const app = express()
const port = 8080
const dbURL = (new URL('postgres://genomedb:genomedb@postgres:5432/genomedb'))

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

app.listen(port, () => console.log('GenomeDB serving on ', port))
