import { query } from '../../config/database.js'

const dischargeEntrySelect = `
  de.id,
  de.vessel_id,
  de.hatch_cargo_id,
  de.destination_id,
  de.checker_id,
  de.plate_number,
  de.tonnage,
  de.delivery_order_number,
  de.scale_ticket_number,
  de.gate_in_at,
  de.gate_in_date,
  de.gate_in_time,
  de.gate_out_at,
  de.gate_out_date,
  de.gate_out_time,
  de.barcode_photo_url,
  de.notes,
  de.created_at,
  de.updated_at,
  hc.hatch_no,
  hc.hatch_label,
  ed.name as entry_destination_name,
  v.vessel_name,
  v.cargo_owner,
  v.cargo_type,
  v.destination_id as vessel_destination_id,
  vd.name as vessel_destination_name,
  checker.full_name as checker_name
`

const dischargeEntryJoins = `
  join public.hatch_cargo hc on hc.id = de.hatch_cargo_id
  left join public.destinations ed on ed.id = de.destination_id
  join public.vessels v on v.id = de.vessel_id
  left join public.destinations vd on vd.id = v.destination_id
  join public.app_users checker on checker.id = de.checker_id
`

function normalizePagination({ page, pageSize } = {}) {
  const cleanPage = Number(page || 0)
  const cleanPageSize = Number(pageSize || 0)

  if (!cleanPage || !cleanPageSize) {
    return null
  }

  return {
    limit: cleanPageSize,
    offset: (cleanPage - 1) * cleanPageSize,
  }
}

function addFilter(filters, params, condition, value) {
  if (value === undefined || value === null || value === '') return

  params.push(value)
  filters.push(condition.replace('?', `$${params.length}`))
}

function buildEntryFilters(options = {}) {
  const filters = []
  const params = []

  addFilter(filters, params, 'de.checker_id = ?', options.checkerId)
  addFilter(filters, params, 'de.vessel_id = ?', options.vesselId)
  addFilter(filters, params, 'de.hatch_cargo_id = ?', options.hatchCargoId)
  addFilter(filters, params, 'de.destination_id = ?', options.destinationId)
  addFilter(filters, params, 'de.gate_out_date = ?', options.gateOutDate)

  const searchTerm = String(options.searchTerm || '').trim()
  if (searchTerm) {
    params.push(`%${searchTerm}%`)
    filters.push(`
      (
        de.plate_number ilike $${params.length}
        or de.delivery_order_number ilike $${params.length}
        or de.scale_ticket_number ilike $${params.length}
      )
    `)
  }

  return {
    params,
    whereClause: filters.length ? `where ${filters.join(' and ')}` : '',
  }
}

export async function listAssignedVesselsForChecker(checkerId) {
  const result = await query(
    `
      select
        ca.id as assignment_id,
        v.id,
        v.vessel_name,
        v.cargo_owner,
        v.cargo_type,
        v.destination_id,
        d.name as destination_name,
        v.total_hatch,
        v.eta,
        v.start_discharge_date,
        v.status,
        coalesce(vd_rows.vessel_destinations, '[]'::json) as vessel_destinations,
        coalesce(hc_rows.hatch_cargo_rows, '[]'::json) as hatch_cargo_rows
      from public.checker_assignments ca
      join public.vessels v on v.id = ca.vessel_id
      left join public.destinations d on d.id = v.destination_id
      left join lateral (
        select json_agg(
          json_build_object(
            'vesselDestinationId', vd.id,
            'destinationId', vd.destination_id,
            'name', dest.name,
            'isActive', vd.is_active
          )
          order by vd.created_at asc
        ) as vessel_destinations
        from public.vessel_destinations vd
        join public.destinations dest on dest.id = vd.destination_id
        where vd.vessel_id = v.id
      ) vd_rows on true
      left join lateral (
        select json_agg(
          json_build_object(
            'id', hc.id,
            'vesselId', hc.vessel_id,
            'hatchNo', hc.hatch_no,
            'hatchLabel', hc.hatch_label,
            'initialCargo', hc.initial_cargo
          )
          order by hc.hatch_no asc
        ) as hatch_cargo_rows
        from public.hatch_cargo hc
        where hc.vessel_id = v.id
      ) hc_rows on true
      where ca.checker_id = $1
        and ca.is_active = true
        and v.deleted_at is null
        and v.status <> 'completed'
      order by v.created_at asc
    `,
    [checkerId],
  )

  return result.rows
}

export async function listDischargeEntries(options = {}) {
  const { params, whereClause } = buildEntryFilters(options)
  const pagination = normalizePagination(options)
  const pageParams = [...params]
  let paginationClause = ''

  if (pagination) {
    pageParams.push(pagination.limit, pagination.offset)
    paginationClause = `limit $${pageParams.length - 1} offset $${pageParams.length}`
  }

  const [rowsResult, countResult] = await Promise.all([
    query(
      `
        select ${dischargeEntrySelect}
        from public.discharge_entries de
        ${dischargeEntryJoins}
        ${whereClause}
        order by de.gate_out_at desc
        ${paginationClause}
      `,
      pageParams,
    ),
    query(
      `
        select count(*)::integer as count
        from public.discharge_entries de
        ${whereClause}
      `,
      params,
    ),
  ])

  return {
    count: countResult.rows[0]?.count || 0,
    rows: rowsResult.rows,
  }
}

export async function findDischargeEntryById(entryId) {
  const result = await query(
    `
      select ${dischargeEntrySelect}
      from public.discharge_entries de
      ${dischargeEntryJoins}
      where de.id = $1
      limit 1
    `,
    [entryId],
  )

  return result.rows[0] || null
}

export async function createDischargeEntry(payload) {
  const result = await query(
    `
      insert into public.discharge_entries (
        vessel_id,
        hatch_cargo_id,
        destination_id,
        checker_id,
        plate_number,
        tonnage,
        delivery_order_number,
        scale_ticket_number,
        gate_in_at,
        gate_in_date,
        gate_in_time,
        gate_out_at,
        gate_out_date,
        gate_out_time,
        barcode_photo_url,
        notes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, coalesce($12, now()), $13, $14, $15, $16)
      returning id
    `,
    [
      payload.vessel_id,
      payload.hatch_cargo_id,
      payload.destination_id,
      payload.checker_id,
      payload.plate_number,
      payload.tonnage,
      payload.delivery_order_number,
      payload.scale_ticket_number,
      payload.gate_in_at,
      payload.gate_in_date,
      payload.gate_in_time,
      payload.gate_out_at,
      payload.gate_out_date,
      payload.gate_out_time,
      payload.barcode_photo_url,
      payload.notes,
    ],
  )

  return findDischargeEntryById(result.rows[0].id)
}

export async function updateDischargeEntry(entryId, payload) {
  const result = await query(
    `
      update public.discharge_entries
      set
        vessel_id = $2,
        hatch_cargo_id = $3,
        destination_id = $4,
        checker_id = $5,
        plate_number = $6,
        tonnage = $7,
        delivery_order_number = $8,
        scale_ticket_number = $9,
        gate_in_at = $10,
        gate_in_date = $11,
        gate_in_time = $12,
        gate_out_at = coalesce($13, gate_out_at),
        gate_out_date = $14,
        gate_out_time = $15,
        barcode_photo_url = coalesce($16, barcode_photo_url),
        notes = $17
      where id = $1
      returning id
    `,
    [
      entryId,
      payload.vessel_id,
      payload.hatch_cargo_id,
      payload.destination_id,
      payload.checker_id,
      payload.plate_number,
      payload.tonnage,
      payload.delivery_order_number,
      payload.scale_ticket_number,
      payload.gate_in_at,
      payload.gate_in_date,
      payload.gate_in_time,
      payload.gate_out_at,
      payload.gate_out_date,
      payload.gate_out_time,
      payload.barcode_photo_url,
      payload.notes,
    ],
  )

  if (!result.rows[0]) return null

  return findDischargeEntryById(result.rows[0].id)
}
