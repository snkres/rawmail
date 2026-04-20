'use strict'

function stripTrackingPixels(html) {
  if (!html) return html
  return html.replace(
    /<img[^>]*(?:width=["']?[01]["']?[^>]*height=["']?[01]["']?|height=["']?[01]["']?[^>]*width=["']?[01]["']?)[^>]*\/?>/gi,
    ''
  )
}

exports.stripTrackingPixels = stripTrackingPixels

exports.hook_data_post = function (next, connection) {
  const transaction = connection.transaction
  transaction.message_stream.get_data((data) => {
    const html = data.toString()
    const cleaned = stripTrackingPixels(html)
    if (cleaned !== html) {
      transaction.notes.sanitizedHtml = cleaned
    }
    next()
  })
}
