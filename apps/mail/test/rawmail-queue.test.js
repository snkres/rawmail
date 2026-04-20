import { describe, it, expect } from 'vitest'

describe('rawmail-queue plugin', () => {
  it('loads plugin module', async () => {
    const plugin = await import('../plugins/rawmail-queue.js')
    expect(plugin).toBeTruthy()
  })
})
