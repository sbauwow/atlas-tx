# County-month water-risk panel coverage

- Built at: 2026-05-09T20:35:43.164Z
- Row count: 18288
- County count: 254
- Month count: 72
- Coverage window: 2020-01 through 2025-12
- County-months with any SDWIS health-based event: 3206
- County-months with historical precipitation attached: 18288
- County-months with NWS flood/flash-flood warning context attached: 18288
- County-months with streamflow context attached: 14698
- County-months with drought context attached: 18288
- County-months with temperature/heat context attached: 18288
- County-months usable for current trigger models: 14698
- Overflow severe threshold (gallons, first-pass 75th percentile incident size): 1437
- Dropped overflow rows without county: 0
- Dropped overflow rows without month: 0

## Source versions

- SDWIS: data/sdwis-healthbased-2020.json
- Overflow: 2026-05-09T20:35:50.928Z
- Structural: permits:2026-05-09T20:35:45.531Z|surface:2026-05-09T04:56:55.042Z|hydrology:2026-05-09T04:06:07.779Z
- Weather: 2026-05-09T13:35:51.361Z|2026-05-09T14:34:16.626Z|2026-05-09T16:56:00.719Z|2026-05-09T17:42:09.930Z|2026-05-09T19:07:32.447Z

## Notes

- Historical precipitation is sourced from county-centroid Open-Meteo archive daily `precipitation_sum` and aggregated to monthly totals, heavy-rain-day counts, max-1d precipitation, and same-calendar-month z-score anomalies.
- NWS flood/flash-flood warning context is derived from OpenFEMA IPAWS archived alerts filtered to NWS sender rows and Texas county SAME codes.
- Streamflow context is based on the nearest active USGS streamflow gauge to each county centroid and monthly mean discharge z-score anomalies.
- Drought context is based on weekly U.S. Drought Monitor county statistics aggregated to monthly mean D1+ and D3+ fractions.
- Temperature/heat context is sourced from county-centroid Open-Meteo archive daily air temperature and aggregated to monthly mean-temperature anomalies, heat-day counts, and freeze-day counts.
- `permit_count_current`, `impaired_segments_current`, and `hydrology_context_score_current` are treated as current structural context, not historical monthly measures.
- The panel currently prefers `data/sdwis-healthbased-2020.json` when present, then falls back to the committed SDWIS snapshot.
