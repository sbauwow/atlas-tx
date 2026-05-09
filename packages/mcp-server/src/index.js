import { MVP_DATASETS } from '../../../src/lib/mvp-datasets.ts';

const DATASET_URLS = {
  'tceq-cid-search-one': 'https://www14.tceq.texas.gov/epic/eCID/index.cfm#searchone',
  'tceq-cid-search-two': 'https://www14.tceq.texas.gov/epic/eCID/index.cfm#searchtwo',
  'census-acs5-2023-county': 'https://www.census.gov/programs-surveys/acs',
  'epa-sdwis-violations': 'https://data.epa.gov/efservice',
};

function datasetById(datasetId) {
  return MVP_DATASETS.find((dataset) => dataset.id === datasetId);
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

function normalizePermitContext(data) {
  return {
    generatedAt: data.generatedAt,
    cacheState: data.cacheState ?? 'snapshot',
    permits: data.permits,
    cidSummary: data.cidSummary,
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

  return {
    async discover_datasets(params = {}) {
      const data = params.category
        ? MVP_DATASETS.filter((dataset) => dataset.category === params.category)
        : MVP_DATASETS;
      const now = new Date().toISOString();
      return envelope(data, {
        generatedAt: now,
        cacheState: 'snapshot',
        sources: [],
        caveats: [],
      });
    },

    async get_dataset_schema({ dataset_id }) {
      const dataset = datasetById(dataset_id);
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
