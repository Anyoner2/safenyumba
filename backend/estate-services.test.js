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
      full_name: 'Estate Resident',
      email,
      password: 'secret123',
      confirm_password: 'secret123',
    }),
  })
  assert.equal(response.status, 201)
  return (await response.json()).token
}

test('maintenance requests are private to their reporter and assigned estate manager', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const reporterEmail = `reporter-${crypto.randomUUID()}@example.com`
    const otherEmail = `other-${crypto.randomUUID()}@example.com`
    const managerEmail = `manager-${crypto.randomUUID()}@example.com`
    const reporterToken = await register(baseUrl, reporterEmail)
    const otherToken = await register(baseUrl, otherEmail)
    const managerToken = await register(baseUrl, managerEmail)
    const manager = globalThis.__safeNyumbaData.users.find((user) => user.email === managerEmail)
    manager.role = 'estate_manager'
    manager.managed_estate = 'kilimani'

    const reporterHeaders = { Authorization: `Token ${reporterToken}`, 'Content-Type': 'application/json' }
    const otherHeaders = { Authorization: `Token ${otherToken}`, 'Content-Type': 'application/json' }
    const managerHeaders = { Authorization: `Token ${managerToken}`, 'Content-Type': 'application/json' }
    const payload = {
      estate_slug: 'kilimani',
      unit_name: 'Block A, Unit 4',
      title: 'Leaking kitchen tap',
      description: 'Water is dripping under the sink.',
      priority: 'high',
    }

    assert.equal((await fetch(`${baseUrl}/api/maintenance-requests/`)).status, 401)
    const invalid = await fetch(`${baseUrl}/api/maintenance-requests/`, {
      method: 'POST',
      headers: reporterHeaders,
      body: JSON.stringify({ ...payload, estate_slug: 'unknown' }),
    })
    assert.equal(invalid.status, 400)

    const createdResponse = await fetch(`${baseUrl}/api/maintenance-requests/`, {
      method: 'POST',
      headers: reporterHeaders,
      body: JSON.stringify(payload),
    })
    assert.equal(createdResponse.status, 201)
    const created = await createdResponse.json()
    assert.equal(created.status, 'open')
    assert.equal(created.requester_name, 'Estate Resident')
    assert.equal(Object.hasOwn(created, 'user_id'), false)

    assert.deepEqual(await (await fetch(`${baseUrl}/api/maintenance-requests/`, { headers: otherHeaders })).json(), [])
    const managerList = await (await fetch(`${baseUrl}/api/maintenance-requests/`, { headers: managerHeaders })).json()
    assert.equal(managerList.length, 1)
    assert.equal(managerList[0].id, created.id)

    const landlordUpdate = await fetch(`${baseUrl}/api/maintenance-requests/${created.id}/status/`, {
      method: 'PATCH',
      headers: { ...reporterHeaders },
      body: JSON.stringify({ status: 'resolved' }),
    })
    assert.equal(landlordUpdate.status, 403)

    const invalidStatus = await fetch(`${baseUrl}/api/maintenance-requests/${created.id}/status/`, {
      method: 'PATCH',
      headers: managerHeaders,
      body: JSON.stringify({ status: 'ignored' }),
    })
    assert.equal(invalidStatus.status, 400)

    const updatedResponse = await fetch(`${baseUrl}/api/maintenance-requests/${created.id}/status/`, {
      method: 'PATCH',
      headers: managerHeaders,
      body: JSON.stringify({ status: 'in_progress' }),
    })
    assert.equal(updatedResponse.status, 200)
    assert.equal((await updatedResponse.json()).status, 'in_progress')
    const reporterList = await (await fetch(`${baseUrl}/api/maintenance-requests/`, { headers: reporterHeaders })).json()
    assert.equal(reporterList[0].status, 'in_progress')

    const otherEstateRequest = await fetch(`${baseUrl}/api/maintenance-requests/`, {
      method: 'POST',
      headers: otherHeaders,
      body: JSON.stringify({ ...payload, estate_slug: 'westlands' }),
    })
    assert.equal(otherEstateRequest.status, 201)
    const otherManagerEmail = `westlands-manager-${crypto.randomUUID()}@example.com`
    const otherManagerToken = await register(baseUrl, otherManagerEmail)
    const otherManager = globalThis.__safeNyumbaData.users.find((user) => user.email === otherManagerEmail)
    otherManager.role = 'estate_manager'
    otherManager.managed_estate = 'westlands'
    const otherEstateUpdate = await fetch(`${baseUrl}/api/maintenance-requests/${created.id}/status/`, {
      method: 'PATCH',
      headers: { Authorization: `Token ${otherManagerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    })
    assert.equal(otherEstateUpdate.status, 404)
  } finally {
    server.close()
  }
})

test('estate announcements are public and can only be posted by an assigned estate manager', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const landlordEmail = `announcement-landlord-${crypto.randomUUID()}@example.com`
    const managerEmail = `announcement-manager-${crypto.randomUUID()}@example.com`
    const landlordToken = await register(baseUrl, landlordEmail)
    const managerToken = await register(baseUrl, managerEmail)
    const manager = globalThis.__safeNyumbaData.users.find((user) => user.email === managerEmail)
    manager.role = 'estate_manager'
    manager.managed_estate = 'kilimani'
    const payload = {
      title: 'Scheduled water maintenance',
      body: 'Water service will be interrupted on Saturday morning.',
    }

    assert.deepEqual(await (await fetch(`${baseUrl}/api/announcements/`)).json(), [])
    const landlordPost = await fetch(`${baseUrl}/api/announcements/`, {
      method: 'POST',
      headers: { Authorization: `Token ${landlordToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    assert.equal(landlordPost.status, 403)

    const managerPost = await fetch(`${baseUrl}/api/announcements/`, {
      method: 'POST',
      headers: { Authorization: `Token ${managerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    assert.equal(managerPost.status, 201)
    const created = await managerPost.json()
    assert.equal(created.estate_slug, 'kilimani')
    assert.equal(created.estate_name, 'Kilimani')

    const publicList = await (await fetch(`${baseUrl}/api/announcements/`)).json()
    assert.equal(publicList.length, 1)
    assert.equal(publicList[0].title, payload.title)
    assert.equal(Object.hasOwn(publicList[0], 'author_id'), false)
    const filteredList = await (await fetch(`${baseUrl}/api/announcements/?estate=kilimani`)).json()
    assert.equal(filteredList.length, 1)
    const otherEstateList = await (await fetch(`${baseUrl}/api/announcements/?estate=westlands`)).json()
    assert.deepEqual(otherEstateList, [])
    assert.equal((await fetch(`${baseUrl}/api/announcements/?estate=unknown`)).status, 400)

    const invalidPost = await fetch(`${baseUrl}/api/announcements/`, {
      method: 'POST',
      headers: { Authorization: `Token ${managerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', body: '' }),
    })
    assert.equal(invalidPost.status, 400)
  } finally {
    server.close()
  }
})
