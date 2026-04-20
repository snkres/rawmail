'use strict'

const { Pool } = require('pg')
const { Redis } = require('ioredis')
const { simpleParser } = require('mailparser')
const { stripTrackingPixels } = require('./rawmail-sanitize')
const { randomUUID } = require('crypto')

let pool
let redis

exports.register = function () {
  pool = new Pool({ connectionString: process.env.DATABASE_URL })
  redis = new Redis(process.env.REDIS_URL)
  this.logdebug('rawmail-queue registered')
}

exports.hook_queue = function (next, connection) {
  const transaction = connection.transaction
  const recipients = transaction.rcpt_to.map((r) => r.address())

  transaction.message_stream.get_data(async (rawData) => {
    try {
      const parsed = await simpleParser(rawData)
      const htmlBody = stripTrackingPixels(parsed.html || '')
      const textBody = parsed.text || ''

      for (const address of recipients) {
        const inboxResult = await pool.query(
          `INSERT INTO inboxes (id, address, ttl_expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '7 days')
           ON CONFLICT (address) DO UPDATE SET address = EXCLUDED.address
           RETURNING id`,
          [randomUUID(), address]
        )
        const inboxId = inboxResult.rows[0].id

        const msgResult = await pool.query(
          `INSERT INTO messages (id, inbox_id, from_address, subject, html_body, text_body)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [
            randomUUID(),
            inboxId,
            parsed.from?.text ?? '',
            parsed.subject ?? '',
            htmlBody,
            textBody,
          ]
        )
        const messageId = msgResult.rows[0].id

        for (const att of parsed.attachments ?? []) {
          const filename = att.filename ?? 'attachment.bin'
          const storagePath = `attachments/${inboxId}/${messageId}/${filename}`
          await pool.query(
            `INSERT INTO attachments (id, message_id, filename, content_type, storage_path, size)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              randomUUID(),
              messageId,
              filename,
              att.contentType ?? 'application/octet-stream',
              storagePath,
              att.size,
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

      next(OK)
    } catch (err) {
      connection.logerror(this, `Queue error: ${err.message}`)
      next(DENYSOFT, 'Temporary error, try again')
    }
  })
}

exports.shutdown = async function () {
  await pool?.end()
  await redis?.quit()
}
