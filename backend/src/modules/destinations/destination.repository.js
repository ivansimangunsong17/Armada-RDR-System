import { query } from '../../config/database.js'

const destinationSelect = `
  id,
  name,
  description,
  is_active,
  created_at,
  updated_at
`

export async function listDestinations() {
  const result = await query(
    `
      select ${destinationSelect}
      from public.destinations
      order by name asc
    `,
  )

  return result.rows
}

export async function findDestinationById(destinationId) {
  const result = await query(
    `
      select ${destinationSelect}
      from public.destinations
      where id = $1
      limit 1
    `,
    [destinationId],
  )

  return result.rows[0] || null
}

export async function findDestinationByName(name) {
  const result = await query(
    `
      select ${destinationSelect}
      from public.destinations
      where lower(name) = lower($1)
      limit 1
    `,
    [String(name || '').trim()],
  )

  return result.rows[0] || null
}

export async function createDestination(payload) {
  const result = await query(
    `
      insert into public.destinations (
        name,
        description,
        is_active
      )
      values ($1, $2, $3)
      returning ${destinationSelect}
    `,
    [payload.name, payload.description, payload.isActive],
  )

  return result.rows[0]
}

export async function updateDestination(destinationId, payload) {
  const result = await query(
    `
      update public.destinations
      set
        name = $2,
        description = $3,
        is_active = $4
      where id = $1
      returning ${destinationSelect}
    `,
    [destinationId, payload.name, payload.description, payload.isActive],
  )

  return result.rows[0] || null
}

export async function updateDestinationStatus(destinationId, isActive) {
  const result = await query(
    `
      update public.destinations
      set is_active = $2
      where id = $1
      returning ${destinationSelect}
    `,
    [destinationId, isActive],
  )

  return result.rows[0] || null
}
