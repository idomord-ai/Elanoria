import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const localSdk = fileURLToPath(new URL('../../siwc-devkit/packages/local/dist/index.js', import.meta.url))
const sdk = process.env.ELANORIA_SIWC_SDK || localSdk
const port = process.env.ELANORIA_CHATGPT_PORT ?? '5174'

if (!/^[1-9]\d{0,4}$/.test(port) || Number(port) > 65535) {
  console.error('Set ELANORIA_CHATGPT_PORT to a port number from 1 to 65535.')
  process.exitCode = 1
} else if (process.platform !== 'win32' || !existsSync(sdk)) {
  console.error('Set ELANORIA_SIWC_SDK to the built local Sign in with ChatGPT DevKit entry on Windows.')
  process.exitCode = 1
} else {
  const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
  const server = spawn(process.execPath, [vite, '--host', '127.0.0.1', '--port', port, '--strictPort'], {
    stdio: 'inherit',
    env: { ...process.env, ELANORIA_CHATGPT: '1', ELANORIA_SIWC_SDK: sdk },
  })
  server.on('error', () => { process.exitCode = 1 })
  server.on('exit', (code) => { process.exitCode = code ?? 0 })
}
