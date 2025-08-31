/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const { spawnSync } = require('child_process')

function loadEnv() {
  // Prefer existing env, else attempt .env.local then .env
  if (!process.env.DATABASE_URL) {
    const localEnvPath = path.resolve(process.cwd(), '.env.local')
    const defaultEnvPath = path.resolve(process.cwd(), '.env')

    if (fs.existsSync(localEnvPath)) {
      dotenv.config({ path: localEnvPath })
      console.log('[run-sql] Loaded env from .env.local')
    } else if (fs.existsSync(defaultEnvPath)) {
      dotenv.config({ path: defaultEnvPath })
      console.log('[run-sql] Loaded env from .env')
    }
  }
}

function getPrismaBin() {
  const binUnix = path.resolve(process.cwd(), 'node_modules', '.bin', 'prisma')
  const binWin = path.resolve(process.cwd(), 'node_modules', '.bin', 'prisma.cmd')
  if (fs.existsSync(binUnix)) return binUnix
  if (fs.existsSync(binWin)) return binWin
  return 'prisma' // fallback if PATH contains it
}

function runPrismaExecute(file) {
  // Use npx prisma and rely on env.DATABASE_URL loaded above. Provide --schema for clarity.
  const res = spawnSync('npx', ['prisma', 'db', 'execute', '--file', file, '--schema', 'prisma/schema.prisma'], {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  })
  if (res.error) {
    console.error('[run-sql] Failed to run Prisma CLI:', res.error)
    process.exit(1)
  }
  if (res.status !== 0) {
    console.error(`[run-sql] Prisma command exited with code ${res.status}`)
    process.exit(res.status)
  }
}

function run() {
  loadEnv()

  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: node scripts/run-sql.js <path-to-sql-file>')
    process.exit(1)
  }

  const resolved = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(resolved)) {
    console.error(`SQL file not found: ${resolved}`)
    process.exit(1)
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Please configure your environment (.env.local or similar).')
    process.exit(1)
  }

  const sql = fs.readFileSync(resolved, 'utf8').trim()
  if (sql.length === 0) {
    console.log(`[run-sql] No statements to execute in ${filePath}. Skipping.`)
    process.exit(0)
  }

  console.log(`[run-sql] Executing SQL from ${filePath} ...`)
  runPrismaExecute(resolved)
  console.log('[run-sql] Done.')
}

run()
