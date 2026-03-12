import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Module backend configurations ──────────────────────────────────────────
const MODULE_CONFIGS = {
  graphql: {
    cmd: 'uvicorn',
    args: ['main:app', '--reload'],
    cwd: resolve(__dirname, '../graphql-learning'),
    healthUrl: 'http://localhost:8000/graphql',
  },
  springboot: {
    cmd: 'mvn',
    args: ['spring-boot:run'],
    cwd: resolve(__dirname, '../springboot-learning'),
    healthUrl: 'http://localhost:8080/api/teams',
  },
}

const runningProcesses = {}

async function isHealthy(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(2000) })
    return true
  } catch {
    return false
  }
}

function startModule(moduleId) {
  const config = MODULE_CONFIGS[moduleId]
  if (!config) return false
  if (runningProcesses[moduleId]) return true   // already running

  const proc = spawn(config.cmd, config.args, {
    cwd: config.cwd,
    stdio: 'pipe',
    shell: true,
  })

  proc.stdout?.on('data', (d) => process.stdout.write(`[${moduleId}] ${d}`))
  proc.stderr?.on('data', (d) => process.stderr.write(`[${moduleId}] ${d}`))

  proc.on('error', (err) => {
    console.error(`[hub] ${moduleId} failed to start:`, err.message)
    delete runningProcesses[moduleId]
  })
  proc.on('exit', (code) => {
    console.log(`[hub] ${moduleId} process exited (code ${code})`)
    delete runningProcesses[moduleId]
  })

  runningProcesses[moduleId] = proc
  console.log(`[hub] Spawned ${moduleId} backend (pid ${proc.pid})`)
  return true
}

// ── Vite plugin ─────────────────────────────────────────────────────────────
function moduleManagerPlugin() {
  return {
    name: 'hub-module-manager',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/__hub/')) return next()

        // URL shape: /__hub/<action>/<moduleId>
        const [, , action, moduleId] = req.url.split('/')
        res.setHeader('Content-Type', 'application/json')

        if (action === 'start' && req.method === 'POST') {
          startModule(moduleId)
          res.end(JSON.stringify({ ok: true }))

        } else if (action === 'status') {
          const config = MODULE_CONFIGS[moduleId]
          if (!config) {
            res.statusCode = 404
            res.end(JSON.stringify({ ready: false }))
            return
          }
          const ready = await isHealthy(config.healthUrl)
          res.end(JSON.stringify({ ready }))

        } else {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'unknown action' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), moduleManagerPlugin()],
  server: {
    port: 3000,
    fs: { allow: ['..'] },
    proxy: {
      '/graphql': 'http://localhost:8000',
      '/api':     'http://localhost:8080',
    },
  },
})
