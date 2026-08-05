import { getPool, query } from '../../config/database.js'

const vesselSelect = `
  id,
  vessel_name,
  cargo_owner,
  cargo_type,
  destination_id,
  total_hatch,
  eta,
  start_discharge_date,
  status,
  created_by,
  created_at,
  updated_at,
  deleted_at
`

export async function listVessels() {
  const result = await query(
    `
      select
        v.id,
        v.vessel_name,
        v.cargo_owner,
        v.cargo_type,
        v.destination_id,
        v.total_hatch,
        v.eta,
        v.start_discharge_date,
        v.status,
        v.created_by,
        v.created_at,
        v.updated_at,
        v.deleted_at,
        coalesce(
          json_agg(
            json_build_object(
              'id', vd.id,
              'vessel_id', vd.vessel_id,
              'destination_id', vd.destination_id,
              'is_active', vd.is_active,
              'destinations', json_build_object(
                'id', d.id,
                'name', d.name
              )
            )
            order by vd.created_at asc
          ) filter (where vd.id is not null),
          '[]'::json
        ) as vessel_destinations
      from public.vessels v
      left join public.vessel_destinations vd on vd.vessel_id = v.id
      left join public.destinations d on d.id = vd.destination_id
      where v.deleted_at is null
      group by v.id
      order by v.created_at asc
    `,
  )

  return result.rows
}

export async function findVesselById(vesselId) {
  const result = await query(
    `
      select
        v.id,
        v.vessel_name,
        v.cargo_owner,
        v.cargo_type,
        v.destination_id,
        v.total_hatch,
        v.eta,
        v.start_discharge_date,
        v.status,
        v.created_by,
        v.created_at,
        v.updated_at,
        v.deleted_at,
        coalesce(
          json_agg(
            json_build_object(
              'id', vd.id,
              'vessel_id', vd.vessel_id,
              'destination_id', vd.destination_id,
              'is_active', vd.is_active,
              'destinations', json_build_object(
                'id', d.id,
                'name', d.name
              )
            )
            order by vd.created_at asc
          ) filter (where vd.id is not null),
          '[]'::json
        ) as vessel_destinations
      from public.vessels v
      left join public.vessel_destinations vd on vd.vessel_id = v.id
      left join public.destinations d on d.id = vd.destination_id
      where v.id = $1
        and v.deleted_at is null
      group by v.id
      limit 1
    `,
    [vesselId],
  )

  return result.rows[0] || null
}

export async function createVessel(payload) {
  const result = await query(
    `
      insert into public.vessels (
        vessel_name,
        cargo_owner,
        cargo_type,
        destination_id,
        total_hatch,
        eta,
        start_discharge_date,
        status,
        created_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning ${vesselSelect}
    `,
    [
      payload.vesselName,
      payload.cargoOwner,
      payload.cargoType,
      payload.destinationId,
      payload.totalHatch,
      payload.eta,
      payload.startDischargeDate,
      payload.status,
      payload.createdBy,
    ],
  )

  return result.rows[0]
}

export async function updateVessel(vesselId, payload) {
  const result = await query(
    `
      update public.vessels
      set
        vessel_name = $2,
        cargo_owner = $3,
        cargo_type = $4,
        destination_id = $5,
        total_hatch = $6,
        eta = $7,
        start_discharge_date = $8,
        status = $9,
        created_by = $10
      where id = $1
      returning ${vesselSelect}
    `,
    [
      vesselId,
      payload.vesselName,
      payload.cargoOwner,
      payload.cargoType,
      payload.destinationId,
      payload.totalHatch,
      payload.eta,
      payload.startDischargeDate,
      payload.status,
      payload.createdBy,
    ],
  )

  return result.rows[0] || null
}

export async function updateVesselStatus(vesselId, status) {
  const result = await query(
    `
      update public.vessels
      set status = $2
      where id = $1 and deleted_at is null
      returning ${vesselSelect}
    `,
    [vesselId, status],
  )

  return result.rows[0] || null
}

export async function archiveVessel(vesselId) {
  const result = await query(
    `
      update public.vessels
      set deleted_at = now()
      where id = $1 and deleted_at is null
      returning ${vesselSelect}
    `,
    [vesselId],
  )

  return result.rows[0] || null
}

export async function listVesselDestinations(vesselId, isActive = null) {
  const params = [vesselId]
  const activeClause = isActive === null ? '' : 'and vd.is_active = $2'

  if (isActive !== null) params.push(isActive)

  const result = await query(
    `
      select
        vd.id,
        vd.vessel_id,
        vd.destination_id,
        vd.is_active,
        json_build_object(
          'id', d.id,
          'name', d.name
        ) as destinations
      from public.vessel_destinations vd
      join public.destinations d on d.id = vd.destination_id
      where vd.vessel_id = $1
        ${activeClause}
      order by vd.created_at asc
    `,
    params,
  )

  return result.rows
}

export async function addDestinationToVessel({ vesselId, destinationId, createdBy }) {
  const result = await query(
    `
      insert into public.vessel_destinations (
        vessel_id,
        destination_id,
        created_by,
        is_active,
        deactivated_at
      )
      values ($1, $2, $3, true, null)
      on conflict (vessel_id, destination_id)
      do update set
        is_active = true,
        deactivated_at = null
      returning id, vessel_id, destination_id, is_active
    `,
    [vesselId, destinationId, createdBy],
  )

  return result.rows[0]
}

export async function deactivateDestinationOnVessel({ vesselId, destinationId }) {
  const result = await query(
    `
      update public.vessel_destinations
      set
        is_active = false,
        deactivated_at = now()
      where vessel_id = $1 and destination_id = $2
      returning id, vessel_id, destination_id, is_active
    `,
    [vesselId, destinationId],
  )

  return result.rows[0] || null
}

export async function listHatchCargoByVesselIds(vesselIds) {
  if (!vesselIds.length) return []

  const result = await query(
    `
      select id, vessel_id, hatch_no, hatch_label, initial_cargo
      from public.hatch_cargo
      where vessel_id = any($1::uuid[])
      order by vessel_id asc, hatch_no asc
    `,
    [vesselIds],
  )

  return result.rows
}

export async function listHatchCargoByVesselId(vesselId) {
  return listHatchCargoByVesselIds([vesselId])
}

export async function saveHatchCargo(vesselId, rows) {
  if (!rows.length) return []

  const values = []
  const placeholders = rows.map((row, index) => {
    const baseIndex = index * 3
    values.push(vesselId, row.hatchNo, row.initialCargo)
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`
  })

  const result = await query(
    `
      insert into public.hatch_cargo (
        vessel_id,
        hatch_no,
        initial_cargo
      )
      values ${placeholders.join(', ')}
      on conflict (vessel_id, hatch_no)
      do update set initial_cargo = excluded.initial_cargo
      returning id, vessel_id, hatch_no, hatch_label, initial_cargo
    `,
    values,
  )

  return result.rows
}

export async function deleteExtraHatchCargo(vesselId, totalHatch) {
  await query(
    `
      delete from public.hatch_cargo
      where vessel_id = $1 and hatch_no > $2
    `,
    [vesselId, totalHatch],
  )
}

export async function listCheckerAssignmentsByVesselIds(vesselIds) {
  if (!vesselIds.length) return []

  const result = await query(
    `
      select id, vessel_id, checker_id, is_active
      from public.checker_assignments
      where vessel_id = any($1::uuid[])
        and is_active = true
    `,
    [vesselIds],
  )

  return result.rows
}

export async function findActiveCheckerAssignmentByVesselId(vesselId) {
  const result = await query(
    `
      select id, vessel_id, checker_id, is_active
      from public.checker_assignments
      where vessel_id = $1
        and is_active = true
      limit 1
    `,
    [vesselId],
  )

  return result.rows[0] || null
}

export async function saveCheckerAssignment({ vesselId, checkerId, assignedBy }) {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('begin')

    await client.query(
      `
        update public.checker_assignments
        set is_active = false
        where vessel_id = $1 and is_active = true
      `,
      [vesselId],
    )

    const result = await client.query(
      `
        insert into public.checker_assignments (
          vessel_id,
          checker_id,
          assigned_by,
          is_active
        )
        values ($1, $2, $3, true)
        on conflict (vessel_id, checker_id)
        do update set
          assigned_by = excluded.assigned_by,
          is_active = true
        returning id, vessel_id, checker_id, is_active
      `,
      [vesselId, checkerId, assignedBy],
    )

    await client.query('commit')
    return result.rows[0]
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}
