let intended: string | undefined

export function rememberIntendedRoute(path: string): void {
  intended = path
}

export function takeIntendedRoute(): string | undefined {
  const path = intended
  intended = undefined
  return path
}
