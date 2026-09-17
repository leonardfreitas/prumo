import { describe, expect, it } from 'vitest'
import { doctor, type Probe } from './doctor.ts'

function probe(overrides: Partial<Probe> & { commands?: Record<string, string> } = {}): Probe {
  const commands = overrides.commands ?? {
    'pnpm --version': '12.3.4',
    'git --version': 'git version 2.54.0',
    'docker --version': 'Docker version 29.7.2',
    'docker info': '',
    'psql --version': 'psql (PostgreSQL) 18.6',
  }

  return {
    nodeVersion: '22.17.0',
    run: (command, args) => {
      const stdout = commands[[command, ...args].join(' ')]
      return { ok: stdout !== undefined, stdout: stdout ?? '' }
    },
    exists: () => false,
    list: () => [],
    portOpen: async () => true,
    ...overrides,
  }
}

const status = (report: Awaited<ReturnType<typeof doctor>>, id: string) =>
  report.checks.find((check) => check.id === id)?.status

describe('doctor', () => {
  it('is ready when everything answers', async () => {
    const report = await doctor(probe())

    expect(report.ready).toBe(true)
    expect(report.checks.every((check) => check.status === 'ok')).toBe(true)
  })

  it('fails on a Node below the floor, and on a missing pnpm or git', async () => {
    const report = await doctor(probe({ nodeVersion: '22.16.9', commands: {} }))

    expect(report.ready).toBe(false)
    expect(status(report, 'node')).toBe('fail')
    expect(status(report, 'pnpm')).toBe('fail')
    expect(status(report, 'git')).toBe('fail')
  })

  it('only warns about what the database needs, and tells installed from running Docker', async () => {
    const report = await doctor(
      probe({
        commands: { 'pnpm --version': '12', 'git --version': 'git', 'docker --version': 'Docker' },
        portOpen: async () => false,
      }),
    )

    expect(report.ready).toBe(true)
    expect(report.checks.find((check) => check.id === 'docker')?.detail).toContain('not running')
    expect(status(report, 'psql')).toBe('warn')
    expect(status(report, 'database')).toBe('warn')
  })

  it('finds a psql the EDB installer left off PATH, newest version first', async () => {
    const report = await doctor(
      probe({
        commands: {
          'pnpm --version': '12',
          'git --version': 'git',
          '/Library/PostgreSQL/18/bin/psql --version': 'psql (PostgreSQL) 18.6',
        },
        list: (directory) => (directory === '/Library/PostgreSQL' ? ['9', '18'] : []),
        exists: (path) => path.startsWith('/Library/PostgreSQL/'),
      }),
    )

    expect(report.checks.find((check) => check.id === 'psql')?.detail).toBe(
      'psql (PostgreSQL) 18.6 at /Library/PostgreSQL/18/bin/psql',
    )
    expect(status(report, 'database')).toBe('ok')
  })
})
