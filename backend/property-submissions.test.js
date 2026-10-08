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

test('property submissions accept complete GPS coordinates and reject out-of-range locations', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const response = await fetch(`${baseUrl}/api/property-submissions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validSubmission, latitude: -1.2921, longitude: 36.7875 }),
    })
    assert.equal(response.status, 201)
    const { id } = await response.json()
    const stored = globalThis.__safeNyumbaData.propertySubmissions.find((submission) =>
      submission.id === id,
    )
    assert.equal(stored.latitude, -1.2921)
    assert.equal(stored.longitude, 36.7875)
    assert.equal(stored.location_accuracy, 'gps')

    const invalidResponse = await fetch(`${baseUrl}/api/property-submissions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validSubmission, latitude: 91, longitude: 36.7875 }),
    })
    assert.equal(invalidResponse.status, 400)
    assert.match(JSON.stringify(await invalidResponse.json()), /latitude/i)

    const incompleteResponse = await fetch(`${baseUrl}/api/property-submissions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validSubmission, latitude: -1.2921 }),
    })
    assert.equal(incompleteResponse.status, 400)
    assert.match(JSON.stringify(await incompleteResponse.json()), /both GPS coordinates/i)
  } finally {
    server.close()
  }
})

test('Nairobi neighbourhood searches return area-matched homes within budget', async () => {
  const { server, baseUrl } = await startServer()
  const neighbourhoods = [
    'Buruburu', 'Donholm', 'Eastleigh', 'Embakasi', 'Hurlingham', 'Kahawa West',
    'Karen', 'Kasarani', 'Kileleshwa', 'Kilimani', "Lang'ata", 'Lavington',
    'Muthaiga', 'Nairobi CBD', 'Ngara', 'Pangani', 'Parklands', 'Roysambu',
    'Ruai', 'Runda', 'South B', 'South C', 'Umoja', 'Upper Hill', 'Westlands',
    'Zimmerman',
  ]

  try {
    const responses = await Promise.all(neighbourhoods.map((neighbourhood) =>
      fetch(`${baseUrl}/api/properties/?location=${encodeURIComponent(neighbourhood)}`),
    ))
    const neighbourhoodHomes = await Promise.all(responses.map((response) => response.json()))
    const affordableResponse = await fetch(`${baseUrl}/api/properties/?location=Umoja&budget=20000`)
    const affordableHomes = await affordableResponse.json()

    assert.ok(responses.every((response) => response.status === 200))
    assert.ok(neighbourhoodHomes.every((homes, index) =>
      homes.some((home) => home.location === neighbourhoods[index]),
    ))
    assert.ok(affordableHomes.length > 0)
    assert.ok(affordableHomes.every((home) => home.location === 'Umoja' && home.rent <= 20000))
    const mappedHomes = await (await fetch(`${baseUrl}/api/properties/`)).json()
    assert.ok(mappedHomes.some((home) => home.locationAccuracy === 'area' && Number.isFinite(home.latitude)))
    assert.ok(mappedHomes.every((home) =>
      (home.latitude === undefined && home.longitude === undefined)
      || (Number.isFinite(home.latitude) && Number.isFinite(home.longitude)),
    ))
  } finally {
    server.close()
  }
})