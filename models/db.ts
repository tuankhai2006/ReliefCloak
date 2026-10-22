// DB giả lập: một file JSON. Đủ cho demo và dễ "hack" trực tiếp ở trang /rogue.
import fs from 'fs'
import path from 'path'
import type { Claim } from './claim'

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')
const SEED_PATH = path.join(process.cwd(), 'data', 'db.seed.json')

interface DbShape {
  claims: Claim[]
}

function load(): DbShape {
  if (!fs.existsSync(DB_PATH)) fs.copyFileSync(SEED_PATH, DB_PATH)
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

function save(db: DbShape) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export const claimRepo = {
  all(): Claim[] {
    return load().claims
  },
  get(id: string): Claim | undefined {
    return load().claims.find((c) => c.id === id)
  },
  insert(claim: Claim) {
    const db = load()
    db.claims.unshift(claim)
    save(db)
  },
  update(claim: Claim) {
    const db = load()
    db.claims = db.claims.map((c) => (c.id === claim.id ? claim : c))
    save(db)
  },
  reset() {
    fs.copyFileSync(SEED_PATH, DB_PATH)
  },
}
