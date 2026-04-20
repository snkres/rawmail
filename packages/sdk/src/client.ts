import { InboxesNamespace } from './inboxes'

export interface RawmailClientOptions {
  baseUrl?: string
  token?: string
}

export class RawmailClient {
  readonly inboxes: InboxesNamespace

  constructor(opts: RawmailClientOptions = {}) {
    const base = opts.baseUrl ?? 'https://api.rawmail.sh'
    this.inboxes = new InboxesNamespace(base, opts.token)
  }
}
