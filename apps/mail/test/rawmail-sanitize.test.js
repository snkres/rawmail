import { describe, it, expect } from 'vitest'
import sanitizePlugin from '../plugins/rawmail-sanitize.js'

const { stripTrackingPixels } = sanitizePlugin

describe('stripTrackingPixels', () => {
  it('removes 1x1 tracking pixel img tags', () => {
    const html = '<p>Hello</p><img src="https://track.example.com/open" width="1" height="1">'
    const result = stripTrackingPixels(html)
    expect(result).not.toContain('<img')
    expect(result).toContain('<p>Hello</p>')
  })

  it('removes img tags with width=0', () => {
    const html = '<img src="https://pixel.example.com" width="0" height="0">'
    const result = stripTrackingPixels(html)
    expect(result).not.toContain('<img')
  })

  it('preserves normal images', () => {
    const html = '<img src="https://example.com/logo.png" width="200" height="100">'
    const result = stripTrackingPixels(html)
    expect(result).toContain('<img')
  })
})
