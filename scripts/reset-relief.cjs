const fs = require('node:fs')
const path = require('node:path')
const data = path.resolve(process.cwd(), 'data')
if (!process.argv.includes('--confirm')) {
  console.error('This replaces only data/relief.json with synthetic seed data. Stop the dev server first. Run: npm run reset:relief -- --confirm')
  process.exit(1)
}
if (fs.existsSync(path.join(data, 'relief.lock'))) {
  console.error('Store is locked. Stop all app processes and inspect the lock before resetting.')
  process.exit(1)
}
fs.copyFileSync(path.join(data, 'relief.seed.json'), path.join(data, 'relief.json'))
console.log('Restored synthetic relief data. Existing legacy community.json and db.json were not changed.')
