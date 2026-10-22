import fs from 'node:fs'
import path from 'node:path'
import type { ReliefStore } from './relief'
import { ServiceError } from '@/services/claimService'

const empty = (): ReliefStore => ({ version: 1, reports: [], posts: [], campaigns: [], donations: [], disbursements: [], audit: [] })
const directory = () => path.join(process.env.RELIEF_DATA_DIR || path.join(process.cwd(), 'data'))
function read(): ReliefStore {
  const file = path.join(directory(), 'relief.json')
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'))
  // Preserve existing reports/posts on first migration. Never overwrite a live store with seeds.
  const legacy = path.join(directory(), 'community.json')
  if (fs.existsSync(legacy)) return { ...empty(), ...JSON.parse(fs.readFileSync(legacy, 'utf8')) }
  const seed = path.join(directory(), 'relief.seed.json')
  return fs.existsSync(seed) ? JSON.parse(fs.readFileSync(seed, 'utf8')) : empty()
}
export function readRelief(): ReliefStore { return read() }

// All callbacks are synchronous and commit the entire mutation once. The filesystem
// lock also prevents lost updates across Next route workers; contenders retry via UI.
export function mutateRelief<T>(fn: (store: ReliefStore) => T): T {
  fs.mkdirSync(directory(), { recursive: true })
  const lock = path.join(directory(), 'relief.lock')
  try { fs.mkdirSync(lock) } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new ServiceError(409, 'STORE_BUSY')
    throw error
  }
  const temporary = path.join(directory(), 'relief.json.tmp')
  try {
    const store = read()
    const result = fn(store)
    fs.writeFileSync(temporary, JSON.stringify(store, null, 2))
    fs.renameSync(temporary, path.join(directory(), 'relief.json'))
    return result
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary)
    fs.rmdirSync(lock)
  }
}
