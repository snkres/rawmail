import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InboxService } from '../src/services/inbox.service'

function makeMockDb() {
  return {
    query: {
      inboxes: {
        findFirst: vi.fn(async () => null),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => [
          {
            id: 'inbox-1',
            address: 'test@rawmail.sh',
            isClaimed: false,
            tokenHash: null,
            ttlExpiresAt: new Date(Date.now() + 7 * 86400_000),
            createdAt: new Date(),
          },
        ]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => [
            {
              id: 'inbox-1',
              address: 'test@rawmail.sh',
              isClaimed: true,
              tokenHash: 'hashed',
              ttlExpiresAt: new Date(),
              createdAt: new Date(),
            },
          ]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(async () => []),
      })),
    })),
  } as any
}

describe('InboxService', () => {
  let db: ReturnType<typeof makeMockDb>
  let service: InboxService

  beforeEach(() => {
    db = makeMockDb()
    service = new InboxService(db)
  })

  it('getOrCreate returns existing inbox', async () => {
    const existing = { id: 'inbox-1', address: 'test@rawmail.sh', isClaimed: false }
    db.query.inboxes.findFirst.mockResolvedValue(existing)
    const result = await service.getOrCreate('test@rawmail.sh')
    expect(result).toBe(existing)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('getOrCreate creates new inbox when not found', async () => {
    db.query.inboxes.findFirst.mockResolvedValue(null)
    const result = await service.getOrCreate('new@rawmail.sh')
    expect(db.insert).toHaveBeenCalled()
    expect(result.address).toBe('test@rawmail.sh')
  })

  it('claim throws if inbox already claimed', async () => {
    db.query.inboxes.findFirst.mockResolvedValue({ id: 'inbox-1', isClaimed: true })
    await expect(service.claim('test@rawmail.sh')).rejects.toThrow('already claimed')
  })

  it('claim returns token and updates inbox', async () => {
    db.query.inboxes.findFirst.mockResolvedValue({
      id: 'inbox-1',
      isClaimed: false,
      tokenHash: null,
    })
    const result = await service.claim('test@rawmail.sh')
    expect(result.token).toHaveLength(64)
    expect(db.update).toHaveBeenCalled()
  })

  it('deleteExpired removes inboxes past TTL', async () => {
    await service.deleteExpired()
    expect(db.delete).toHaveBeenCalled()
  })
})
