import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

import app from './server.js'

async function startServer() {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  return { server, baseUrl: `http://127.0.0.1:${server.address().port}` }
}

async function register(baseUrl, email) {
  const response = await fetch(`${baseUrl}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Rent Tracker',
      email,
      password: 'secret123',
      confirm_password: 'secret123',
    }),
  })
  assert.equal(response.status, 201)
  return (await response.json()).token
}

test('rent payments are validated, private to the landlord, and can be marked paid', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const ownerToken = await register(baseUrl, `rent-owner-${crypto.randomUUID()}@example.com`)
    const otherToken = await register(baseUrl, `rent-other-${crypto.randomUUID()}@example.com`)
    const ownerHeaders = { Authorization: `Token ${ownerToken}`, 'Content-Type': 'application/json' }
    const otherHeaders = { Authorization: `Token ${otherToken}` }
    const requestBody = {
      tenant_name: 'Amina Tenant',
      unit_name: 'Block A, Unit 4',
      amount: 25000,
      period: '2026-10',
      due_date: '2026-10-05',
    }

    const unauthenticated = await fetch(`${baseUrl}/api/rent-payments/`)
    assert.equal(unauthenticated.status, 401)

    const invalid = await fetch(`${baseUrl}/api/rent-payments/`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({ ...requestBody, due_date: '2026-02-30' }),
    })
    assert.equal(invalid.status, 400)
    assert.match(JSON.stringify(await invalid.json()), /due date/i)

    const createdResponse = await fetch(`${baseUrl}/api/rent-payments/`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify(requestBody),
    })
    assert.equal(createdResponse.status, 201)
    const created = await createdResponse.json()
    assert.equal(created.tenant_name, requestBody.tenant_name)
    assert.equal(created.amount, requestBody.amount)
    assert.equal(created.paid_at, null)

    const otherList = await fetch(`${baseUrl}/api/rent-payments/`, { headers: otherHeaders })
    assert.deepEqual(await otherList.json(), [])
    const otherUpdate = await fetch(`${baseUrl}/api/rent-payments/${created.id}/paid/`, {
      method: 'PATCH',
      headers: otherHeaders,
    })
    assert.equal(otherUpdate.status, 404)

    const paidResponse = await fetch(`${baseUrl}/api/rent-payments/${created.id}/paid/`, {
      method: 'PATCH',
      headers: ownerHeaders,
    })
    assert.equal(paidResponse.status, 200)
    const paid = await paidResponse.json()
    assert.ok(paid.paid_at)
    assert.equal(paid.id, created.id)
  } finally {
    server.close()
  }
})
