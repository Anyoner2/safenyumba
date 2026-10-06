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

const data = globalThis.__safeNyumbaData ??= { users: [], tokens: {} }

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
        password_hash TEXT NOT NULL
      );
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
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

app.post('/api/auth/register/', async (req, res) => {
  const { full_name, email, password } = req.body || {}

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

  const existingUser = await getUserByEmail(normalizedEmail)
  if (existingUser) {
    return res.status(400).json({ email: ['An account with this email already exists.'] })
  }

  const user = {
    id: `user-${crypto.randomUUID()}`,
    first_name: String(full_name).trim(),
    email: normalizedEmail,
    password: hashPassword(String(password)),
  }

  if (pool && databaseReady) {
    await pool.query(
      'INSERT INTO users (id, first_name, email, password_hash) VALUES ($1, $2, $3, $4)',
      [user.id, user.first_name, user.email, user.password],
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
