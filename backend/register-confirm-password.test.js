import test from 'node:test'
import assert from 'node:assert/strict'

import app from './server.js'

async function startServer() {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const port = server.address().port
  return { server, baseUrl: `http://127.0.0.1:${port}` }
}

test('register rejects mismatched passwords', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const response = await fetch(`${baseUrl}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Mismatch User',
        email: 'mismatch@example.com',
        password: 'secret123',
        confirm_password: 'secret456',
      }),
    })

    const payload = await response.json()
    assert.equal(response.status, 400)
    assert.match(JSON.stringify(payload), /confirm|match/i)
  } finally {
    server.close()
  }
})

test('register accepts matching passwords', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const response = await fetch(`${baseUrl}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Match User',
        email: 'match@example.com',
        password: 'secret123',
        confirm_password: 'secret123',
      }),
    })

    const payload = await response.json()
    assert.equal(response.status, 201)
    assert.equal(payload.user.full_name, 'Match User')
    assert.ok(payload.token)
  } finally {
    server.close()
  }
})
