const PROJECT_NAME = /^[a-z][a-z0-9-]*$/

export function validateProjectName(name: string): string | undefined {
  if (!PROJECT_NAME.test(name)) {
    return 'Use lowercase letters, digits and hyphens, starting with a letter.'
  }

  return undefined
}

export function schemeFor(name: string): string {
  return name.replaceAll('-', '')
}
