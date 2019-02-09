const { Pool } = require('pg')

var pool

const nodepgLogger = function (msg) {
  console.log('node-pg: %s', msg)
}

module.exports = {
  connect: function (urlObject) {
    var host = urlObject.host
    console.log('Connecting to postgres at', host)
    pool = new Pool({
      connectionString: urlObject.href,
      log: process.env.NODEPG_DEBUG ? nodepgLogger : function () { }
    })

    return pool.query('SELECT NOW() as now')
      .then(function (res) {
        console.log('Connected to postgres on', res.rows[0].now)
      })
  }
}
