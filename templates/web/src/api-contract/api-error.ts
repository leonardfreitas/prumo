export type FieldErrors = Record<string, string[]>

type ProblemDocument = {
  title?: string
  status?: number
  detail?: string
  requestId?: string
  errors?: FieldErrors
}

type AuthClientError = {
  status: number
  statusText: string
  message?: string
  code?: string
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly title: string,
    readonly detail: string | undefined,
    readonly requestId: string | undefined,
    readonly errors: FieldErrors,
  ) {
    super(detail ?? title)
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const requestId = response.headers.get('x-request-id') ?? undefined
    const isProblem = response.headers.get('content-type')?.includes('application/problem+json')

    if (!isProblem) {
      return new ApiError(response.status, response.statusText, undefined, requestId, {})
    }

    const problem = (await response.json()) as ProblemDocument

    return new ApiError(
      response.status,
      problem.title ?? response.statusText,
      problem.detail,
      problem.requestId ?? requestId,
      problem.errors ?? {},
    )
  }

  static fromAuthError(error: AuthClientError): ApiError {
    return new ApiError(error.status, error.code ?? error.statusText, error.message, undefined, {})
  }
}
