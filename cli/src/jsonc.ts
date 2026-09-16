import {
  applyEdits,
  findNodeAtLocation,
  type JSONPath,
  modify,
  parse,
  parseTree,
} from 'jsonc-parser'

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

const FORMAT = { formattingOptions: { insertSpaces: true, tabSize: 2 } }

function isObject(value: unknown): value is Record<string, Json> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pathsEqualTo(target: Json, base: Json, path: JSONPath): JSONPath[] {
  if (!isObject(target) || !isObject(base)) {
    return JSON.stringify(target) === JSON.stringify(base) ? [path] : []
  }

  return Object.keys(target).flatMap((key) =>
    key in base ? pathsEqualTo(target[key] as Json, base[key] as Json, [...path, key]) : [],
  )
}

function emptyObjectPath(value: Json, path: JSONPath): JSONPath | undefined {
  if (!isObject(value)) {
    return undefined
  }

  for (const [key, child] of Object.entries(value)) {
    const found = emptyObjectPath(child, [...path, key])

    if (found !== undefined) {
      return found
    }
  }

  return Object.keys(value).length === 0 && path.length > 0 ? path : undefined
}

// jsonc-parser's own removal also deletes the comment written above the next property, which here is the
// one-line reason a rule change must carry. So a property is cut out by its offsets, and nothing after it moves.
function removeProperty(text: string, path: JSONPath): string {
  const value = findNodeAtLocation(parseTree(text) as never, path)
  const property = value?.parent

  if (property === undefined) {
    return text
  }

  let start = property.offset
  let end = property.offset + property.length
  const after = text.slice(end).match(/^\s*,/)

  if (after !== null) {
    end += after[0].length
  } else {
    const before = text.slice(0, start).match(/,\s*$/)

    if (before !== null) {
      start -= before[0].length
    }
  }

  const lineStart = text.lastIndexOf('\n', start - 1) + 1

  if (text.slice(lineStart, start).trim() === '') {
    start = lineStart
    const lineEnd = text.indexOf('\n', end)

    if (lineEnd !== -1 && text.slice(end, lineEnd).trim() === '') {
      end = lineEnd + 1
    }
  }

  return text.slice(0, start) + text.slice(end)
}

export function readJsonc<T>(text: string): T {
  return parse(text) as T
}

export function setJsonc(text: string, path: JSONPath, value: unknown): string {
  return value === undefined
    ? removeProperty(text, path)
    : applyEdits(text, modify(text, path, value, FORMAT))
}

export function prependProperty(text: string, key: string, value: string): string {
  const open = text.indexOf('{')

  return `${text.slice(0, open + 1)}\n  ${JSON.stringify(key)}: ${JSON.stringify(value)},${text.slice(open + 1)}`
}

export function removeWhatBaseDeclares(text: string, baseText: string): string {
  let result = text

  for (const path of pathsEqualTo(parse(text), parse(baseText), [])) {
    result = removeProperty(result, path)
  }

  for (let empty = emptyObjectPath(parse(result), []); empty !== undefined; ) {
    result = removeProperty(result, empty)
    empty = emptyObjectPath(parse(result), [])
  }

  return result
}
