import test from 'node:test'
import assert from 'node:assert/strict'

import app from './server.js'

async function startServer() {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  return { server, baseUrl: `http://127.0.0.1:${server.address().port}` }
}

const validSubmission = {
  property_name: 'Kilimani Court',
  property_type: 'apartment',
  city: 'Nairobi',
  area: 'Kilimani',
  street_address: 'Argwings Kodhek Road',
  tenure: 'leasehold',
  unit_counts: {
    bedsitters: 2,
    single_rooms: 0,
    one_bedroom: 8,
    two_bedrooms: 4,
    three_bedrooms: 1,
    four_plus_bedrooms: 0,
  },
  owners: [{ full_name: 'Property Owner', id_number: '12345678' }],
  managers: [{ full_name: 'Property Manager', id_number: '87654321', phone: '+254700000000', role: 'property_manager' }],
  legal_documents: { ownership_proof: true, land_rates_clearance: true },
  ownership_authorized: true,
  legal_acknowledgement: true,
}

test('property submissions are validated and queued for review', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const response = await fetch(`${baseUrl}/api/property-submissions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSubmission),
    })

    const payload = await response.json()
    assert.equal(response.status, 201)
    assert.match(payload.id, /^property-/)
    assert.equal(payload.status, 'pending_review')
    assert.equal(Object.hasOwn(payload, 'owners'), false)
  } finally {
    server.close()
  }
})

test('property submissions reject empty unit counts', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const response = await fetch(`${baseUrl}/api/property-submissions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validSubmission, unit_counts: {} }),
    })

    assert.equal(response.status, 400)
    assert.match(JSON.stringify(await response.json()), /unit/i)
  } finally {
    server.close()
  }
})