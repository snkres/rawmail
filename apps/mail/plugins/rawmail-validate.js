'use strict'

const { Pool } = require('pg')
let pool

exports.register = function () {
  pool = new Pool({ connectionString: process.env.DATABASE_URL })
  this.logdebug('rawmail-validate registered')
}

exports.hook_rcpt = async function (next, connection, params) {
  const domain = params[0].host.toLowerCase()

  if (domain === (process.env.RAWMAIL_DOMAIN ?? 'rawmail.sh')) {
    return next()
  }

  try {
    const { rows } = await pool.query(
      'SELECT id FROM domains WHERE domain = $1 AND mx_verified = true LIMIT 1',
      [domain]
    )
    if (rows.length > 0) return next()
  } catch (err) {
    connection.logerror(this, `DB error: ${err.message}`)
  }

  return next(DENY, `Unknown domain: ${domain}`)
}

exports.shutdown = async function () {
  await pool?.end()
}
