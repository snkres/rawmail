import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MessageService } from '../src/services/message.service'

function makeMockDb() {
  return {
    query: {
      inboxes: {
        findFirst: vi.fn(async () => ({ id: 'inbox-1', address: 'test@rawmail.sh' })),
      },
      messages: {
        findMany: vi.fn(async () => [
          {
            id: 'msg-1',
            inboxId: 'inbox-1',
            fromAddress: 'from@example.com',
            subject: 'Hello',
            htmlBody: '<p>hi</p>',
            textBody: 'hi',
            receivedAt: new Date(),
          },
        ]),
        findFirst: vi.fn(async () => ({ id: 'msg-1', inboxId: 'inbox-1' })),
      },
    },
    delete: vi.fn(() => ({ where: vi.fn(async () => []) })),
  } as any
}

describe('MessageService', () => {
  let db: ReturnType<typeof makeMockDb>
  let service: MessageService

  beforeEach(() => {
    db = makeMockDb()
    service = new MessageService(db)
  })

  it('listByInbox returns empty array when inbox not found', async () => {
    db.query.inboxes.findFirst.mockResolvedValue(null)
    const result = await service.listByInbox('missing@rawmail.sh')
    expect(result).toEqual([])
  })

  it('listByInbox returns messages for known inbox', async () => {
    const result = await service.listByInbox('test@rawmail.sh')
    expect(result).toHaveLength(1)
    expect(result[0].subject).toBe('Hello')
  })

  it('getById returns message by id', async () => {
    const result = await service.getById('msg-1')
    expect(result?.id).toBe('msg-1')
  })

  it('delete calls db.delete', async () => {
    await service.delete('msg-1')
    expect(db.delete).toHaveBeenCalled()
  })
})
