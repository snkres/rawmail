'use strict'

const { SMTPServer } = require('smtp-server')
const { simpleParser } = require('mailparser')
const { Pool } = require('pg')
const { Redis } = require('ioredis')
const { randomUUID } = require('crypto')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const redis = new Redis(process.env.REDIS_URL)
const APP_DOMAIN = process.env.APP_DOMAIN ?? process.env.RAWMAIL_DOMAIN ?? 'rawmail.sh'

function stripTrackingPixels(html) {
  if (!html) return html
  return html.replace(
    /<img[^>]*(?:width=["']?\s*[01]\s*["']?[^>]*height=["']?\s*[01]\s*["']?|height=["']?\s*[01]\s*["']?[^>]*width=["']?\s*[01]\s*["']?)[^>]*\/?>/gi,
    ''
  )
}

async function isKnownDomain(domain) {
  if (domain === APP_DOMAIN) return true
  try {
    const { rows } = await pool.query(
      'SELECT id FROM domains WHERE domain = $1 AND mx_verified = true LIMIT 1',
      [domain]
    )
    return rows.length > 0
  } catch {
    return false
  }
}

const server = new SMTPServer({
  allowInsecureAuth: true,
  disabledCommands: ['AUTH'],
  logger: false,

  async onRcptTo(address, session, cb) {
    const domain = address.address.split('@')[1]?.toLowerCase()
    if (!domain) return cb(new Error('Invalid recipient'))
    const known = await isKnownDomain(domain)
    if (!known) return cb(Object.assign(new Error(`Unknown domain: ${domain}`), { responseCode: 550 }))
    cb()
  },

  async onData(stream, session, cb) {
    try {
      const parsed = await simpleParser(stream)
      const recipients = session.envelope.rcptTo.map(r => r.address)
      const htmlBody = stripTrackingPixels(parsed.html || '')
      const textBody = parsed.text || ''

      for (const address of recipients) {
        const inboxRes = await pool.query(
          `INSERT INTO inboxes (id, address, ttl_expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '7 days')
           ON CONFLICT (address) DO UPDATE SET address = EXCLUDED.address
           RETURNING id`,
          [randomUUID(), address]
        )
        const inboxId = inboxRes.rows[0].id

        const msgRes = await pool.query(
          `INSERT INTO messages (id, inbox_id, from_address, subject, html_body, text_body)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [randomUUID(), inboxId, parsed.from?.text ?? '', parsed.subject ?? '', htmlBody, textBody]
        )
        const messageId = msgRes.rows[0].id

        for (const att of parsed.attachments ?? []) {
          await pool.query(
            `INSERT INTO attachments (id, message_id, filename, content_type, storage_path, size)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              randomUUID(), messageId,
              att.filename ?? 'attachment',
              att.contentType,
              `attachments/${inboxId}/${messageId}/${att.filename ?? 'attachment'}`,
              att.size ?? 0,
            ]
          )
        }

        const payload = JSON.stringify({
          id: messageId,
          inboxId,
          fromAddress: parsed.from?.text ?? '',
          subject: parsed.subject ?? '',
          receivedAt: new Date().toISOString(),
        })
        await redis.publish(`inbox:${address}`, payload)
      }

      cb()
    } catch (err) {
      console.error('[mail] processing error:', err.stack ?? err.message)
      cb(new Error('Temporary error, try again later'))
    }
  },
})

server.on('error', err => console.error('[mail] server error:', err.message))

server.listen(25, '0.0.0.0', () => {
  console.log(`[mail] SMTP server listening on port 25 (domain: ${APP_DOMAIN})`)
})

process.on('SIGTERM', async () => {
  server.close()
  await pool.end()
  await redis.quit()
  process.exit(0)
})
