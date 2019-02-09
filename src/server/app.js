const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello world\n')
})

app.listen(port, () => console.log('GenomeDB serving on ', port))
