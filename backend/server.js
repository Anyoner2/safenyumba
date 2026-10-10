import crypto from 'node:crypto'

import cors from 'cors'
import express from 'express'
import { Pool } from 'pg'

const app = express()
const port = Number(process.env.PORT || 4000)
const isVercel = Boolean(process.env.VERCEL)
const databaseUrl = process.env.DATABASE_URL
let pool = null
let databaseReady = false

if (databaseUrl) {
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: !isVercel ? false : { rejectUnauthorized: false },
    })
  } catch (error) {
    console.warn('Postgres pool creation failed, falling back to memory store:', error.message)
  }
}

const data = globalThis.__safeNyumbaData ??= {
  users: [],
  tokens: {},
  propertySubmissions: [],
  rentPayments: [],
  propertyAvailability: {},
  savedProperties: [],
  notifications: [],
  maintenanceRequests: [],
  announcements: [],
  viewingRequests: [],
  ownerProperties: [],
  ownerUnits: [],
}
data.propertySubmissions ??= []
data.rentPayments ??= []
data.propertyAvailability ??= {}
data.savedProperties ??= []
data.notifications ??= []
data.maintenanceRequests ??= []
data.announcements ??= []
data.viewingRequests ??= []
data.ownerProperties ??= []
data.ownerUnits ??= []

const seedEstates = [
  {
    slug: 'kilimani',
    name: 'Kilimani',
    area: 'Nairobi',
    description: 'A central, leafy neighbourhood with cafés, convenience stores, and easy access to work and leisure.',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'westlands',
    name: 'Westlands',
    area: 'Nairobi',
    description: 'A vibrant urban district known for modern apartments, nightlife, and reliable amenities.',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'muthaiga',
    name: 'Muthaiga',
    area: 'Nairobi',
    description: 'An established residential area with graceful homes, green spaces, and a relaxed suburban feel.',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  },
]

const seedProperties = [
  {
    slug: 'kilimani-two-bedroom',
    estate: 'kilimani',
    title: 'Kilimani apartment',
    location: 'Kilimani',
    city: 'Nairobi',
    latitude: -1.2921,
    longitude: 36.7875,
    location_accuracy: 'area',
    rent: 68000,
    bedrooms: 2,
    amenity: 'Lift, security',
    kind: 'Apartment',
    verified: true,
    vacant: true,
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    ],
    image_alt: 'A modern apartment',
  },
  {
    slug: 'kilimani-three-bedroom',
    estate: 'kilimani',
    title: 'Kilimani family home',
    location: 'Kilimani',
    city: 'Nairobi',
    latitude: -1.2869,
    longitude: 36.7833,
    location_accuracy: 'area',
    rent: 110000,
    bedrooms: 3,
    amenity: 'Garden, parking',
    kind: 'Townhouse',
    verified: true,
    vacant: true,
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
    ],
    image_alt: 'A family home',
  },
  {
    slug: 'westlands-loft',
    estate: 'westlands',
    title: 'Westlands loft rental',
    location: 'Westlands',
    city: 'Nairobi',
    latitude: -1.2676,
    longitude: 36.8108,
    location_accuracy: 'area',
    rent: 94000,
    bedrooms: 2,
    amenity: 'Gym, balcony',
    kind: 'Apartment',
    verified: true,
    vacant: true,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?auto=format&fit=crop&w=1200&q=80',
    ],
    image_alt: 'A bright loft apartment',
  },
  {
    slug: 'muthaiga-bungalow',
    estate: 'muthaiga',
    title: 'Muthaiga bungalow',
    location: 'Muthaiga',
    city: 'Nairobi',
    latitude: -1.2465,
    longitude: 36.8325,
    location_accuracy: 'area',
    rent: 145000,
    bedrooms: 4,
    amenity: 'Garden, servant quarter',
    kind: 'Bungalow',
    verified: true,
    vacant: true,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80',
    ],
    image_alt: 'A spacious bungalow',
  },
]

const nairobiNeighbourhoodHomes = [
  ['kilimani-one-bedroom', 'Kilimani', 42000, 1, 'Flat'],
  ['westlands-one-bedroom', 'Westlands', 48000, 1, 'Apartment'],
  ['kileleshwa-one-bedroom', 'Kileleshwa', 45000, 1, 'Flat'],
  ['karen-two-bedroom', 'Karen', 75000, 2, 'Apartment'],
  ['nairobi-cbd-one-bedroom', 'Nairobi CBD', 25000, 1, 'Flat'],
  ['ngara-one-bedroom', 'Ngara', 18000, 1, 'Flat'],
  ['pangani-one-bedroom', 'Pangani', 20000, 1, 'Apartment'],
  ['eastleigh-one-bedroom', 'Eastleigh', 22000, 1, 'Flat'],
  ['south-b-one-bedroom', 'South B', 28000, 1, 'Apartment'],
  ['south-b-two-bedroom', 'South B', 45000, 2, 'Flat'],
  ['south-c-one-bedroom', 'South C', 32000, 1, 'Apartment'],
  ["langata-one-bedroom", "Lang'ata", 28000, 1, 'Flat'],
  ['embakasi-one-bedroom', 'Embakasi', 18000, 1, 'Flat'],
  ['umoja-one-bedroom', 'Umoja', 16000, 1, 'Flat'],
  ['donholm-one-bedroom', 'Donholm', 20000, 1, 'Apartment'],
  ['buruburu-two-bedroom', 'Buruburu', 38000, 2, 'Flat'],
  ['kasarani-one-bedroom', 'Kasarani', 18000, 1, 'Flat'],
  ['roysambu-one-bedroom', 'Roysambu', 22000, 1, 'Apartment'],
  ['zimmerman-one-bedroom', 'Zimmerman', 14000, 1, 'Flat'],
  ['kahawa-west-one-bedroom', 'Kahawa West', 13000, 1, 'Flat'],
  ['ruai-one-bedroom', 'Ruai', 15000, 1, 'Flat'],
  ['parklands-one-bedroom', 'Parklands', 35000, 1, 'Apartment'],
  ['lavington-one-bedroom', 'Lavington', 43000, 1, 'Flat'],
  ['hurlingham-one-bedroom', 'Hurlingham', 32000, 1, 'Apartment'],
  ['upper-hill-one-bedroom', 'Upper Hill', 40000, 1, 'Apartment'],
  ['runda-two-bedroom', 'Runda', 95000, 2, 'Townhouse'],
  ['muthaiga-two-bedroom', 'Muthaiga', 80000, 2, 'Apartment'],
].map(([slug, location, rent, bedrooms, kind], index) => ({
  slug,
  estate: slug.split('-').slice(0, -2).join('-') || slug.split('-')[0],
  title: `${location} ${bedrooms}-bedroom ${kind.toLowerCase()}`,
  location,
  city: 'Nairobi',
  rent,
  bedrooms,
  amenity: 'Secure entry, nearby shops',
  kind,
  verified: true,
  vacant: true,
  image: [
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
  ][index % 4],
  images: [
    [
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    ],
    [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?auto=format&fit=crop&w=1200&q=80',
    ],
    [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    ],
    [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80',
    ],
  ][index % 4],
  image_alt: `A ${bedrooms}-bedroom home in ${location}`,
}))

seedProperties.push(...nairobiNeighbourhoodHomes)

const knownEstateSlugs = new Set(seedEstates.map((estate) => estate.slug))
seedProperties.forEach((property) => {
  if (knownEstateSlugs.has(property.estate)) return
  knownEstateSlugs.add(property.estate)
  seedEstates.push({
    slug: property.estate,
    name: property.location,
    area: property.city,
    description: `Explore available homes and local rentals in ${property.location}.`,
    image: property.image,
  })
})

function saveData() {
  globalThis.__safeNyumbaData = data
}

async function initializeDatabase() {
  if (!pool) {
    databaseReady = false
    return false
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'landlord',
        managed_estate TEXT
      );
    `)
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'landlord'")
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS managed_estate TEXT')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
      );
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_submissions (
        id TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rent_payments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_name TEXT NOT NULL,
        unit_name TEXT NOT NULL,
        estate_slug TEXT,
        amount INTEGER NOT NULL CHECK (amount > 0),
        period TEXT NOT NULL,
        due_date DATE NOT NULL,
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)
    await pool.query('ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS estate_slug TEXT')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_availability (
        property_id TEXT PRIMARY KEY,
        estate_slug TEXT NOT NULL,
        vacant BOOLEAN NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_properties (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        property_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, property_id)
      );
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        property_id TEXT NOT NULL,
        notification_type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        read_at TIMESTAMPTZ
      );
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        estate_slug TEXT NOT NULL,
        unit_name TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS viewing_requests (
        id TEXT PRIMARY KEY,
        property_id TEXT NOT NULL,
        estate_slug TEXT NOT NULL,
        owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        request_type TEXT NOT NULL,
        requester_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        preferred_date DATE,
        message TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)
    await pool.query('ALTER TABLE viewing_requests ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES users(id) ON DELETE CASCADE')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS owner_properties (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        location TEXT NOT NULL,
        kind TEXT NOT NULL,
        amenity TEXT NOT NULL DEFAULT '',
        photos JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS owner_units (
        id TEXT PRIMARY KEY,
        property_id TEXT NOT NULL REFERENCES owner_properties(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        bedrooms INTEGER NOT NULL CHECK (bedrooms > 0),
        rent INTEGER NOT NULL CHECK (rent > 0),
        status TEXT NOT NULL CHECK (status IN ('vacant', 'occupied', 'reserved')),
        tenant_name TEXT NOT NULL DEFAULT '',
        tenant_email TEXT NOT NULL DEFAULT '',
        tenant_phone TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS estate_announcements (
        id TEXT PRIMARY KEY,
        estate_slug TEXT NOT NULL,
        author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    databaseReady = true
    return true
  } catch (error) {
    console.warn('Postgres initialization failed, falling back to memory store:', error.message)
    try {
      await pool.end()
    } catch {
      // ignore shutdown errors
    }
    pool = null
    databaseReady = false
    return false
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function serializeUser(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    full_name: user.first_name,
    role: user.role || 'landlord',
    managed_estate: user.managed_estate || null,
  }
}

async function getUserByEmail(email) {
  if (!pool || !databaseReady) {
    return data.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  return result.rows[0] || null
}

async function currentUserFromToken(token) {
  if (!token) return null

  if (!pool || !databaseReady) {
    if (!data.tokens[token]) return null
    const userId = data.tokens[token]
    return data.users.find((user) => user.id === userId) || null
  }

  const result = await pool.query(
    `SELECT u.*
     FROM tokens t
     INNER JOIN users u ON u.id = t.user_id
     WHERE t.token = $1`,
    [token],
  )

  return result.rows[0] || null
}

async function saveToken(token, userId) {
  if (!pool || !databaseReady) {
    data.tokens[token] = userId
    saveData()
    return
  }

  await pool.query(
    'INSERT INTO tokens (token, user_id) VALUES ($1, $2) ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id',
    [token, userId],
  )
}

async function clearToken(token) {
  if (!pool || !databaseReady) {
    if (token && data.tokens[token]) {
      delete data.tokens[token]
      saveData()
    }
    return
  }

  await pool.query('DELETE FROM tokens WHERE token = $1', [token])
}

function buildEstatePayload(estate, properties = seedProperties) {
  const homes = properties.filter(
    (property) => property.estate === estate.slug && property.verified && property.vacant,
  ).length

  return {
    slug: estate.slug,
    name: estate.name,
    area: estate.area,
    homes,
    description: estate.description,
    image: estate.image,
  }
}

async function getPropertiesWithAvailability() {
  let availability
  if (pool && databaseReady) {
    const result = await pool.query('SELECT property_id, vacant FROM property_availability')
    availability = new Map(result.rows.map((entry) => [entry.property_id, entry.vacant]))
  } else {
    availability = new Map(Object.entries(data.propertyAvailability))
  }

  const ownerProperties = await getAllOwnerProperties()
  const ownerUnits = await getOwnerUnitsForProperties(ownerProperties.map((property) => property.id))
  const unitsByPropertyId = new Map()
  ownerUnits.forEach((unit) => {
    const units = unitsByPropertyId.get(unit.property_id) || []
    units.push(unit)
    unitsByPropertyId.set(unit.property_id, units)
  })
  const registeredProperties = ownerProperties.flatMap((property) =>
    (unitsByPropertyId.get(property.id) || []).map((unit) => ({
      slug: `owner-unit-${unit.id}`,
      owner_id: property.owner_id,
      estate: property.id,
      title: `${property.name} · ${unit.name}`,
      location: property.location,
      city: property.city,
      rent: unit.rent,
      bedrooms: unit.bedrooms,
      amenity: property.amenity,
      kind: property.kind,
      verified: true,
      vacant: unit.status === 'vacant',
      status: unit.status,
      image: property.photos[0] || seedProperties[0].image,
      images: property.photos.length ? property.photos : [seedProperties[0].image],
      image_alt: `${unit.name} at ${property.name}`,
      available_date: null,
    })),
  )

  return [...seedProperties, ...registeredProperties].map((property) => ({
    ...property,
    vacant: availability.has(property.slug) ? availability.get(property.slug) : property.vacant,
  }))
}

async function getAllOwnerProperties() {
  if (pool && databaseReady) {
    const result = await pool.query(
      'SELECT id, owner_id, name, city, location, kind, amenity, photos, created_at FROM owner_properties ORDER BY created_at DESC',
    )
    return result.rows
  }
  return data.ownerProperties
}

async function getOwnerPropertiesForUser(ownerId) {
  if (pool && databaseReady) {
    const result = await pool.query(
      'SELECT id, owner_id, name, city, location, kind, amenity, photos, created_at FROM owner_properties WHERE owner_id = $1 ORDER BY created_at DESC',
      [ownerId],
    )
    return result.rows
  }
  return data.ownerProperties.filter((property) => property.owner_id === ownerId)
}

async function getOwnerUnitsForProperties(propertyIds) {
  if (!propertyIds.length) return []
  if (pool && databaseReady) {
    const result = await pool.query(
      `SELECT id, property_id, name, bedrooms, rent, status, tenant_name, tenant_email, tenant_phone, created_at
       FROM owner_units
       WHERE property_id = ANY($1::text[])
       ORDER BY created_at`,
      [propertyIds],
    )
    return result.rows
  }
  return data.ownerUnits.filter((unit) => propertyIds.includes(unit.property_id))
}

function findSeedProperty(propertyId) {
  return seedProperties.find((property) => property.slug === propertyId)
}

function buildPropertyPayload(property) {
  return {
    id: property.slug,
    title: property.title,
    location: property.location,
    city: property.city,
    ...(Number.isFinite(property.latitude) && Number.isFinite(property.longitude) ? {
      latitude: property.latitude,
      longitude: property.longitude,
      locationAccuracy: property.location_accuracy || 'gps',
    } : {}),
    rent: property.rent,
    bedrooms: property.bedrooms,
    amenity: property.amenity,
    kind: property.kind,
    verified: property.verified,
    vacant: property.vacant,
    image: property.image,
    imageAlt: property.image_alt,
    images: property.images || [property.image],
    availableDate: property.available_date || null,
    ...(property.owner_id ? { ownerListing: true } : {}),
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Token ') ? authHeader.slice(6).trim() : ''
  const user = await currentUserFromToken(token)
  if (!user) {
    return res.status(401).json({ detail: 'Authentication required.' })
  }

  req.user = user
  next()
}

function roleRequired(role, message) {
  return (req, res, next) => {
    if ((req.user.role || 'landlord') !== role) {
      return res.status(403).json({ detail: message })
    }
    next()
  }
}

function sortRentPayments(payments) {
  return payments.sort((first, second) =>
    second.period.localeCompare(first.period)
    || first.due_date.localeCompare(second.due_date)
    || second.created_at.localeCompare(first.created_at),
  )
}

async function getRentPaymentsForUser(userId) {
  if (pool && databaseReady) {
    const result = await pool.query(
      `SELECT id, tenant_name, unit_name, estate_slug, amount, period, due_date, paid_at, created_at
       FROM rent_payments
       WHERE user_id = $1
       ORDER BY period DESC, due_date ASC, created_at DESC`,
      [userId],
    )
    return result.rows
  }

  return sortRentPayments(data.rentPayments.filter((payment) => payment.user_id === userId))
}

async function getRentPaymentsForEstate(estateSlug) {
  if (pool && databaseReady) {
    const result = await pool.query(
      `SELECT unit_name, amount, period, due_date, paid_at, created_at
       FROM rent_payments
       WHERE estate_slug = $1
       ORDER BY period DESC, due_date ASC, created_at DESC`,
      [estateSlug],
    )
    return result.rows
  }

  return sortRentPayments(data.rentPayments.filter((payment) => payment.estate_slug === estateSlug))
}

await initializeDatabase()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '12mb' }))

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Safe Nyumba API',
    message: 'API is running.',
    endpoints: {
      health: '/api/health/',
      properties: '/api/properties/',
      estates: '/api/estates/',
      auth: '/api/auth/',
    },
  })
})

app.get('/api/health/', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/properties/', async (req, res) => {
  const { location = '', budget, minRent, maxRent, bedrooms, kind, amenity } = req.query

  let filtered = (await getPropertiesWithAvailability()).filter((property) => property.vacant && property.verified)

  if (location) {
    const value = String(location).trim().toLowerCase()
    filtered = filtered.filter(
      (property) =>
        property.location.toLowerCase().includes(value) ||
      property.city.toLowerCase().includes(value) ||
      property.estate.toLowerCase().includes(value),
    )
  }

  const minimumRent = minRent ? Number(minRent) : 0
  const maximumRent = maxRent ? Number(maxRent) : budget ? Number(budget) : Infinity
  if ((minRent && (!Number.isInteger(minimumRent) || minimumRent < 0))
    || ((maxRent || budget) && (!Number.isInteger(maximumRent) || maximumRent < 0))) {
    return res.status(400).json({ rent: ['Enter a whole number greater than or equal to zero.'] })
  }
  if (minimumRent > maximumRent) {
    return res.status(400).json({ rent: ['Minimum rent cannot exceed maximum rent.'] })
  }
  filtered = filtered.filter((property) => property.rent >= minimumRent && property.rent <= maximumRent)

  if (kind) {
    const value = String(kind).trim().toLowerCase()
    filtered = filtered.filter((property) => property.kind.toLowerCase() === value)
  }

  if (amenity) {
    const value = String(amenity).trim().toLowerCase()
    filtered = filtered.filter((property) => property.amenity.toLowerCase().includes(value))
  }

  if (bedrooms) {
    const bedroomCount = Number(bedrooms)
    if (!Number.isInteger(bedroomCount) || bedroomCount < 1) {
      return res.status(400).json({ bedrooms: ['Enter a positive whole number.'] })
    }

    if (bedroomCount === 3) {
      filtered = filtered.filter((property) => property.bedrooms >= 3)
    } else {
      filtered = filtered.filter((property) => property.bedrooms === bedroomCount)
    }
  }

  res.json(filtered.map(buildPropertyPayload))
})

app.post('/api/viewing-requests/', async (req, res) => {
  const body = req.body || {}
  const propertyId = typeof body.property_id === 'string' ? body.property_id.trim() : ''
  const requestType = typeof body.request_type === 'string' ? body.request_type : ''
  const requesterName = typeof body.requester_name === 'string' ? body.requester_name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const preferredDate = typeof body.preferred_date === 'string' ? body.preferred_date : ''
  const validPreferredDate = /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)
    && !Number.isNaN(Date.parse(`${preferredDate}T00:00:00.000Z`))
    && new Date(`${preferredDate}T00:00:00.000Z`).toISOString().slice(0, 10) === preferredDate
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const property = (await getPropertiesWithAvailability()).find(
    (entry) => entry.slug === propertyId && entry.vacant && entry.verified,
  )
  const errors = {}

  if (!property) errors.property_id = ['Choose a currently available home.']
  if (!['viewing', 'contact'].includes(requestType)) errors.request_type = ['Choose a valid request type.']
  if (!requesterName || requesterName.length > 120) errors.requester_name = ['Enter your name (up to 120 characters).']
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = ['Enter a valid email address.']
  if (!phone || phone.length > 40) errors.phone = ['Enter a phone number (up to 40 characters).']
  if (requestType === 'viewing' && !validPreferredDate) {
    errors.preferred_date = ['Choose a preferred viewing date.']
  } else if (requestType === 'viewing' && preferredDate < new Date().toISOString().slice(0, 10)) {
    errors.preferred_date = ['Choose today or a future date.']
  }
  if (message.length > 2000) errors.message = ['Keep your message under 2,000 characters.']
  if (Object.keys(errors).length) return res.status(400).json(errors)

  const request = {
    id: `viewing-${crypto.randomUUID()}`,
    property_id: property.slug,
    property_title: property.title,
    estate_slug: property.estate,
    owner_id: property.owner_id || null,
    request_type: requestType,
    requester_name: requesterName,
    email,
    phone,
    preferred_date: preferredDate || null,
    message,
    created_at: new Date().toISOString(),
  }

  if (pool && databaseReady) {
    const result = await pool.query(
      `INSERT INTO viewing_requests
       (id, property_id, estate_slug, owner_id, request_type, requester_name, email, phone, preferred_date, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, property_id, estate_slug, owner_id, request_type, requester_name, email, phone, preferred_date, message, created_at`,
      [
        request.id, request.property_id, request.estate_slug, request.owner_id, request.request_type,
        request.requester_name, request.email, request.phone, request.preferred_date, request.message,
        request.created_at,
      ],
    )
    return res.status(201).json({ ...result.rows[0], property_title: property.title })
  }

  data.viewingRequests.push(request)
  saveData()
  res.status(201).json(request)
})

function parseOwnerPhotos(photos) {
  if (!Array.isArray(photos) || photos.length > 5) {
    return { error: 'Upload up to 5 photos.' }
  }

  const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
  for (const photo of photos) {
    const match = typeof photo === 'string'
      ? photo.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/)
      : null
    if (!match || !supportedTypes.has(match[1])) {
      return { error: 'Photos must be JPEG, PNG, or WebP image files.' }
    }

    const bytes = Buffer.from(match[2], 'base64')
    if (!bytes.length || bytes.length > 1024 * 1024) {
      return { error: 'Each photo must be smaller than 1 MB.' }
    }
    const validSignature = match[1] === 'image/jpeg'
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : match[1] === 'image/png'
        ? bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        : bytes.toString('ascii', 0, 4) === 'RIFF'
          && bytes.toString('ascii', 8, 12) === 'WEBP'
    if (!validSignature) return { error: 'A photo does not match its image file type.' }
  }
  return { photos }
}

function serializeOwnerUnit(unit) {
  return {
    id: unit.id,
    property_id: unit.property_id,
    name: unit.name,
    bedrooms: Number(unit.bedrooms),
    rent: Number(unit.rent),
    status: unit.status,
    tenant_name: unit.tenant_name || '',
    tenant_email: unit.tenant_email || '',
    tenant_phone: unit.tenant_phone || '',
    created_at: unit.created_at,
  }
}

async function notifySavedHomeUsers(property) {
  const createdAt = new Date().toISOString()
  const title = `${property.title} is available again`
  const message = `${property.title} in ${property.location} is available to view.`
  if (pool && databaseReady) {
    const result = await pool.query('SELECT user_id FROM saved_properties WHERE property_id = $1', [property.slug])
    for (const { user_id: userId } of result.rows) {
      await pool.query(
        `INSERT INTO notifications (id, user_id, property_id, notification_type, title, message, created_at)
         VALUES ($1, $2, $3, 'vacancy', $4, $5, $6)`,
        [`notification-${crypto.randomUUID()}`, userId, property.slug, title, message, createdAt],
      )
    }
    return result.rowCount
  }

  const userIds = data.savedProperties
    .filter((entry) => entry.property_id === property.slug)
    .map((entry) => entry.user_id)
  data.notifications.push(...userIds.map((userId) => ({
    id: `notification-${crypto.randomUUID()}`,
    user_id: userId,
    property_id: property.slug,
    notification_type: 'vacancy',
    title,
    message,
    created_at: createdAt,
    read_at: null,
  })))
  saveData()
  return userIds.length
}

app.post('/api/owner/properties/', authRequired, roleRequired('landlord', 'Only owner accounts can register properties.'), async (req, res) => {
  const body = req.body || {}
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const city = typeof body.city === 'string' ? body.city.trim() : ''
  const location = typeof body.location === 'string' ? body.location.trim() : ''
  const kind = typeof body.kind === 'string' ? body.kind : ''
  const amenity = typeof body.amenity === 'string' ? body.amenity.trim() : ''
  const photoResult = parseOwnerPhotos(body.photos ?? [])
  const errors = {}

  if (!name || name.length > 160) errors.name = ['Enter a property name (up to 160 characters).']
  if (!city || city.length > 120) errors.city = ['Enter a city or county (up to 120 characters).']
  if (!location || location.length > 120) errors.location = ['Enter a neighbourhood or estate (up to 120 characters).']
  if (!['Apartment', 'Flat', 'Townhouse', 'Maisonette', 'Bungalow', 'Bedsitter'].includes(kind)) {
    errors.kind = ['Choose a supported property type.']
  }
  if (amenity.length > 500) errors.amenity = ['Keep amenities under 500 characters.']
  if (photoResult.error) errors.photos = [photoResult.error]
  if (Object.keys(errors).length) return res.status(400).json(errors)

  const property = {
    id: `owner-property-${crypto.randomUUID()}`,
    owner_id: req.user.id,
    name,
    city,
    location,
    kind,
    amenity,
    photos: photoResult.photos,
    created_at: new Date().toISOString(),
  }
  if (pool && databaseReady) {
    await pool.query(
      `INSERT INTO owner_properties (id, owner_id, name, city, location, kind, amenity, photos, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [property.id, property.owner_id, property.name, property.city, property.location, property.kind,
        property.amenity, JSON.stringify(property.photos), property.created_at],
    )
  } else {
    data.ownerProperties.push(property)
    saveData()
  }

  res.status(201).json({ ...property, units: [] })
})

app.post('/api/owner/properties/:propertyId/units/', authRequired, roleRequired('landlord', 'Only owner accounts can manage units.'), async (req, res) => {
  const properties = await getOwnerPropertiesForUser(req.user.id)
  const property = properties.find((entry) => entry.id === req.params.propertyId)
  if (!property) return res.status(404).json({ detail: 'Property not found in your portfolio.' })

  const body = req.body || {}
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const bedrooms = Number(body.bedrooms)
  const rent = Number(body.rent)
  const errors = {}
  if (!name || name.length > 120) errors.name = ['Enter a unit name (up to 120 characters).']
  if (!Number.isSafeInteger(bedrooms) || bedrooms < 1 || bedrooms > 20) errors.bedrooms = ['Enter a bedroom count from 1 to 20.']
  if (!Number.isSafeInteger(rent) || rent < 1 || rent > 1000000000) errors.rent = ['Enter monthly rent from KSh 1 to KSh 1,000,000,000.']
  if (Object.keys(errors).length) return res.status(400).json(errors)

  const unit = {
    id: `owner-unit-${crypto.randomUUID()}`,
    property_id: property.id,
    name,
    bedrooms,
    rent,
    status: 'vacant',
    tenant_name: '',
    tenant_email: '',
    tenant_phone: '',
    created_at: new Date().toISOString(),
  }
  if (pool && databaseReady) {
    await pool.query(
      `INSERT INTO owner_units (id, property_id, name, bedrooms, rent, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [unit.id, unit.property_id, unit.name, unit.bedrooms, unit.rent, unit.status, unit.created_at],
    )
  } else {
    data.ownerUnits.push(unit)
    saveData()
  }
  res.status(201).json(serializeOwnerUnit(unit))
})

app.patch('/api/owner/properties/:propertyId/units/:unitId/', authRequired, roleRequired('landlord', 'Only owner accounts can manage units.'), async (req, res) => {
  const properties = await getOwnerPropertiesForUser(req.user.id)
  const property = properties.find((entry) => entry.id === req.params.propertyId)
  if (!property) return res.status(404).json({ detail: 'Property not found in your portfolio.' })
  const units = await getOwnerUnitsForProperties([property.id])
  const current = units.find((entry) => entry.id === req.params.unitId)
  if (!current) return res.status(404).json({ detail: 'Unit not found in this property.' })

  const body = req.body || {}
  const name = body.name === undefined ? current.name : typeof body.name === 'string' ? body.name.trim() : ''
  const bedrooms = body.bedrooms === undefined ? Number(current.bedrooms) : Number(body.bedrooms)
  const rent = body.rent === undefined ? Number(current.rent) : Number(body.rent)
  const status = body.status === undefined ? current.status : body.status
  const tenantName = status === 'occupied'
    ? (typeof body.tenant_name === 'string' ? body.tenant_name.trim() : current.tenant_name || '')
    : ''
  const tenantEmail = status === 'occupied'
    ? (typeof body.tenant_email === 'string' ? body.tenant_email.trim().toLowerCase() : current.tenant_email || '')
    : ''
  const tenantPhone = status === 'occupied'
    ? (typeof body.tenant_phone === 'string' ? body.tenant_phone.trim() : current.tenant_phone || '')
    : ''
  const errors = {}
  if (!name || name.length > 120) errors.name = ['Enter a unit name (up to 120 characters).']
  if (!Number.isSafeInteger(bedrooms) || bedrooms < 1 || bedrooms > 20) errors.bedrooms = ['Enter a bedroom count from 1 to 20.']
  if (!Number.isSafeInteger(rent) || rent < 1 || rent > 1000000000) errors.rent = ['Enter monthly rent from KSh 1 to KSh 1,000,000,000.']
  if (!['vacant', 'occupied', 'reserved'].includes(status)) errors.status = ['Choose Vacant, Occupied, or Reserved.']
  if (status === 'occupied' && (!tenantName || tenantName.length > 120)) errors.tenant_name = ['Enter the current tenant name (up to 120 characters).']
  if (status === 'occupied' && (!tenantPhone || tenantPhone.length > 40)) errors.tenant_phone = ['Enter the current tenant phone number.']
  if (tenantEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantEmail) || tenantEmail.length > 254)) errors.tenant_email = ['Enter a valid tenant email address.']
  if (Object.keys(errors).length) return res.status(400).json(errors)

  const updated = { ...current, name, bedrooms, rent, status, tenant_name: tenantName, tenant_email: tenantEmail, tenant_phone: tenantPhone }
  if (pool && databaseReady) {
    await pool.query(
      `UPDATE owner_units
       SET name = $1, bedrooms = $2, rent = $3, status = $4, tenant_name = $5, tenant_email = $6, tenant_phone = $7
       WHERE id = $8 AND property_id = $9`,
      [updated.name, updated.bedrooms, updated.rent, updated.status, updated.tenant_name,
        updated.tenant_email, updated.tenant_phone, updated.id, property.id],
    )
  } else {
    const index = data.ownerUnits.findIndex((unit) => unit.id === updated.id)
    data.ownerUnits[index] = updated
    saveData()
  }
  let notificationsCreated = 0
  if (updated.status === 'vacant' && current.status !== 'vacant') {
    const currentProperty = await getPropertiesWithAvailability()
    const publicProperty = currentProperty.find((entry) => entry.slug === `owner-unit-${updated.id}`)
    if (publicProperty) notificationsCreated = await notifySavedHomeUsers(publicProperty)
  }
  res.json({ ...serializeOwnerUnit(updated), notificationsCreated })
})

app.get('/api/estates/', async (req, res) => {
  const properties = await getPropertiesWithAvailability()
  res.json(seedEstates.map((estate) => buildEstatePayload(estate, properties)))
})

app.get('/api/saved-properties/', authRequired, async (req, res) => {
  let savedIds
  if (pool && databaseReady) {
    const result = await pool.query(
      'SELECT property_id FROM saved_properties WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id],
    )
    savedIds = result.rows.map((row) => row.property_id)
  } else {
    savedIds = data.savedProperties
      .filter((entry) => entry.user_id === req.user.id)
      .map((entry) => entry.property_id)
  }

  const properties = await getPropertiesWithAvailability()
  const propertiesById = new Map(properties.map((property) => [property.slug, property]))
  res.json(savedIds.map((id) => propertiesById.get(id)).filter(Boolean).map(buildPropertyPayload))
})

app.post('/api/saved-properties/:id/', authRequired, async (req, res) => {
  const property = (await getPropertiesWithAvailability()).find((entry) => entry.slug === req.params.id)
  if (!property || !property.verified) return res.status(404).json({ detail: 'Property not found.' })

  if (pool && databaseReady) {
    await pool.query(
      'INSERT INTO saved_properties (user_id, property_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, property.slug],
    )
  } else if (!data.savedProperties.some((entry) =>
    entry.user_id === req.user.id && entry.property_id === property.slug,
  )) {
    data.savedProperties.push({ user_id: req.user.id, property_id: property.slug })
    saveData()
  }

  res.status(201).json({ id: property.slug })
})

app.delete('/api/saved-properties/:id/', authRequired, async (req, res) => {
  if (pool && databaseReady) {
    await pool.query(
      'DELETE FROM saved_properties WHERE user_id = $1 AND property_id = $2',
      [req.user.id, req.params.id],
    )
  } else {
    data.savedProperties = data.savedProperties.filter((entry) =>
      !(entry.user_id === req.user.id && entry.property_id === req.params.id),
    )
    saveData()
  }

  res.status(204).send()
})

app.get('/api/notifications/', authRequired, async (req, res) => {
  let notifications
  if (pool && databaseReady) {
    const result = await pool.query(
      `SELECT id, property_id, notification_type, title, message, created_at, read_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id],
    )
    notifications = result.rows
  } else {
    notifications = data.notifications
      .filter((entry) => entry.user_id === req.user.id)
      .sort((first, second) => second.created_at.localeCompare(first.created_at))
  }

  const propertiesById = new Map(
    (await getPropertiesWithAvailability()).map((property) => [property.slug, property]),
  )
  res.json(notifications.map((notification) => {
    const property = propertiesById.get(notification.property_id) || findSeedProperty(notification.property_id)
    return {
      id: notification.id,
      type: notification.notification_type,
      title: notification.title,
      message: notification.message,
      created_at: notification.created_at,
      read_at: notification.read_at,
      property: property ? buildPropertyPayload(property) : null,
    }
  }))
})

app.patch('/api/notifications/read-all/', authRequired, async (req, res) => {
  const readAt = new Date().toISOString()
  if (pool && databaseReady) {
    await pool.query(
      'UPDATE notifications SET read_at = $1 WHERE user_id = $2 AND read_at IS NULL',
      [readAt, req.user.id],
    )
  } else {
    data.notifications.forEach((notification) => {
      if (notification.user_id === req.user.id && !notification.read_at) notification.read_at = readAt
    })
    saveData()
  }
  res.status(204).send()
})

app.patch('/api/properties/:id/vacancy/', authRequired, roleRequired('estate_manager', 'Only estate managers can update listing availability.'), async (req, res) => {
  const property = findSeedProperty(req.params.id)
  const vacant = req.body?.vacant
  const managedEstate = req.user.managed_estate
  if (!property || property.estate !== managedEstate) {
    return res.status(404).json({ detail: 'Property not found in your assigned estate.' })
  }
  if (typeof vacant !== 'boolean') {
    return res.status(400).json({ vacant: ['Choose whether the property is available.'] })
  }

  const current = await getPropertiesWithAvailability()
  const previousVacancy = current.find((entry) => entry.slug === property.slug)?.vacant
  if (previousVacancy === vacant) {
    return res.json({ property: buildPropertyPayload({ ...property, vacant }), notificationsCreated: 0 })
  }

  const createdAt = new Date().toISOString()
  let savedUserIds = []
  if (pool && databaseReady) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO property_availability (property_id, estate_slug, vacant, updated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (property_id) DO UPDATE
         SET vacant = EXCLUDED.vacant, updated_at = EXCLUDED.updated_at`,
        [property.slug, property.estate, vacant, createdAt],
      )
      if (vacant && !previousVacancy) {
        const saved = await client.query(
          'SELECT user_id FROM saved_properties WHERE property_id = $1',
          [property.slug],
        )
        savedUserIds = saved.rows.map((row) => row.user_id)
        for (const userId of savedUserIds) {
          await client.query(
            `INSERT INTO notifications (id, user_id, property_id, notification_type, title, message, created_at)
             VALUES ($1, $2, $3, 'vacancy', $4, $5, $6)`,
            [
              `notification-${crypto.randomUUID()}`,
              userId,
              property.slug,
              `${property.title} is available again`,
              `${property.title} in ${property.location} is available to view.`,
              createdAt,
            ],
          )
        }
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } else {
    data.propertyAvailability[property.slug] = vacant
    if (vacant && !previousVacancy) {
      const savedEntries = data.savedProperties.filter((entry) => entry.property_id === property.slug)
      savedUserIds = savedEntries.map((entry) => entry.user_id)
      data.notifications.push(...savedUserIds.map((userId) => ({
        id: `notification-${crypto.randomUUID()}`,
        user_id: userId,
        property_id: property.slug,
        notification_type: 'vacancy',
        title: `${property.title} is available again`,
        message: `${property.title} in ${property.location} is available to view.`,
        created_at: createdAt,
        read_at: null,
      })))
    }
    saveData()
  }

  res.json({
    property: buildPropertyPayload({ ...property, vacant }),
    notificationsCreated: savedUserIds.length,
  })
})

app.get('/api/maintenance-requests/', authRequired, async (req, res) => {
  const isManager = req.user.role === 'estate_manager'
  if (isManager && !seedEstates.some((estate) => estate.slug === req.user.managed_estate)) {
    return res.status(403).json({ detail: 'An assigned estate-manager account is required.' })
  }

  if (pool && databaseReady) {
    const result = isManager
      ? await pool.query(
        `SELECT mr.id, mr.estate_slug, mr.unit_name, mr.title, mr.description,
                mr.priority, mr.status, mr.created_at, mr.updated_at, u.first_name AS requester_name
         FROM maintenance_requests mr
         INNER JOIN users u ON u.id = mr.user_id
         WHERE mr.estate_slug = $1
         ORDER BY mr.created_at DESC`,
        [req.user.managed_estate],
      )
      : await pool.query(
        `SELECT mr.id, mr.estate_slug, mr.unit_name, mr.title, mr.description,
                mr.priority, mr.status, mr.created_at, mr.updated_at, u.first_name AS requester_name
         FROM maintenance_requests mr
         INNER JOIN users u ON u.id = mr.user_id
         WHERE mr.user_id = $1
         ORDER BY mr.created_at DESC`,
        [req.user.id],
      )
    return res.json(result.rows)
  }

  const requests = data.maintenanceRequests
    .filter((request) => isManager
      ? request.estate_slug === req.user.managed_estate
      : request.user_id === req.user.id)
    .sort((first, second) => second.created_at.localeCompare(first.created_at))
  res.json(requests.map(({ user_id, ...request }) => request))
})

app.post('/api/maintenance-requests/', authRequired, async (req, res) => {
  const body = req.body || {}
  const estateSlug = typeof body.estate_slug === 'string' ? body.estate_slug : ''
  if (req.user.role === 'estate_manager' && !seedEstates.some((estate) => estate.slug === req.user.managed_estate)) {
    return res.status(403).json({ detail: 'An assigned estate-manager account is required.' })
  }
  if (req.user.role === 'estate_manager' && estateSlug !== req.user.managed_estate) {
    return res.status(403).json({ detail: 'You can only submit requests for your assigned estate.' })
  }
  const unitName = typeof body.unit_name === 'string' ? body.unit_name.trim() : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const priority = typeof body.priority === 'string' ? body.priority : 'normal'
  const errors = {}

  if (!seedEstates.some((estate) => estate.slug === estateSlug)) errors.estate_slug = ['Choose an available estate.']
  if (!unitName || unitName.length > 120) errors.unit_name = ['Enter a unit or property (up to 120 characters).']
  if (!title || title.length > 120) errors.title = ['Enter a request title (up to 120 characters).']
  if (!description || description.length > 2000) errors.description = ['Describe the issue in up to 2,000 characters.']
  if (!['normal', 'high', 'urgent'].includes(priority)) errors.priority = ['Choose a valid priority.']
  if (Object.keys(errors).length) return res.status(400).json(errors)

  const createdAt = new Date().toISOString()
  const request = {
    id: `maintenance-${crypto.randomUUID()}`,
    user_id: req.user.id,
    requester_name: req.user.first_name,
    estate_slug: estateSlug,
    unit_name: unitName,
    title,
    description,
    priority,
    status: 'open',
    created_at: createdAt,
    updated_at: createdAt,
  }

  if (pool && databaseReady) {
    const result = await pool.query(
      `INSERT INTO maintenance_requests
       (id, user_id, estate_slug, unit_name, title, description, priority, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, estate_slug, unit_name, title, description, priority, status, created_at, updated_at`,
      [
        request.id, request.user_id, request.estate_slug, request.unit_name, request.title,
        request.description, request.priority, request.status, request.created_at, request.updated_at,
      ],
    )
    return res.status(201).json({ ...result.rows[0], requester_name: req.user.first_name })
  }

  data.maintenanceRequests.push(request)
  saveData()
  const { user_id, ...publicRequest } = request
  res.status(201).json(publicRequest)
})

app.patch('/api/maintenance-requests/:id/status/', authRequired, roleRequired('estate_manager', 'Only estate managers can update maintenance requests.'), async (req, res) => {
  if (!seedEstates.some((estate) => estate.slug === req.user.managed_estate)) {
    return res.status(403).json({ detail: 'An assigned estate-manager account is required.' })
  }
  const status = req.body?.status
  if (!['open', 'in_progress', 'resolved'].includes(status)) {
    return res.status(400).json({ status: ['Choose a valid request status.'] })
  }

  const updatedAt = new Date().toISOString()
  if (pool && databaseReady) {
    const result = await pool.query(
      `UPDATE maintenance_requests
       SET status = $1, updated_at = $2
       WHERE id = $3 AND estate_slug = $4
       RETURNING id, user_id, estate_slug, unit_name, title, description, priority, status, created_at, updated_at`,
      [status, updatedAt, req.params.id, req.user.managed_estate],
    )
    if (!result.rowCount) return res.status(404).json({ detail: 'Maintenance request not found in your assigned estate.' })
    const { user_id: requesterId, ...publicRequest } = result.rows[0]
    const reporter = await pool.query('SELECT first_name FROM users WHERE id = $1', [requesterId])
    return res.json({ ...publicRequest, requester_name: reporter.rows[0]?.first_name || '' })
  }

  const request = data.maintenanceRequests.find(
    (entry) => entry.id === req.params.id && entry.estate_slug === req.user.managed_estate,
  )
  if (!request) return res.status(404).json({ detail: 'Maintenance request not found in your assigned estate.' })
  request.status = status
  request.updated_at = updatedAt
  saveData()
  const { user_id, ...publicRequest } = request
  res.json(publicRequest)
})

app.get('/api/announcements/', async (req, res) => {
  const estateSlug = typeof req.query.estate === 'string' ? req.query.estate : ''
  if (estateSlug && !seedEstates.some((estate) => estate.slug === estateSlug)) {
    return res.status(400).json({ estate: ['Choose an available estate.'] })
  }

  if (pool && databaseReady) {
    const result = await pool.query(
      `SELECT a.id, a.estate_slug, a.title, a.body, a.created_at,
              u.first_name AS author_name
       FROM estate_announcements a
       INNER JOIN users u ON u.id = a.author_id
       WHERE ($1 = '' OR a.estate_slug = $1)
       ORDER BY a.created_at DESC`,
      [estateSlug],
    )
    const estatesBySlug = new Map(seedEstates.map((estate) => [estate.slug, estate.name]))
    return res.json(result.rows.map((announcement) => ({
      ...announcement,
      estate_name: estatesBySlug.get(announcement.estate_slug),
    })))
  }

  const estatesBySlug = new Map(seedEstates.map((estate) => [estate.slug, estate.name]))
  const usersById = new Map(data.users.map((user) => [user.id, user.first_name]))
  const announcements = data.announcements
    .filter((announcement) => !estateSlug || announcement.estate_slug === estateSlug)
    .sort((first, second) => second.created_at.localeCompare(first.created_at))
    .map((announcement) => ({
      id: announcement.id,
      estate_slug: announcement.estate_slug,
      title: announcement.title,
      body: announcement.body,
      created_at: announcement.created_at,
      estate_name: estatesBySlug.get(announcement.estate_slug),
      author_name: usersById.get(announcement.author_id) || '',
    }))
  res.json(announcements)
})

app.post('/api/announcements/', authRequired, roleRequired('estate_manager', 'Only estate managers can post announcements.'), async (req, res) => {
  const managedEstate = seedEstates.find((estate) => estate.slug === req.user.managed_estate)
  if (!managedEstate) return res.status(403).json({ detail: 'An assigned estate-manager account is required.' })

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : ''
  const errors = {}
  if (!title || title.length > 120) errors.title = ['Enter a title (up to 120 characters).']
  if (!body || body.length > 3000) errors.body = ['Enter an announcement (up to 3,000 characters).']
  if (Object.keys(errors).length) return res.status(400).json(errors)

  const announcement = {
    id: `announcement-${crypto.randomUUID()}`,
    estate_slug: managedEstate.slug,
    estate_name: managedEstate.name,
    author_id: req.user.id,
    author_name: req.user.first_name,
    title,
    body,
    created_at: new Date().toISOString(),
  }

  if (pool && databaseReady) {
    const result = await pool.query(
      `INSERT INTO estate_announcements (id, estate_slug, author_id, title, body, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, estate_slug, title, body, created_at`,
      [announcement.id, announcement.estate_slug, announcement.author_id, title, body, announcement.created_at],
    )
    return res.status(201).json({
      ...result.rows[0],
      estate_name: managedEstate.name,
      author_name: req.user.first_name,
    })
  }

  data.announcements.push(announcement)
  saveData()
  const { author_id, ...publicAnnouncement } = announcement
  res.status(201).json(publicAnnouncement)
})

app.post('/api/property-submissions/', async (req, res) => {
  const body = req.body || {}
  const errors = {}
  const propertyTypes = new Set([
    'apartment', 'flat', 'townhouse', 'maisonette', 'bungalow', 'bedsitter_block',
    'single_room_block', 'mixed_use', 'other',
  ])
  const unitTypes = ['bedsitters', 'single_rooms', 'one_bedroom', 'two_bedrooms', 'three_bedrooms', 'four_plus_bedrooms']
  const legalDocumentTypes = [
    'ownership_proof', 'land_rates_clearance', 'land_rent_clearance', 'approved_building_plans',
    'occupation_certificate', 'environmental_approval', 'management_authority', 'tax_compliance',
  ]
  const text = (value) => typeof value === 'string' ? value.trim() : ''
  const propertyName = text(body.property_name)
  const propertyType = text(body.property_type)
  const city = text(body.city)
  const area = text(body.area)
  const streetAddress = text(body.street_address)
  const tenure = text(body.tenure)
  const hasLatitude = body.latitude !== undefined && body.latitude !== null && body.latitude !== ''
  const hasLongitude = body.longitude !== undefined && body.longitude !== null && body.longitude !== ''
  const latitude = Number(body.latitude)
  const longitude = Number(body.longitude)

  if (!propertyName) errors.property_name = ['Enter the property name.']
  if (!propertyTypes.has(propertyType)) errors.property_type = ['Choose a supported property type.']
  if (!city) errors.city = ['Enter the city or county.']
  if (!area) errors.area = ['Enter the neighbourhood or area.']
  if (!streetAddress) errors.street_address = ['Enter the physical address.']
  if (!['freehold', 'leasehold', 'other'].includes(tenure)) errors.tenure = ['Choose the land tenure.']
  if (hasLatitude !== hasLongitude) errors.location = ['Provide both GPS coordinates together.']
  if (hasLatitude && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    errors.latitude = ['Enter a valid latitude between -90 and 90.']
  }
  if (hasLongitude && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    errors.longitude = ['Enter a valid longitude between -180 and 180.']
  }

  const unitCounts = {}
  for (const unitType of unitTypes) {
    const value = Number(body.unit_counts?.[unitType] ?? 0)
    if (!Number.isInteger(value) || value < 0 || value > 5000) {
      errors.unit_counts = ['Unit counts must be whole numbers between 0 and 5,000.']
      break
    }
    unitCounts[unitType] = value
  }
  if (Object.keys(unitCounts).length === unitTypes.length && !Object.values(unitCounts).some((count) => count > 0)) {
    errors.unit_counts = ['Enter at least one unit.']
  }

  function validatePeople(people, label, requirePhone = false) {
    if (!Array.isArray(people) || people.length < 1 || people.length > 20) {
      errors[label] = [`Add between 1 and 20 ${label === 'owners' ? 'owners' : 'managers or caretakers'}.`]
      return []
    }

    return people.map((person, index) => {
      const fullName = text(person?.full_name)
      const idNumber = text(person?.id_number)
      const phone = text(person?.phone)
      const role = text(person?.role)
      if (!fullName || !idNumber || (requirePhone && !phone)) {
        errors[label] = [`Enter a name and ID/passport number${requirePhone ? ', and phone number,' : ''} for each person.`]
      }
      if (label === 'managers' && !['property_manager', 'caretaker'].includes(role)) {
        errors[label] = ['Choose property manager or caretaker for each person.']
      }
      return {
        full_name: fullName.slice(0, 120),
        id_number: idNumber.slice(0, 40),
        ...(phone ? { phone: phone.slice(0, 40) } : {}),
        ...(role ? { role } : {}),
      }
    })
  }

  const owners = validatePeople(body.owners, 'owners')
  const managers = validatePeople(body.managers, 'managers', true)
  if (body.ownership_authorized !== true) errors.ownership_authorized = ['Confirm you are authorized to submit the owner details.']
  if (body.legal_acknowledgement !== true) errors.legal_acknowledgement = ['Confirm the legal information is accurate and can be verified.']

  if (Object.keys(errors).length) return res.status(400).json(errors)

  const legalDocuments = Object.fromEntries(
    legalDocumentTypes.map((documentType) => [documentType, body.legal_documents?.[documentType] === true]),
  )
  const submission = {
    id: `property-${crypto.randomUUID()}`,
    property_name: propertyName.slice(0, 160),
    property_type: propertyType,
    city: city.slice(0, 120),
    area: area.slice(0, 120),
    street_address: streetAddress.slice(0, 240),
    ...(hasLatitude && hasLongitude && !errors.latitude && !errors.longitude
      ? { latitude, longitude, location_accuracy: 'gps' }
      : {}),
    tenure,
    unit_counts: unitCounts,
    owners,
    managers,
    legal_documents: legalDocuments,
    status: 'pending_review',
    submitted_at: new Date().toISOString(),
  }

  if (pool && databaseReady) {
    await pool.query(
      'INSERT INTO property_submissions (id, payload, status) VALUES ($1, $2, $3)',
      [submission.id, JSON.stringify(submission), submission.status],
    )
  } else {
    data.propertySubmissions.push(submission)
    saveData()
  }

  res.status(201).json({ id: submission.id, status: submission.status })
})

app.post('/api/auth/register/', async (req, res) => {
  const { full_name, email, password, confirm_password } = req.body || {}

  if (!full_name || !String(full_name).trim()) {
    return res.status(400).json({ full_name: ['Enter your full name.'] })
  }

  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ email: ['Enter a valid email address.'] })
  }

  if (password === undefined || String(password).length < 8) {
    return res.status(400).json({ password: ['Password must be at least 8 characters long.'] })
  }

  if (String(password) !== String(confirm_password ?? '')) {
    return res.status(400).json({ confirm_password: ['Passwords do not match.'] })
  }

  const existingUser = await getUserByEmail(normalizedEmail)
  if (existingUser) {
    return res.status(400).json({ email: ['An account with this email already exists.'] })
  }

  const user = {
    id: `user-${crypto.randomUUID()}`,
    first_name: String(full_name).trim(),
    email: normalizedEmail,
    password: hashPassword(String(password)),
    role: 'landlord',
    managed_estate: null,
  }

  if (pool && databaseReady) {
    await pool.query(
      'INSERT INTO users (id, first_name, email, password_hash, role, managed_estate) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.id, user.first_name, user.email, user.password, user.role, user.managed_estate],
    )
  } else {
    data.users.push(user)
    saveData()
  }

  const token = makeToken()
  await saveToken(token, user.id)

  res.status(201).json({
    token,
    user: serializeUser(user),
  })
})

app.post('/api/auth/login/', async (req, res) => {
  const { email, password } = req.body || {}
  const normalizedEmail = normalizeEmail(email)
  const user = await getUserByEmail(normalizedEmail)
  const providedHash = hashPassword(String(password || ''))
  const storedHash = user?.password_hash ?? user?.password

  if (!user || storedHash !== providedHash) {
    return res.status(400).json({ detail: 'Email or password is incorrect.' })
  }

  const token = makeToken()
  await saveToken(token, user.id)

  res.json({
    token,
    user: serializeUser(user),
  })
})

app.post('/api/auth/logout/', authRequired, async (req, res) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Token ') ? authHeader.slice(6).trim() : ''
  await clearToken(token)
  res.status(204).send()
})

app.get('/api/auth/me/', authRequired, (req, res) => {
  res.json(serializeUser(req.user))
})

app.get('/api/dashboard/landlord/', authRequired, roleRequired('landlord', 'This dashboard is for landlord accounts.'), async (req, res) => {
  const ownerProperties = await getOwnerPropertiesForUser(req.user.id)
  const ownerUnits = await getOwnerUnitsForProperties(ownerProperties.map((property) => property.id))
  const unitsByPropertyId = new Map()
  ownerUnits.forEach((unit) => {
    const units = unitsByPropertyId.get(unit.property_id) || []
    units.push(serializeOwnerUnit(unit))
    unitsByPropertyId.set(unit.property_id, units)
  })
  const properties = ownerProperties.map((property) => ({
    ...property,
    units: unitsByPropertyId.get(property.id) || [],
  }))
  const viewingRequests = pool && databaseReady
    ? (await pool.query(
      `SELECT id, property_id, request_type, requester_name, email, phone, preferred_date, message, created_at
       FROM viewing_requests
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [req.user.id],
    )).rows.map((request) => ({
      ...request,
      property_title: properties.find((property) =>
        property.units.some((unit) => `owner-unit-${unit.id}` === request.property_id),
      )?.name || 'Your property',
    }))
    : data.viewingRequests
      .filter((request) => request.owner_id === req.user.id)
      .sort((first, second) => second.created_at.localeCompare(first.created_at))

  const payments = await getRentPaymentsForUser(req.user.id)
  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const today = now.toISOString().slice(0, 10)
  const currentMonth = payments.filter((payment) => payment.period === currentPeriod)
  const activeUnits = new Set(
    currentMonth.map((payment) => `${payment.estate_slug || ''}:${payment.unit_name}`),
  )
  const summary = payments.reduce((totals, payment) => {
    if (payment.paid_at) totals.received += Number(payment.amount)
    else {
      totals.outstanding += Number(payment.amount)
      if (payment.due_date < today) totals.overdue += Number(payment.amount)
    }
    return totals
  }, { received: 0, outstanding: 0, overdue: 0 })

  res.json({
    summary: {
      ...summary,
      rentRecords: payments.length,
      trackedUnits: activeUnits.size,
      currentMonthDue: currentMonth.reduce((sum, payment) => sum + Number(payment.amount), 0),
      currentMonthReceived: currentMonth.reduce(
        (sum, payment) => sum + (payment.paid_at ? Number(payment.amount) : 0),
        0,
      ),
    },
    recentPayments: payments.slice(0, 5),
    properties,
    viewingRequests,
  })
})

app.get('/api/dashboard/estate/', authRequired, roleRequired('estate_manager', 'An assigned estate-manager account is required.'), async (req, res) => {
  const user = serializeUser(req.user)
  if (!user.managed_estate) {
    return res.status(403).json({ detail: 'An assigned estate-manager account is required.' })
  }

  const estate = seedEstates.find((entry) => entry.slug === user.managed_estate)
  if (!estate) return res.status(403).json({ detail: 'Your account is assigned to an unavailable estate.' })

  const properties = (await getPropertiesWithAvailability())
    .filter((property) => property.estate === estate.slug)
    .map(buildPropertyPayload)
  const estatePayments = await getRentPaymentsForEstate(estate.slug)
  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const today = now.toISOString().slice(0, 10)
  const occupiedUnits = new Set(
    estatePayments
      .filter((payment) => payment.period === currentPeriod)
      .map((payment) => payment.unit_name),
  )
  const availableProperties = properties.filter((property) => property.vacant).length
  const trackedUnits = occupiedUnits.size
  const portfolioUnits = trackedUnits + availableProperties
  const summary = estatePayments.reduce((totals, payment) => {
    if (payment.paid_at) totals.received += Number(payment.amount)
    else {
      totals.outstanding += Number(payment.amount)
      if (payment.due_date < today) totals.overdue += Number(payment.amount)
    }
    return totals
  }, { received: 0, outstanding: 0, overdue: 0 })
  const viewingRequests = pool && databaseReady
    ? (await pool.query(
      `SELECT id, property_id, request_type, requester_name, email, phone, preferred_date, message, created_at
       FROM viewing_requests
       WHERE estate_slug = $1
       ORDER BY created_at DESC`,
      [estate.slug],
    )).rows.map((request) => ({
      ...request,
      property_title: seedProperties.find((property) => property.slug === request.property_id)?.title || request.property_id,
    }))
    : data.viewingRequests
      .filter((request) => request.estate_slug === estate.slug)
      .sort((first, second) => second.created_at.localeCompare(first.created_at))

  res.json({
    estate: { slug: estate.slug, name: estate.name, area: estate.area },
    summary: {
      properties: properties.length,
      availableProperties,
      occupiedUnits: trackedUnits,
      occupancyRate: portfolioUnits ? Math.round((trackedUnits / portfolioUnits) * 100) : 0,
      ...summary,
    },
    properties,
    viewingRequests,
  })
})

app.get('/api/rent-payments/', authRequired, roleRequired('landlord', 'Rent tracking is for landlord accounts.'), async (req, res) => {
  res.json(await getRentPaymentsForUser(req.user.id))
})

app.post('/api/rent-payments/', authRequired, roleRequired('landlord', 'Rent tracking is for landlord accounts.'), async (req, res) => {
  const body = req.body || {}
  const tenantName = typeof body.tenant_name === 'string' ? body.tenant_name.trim() : ''
  const unitName = typeof body.unit_name === 'string' ? body.unit_name.trim() : ''
  const amount = Number(body.amount)
  const period = typeof body.period === 'string' ? body.period : ''
  const dueDate = typeof body.due_date === 'string' ? body.due_date : ''
  const estateSlug = typeof body.estate_slug === 'string' ? body.estate_slug : ''
  const parsedDueDate = new Date(`${dueDate}T00:00:00Z`)
  const errors = {}

  if (!tenantName || tenantName.length > 120) errors.tenant_name = ['Enter a tenant name (up to 120 characters).']
  if (!unitName || unitName.length > 120) errors.unit_name = ['Enter a unit or property name (up to 120 characters).']
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000000) {
    errors.amount = ['Enter a whole amount between KES 1 and KES 1,000,000,000.']
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) errors.period = ['Choose a valid rent month.']
  if (estateSlug && !seedEstates.some((estate) => estate.slug === estateSlug)) {
    errors.estate_slug = ['Choose an available estate.']
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    || Number.isNaN(parsedDueDate.getTime())
    || parsedDueDate.toISOString().slice(0, 10) !== dueDate) {
    errors.due_date = ['Choose a valid due date.']
  }
  if (Object.keys(errors).length) return res.status(400).json(errors)

  const payment = {
    id: `rent-${crypto.randomUUID()}`,
    user_id: req.user.id,
    tenant_name: tenantName,
    unit_name: unitName,
    estate_slug: estateSlug || null,
    amount,
    period,
    due_date: dueDate,
    paid_at: null,
    created_at: new Date().toISOString(),
  }

  if (pool && databaseReady) {
    const result = await pool.query(
      `INSERT INTO rent_payments (id, user_id, tenant_name, unit_name, estate_slug, amount, period, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, tenant_name, unit_name, estate_slug, amount, period, due_date, paid_at, created_at`,
      [payment.id, payment.user_id, payment.tenant_name, payment.unit_name, payment.estate_slug, payment.amount, payment.period, payment.due_date],
    )
    return res.status(201).json(result.rows[0])
  }

  data.rentPayments.push(payment)
  saveData()
  res.status(201).json(payment)
})

app.patch('/api/rent-payments/:id/paid/', authRequired, roleRequired('landlord', 'Rent tracking is for landlord accounts.'), async (req, res) => {
  const paidAt = new Date().toISOString()
  if (pool && databaseReady) {
    const result = await pool.query(
      `UPDATE rent_payments
       SET paid_at = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, tenant_name, unit_name, estate_slug, amount, period, due_date, paid_at, created_at`,
      [paidAt, req.params.id, req.user.id],
    )
    if (!result.rowCount) return res.status(404).json({ detail: 'Rent payment not found.' })
    return res.json(result.rows[0])
  }

  const payment = data.rentPayments.find(
    (entry) => entry.id === req.params.id && entry.user_id === req.user.id,
  )
  if (!payment) return res.status(404).json({ detail: 'Rent payment not found.' })
  payment.paid_at = paidAt
  saveData()
  res.json(payment)
})

app.use((req, res) => {
  res.status(404).json({ detail: 'Not found.' })
})

function makeToken() {
  return crypto.randomBytes(32).toString('hex')
}

if (!isVercel) {
  app.listen(port, () => {
    console.log(`Safe Nyumba API running on http://localhost:${port}`)
  })
}

export default app
