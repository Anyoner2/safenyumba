import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import cors from 'cors'
import express from 'express'

const app = express()
const port = Number(process.env.PORT || 4000)
const dataFile = path.join(process.cwd(), 'data.json')

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

const defaultData = { users: [], tokens: {} }

function loadData() {
  try {
    const content = fs.readFileSync(dataFile, 'utf8')
    if (!content.trim()) return structuredClone(defaultData)
    const parsed = JSON.parse(content)
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      tokens: parsed.tokens && typeof parsed.tokens === 'object' ? parsed.tokens : {},
    }
  } catch {
    fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2))
    return structuredClone(defaultData)
  }
}

let data = loadData()

function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
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

function currentUserFromToken(token) {
  if (!token || !data.tokens[token]) return null
  const userId = data.tokens[token]
  return data.users.find((user) => user.id === userId) || null
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Token ') ? authHeader.slice(6).trim() : ''
  const user = currentUserFromToken(token)
  if (!user) {
    return res.status(401).json({ detail: 'Authentication required.' })
  }

  req.user = user
  next()
}

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

app.post('/api/auth/register/', (req, res) => {
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

  if (data.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ email: ['An account with this email already exists.'] })
  }

  const user = {
    id: `user-${crypto.randomUUID()}`,
    first_name: String(full_name).trim(),
    email: normalizedEmail,
    password: hashPassword(String(password)),
  }

  data.users.push(user)
  saveData()

  const token = makeToken()
  data.tokens[token] = user.id
  saveData()

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.first_name,
    },
  })
})

app.post('/api/auth/login/', (req, res) => {
  const { email, password } = req.body || {}
  const normalizedEmail = normalizeEmail(email)
  const user = data.users.find((entry) => entry.email.toLowerCase() === normalizedEmail)

  if (!user || user.password !== hashPassword(String(password || ''))) {
    return res.status(400).json({ detail: 'Email or password is incorrect.' })
  }

  const token = makeToken()
  data.tokens[token] = user.id
  saveData()

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.first_name,
    },
  })
})

app.post('/api/auth/logout/', authRequired, (req, res) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Token ') ? authHeader.slice(6).trim() : ''
  if (token && data.tokens[token]) {
    delete data.tokens[token]
    saveData()
  }
  res.status(204).send()
})

app.get('/api/auth/me/', authRequired, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.first_name,
  })
})

app.use((req, res) => {
  res.status(404).json({ detail: 'Not found.' })
})

function makeToken() {
  return crypto.randomBytes(32).toString('hex')
}

app.listen(port, () => {
  console.log(`Safe Nyumba API running on http://localhost:${port}`)
})
