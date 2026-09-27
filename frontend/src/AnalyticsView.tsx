import { CircularProgress, Paper, Typography } from '@mui/material'
import { buildAnalyticsData, type AnalyticsData } from './analytics'
import type { RecordRow, SetOption } from './types'
import './AnalyticsView.scss'

type AnalyticsViewProps = {
  selectedSet?: SetOption
  records: RecordRow[]
  loading: boolean
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function DonutChart({ data, centerLabel }: { data: AnalyticsData['rarities']; centerLabel: string }) {
  const visible = data.filter((item) => item.count > 0)
  const total = visible.reduce((sum, item) => sum + item.count, 0)
  let offset = 0

  return (
    <div className="analytics-donut-wrap">
      <svg className="analytics-donut" viewBox="0 0 120 120" role="img" aria-label={`${centerLabel} distribution`}>
        <circle className="analytics-donut__track" cx="60" cy="60" r="42" />
        {total > 0 && visible.map((item) => {
          const length = (item.count / total) * 263.9
          const segment = <circle key={item.key} className="analytics-donut__segment" cx="60" cy="60" r="42" stroke={item.color} strokeDasharray={`${length} ${263.9 - length}`} strokeDashoffset={-offset} />
          offset += length
          return segment
        })}
      </svg>
      <div className="analytics-donut__center"><strong>{centerLabel}</strong><span>boosters</span></div>
    </div>
  )
}

function DistributionLegend({ data }: { data: AnalyticsData['rarities'] }) {
  return (
    <div className="analytics-legend">
      <div className="analytics-legend__header"><span>Rarity</span><span>Count</span><span>Rate</span></div>
      {data.map((item) => (
        <div className="analytics-legend__row" key={item.key}>
          <span className="analytics-legend__label"><i style={{ backgroundColor: item.color }} />{item.label}</span>
          <span>{item.count.toLocaleString()}</span>
          <span>{formatPercent(item.observedRate)}</span>
        </div>
      ))}
    </div>
  )
}

function Kpi({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: string }) {
  return <div className="analytics-kpi"><span className="analytics-kpi__icon">{icon}</span><div><span className="analytics-kpi__label">{label}</span><strong>{value}</strong><small>{detail}</small></div></div>
}

function AnalyticsView({ selectedSet, records, loading }: AnalyticsViewProps) {
  const data = buildAnalyticsData(records, selectedSet)

  if (loading) {
    return <Paper className="analytics-state content-panel" elevation={0}><CircularProgress size={28} /><Typography color="text.secondary">Loading analytics…</Typography></Paper>
  }

  const hitVsNoHit = [
    { key: 'hit', label: 'At least one hit', color: '#45a354', count: data.totalHits, observedRate: data.hitRate, expectedRate: null },
    data.rarities.find((item) => item.key === 'noHit')!,
  ]

  return (
    <section className="analytics-view" aria-label="Analytics dashboard">
      <Paper className="analytics-kpis content-panel" elevation={0}>
        <Kpi label="Total boosters opened" value={data.totalBoosters.toLocaleString()} detail="Across all players" icon="□" />
        <Kpi label="Total hits" value={data.totalHits.toLocaleString()} detail={`${formatPercent(data.hitRate)} hit rate`} icon="◈" />
        <Kpi label="Premium hits" value={data.premiumHits.toLocaleString()} detail={`${formatPercent(data.totalBoosters ? data.premiumHits / data.totalBoosters * 100 : 0)} of boosters`} icon="✦" />
        <Kpi label="1 in X boosters" value={data.oneInX ? `1 in ${data.oneInX.toFixed(2)}` : '-'} detail="For any hit" icon="▱" />
        <Kpi label="No-hit rate" value={formatPercent(data.noHitRate)} detail={`${data.noHitBoosters.toLocaleString()} no-hit boosters`} icon="⊘" />
      </Paper>

      <div className="analytics-chart-grid">
        <Paper className="analytics-panel content-panel" elevation={0}>
          <Typography variant="h6">Pull distribution</Typography>
          <Typography className="analytics-panel__subtitle">Share of all opened boosters by rarity.</Typography>
          <div className="analytics-chart-content"><DonutChart data={data.rarities} centerLabel={data.totalBoosters.toLocaleString()} /><DistributionLegend data={data.rarities} /></div>
        </Paper>
        <Paper className="analytics-panel content-panel" elevation={0}>
          <Typography variant="h6">Hit vs no-hit boosters</Typography>
          <Typography className="analytics-panel__subtitle">Proportion of boosters with at least one recorded hit.</Typography>
          <div className="analytics-chart-content"><DonutChart data={hitVsNoHit} centerLabel={data.totalBoosters.toLocaleString()} /><DistributionLegend data={hitVsNoHit} /></div>
        </Paper>
      </div>

      <Paper className="analytics-panel analytics-rates content-panel" elevation={0}>
        <Typography variant="h6">Expected vs observed rates</Typography>
        <Typography className="analytics-panel__subtitle">Compare your results to the published rates for this set.</Typography>
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead><tr><th>Rarity</th><th>Observed count</th><th>Observed rate</th><th>Expected rate</th><th>Difference</th><th>Position</th></tr></thead>
            <tbody>{data.rarities.filter((item) => item.key !== 'noHit').map((item) => {
              const difference = item.expectedRate === null ? null : item.observedRate - item.expectedRate
              const markerPosition = item.expectedRate === null ? 50 : Math.min(100, Math.max(0, (item.observedRate / Math.max(item.expectedRate, 1)) * 50))
              return <tr key={item.key}><td><span className="analytics-rarity"><i style={{ backgroundColor: item.color }} />{item.label}</span></td><td>{item.count.toLocaleString()}</td><td>{formatPercent(item.observedRate)}</td><td>{item.expectedRate === null ? '-' : formatPercent(item.expectedRate)}</td><td className={difference !== null && difference >= 0 ? 'positive' : 'negative'}>{difference === null ? '-' : `${difference >= 0 ? '+' : ''}${difference.toFixed(1)}%`}</td><td><span className="analytics-marker"><b style={{ left: `${markerPosition}%` }} /></span></td></tr>
            })}</tbody>
          </table>
        </div>
      </Paper>
    </section>
  )
}

export default AnalyticsView
