import { AsyncLocalStorage } from 'node:async_hooks'
import { Injectable } from '@nestjs/common'

type Store = { requestId: string }

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<Store>()

  run<T>(requestId: string, callback: () => T): T {
    return this.storage.run({ requestId }, callback)
  }

  get requestId(): string | undefined {
    return this.storage.getStore()?.requestId
  }
}
