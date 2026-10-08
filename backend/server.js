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

const data = globalThis.__safeNyumbaData ??= { users: [], tokens: {}, propertySubmissions: [], rentPayments: [] }
data.propertySubmissions ??= []
data.rentPayments ??= []

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
    rent: 68000,
    bedrooms: 2,
    amenity: 'Lift, security',
    kind: 'Apartment',
    verified: true,
    vacant: true,
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
    image_alt: 'A modern apartment',
  },
  {
    slug: 'kilimani-three-bedroom',
    estate: 'kilimani',
    title: 'Kilimani family home',
    location: 'Kilimani',
    city: 'Nairobi',
    rent: 110000,
    bedrooms: 3,
    amenity: 'Garden, parking',
    kind: 'Townhouse',
    verified: true,
    vacant: true,
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
    image_alt: 'A family home',
  },
  {
    slug: 'westlands-loft',
    estate: 'westlands',
    title: 'Westlands loft rental',
    location: 'Westlands',
    city: 'Nairobi',
    rent: 94000,
    bedrooms: 2,
    amenity: 'Gym, balcony',
    kind: 'Apartment',
    verified: true,
    vacant: true,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    image_alt: 'A bright loft apartment',
  },
  {
    slug: 'muthaiga-bungalow',
    estate: 'muthaiga',
    title: 'Muthaiga bungalow',
    location: 'Muthaiga',
    city: 'Nairobi',
    rent: 145000,
    bedrooms: 4,
    amenity: 'Garden, servant quarter',
    kind: 'Bungalow',
    verified: true,
    vacant: true,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
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
  image_alt: `A ${bedrooms}-bedroom home in ${location}`,
}))

seedProperties.push(...nairobiNeighbourhoodHomes)

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

function buildEstatePayload(estate) {
  const homes = seedProperties.filter(
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

function buildPropertyPayload(property) {
  return {
    id: property.slug,
    title: property.title,
    location: property.location,
    city: property.city,
    rent: property.rent,
    bedrooms: property.bedrooms,
    amenity: property.amenity,
    kind: property.kind,
    verified: property.verified,
    vacant: property.vacant,
    image: property.image,
    imageAlt: property.image_alt,
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
app.use(express.json())

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

app.get('/api/properties/', (req, res) => {
  const { location = '', budget, bedrooms } = req.query

  let filtered = [...seedProperties].filter((property) => property.vacant && property.verified)

  if (location) {
    const value = String(location).trim().toLowerCase()
    filtered = filtered.filter(
      (property) =>
        property.location.toLowerCase().includes(value) ||
        property.city.toLowerCase().includes(value),
    )
  }

  if (budget) {
    const maxBudget = Number(budget)
    if (Number.isNaN(maxBudget)) {
      return res.status(400).json({ budget: ['Enter a whole number.'] })
    }
    filtered = filtered.filter((property) => property.rent <= maxBudget)
  }

  if (bedrooms) {
    const bedroomCount = Number(bedrooms)
    if (Number.isNaN(bedroomCount)) {
      return res.status(400).json({ bedrooms: ['Enter a whole number.'] })
    }

    if (bedroomCount === 3) {
      filtered = filtered.filter((property) => property.bedrooms >= 3)
    } else if (bedroomCount > 0) {
      filtered = filtered.filter((property) => property.bedrooms === bedroomCount)
    }
  }

  res.json(filtered.map(buildPropertyPayload))
})

app.get('/api/estates/', (req, res) => {
  res.json(seedEstates.map(buildEstatePayload))
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

  if (!propertyName) errors.property_name = ['Enter the property name.']
  if (!propertyTypes.has(propertyType)) errors.property_type = ['Choose a supported property type.']
  if (!city) errors.city = ['Enter the city or county.']
  if (!area) errors.area = ['Enter the neighbourhood or area.']
  if (!streetAddress) errors.street_address = ['Enter the physical address.']
  if (!['freehold', 'leasehold', 'other'].includes(tenure)) errors.tenure = ['Choose the land tenure.']

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
  })
})

app.get('/api/dashboard/estate/', authRequired, roleRequired('estate_manager', 'An assigned estate-manager account is required.'), async (req, res) => {
  const user = serializeUser(req.user)
  if (!user.managed_estate) {
    return res.status(403).json({ detail: 'An assigned estate-manager account is required.' })
  }

  const estate = seedEstates.find((entry) => entry.slug === user.managed_estate)
  if (!estate) return res.status(403).json({ detail: 'Your account is assigned to an unavailable estate.' })

  const properties = seedProperties
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
