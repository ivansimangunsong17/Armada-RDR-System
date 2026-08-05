import { query } from '../../config/database.js'

const vesselReportSelect = `
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
  v.deleted_at,
  coalesce(
    json_agg(
      json_build_object(
        'destinationId', vd.destination_id,
        'name', vdd.name,
        'isActive', vd.is_active
      )
      order by vd.created_at asc
    ) filter (where vd.id is not null),
    '[]'::json
  ) as vessel_destinations
`

const truckDurationSelect = `
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
  de.gate_in_date::text as gate_in_date,
  de.gate_in_time::text as gate_in_time,
  de.gate_out_at,
  de.gate_out_date::text as gate_out_date,
  de.gate_out_time::text as gate_out_time,
  de.notes,
  hc.hatch_no,
  hc.hatch_label,
  ed.name as entry_destination_name,
  v.vessel_name,
  v.destination_id as vessel_destination_id,
  vd.name as vessel_destination_name,
  checker.full_name as checker_name
`

const truckDurationJoins = `
  join public.hatch_cargo hc on hc.id = de.hatch_cargo_id
  left join public.destinations ed on ed.id = de.destination_id
  join public.vessels v on v.id = de.vessel_id
  left join public.destinations vd on vd.id = v.destination_id
  join public.app_users checker on checker.id = de.checker_id
`

export async function listActiveVesselsForReports(user) {
  const params = []
  let checkerJoin = ''
  let checkerWhere = ''

  if (user?.role === 'checker') {
    params.push(user.id)
    checkerJoin = 'join public.checker_assignments ca on ca.vessel_id = v.id'
    checkerWhere = 'and ca.checker_id = $1 and ca.is_active = true'
  }

  const result = await query(
    `
      select ${vesselReportSelect}
      from public.vessels v
      left join public.destinations d on d.id = v.destination_id
      left join public.vessel_destinations vd on vd.vessel_id = v.id
      left join public.destinations vdd on vdd.id = vd.destination_id
      ${checkerJoin}
      where v.deleted_at is null
        and v.status <> 'completed'
        ${checkerWhere}
      group by v.id, d.name
      order by v.start_discharge_date desc
    `,
    params,
  )

  return result.rows
}

export async function listRunningReportRows(vesselIds) {
  if (!vesselIds.length) return []

  const result = await query(
    `
      select
        vessel_id,
        vessel_name,
        destination,
        hatch_cargo_id,
        hatch_no,
        hatch_label,
        initial_cargo,
        total_discharge,
        total_dt,
        average_tonnage,
        remaining_cargo,
        progress_percentage
      from public.running_report
      where vessel_id = any($1::uuid[])
      order by hatch_no asc
    `,
    [vesselIds],
  )

  return result.rows
}

export async function listLatestDischargeEntries(vesselIds) {
  if (!vesselIds.length) return []

  const result = await query(
    `
      select
        de.id,
        de.vessel_id,
        de.tonnage,
        de.gate_out_date::text as gate_out_date,
        de.gate_out_time::text as gate_out_time,
        de.gate_out_at,
        hc.hatch_no,
        hc.hatch_label,
        v.vessel_name
      from public.discharge_entries de
      join public.hatch_cargo hc on hc.id = de.hatch_cargo_id
      join public.vessels v on v.id = de.vessel_id
      where de.vessel_id = any($1::uuid[])
      order by de.gate_out_at desc
      limit 50
    `,
    [vesselIds],
  )

  return result.rows
}

export async function listRunningDestinationSummary(vesselId) {
  const result = await query(
    `
      select
        coalesce(de.destination_id, v.destination_id) as destination_id,
        coalesce(ed.name, vd.name, '-') as destination,
        coalesce(sum(de.tonnage), 0)::numeric(14, 3) as total_discharge,
        count(de.id)::integer as total_dt,
        case
          when count(de.id) > 0 then (sum(de.tonnage) / count(de.id))::numeric(14, 3)
          else 0::numeric(14, 3)
        end as average_tonnage
      from public.discharge_entries de
      join public.vessels v on v.id = de.vessel_id
      left join public.destinations ed on ed.id = de.destination_id
      left join public.destinations vd on vd.id = v.destination_id
      where de.vessel_id = $1
      group by coalesce(de.destination_id, v.destination_id), coalesce(ed.name, vd.name, '-')
      order by destination asc
    `,
    [vesselId],
  )

  return result.rows
}

export async function listShiftReportRows({ vesselId, reportDate, shiftName }) {
  const result = await query(
    `
      select
        vessel_id,
        vessel_name,
        destination,
        gate_out_date::text as gate_out_date,
        shift_name,
        hatch_cargo_id,
        hatch_no,
        hatch_label,
        total_discharge,
        total_dt,
        average_tonnage
      from public.shift_report
      where vessel_id = $1
        and gate_out_date = $2
        and shift_name = $3
      order by hatch_no asc
    `,
    [vesselId, reportDate, shiftName],
  )

  return result.rows
}

export async function listHatchCargoRows(vesselId) {
  const result = await query(
    `
      select id, vessel_id, hatch_no, hatch_label, initial_cargo
      from public.hatch_cargo
      where vessel_id = $1
      order by hatch_no asc
    `,
    [vesselId],
  )

  return result.rows
}

export async function listEntriesUntilDate(vesselId, reportDate) {
  const result = await query(
    `
      select
        de.id,
        de.hatch_cargo_id,
        de.destination_id,
        de.tonnage,
        de.gate_out_date::text as gate_out_date,
        de.gate_out_time::text as gate_out_time,
        v.destination_id as vessel_destination_id
      from public.discharge_entries de
      join public.vessels v on v.id = de.vessel_id
      where de.vessel_id = $1
        and de.gate_out_date <= $2
    `,
    [vesselId, reportDate],
  )

  return result.rows
}

export async function listDestinations() {
  const result = await query(
    `
      select id, name
      from public.destinations
    `,
  )

  return result.rows
}

function buildTruckDurationWhere({ vesselId, reportDate }) {
  const params = [vesselId]
  let where = 'where de.vessel_id = $1'

  if (reportDate) {
    params.push(reportDate)
    where += ` and de.gate_out_date = $${params.length}`
  }

  return { params, where }
}

export async function listTruckDurationRows({ vesselId, reportDate, page, pageSize }) {
  const safePage = Math.max(1, Number(page) || 1)
  const safePageSize = Math.max(1, Number(pageSize) || 20)
  const { params, where } = buildTruckDurationWhere({ vesselId, reportDate })
  const pageParams = [...params, safePageSize, (safePage - 1) * safePageSize]

  const [pageResult, countResult, summaryResult] = await Promise.all([
    query(
      `
        select ${truckDurationSelect}
        from public.discharge_entries de
        ${truckDurationJoins}
        ${where}
        order by de.gate_out_at desc
        limit $${pageParams.length - 1} offset $${pageParams.length}
      `,
      pageParams,
    ),
    query(
      `
        select count(*)::integer as count
        from public.discharge_entries de
        ${where}
      `,
      params,
    ),
    query(
      `
        select ${truckDurationSelect}
        from public.discharge_entries de
        ${truckDurationJoins}
        ${where}
        order by de.gate_out_at desc
      `,
      params,
    ),
  ])

  return {
    count: countResult.rows[0]?.count || 0,
    pageRows: pageResult.rows,
    summaryRows: summaryResult.rows,
  }
}
