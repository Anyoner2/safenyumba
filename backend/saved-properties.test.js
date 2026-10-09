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
      full_name: 'Saved Home User',
      email,
      password: 'secret123',
      confirm_password: 'secret123',
    }),
  })
  assert.equal(response.status, 201)
  return (await response.json()).token
}

test('saved homes notify their owners only when an estate manager reopens them', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const savedHomeEmail = `saved-${crypto.randomUUID()}@example.com`
    const otherEmail = `other-${crypto.randomUUID()}@example.com`
    const managerEmail = `manager-${crypto.randomUUID()}@example.com`
    const savedHomeToken = await register(baseUrl, savedHomeEmail)
    const otherToken = await register(baseUrl, otherEmail)
    const managerToken = await register(baseUrl, managerEmail)
    const managerUser = globalThis.__safeNyumbaData.users.find((user) => user.email === managerEmail)
    managerUser.role = 'estate_manager'
    managerUser.managed_estate = 'kilimani'

    const savedHeaders = { Authorization: `Token ${savedHomeToken}` }
    const otherHeaders = { Authorization: `Token ${otherToken}` }
    const managerHeaders = { Authorization: `Token ${managerToken}`, 'Content-Type': 'application/json' }
    const propertyId = 'kilimani-two-bedroom'

    const saved = await fetch(`${baseUrl}/api/saved-properties/${propertyId}/`, {
      method: 'POST',
      headers: savedHeaders,
    })
    assert.equal(saved.status, 201)
    const savedList = await fetch(`${baseUrl}/api/saved-properties/`, { headers: savedHeaders })
    assert.deepEqual((await savedList.json()).map((property) => property.id), [propertyId])

    const occupied = await fetch(`${baseUrl}/api/properties/${propertyId}/vacancy/`, {
      method: 'PATCH',
      headers: managerHeaders,
      body: JSON.stringify({ vacant: false }),
    })
    assert.equal(occupied.status, 200)
    assert.equal((await (await fetch(`${baseUrl}/api/notifications/`, { headers: savedHeaders })).json()).length, 0)

    const publicHomes = await (await fetch(`${baseUrl}/api/properties/`)).json()
    assert.equal(publicHomes.some((property) => property.id === propertyId), false)

    const otherEstate = await fetch(`${baseUrl}/api/properties/westlands-loft/vacancy/`, {
      method: 'PATCH',
      headers: managerHeaders,
      body: JSON.stringify({ vacant: false }),
    })
    assert.equal(otherEstate.status, 404)
    const landlordUpdate = await fetch(`${baseUrl}/api/properties/${propertyId}/vacancy/`, {
      method: 'PATCH',
      headers: { Authorization: `Token ${otherToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ vacant: true }),
    })
    assert.equal(landlordUpdate.status, 403)

    const available = await fetch(`${baseUrl}/api/properties/${propertyId}/vacancy/`, {
      method: 'PATCH',
      headers: managerHeaders,
      body: JSON.stringify({ vacant: true }),
    })
    assert.equal(available.status, 200)
    assert.equal((await available.json()).notificationsCreated, 1)
    const stillAvailable = await fetch(`${baseUrl}/api/properties/${propertyId}/vacancy/`, {
      method: 'PATCH',
      headers: managerHeaders,
      body: JSON.stringify({ vacant: true }),
    })
    assert.equal((await stillAvailable.json()).notificationsCreated, 0)
    const notifications = await (await fetch(`${baseUrl}/api/notifications/`, { headers: savedHeaders })).json()
    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].type, 'vacancy')
    assert.equal(notifications[0].property.id, propertyId)
    assert.equal(notifications[0].read_at, null)
    assert.deepEqual(await (await fetch(`${baseUrl}/api/notifications/`, { headers: otherHeaders })).json(), [])

    const markRead = await fetch(`${baseUrl}/api/notifications/read-all/`, {
      method: 'PATCH',
      headers: savedHeaders,
    })
    assert.equal(markRead.status, 204)
    const readNotifications = await (await fetch(`${baseUrl}/api/notifications/`, { headers: savedHeaders })).json()
    assert.ok(readNotifications[0].read_at)

    const removed = await fetch(`${baseUrl}/api/saved-properties/${propertyId}/`, {
      method: 'DELETE',
      headers: savedHeaders,
    })
    assert.equal(removed.status, 204)
    assert.deepEqual(await (await fetch(`${baseUrl}/api/saved-properties/`, { headers: savedHeaders })).json(), [])
  } finally {
    server.close()
  }
})
