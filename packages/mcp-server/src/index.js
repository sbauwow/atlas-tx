import { promises as fs } from 'node:fs';
import path from 'node:path';

import * as datasetsModule from '../../../src/lib/mvp-datasets.ts';

const { MVP_DATASETS } = datasetsModule;
const DATASETS = Array.isArray(MVP_DATASETS) ? MVP_DATASETS : [];

async function loadMvpDatasets() {
  const mod = await import('../../../src/lib/mvp-datasets.ts');
  return Array.isArray(mod.MVP_DATASETS) ? mod.MVP_DATASETS : [];
}

const DATASET_URLS = {
  'tceq-cid-search-one': 'https://www14.tceq.texas.gov/epic/eCID/index.cfm#searchone',
  'tceq-cid-search-two': 'https://www14.tceq.texas.gov/epic/eCID/index.cfm#searchtwo',
  'census-acs5-2023-county': 'https://www.census.gov/programs-surveys/acs',
  'epa-sdwis-violations': 'https://data.epa.gov/efservice',
  'tceq-swq-segments': 'https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer',
  'twdb-major-aquifers': 'https://www.twdb.texas.gov/mapping/gisdata.asp',
  'twdb-river-basins': 'https://www.twdb.texas.gov/mapping/gisdata.asp',
  'twdb-huc8': 'https://www.twdb.texas.gov/mapping/gisdata.asp',
};

const ANALYTICS_DATASET_IDS = {
  sdwis: ['epa-sdwis-violations'],
  'acs-county': ['census-acs5-2023-county'],
  'surface-water-quality': ['tceq-swq-segments'],
  'twdb-hydrology': ['twdb-major-aquifers', 'twdb-river-basins', 'twdb-huc8'],
};

const SCATTER_QUADRANT_LABELS = {
  'high-pressure-high-risk': 'High pressure + high risk',
  'high-pressure-lower-risk': 'High pressure + lower risk',
  'lower-pressure-high-risk': 'Lower pressure + high risk',
  'lower-pressure-lower-risk': 'Lower pressure + lower risk',
};

function datasetById(datasetId) {
  return DATASETS.find((dataset) => dataset.id === datasetId);
}

async function loadAcsCountyPopulationFromSnapshot() {
  const mod = await import('../../../src/lib/datasets/acs.ts');
  return await mod.loadAcsCountyPopulationFromSnapshot();
}

async function loadScoreProtestDensity() {
  const mod = await import('../../../src/lib/scoring/protest_density.ts');
  return mod.scoreProtestDensity;
}

async function loadSdwisSnapshot() {
  const mod = await import('../../../src/lib/datasets/sdwis.ts');
  return await mod.loadSdwisSnapshot();
}

async function loadScoreDrinkingWaterRisk() {
  const mod = await import('../../../src/lib/scoring/dwrs.ts');
  return mod.scoreDrinkingWaterRisk;
}

async function loadScorePermitFilingRedFlags() {
  const mod = await import('../../../src/lib/scoring/permit_filing_red_flags.ts');
  return mod.scorePermitFilingRedFlags;
}

async function loadPermitHelpers() {
  const mod = await import('../../../src/lib/tceq-permits.ts');
  return {
    buildPermitProtestPrep: mod.buildPermitProtestPrep,
    getPermitFilingDetailPageData: mod.getPermitFilingDetailPageData,
    getTceqPendingPermitsPageData: mod.getTceqPendingPermitsPageData,
    listCountyPendingFights: mod.listCountyPendingFights,
  };
}

async function loadPipelineHealthReportFromSnapshot() {
  const reportPath = path.join(process.cwd(), 'public', 'cache', 'pipeline-health.json');
  const raw = await fs.readFile(reportPath, 'utf8');
  return JSON.parse(raw);
}

async function loadRoadmapOpenDataQueueFromSnapshot() {
  const queuePath = path.join(process.cwd(), 'public', 'cache', 'roadmap-open-data-botnet.json');
  const raw = await fs.readFile(queuePath, 'utf8');
  return JSON.parse(raw);
}

async function loadExecutionRegistryHelpers() {
  const mod = await import('../../../src/lib/execution/execution-registry.ts');
  return {
    listAtlasExecutionUnits: mod.listAtlasExecutionUnits,
  };
}

async function loadAnalyticsArtifact(filename) {
  const artifactPath = path.join(process.cwd(), 'public', 'cache', 'analytics', filename);
  const raw = await fs.readFile(artifactPath, 'utf8');
  return JSON.parse(raw);
}

async function loadAnalyticsArtifactsFromSnapshot() {
  const [countyHistory, countyMovers, pressureRiskScatter, sourceFreshness] = await Promise.all([
    loadAnalyticsArtifact('county-history.json'),
    loadAnalyticsArtifact('county-movers.json'),
    loadAnalyticsArtifact('pressure-risk-scatter.json'),
    loadAnalyticsArtifact('source-freshness.json'),
  ]);

  return {
    countyHistory,
    countyMovers,
    pressureRiskScatter,
    sourceFreshness,
  };
}

function source(datasetId, retrievedAt, rowsUsed) {
  const dataset = datasetById(datasetId);
  return {
    dataset_id: datasetId,
    publisher: dataset?.publisher ?? 'Unknown publisher',
    url: DATASET_URLS[datasetId] ?? 'https://github.com/sbauwow/atlas-tx',
    retrieved_at: retrievedAt,
    rows_used: rowsUsed,
  };
}

function envelope(data, { generatedAt, cacheState, sources, caveats = [] }) {
  return {
    data,
    sources,
    caveats,
    generated_at: generatedAt,
    cache_state: cacheState,
  };
}

function normalizeCounty(value) {
  return value?.trim() ?? undefined;
}

function normalizeCountyKey(value) {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? undefined;
}

function findCountyRecord(records, county) {
  const normalizedCounty = normalizeCountyKey(county);
  if (!normalizedCounty) return null;
  return records.find((record) => {
    const names = [record?.county?.name, record?.county].filter(Boolean);
    return names.some((name) => normalizeCountyKey(name) === normalizedCounty);
  }) ?? null;
}

function latestSnapshot(historyRecord) {
  return historyRecord?.snapshots?.at(-1) ?? null;
}

function previousSnapshot(historyRecord) {
  return historyRecord?.snapshots?.at(-2) ?? null;
}

function formatScatterQuadrant(quadrant) {
  return SCATTER_QUADRANT_LABELS[quadrant] ?? quadrant ?? null;
}

function buildAnalyticsSources(sourceFreshness, sourceIds = null) {
  const freshnessRows = sourceFreshness?.sources ?? [];
  const selectedRows = sourceIds
    ? freshnessRows.filter((row) => sourceIds.includes(row.sourceId))
    : freshnessRows;

  return selectedRows.flatMap((row) => {
    const datasetIds = ANALYTICS_DATASET_IDS[row.sourceId] ?? [row.sourceId];
    return datasetIds.map((datasetId) => source(datasetId, row.generatedAt, row.rowCount ?? 0));
  });
}

function buildAnalyticsCaveats(sourceFreshness, extraCaveats = []) {
  const freshnessNotes = (sourceFreshness?.sources ?? [])
    .flatMap((row) => row.notes ?? [])
    .slice(0, 8);

  return [...new Set([...extraCaveats, ...freshnessNotes])];
}

function summarizeQuadrants(points) {
  const counts = points.reduce((accumulator, point) => {
    accumulator[point.quadrant] = (accumulator[point.quadrant] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.keys(SCATTER_QUADRANT_LABELS).map((quadrant) => ({
    quadrant,
    label: SCATTER_QUADRANT_LABELS[quadrant],
    count: counts[quadrant] ?? 0,
  }));
}

function normalizePermitContext(data) {
  return {
    generatedAt: data.generatedAt,
    cacheState: data.cacheState ?? 'snapshot',
    permits: data.permits,
    cidSummary: data.cidSummary,
  };
}

function buildPipelineHealthSummary(report) {
  const cidStep = report.steps.find((step) => step.stepId === 'refresh-cid') ?? null;
  const lastSuccessfulRunAt = report.steps.some((step) => step.status === 'ok') ? report.generatedAt : null;

  return {
    overall_status: report.overallStatus,
    last_successful_run_at: lastSuccessfulRunAt,
    stale_steps: report.steps.filter((step) => step.status !== 'ok').map((step) => step.stepId),
    cid: {
      status: cidStep?.status ?? 'missing',
      browser_fallback_used: cidStep?.notes?.some((note) => /browser fallback/i.test(note)) ?? false,
      last_error: cidStep?.status === 'failed' ? (cidStep.notes?.at(-1) ?? null) : null,
    },
    steps: report.steps.map((step) => ({
      step_id: step.stepId,
      status: step.status,
      started_at: step.startedAt,
      ended_at: step.endedAt,
      duration_ms: step.durationMs,
      output_path: step.outputPath,
      notes: step.notes,
    })),
  };
}

async function buildRoadmapOpenDataQueueSummary(queue) {
  const { listAtlasExecutionUnits } = await loadExecutionRegistryHelpers();
  const executionUnits = listAtlasExecutionUnits();
  return {
    scope: queue.scope,
    generated_at: queue.generatedAt,
    candidate_count: queue.candidateCount,
    waves: queue.waves,
    candidates: queue.candidates.map((candidate) => ({
      execution_unit_id: candidate.executionUnitId,
      name: candidate.name,
      roadmap_wave: candidate.roadmapWave,
      roadmap_phase_label: candidate.roadmapPhaseLabel,
      strategic_priority: candidate.strategicPriority,
      evidence_class: candidate.evidenceClass,
      thesis_lane: candidate.thesisLane,
      upstream_type: candidate.upstreamType,
      grain: candidate.grain,
      geographic_join_strategy: candidate.geographicJoinStrategy,
      downstream_consumers: candidate.downstreamConsumers,
      activation_criteria: candidate.activationCriteria,
      next_action: candidate.nextAction,
      execution_unit_status: executionUnits.find((unit) => unit.id === candidate.executionUnitId)?.status ?? null,
    })),
  };
}

function aggregatePermitRows(cases, protests, params = {}) {
  const protestsById = new Map();
  for (const protest of protests) {
    const list = protestsById.get(protest.tceqId) ?? [];
    list.push(protest);
    protestsById.set(protest.tceqId, list);
  }

  const rows = [];
  for (const row of cases) {
    if (!params.include_closed && row.itemStatus !== 'open') continue;
    if (params.county && row.county !== params.county) continue;
    if (params.program_area && row.programArea !== params.program_area) continue;

    const filings = protestsById.get(row.tceqId) ?? [];
    const comments = filings.filter((f) => f.filingType === 'comment').length;
    const hearingRequests = filings.filter((f) => f.filingType === 'hearing_request').length;
    const publicMeetingRequests = filings.filter((f) => f.filingType === 'public_meeting_request').length;
    if ((params.min_hearing_requests ?? 0) > hearingRequests) continue;

    const namedFilingOrgs = [...new Set(filings.map((f) => f.filerOrganization).filter(Boolean))];
    const latestFiledAt = filings.map((f) => f.filedAt).sort().at(-1) ?? null;

    rows.push({
      tceq_id: row.tceqId,
      applicant_name: row.applicantName,
      county: row.county,
      program_area: row.programArea,
      item_status: row.itemStatus,
      tceq_docket_number: row.tceqDocketNumber,
      soah_docket_number: row.soahDocketNumber,
      filing_counts: {
        comments,
        hearing_requests: hearingRequests,
        public_meeting_requests: publicMeetingRequests,
      },
      named_filing_orgs: namedFilingOrgs,
      latest_filed_at: latestFiledAt,
    });
  }

  return rows
    .sort((a, b) => {
      const hearingDelta = b.filing_counts.hearing_requests - a.filing_counts.hearing_requests;
      if (hearingDelta !== 0) return hearingDelta;
      return (b.latest_filed_at ?? '').localeCompare(a.latest_filed_at ?? '');
    })
    .slice(0, params.limit ?? 25);
}

export function createAtlasTxMcpHandlers(deps = {}) {
  const loadCidData = deps.loadCidData ?? (async () => {
    throw new Error('CID data loader not wired yet');
  });
  const loadCountyPopulation = deps.loadCountyPopulation ?? loadAcsCountyPopulationFromSnapshot;
  const loadSdwisData = deps.loadSdwisData ?? loadSdwisSnapshot;
  const loadPermitPageData = deps.loadPermitPageData ?? (async () => {
    const helpers = await loadPermitHelpers();
    return normalizePermitContext(await helpers.getTceqPendingPermitsPageData());
  });
  const loadPipelineHealthReport = deps.loadPipelineHealthReport ?? loadPipelineHealthReportFromSnapshot;
  const loadRoadmapOpenDataQueue = deps.loadRoadmapOpenDataQueue ?? loadRoadmapOpenDataQueueFromSnapshot;
  const loadAnalyticsArtifacts = deps.loadAnalyticsArtifacts ?? loadAnalyticsArtifactsFromSnapshot;

  return {
    async discover_datasets(params = {}) {
      const datasets = await loadMvpDatasets();
      const data = params.category
        ? datasets.filter((dataset) => dataset.category === params.category)
        : datasets;
      const now = new Date().toISOString();
      return envelope(data, {
        generatedAt: now,
        cacheState: 'snapshot',
        sources: [],
        caveats: [],
      });
    },

    async get_dataset_schema({ dataset_id }) {
      const datasets = await loadMvpDatasets();
      const dataset = datasets.find((row) => row.id === dataset_id);
      if (!dataset) {
        throw new Error(`Unknown dataset_id: ${dataset_id}`);
      }
      const now = new Date().toISOString();
      return envelope({ dataset }, {
        generatedAt: now,
        cacheState: 'snapshot',
        sources: [],
        caveats: [],
      });
    },

    async score_pws_drinking_water_risk(params = {}) {
      const sdwis = await loadSdwisData();
      const scoreDrinkingWaterRisk = await loadScoreDrinkingWaterRisk();
      const data = scoreDrinkingWaterRisk({
        violations: sdwis.rows,
        county: params.county,
        minPopulation: params.min_population,
      }).slice(0, params.limit ?? 25)
        .map((row) => ({
          pws_id: row.pwsId,
          pws_name: row.pwsName,
          county: row.county,
          population_served: row.populationServed,
          score: row.score,
          components: {
            violation_severity: row.components.violationSeverity,
            population_weight: row.components.populationWeight,
            recency_weight: row.components.recencyWeight,
          },
          top_violations: row.topViolations,
        }));
      return envelope(data, {
        generatedAt: sdwis.generatedAt,
        cacheState: sdwis.cacheState ?? 'snapshot',
        sources: [source('epa-sdwis-violations', sdwis.generatedAt, sdwis.rows.length)],
        caveats: [
          ...(sdwis.caveats ?? []),
          'DWRS is a risk indicator derived from violation history, not a measurement of present harm.',
        ],
      });
    },

    async get_county_analytics_summary({ county, history_limit = 4 } = {}) {
      if (!county) {
        throw new Error('county is required');
      }

      const analytics = await loadAnalyticsArtifacts();
      const historyRecord = findCountyRecord(analytics.countyHistory?.counties ?? [], county);
      if (!historyRecord) {
        throw new Error(`Unknown analytics county: ${county}`);
      }

      const mover = findCountyRecord(analytics.countyMovers?.movers ?? [], county);
      const scatterPoint = findCountyRecord(analytics.pressureRiskScatter?.points ?? [], county);
      const currentSnapshot = latestSnapshot(historyRecord);
      const priorSnapshot = previousSnapshot(historyRecord);
      const riskDelta =
        typeof currentSnapshot?.metrics?.countyRiskScore === 'number' && typeof priorSnapshot?.metrics?.countyRiskScore === 'number'
          ? Number((currentSnapshot.metrics.countyRiskScore - priorSnapshot.metrics.countyRiskScore).toFixed(2))
          : null;
      const pressureDelta =
        typeof currentSnapshot?.metrics?.pressureScore === 'number' && typeof priorSnapshot?.metrics?.pressureScore === 'number'
          ? Number((currentSnapshot.metrics.pressureScore - priorSnapshot.metrics.pressureScore).toFixed(2))
          : null;

      return envelope({
        county: historyRecord.county.name,
        county_slug: historyRecord.county.slug,
        current_snapshot: currentSnapshot ? {
          snapshot_at: currentSnapshot.snapshotAt,
          county_risk_score: currentSnapshot.metrics.countyRiskScore,
          pressure_score: currentSnapshot.metrics.pressureScore,
          risk_rank: currentSnapshot.ranks.risk,
          pressure_rank: currentSnapshot.ranks.pressure,
          system_count: currentSnapshot.metrics.systemCount,
          violation_count: currentSnapshot.metrics.violationCount,
          impaired_segment_count: currentSnapshot.metrics.impairedSegmentCount,
          hydrology_layer_hit_count: currentSnapshot.metrics.hydrologyLayerHitCount,
          affected_population: currentSnapshot.metrics.affectedPopulation ?? null,
          population: currentSnapshot.metrics.population ?? null,
        } : null,
        previous_snapshot: priorSnapshot ? {
          snapshot_at: priorSnapshot.snapshotAt,
          county_risk_score: priorSnapshot.metrics.countyRiskScore,
          pressure_score: priorSnapshot.metrics.pressureScore,
          risk_rank: priorSnapshot.ranks.risk,
          pressure_rank: priorSnapshot.ranks.pressure,
        } : null,
        deltas: {
          county_risk_score: riskDelta,
          pressure_score: pressureDelta,
          risk_rank: currentSnapshot && priorSnapshot ? currentSnapshot.ranks.risk - priorSnapshot.ranks.risk : null,
          pressure_rank: currentSnapshot && priorSnapshot ? currentSnapshot.ranks.pressure - priorSnapshot.ranks.pressure : null,
        },
        movement: mover ? {
          movement: mover.movement,
          current_rank: mover.currentRank,
          previous_rank: mover.previousRank,
          rank_delta: mover.rankDelta,
          current_risk_score: mover.currentRiskScore,
          previous_risk_score: mover.previousRiskScore,
          score_delta: mover.scoreDelta,
          current_pressure_score: mover.currentPressureScore,
          previous_pressure_score: mover.previousPressureScore,
        } : null,
        scatter_context: scatterPoint ? {
          x: scatterPoint.x,
          y: scatterPoint.y,
          quadrant: scatterPoint.quadrant,
          quadrant_label: formatScatterQuadrant(scatterPoint.quadrant),
          population: scatterPoint.population,
          impaired_segment_count: scatterPoint.impairedSegmentCount,
          hydrology_layer_hit_count: scatterPoint.hydrologyLayerHitCount,
          system_count: scatterPoint.systemCount,
          violation_count: scatterPoint.violationCount,
        } : null,
        top_systems: currentSnapshot?.highlights?.topSystems ?? [],
        history: historyRecord.snapshots.slice(-Math.max(1, history_limit)).map((snapshot) => ({
          snapshot_at: snapshot.snapshotAt,
          county_risk_score: snapshot.metrics.countyRiskScore,
          pressure_score: snapshot.metrics.pressureScore,
          risk_rank: snapshot.ranks.risk,
          pressure_rank: snapshot.ranks.pressure,
          violation_count: snapshot.metrics.violationCount,
          impaired_segment_count: snapshot.metrics.impairedSegmentCount,
        })),
        provenance: {
          method: analytics.countyHistory?.provenance?.method ?? null,
          notes: analytics.countyHistory?.provenance?.notes ?? [],
        },
      }, {
        generatedAt: analytics.countyHistory?.generatedAt ?? analytics.pressureRiskScatter?.generatedAt,
        cacheState: 'snapshot',
        sources: buildAnalyticsSources(analytics.sourceFreshness),
        caveats: buildAnalyticsCaveats(analytics.sourceFreshness, [
          'County analytics summary is derived from committed cache artifacts and should be treated as a screening surface, not a live regulatory lookup.',
        ]),
      });
    },

    async list_county_movers(params = {}) {
      const analytics = await loadAnalyticsArtifacts();
      const movement = params.movement?.trim();
      const county = normalizeCounty(params.county);
      const movers = (analytics.countyMovers?.movers ?? [])
        .filter((row) => !movement || row.movement === movement)
        .filter((row) => !county || normalizeCountyKey(row.county.name) === normalizeCountyKey(county))
        .slice(0, params.limit ?? 25)
        .map((row) => ({
          county: row.county.name,
          county_slug: row.county.slug,
          movement: row.movement,
          current_rank: row.currentRank,
          previous_rank: row.previousRank,
          rank_delta: row.rankDelta,
          current_risk_score: row.currentRiskScore,
          previous_risk_score: row.previousRiskScore,
          score_delta: row.scoreDelta,
          current_pressure_score: row.currentPressureScore,
          previous_pressure_score: row.previousPressureScore,
        }));

      return envelope({
        baseline_snapshot_at: analytics.countyMovers?.baselineSnapshotAt ?? null,
        comparison_snapshot_at: analytics.countyMovers?.comparisonSnapshotAt ?? null,
        notes: analytics.countyMovers?.notes ?? [],
        movers,
      }, {
        generatedAt: analytics.countyMovers?.generatedAt,
        cacheState: 'snapshot',
        sources: buildAnalyticsSources(analytics.sourceFreshness),
        caveats: buildAnalyticsCaveats(analytics.sourceFreshness, [
          'Most current committed movers are steady because the first comparison window only spans the initial Wave 1 snapshot pair.',
        ]),
      });
    },

    async get_pressure_risk_scatter(params = {}) {
      const analytics = await loadAnalyticsArtifacts();
      const county = normalizeCounty(params.county);
      const quadrant = params.quadrant?.trim();
      const points = (analytics.pressureRiskScatter?.points ?? [])
        .filter((row) => !county || normalizeCountyKey(row.county.name) === normalizeCountyKey(county))
        .filter((row) => !quadrant || row.quadrant === quadrant);

      const sortedPoints = [...points]
        .sort((left, right) => right.y - left.y || right.x - left.x)
        .slice(0, params.limit ?? 100)
        .map((row) => ({
          county: row.county.name,
          county_slug: row.county.slug,
          x: row.x,
          y: row.y,
          population: row.population,
          impaired_segment_count: row.impairedSegmentCount,
          hydrology_layer_hit_count: row.hydrologyLayerHitCount,
          system_count: row.systemCount,
          violation_count: row.violationCount,
          quadrant: row.quadrant,
          quadrant_label: formatScatterQuadrant(row.quadrant),
        }));

      return envelope({
        axes: analytics.pressureRiskScatter?.axes ?? { x: 'pressureScore', y: 'countyRiskScore' },
        quadrant_summary: summarizeQuadrants(analytics.pressureRiskScatter?.points ?? []),
        points: sortedPoints,
      }, {
        generatedAt: analytics.pressureRiskScatter?.generatedAt,
        cacheState: 'snapshot',
        sources: buildAnalyticsSources(analytics.sourceFreshness),
        caveats: buildAnalyticsCaveats(analytics.sourceFreshness, [
          'Scatter quadrants are relative to the current committed statewide snapshot and will shift as new snapshots are committed.',
        ]),
      });
    },

    async get_county_score_decomposition({ county } = {}) {
      if (!county) {
        throw new Error('county is required');
      }

      const analytics = await loadAnalyticsArtifacts();
      const historyRecord = findCountyRecord(analytics.countyHistory?.counties ?? [], county);
      if (!historyRecord) {
        throw new Error(`Unknown analytics county: ${county}`);
      }

      const currentSnapshot = latestSnapshot(historyRecord);
      if (!currentSnapshot) {
        throw new Error(`No analytics snapshots available for county: ${county}`);
      }

      const scatterPoint = findCountyRecord(analytics.pressureRiskScatter?.points ?? [], county);
      const countyCount = analytics.countyHistory?.counties?.length ?? null;
      const currentTopSystems = currentSnapshot.highlights?.topSystems ?? [];

      return envelope({
        county: historyRecord.county.name,
        county_slug: historyRecord.county.slug,
        snapshot_at: currentSnapshot.snapshotAt,
        decomposition: [
          {
            component_id: 'county_risk_score',
            label: 'County drinking-water risk axis',
            value: currentSnapshot.metrics.countyRiskScore,
            rank: currentSnapshot.ranks.risk,
            statewide_county_count: countyCount,
            details: {
              violation_count: currentSnapshot.metrics.violationCount,
              system_count: currentSnapshot.metrics.systemCount,
              affected_population: currentSnapshot.metrics.affectedPopulation ?? null,
            },
          },
          {
            component_id: 'pressure_score',
            label: 'Surface-water pressure axis',
            value: currentSnapshot.metrics.pressureScore,
            rank: currentSnapshot.ranks.pressure,
            statewide_county_count: countyCount,
            details: {
              impaired_segment_count: currentSnapshot.metrics.impairedSegmentCount,
              hydrology_layer_hit_count: currentSnapshot.metrics.hydrologyLayerHitCount,
              population: currentSnapshot.metrics.population ?? null,
              impaired_segment_share: currentSnapshot.metrics.impairedSegmentShare ?? null,
            },
          },
        ],
        top_systems: currentTopSystems.map((system) => ({
          pws_id: system.pwsId,
          pws_name: system.pwsName,
          score: system.score,
          violation_count: system.violationCount,
        })),
        scatter_context: scatterPoint ? {
          quadrant: scatterPoint.quadrant,
          quadrant_label: formatScatterQuadrant(scatterPoint.quadrant),
          x: scatterPoint.x,
          y: scatterPoint.y,
        } : null,
        provenance: {
          method: analytics.countyHistory?.provenance?.method ?? null,
          notes: analytics.countyHistory?.provenance?.notes ?? [],
        },
      }, {
        generatedAt: analytics.countyHistory?.generatedAt,
        cacheState: 'snapshot',
        sources: buildAnalyticsSources(analytics.sourceFreshness),
        caveats: buildAnalyticsCaveats(analytics.sourceFreshness, [
          'First-cut decomposition breaks the county view into the committed risk and pressure axes plus supporting counts; it does not yet expose the fuller live county explorer driver stack.',
        ]),
      });
    },

    async list_protested_permits(params = {}) {
      const cid = await loadCidData();
      const county = normalizeCounty(params.county);
      const data = aggregatePermitRows(cid.cases, cid.protests, {
        ...params,
        county,
      });
      return envelope(data, {
        generatedAt: cid.generatedAt,
        cacheState: cid.cacheState,
        sources: [
          source('tceq-cid-search-one', cid.generatedAt, cid.cases.length),
          source('tceq-cid-search-two', cid.generatedAt, cid.protests.length),
        ],
        caveats: [
          'No individual commenter names are surfaced; only aggregate counts and named filing organizations.',
          'CID reflects public filings and procedural status, not legal merit.',
        ],
      });
    },

    async score_protest_density(params = {}) {
      const cid = await loadCidData();
      const countyPopulation = await loadCountyPopulation();
      const scoreProtestDensity = await loadScoreProtestDensity();
      const data = scoreProtestDensity({
        cases: cid.cases,
        protests: cid.protests,
        countyPopulation,
        county: params.county,
        minPopulation: params.min_population,
      }).slice(0, params.limit ?? 25)
        .map((row) => ({
          county: row.county,
          score: row.score,
          raw_pressure: row.rawPressure,
          per_1k_population: row.per1kPopulation,
          open_case_count: row.openCaseCount,
          components: {
            comment_count: row.components.commentCount,
            hearing_request_count: row.components.hearingRequestCount,
            public_meeting_request_count: row.components.publicMeetingRequestCount,
            soah_case_count: row.components.soahCaseCount,
          },
        }));
      return envelope(data, {
        generatedAt: cid.generatedAt,
        cacheState: cid.cacheState,
        sources: [
          source('tceq-cid-search-one', cid.generatedAt, cid.cases.length),
          source('tceq-cid-search-two', cid.generatedAt, cid.protests.length),
          source('census-acs5-2023-county', cid.generatedAt, Object.keys(countyPopulation).length),
        ],
        caveats: [
          'APD is a protest-pressure indicator, not a finding on environmental harm or permit legality.',
          'Per-capita normalization can brighten rural counties; compare raw pressure alongside the normalized score.',
        ],
      });
    },

    async list_permit_filing_red_flags(params = {}) {
      const permitData = await loadPermitPageData();
      const scorePermitFilingRedFlags = await loadScorePermitFilingRedFlags();
      const county = normalizeCounty(params.county);
      const rows = scorePermitFilingRedFlags({
        permits: permitData.permits,
        cases: permitData.cidSummary.cases,
      }).filter((row) => !county || row.county === county)
        .slice(0, params.limit ?? 25)
        .map((row) => ({
          tceq_id: row.tceqId,
          applicant_name: row.applicantName,
          county: row.county,
          program_area: row.programArea,
          score: row.score,
          reasons: row.reasons.map((reason) => reason.text),
          components: {
            procedural_pressure: row.components.proceduralPressure,
            county_pressure: row.components.countyPressure,
          },
        }));
      return envelope(rows, {
        generatedAt: permitData.generatedAt,
        cacheState: permitData.cacheState,
        sources: [
          source('7fq8-wig2', permitData.generatedAt, permitData.permits.length),
          source('tceq-cid-search-one', permitData.cidSummary.generatedAt ?? permitData.generatedAt, permitData.cidSummary.cases.length),
        ],
        caveats: [
          'Filing red flags are public-record leads, not proof that an application is invalid.',
          'This tool currently emphasizes procedural pressure and county permit concentration over full engineering-document analysis.',
        ],
      });
    },

    async build_permit_protest_prep({ tceq_id }) {
      const permitData = await loadPermitPageData();
      const helpers = await loadPermitHelpers();
      const detail = helpers.getPermitFilingDetailPageData({
        tceqId: tceq_id,
        permits: permitData.permits,
        cidSummary: permitData.cidSummary,
      });
      const prep = helpers.buildPermitProtestPrep({
        caseRow: detail.caseRow,
        countyPermitCount: detail.countyPermitCount,
        redFlagReasons: detail.redFlagRow?.reasons.map((reason) => reason.text) ?? [],
        relatedPermitNumbers: detail.relatedPermits.map((permit) => permit.permitNumber),
      });
      return envelope({
        tceq_id,
        participation_status: prep.participationStatus,
        evidence_checklist: prep.evidenceChecklist,
        draft_text: prep.draftText,
        export_text: prep.exportText,
      }, {
        generatedAt: permitData.generatedAt,
        cacheState: permitData.cacheState,
        sources: [
          source('7fq8-wig2', permitData.generatedAt, permitData.permits.length),
          source('tceq-cid-search-one', permitData.cidSummary.generatedAt ?? permitData.generatedAt, permitData.cidSummary.cases.length),
        ],
        caveats: [
          'Atlas TX provides drafting support only and does not provide legal advice or submit filings.',
          'No individual commenter names are surfaced; only aggregate filing signals and public-record context.',
        ],
      });
    },

    async get_permit_filing_detail({ tceq_id }) {
      const permitData = await loadPermitPageData();
      const helpers = await loadPermitHelpers();
      const detail = helpers.getPermitFilingDetailPageData({
        tceqId: tceq_id,
        permits: permitData.permits,
        cidSummary: permitData.cidSummary,
      });
      return envelope({
        tceq_id,
        procedural_status: {
          county: detail.caseRow.county,
          program_area: detail.caseRow.programArea,
          item_status: detail.caseRow.itemStatus,
          tceq_docket_number: detail.caseRow.tceqDocketNumber,
          soah_docket_number: detail.caseRow.soahDocketNumber,
          latest_filed_at: detail.caseRow.latestFiledAt,
          filing_counts: {
            comments: detail.caseRow.filingCounts.comments,
            hearing_requests: detail.caseRow.filingCounts.hearingRequests,
            public_meeting_requests: detail.caseRow.filingCounts.publicMeetingRequests,
          },
        },
        county_permit_count: detail.countyPermitCount,
        related_permits: detail.relatedPermits.map((permit) => ({
          permit_number: permit.permitNumber,
          permittee_name: permit.permitteeName,
          authorization_type: permit.authorizationType,
          county: permit.county,
          nearest_city: permit.nearestCity,
        })),
        red_flag: detail.redFlagRow ? {
          score: detail.redFlagRow.score,
          reasons: detail.redFlagRow.reasons.map((reason) => reason.text),
          components: {
            procedural_pressure: detail.redFlagRow.components.proceduralPressure,
            county_pressure: detail.redFlagRow.components.countyPressure,
          },
          caveats: detail.redFlagRow.caveats,
        } : null,
      }, {
        generatedAt: permitData.generatedAt,
        cacheState: permitData.cacheState,
        sources: [
          source('7fq8-wig2', permitData.generatedAt, permitData.permits.length),
          source('tceq-cid-search-one', permitData.cidSummary.generatedAt ?? permitData.generatedAt, permitData.cidSummary.cases.length),
        ],
        caveats: [
          'Filing detail is procedural context and not a final legal determination.',
          'Related permits are matched by applicant name and county context; confirm exact project scope in the public record.',
        ],
      });
    },

    async list_county_pending_fights(params = {}) {
      const permitData = await loadPermitPageData();
      const helpers = await loadPermitHelpers();
      const county = normalizeCounty(params.county);
      const rows = helpers.listCountyPendingFights(permitData.permits, permitData.cidSummary.cases, county)
        .slice(0, params.limit ?? 25)
        .map((row) => ({
          tceq_id: row.tceqId,
          applicant_name: row.applicantName,
          county: row.county,
          county_slug: row.countySlug,
          program_area: row.programArea,
          procedural_pressure_score: row.proceduralPressureScore,
          county_permit_count: row.countyPermitCount,
          item_status: row.itemStatus,
          tceq_docket_number: row.tceqDocketNumber,
          soah_docket_number: row.soahDocketNumber,
          latest_filed_at: row.latestFiledAt,
          filing_counts: {
            comments: row.filingCounts.comments,
            hearing_requests: row.filingCounts.hearingRequests,
            public_meeting_requests: row.filingCounts.publicMeetingRequests,
          },
          named_filing_orgs: row.namedFilingOrgs,
        }));
      return envelope(rows, {
        generatedAt: permitData.generatedAt,
        cacheState: permitData.cacheState,
        sources: [
          source('7fq8-wig2', permitData.generatedAt, permitData.permits.length),
          source('tceq-cid-search-one', permitData.cidSummary.generatedAt ?? permitData.generatedAt, permitData.cidSummary.cases.length),
        ],
        caveats: [
          'Pending fights rank procedural pressure from public records and do not imply permit invalidity or project harm.',
          'Named individual filers are intentionally excluded; this tool returns aggregate filing counts only.',
        ],
      });
    },

    async get_pipeline_health() {
      const report = await loadPipelineHealthReport();
      return envelope(buildPipelineHealthSummary(report), {
        generatedAt: report.generatedAt,
        cacheState: 'snapshot',
        sources: [],
        caveats: [
          'Pipeline health reflects the latest staged refresh artifact, not a live check against upstream sources.',
          'CID remains the most failure-prone source; browser fallback usage is inferred from recorded step notes.',
        ],
      });
    },

    async get_roadmap_open_data_queue() {
      const queue = await loadRoadmapOpenDataQueue();
      return envelope(await buildRoadmapOpenDataQueueSummary(queue), {
        generatedAt: queue.generatedAt,
        cacheState: 'snapshot',
        sources: [],
        caveats: [
          'Roadmap queue state comes from the committed roadmap-open-data botnet artifact, not a live probe of every future source.',
          'Execution unit status is joined from the local execution registry so operators can distinguish active, partial, and planned lanes.',
        ],
      });
    },

    async summarize_water_risk_for_county(params = {}) {
      const county = normalizeCounty(params.county);
      if (!county) {
        throw new Error('county is required');
      }
      const maxWords = Math.max(40, Math.min(params.max_words ?? 200, 400));
      const includeProtestDensity = params.include_protest_density === true;

      const [sdwis, analytics] = await Promise.all([
        loadSdwisData(),
        loadAnalyticsArtifacts(),
      ]);

      const scoreDrinkingWaterRisk = await loadScoreDrinkingWaterRisk();
      const dwrsRows = scoreDrinkingWaterRisk({
        violations: sdwis.rows,
        county,
      }).slice(0, 5);
      const topPws = dwrsRows.map((row) => ({
        pws_id: row.pwsId,
        pws_name: row.pwsName,
        score: row.score,
      }));

      const historyRecord = findCountyRecord(analytics.countyHistory?.counties ?? [], county);
      const currentSnapshot = latestSnapshot(historyRecord);
      const scatterPoint = findCountyRecord(analytics.pressureRiskScatter?.points ?? [], county);

      let protestDensity;
      const protestSources = [];
      const protestCaveats = [];
      let cidGeneratedAt = null;
      if (includeProtestDensity) {
        const cid = await loadCidData();
        cidGeneratedAt = cid.generatedAt;
        const countyPopulation = await loadCountyPopulation();
        const scoreProtestDensity = await loadScoreProtestDensity();
        const apdRows = scoreProtestDensity({
          cases: cid.cases,
          protests: cid.protests,
          countyPopulation,
          county,
        });
        const apd = apdRows[0] ?? null;
        if (apd) {
          protestDensity = {
            score: apd.score,
            raw_pressure: apd.rawPressure,
            per_1k_population: apd.per1kPopulation,
            open_case_count: apd.openCaseCount,
          };
        } else {
          protestDensity = null;
          protestCaveats.push(`No CID activity matched ${county} in the current snapshot.`);
        }
        protestSources.push(
          source('tceq-cid-search-one', cid.generatedAt, cid.cases.length),
          source('tceq-cid-search-two', cid.generatedAt, cid.protests.length),
          source('census-acs5-2023-county', cid.generatedAt, Object.keys(countyPopulation).length),
        );
      }

      const headlineCounty = historyRecord?.county?.name ?? county;
      const headlineParts = [`${headlineCounty}`];
      if (currentSnapshot?.metrics?.countyRiskScore != null) {
        headlineParts.push(`risk ${currentSnapshot.metrics.countyRiskScore.toFixed(2)} (rank ${currentSnapshot.ranks?.risk ?? '—'})`);
      }
      if (currentSnapshot?.metrics?.pressureScore != null) {
        headlineParts.push(`pressure ${currentSnapshot.metrics.pressureScore.toFixed(2)} (rank ${currentSnapshot.ranks?.pressure ?? '—'})`);
      }
      const headline = headlineParts.join(' — ');

      const narrativeBits = [];
      if (currentSnapshot?.metrics) {
        const m = currentSnapshot.metrics;
        narrativeBits.push(
          `${headlineCounty} carries ${m.systemCount ?? 0} public water systems with ${m.violationCount ?? 0} cached health-based violations and ${m.impairedSegmentCount ?? 0} impaired surface-water segments.`,
        );
      }
      if (topPws.length > 0) {
        const lead = topPws[0];
        narrativeBits.push(
          `Top DWRS PWS is ${lead.pws_name ?? lead.pws_id} at score ${lead.score}.`,
        );
      } else {
        narrativeBits.push(`No SDWIS health-based violations matched ${headlineCounty} in the current snapshot.`);
      }
      if (scatterPoint?.quadrant) {
        narrativeBits.push(`Quadrant: ${formatScatterQuadrant(scatterPoint.quadrant)}.`);
      }
      if (protestDensity) {
        narrativeBits.push(
          `APD score ${protestDensity.score} across ${protestDensity.open_case_count} open CID cases (${protestDensity.per_1k_population.toFixed(2)} per 1k residents).`,
        );
      }
      narrativeBits.push(
        'EJ block-group overlay is not yet implemented; treat this summary as a screening surface, not a regulatory finding.',
      );

      let narrative = narrativeBits.join(' ');
      const words = narrative.split(/\s+/);
      if (words.length > maxWords) {
        narrative = `${words.slice(0, maxWords).join(' ')}…`;
      }

      return envelope(
        {
          county: headlineCounty,
          headline,
          narrative,
          top_pws: topPws,
          top_block_groups: [],
          ...(includeProtestDensity ? { protest_density: protestDensity } : {}),
        },
        {
          generatedAt: currentSnapshot?.snapshotAt ?? sdwis.generatedAt,
          cacheState: 'snapshot',
          sources: [
            source('epa-sdwis-violations', sdwis.generatedAt, sdwis.rows.length),
            ...buildAnalyticsSources(analytics.sourceFreshness, ['surface-water-quality', 'twdb-hydrology']),
            ...protestSources,
          ],
          caveats: [
            'EJ block-group overlay is not yet wired; top_block_groups returns an empty list.',
            'Composite summary is derived from cached snapshots and is a screening lead, not proof of harm.',
            ...protestCaveats,
            ...(historyRecord ? [] : [`No analytics history matched ${county}; pressure/risk fields will be empty.`]),
          ],
        },
      );
    },
  };
}

export async function runAtlasTxTool(toolName, params = {}, deps = {}) {
  const handlers = createAtlasTxMcpHandlers(deps);
  const handler = handlers[toolName];
  if (typeof handler !== 'function') {
    throw new Error(`Unknown Atlas TX tool: ${toolName}`);
  }
  return await handler(params);
}

export async function main(argv = process.argv.slice(2)) {
  const [toolName, rawParams] = argv;
  if (!toolName) {
    console.log('Atlas TX MCP server scaffold');
    return;
  }

  const params = rawParams ? JSON.parse(rawParams) : {};
  const result = await runAtlasTxTool(toolName, params);
  console.log(JSON.stringify(result));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
