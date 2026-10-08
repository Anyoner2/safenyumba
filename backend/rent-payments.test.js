import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

import app from './server.js'

async function startServer() {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  return { server, baseUrl: `http://127.0.0.1:${server.address().port}` }
}

async function register(baseUrl, email, role = 'landlord') {
  const response = await fetch(`${baseUrl}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Rent Tracker',
      email,
      role,
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
    const ownerEmail = `rent-owner-${crypto.randomUUID()}@example.com`
    const otherEmail = `rent-other-${crypto.randomUUID()}@example.com`
    const managerEmail = `rent-manager-${crypto.randomUUID()}@example.com`
    const ownerToken = await register(baseUrl, ownerEmail)
    const otherToken = await register(baseUrl, otherEmail)
    await register(baseUrl, managerEmail, 'estate_manager')
    const otherUser = globalThis.__safeNyumbaData.users.find((user) => user.email === managerEmail)
    assert.equal(otherUser.role, 'landlord')
    otherUser.role = 'estate_manager'
    otherUser.managed_estate = 'kilimani'
    const otherAuthResponse = await fetch(`${baseUrl}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: managerEmail, password: 'secret123' }),
    })
    assert.equal(otherAuthResponse.status, 200)
    const managerToken = (await otherAuthResponse.json()).token
    const ownerHeaders = { Authorization: `Token ${ownerToken}`, 'Content-Type': 'application/json' }
    const otherHeaders = { Authorization: `Token ${otherToken}` }
    const managerHeaders = { Authorization: `Token ${managerToken}` }
    const requestBody = {
      tenant_name: 'Amina Tenant',
      unit_name: 'Block A, Unit 4',
      estate_slug: 'kilimani',
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
    const managerRentList = await fetch(`${baseUrl}/api/rent-payments/`, { headers: managerHeaders })
    assert.equal(managerRentList.status, 403)
    const otherUpdate = await fetch(`${baseUrl}/api/rent-payments/${created.id}/paid/`, {
      method: 'PATCH',
      headers: otherHeaders,
    })
    assert.equal(otherUpdate.status, 404)
    const managerUpdate = await fetch(`${baseUrl}/api/rent-payments/${created.id}/paid/`, {
      method: 'PATCH',
      headers: managerHeaders,
    })
    assert.equal(managerUpdate.status, 403)

    const paidResponse = await fetch(`${baseUrl}/api/rent-payments/${created.id}/paid/`, {
      method: 'PATCH',
      headers: ownerHeaders,
    })
    assert.equal(paidResponse.status, 200)
    const paid = await paidResponse.json()
    assert.ok(paid.paid_at)
    assert.equal(paid.id, created.id)

    const landlordDashboardResponse = await fetch(`${baseUrl}/api/dashboard/landlord/`, {
      headers: ownerHeaders,
    })
    assert.equal(landlordDashboardResponse.status, 200)
    const landlordDashboard = await landlordDashboardResponse.json()
    assert.equal(landlordDashboard.summary.received, requestBody.amount)
    assert.equal(landlordDashboard.summary.trackedUnits, 1)

    const estateDashboardResponse = await fetch(`${baseUrl}/api/dashboard/estate/`, {
      headers: managerHeaders,
    })
    assert.equal(estateDashboardResponse.status, 200)
    const estateDashboard = await estateDashboardResponse.json()
    assert.equal(estateDashboard.estate.slug, 'kilimani')
    assert.ok(estateDashboard.summary.properties > 0)
    assert.equal(estateDashboard.summary.received, requestBody.amount)
    assert.equal(Object.hasOwn(estateDashboard, 'recentPayments'), false)
  } finally {
    server.close()
  }
})
