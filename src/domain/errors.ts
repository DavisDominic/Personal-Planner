export type DomainErrorCode =
  | 'invalid-input'
  | 'not-found'
  | 'invalid-state'

/** Thrown for input the domain rejects. Messages are calm and factual. */
export class DomainError extends Error {
  readonly code: DomainErrorCode

  constructor(code: DomainErrorCode, message: string) {
    super(message)
    this.name = 'DomainError'
    this.code = code
  }
}

export const invalid = (message: string) => new DomainError('invalid-input', message)
export const notFound = (what: string) => new DomainError('not-found', `That ${what} couldn't be found.`)
export const badState = (message: string) => new DomainError('invalid-state', message)
