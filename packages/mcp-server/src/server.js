import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { createAtlasTxMcpHandlers } from './index.js';

const SERVER_INFO = {
  name: 'atlas-tx',
  version: '0.7.0',
};

const SERVER_INSTRUCTIONS = [
  'Atlas TX MCP server — Texas county water-risk + permit-protest intelligence.',
  'Every tool returns a { data, sources, caveats, generated_at, cache_state } envelope.',
  'Snapshots ship under public/cache/. None of these tools fetch live upstream rows.',
  'EJ overlap and live mismatch tools are not yet implemented; rely on caveats for coverage.',
].join(' ');

const MOVEMENT = z.enum(['new', 'steady', 'up', 'down']);
const QUADRANT = z.enum([
  'high-pressure-high-risk',
  'high-pressure-lower-risk',
  'lower-pressure-high-risk',
  'lower-pressure-lower-risk',
]);

const TOOLS = [
  {
    name: 'discover_datasets',
    description: 'List Atlas TX MVP datasets with category, use case, and access type.',
    inputSchema: {
      category: z.string().optional(),
    },
  },
  {
    name: 'get_dataset_schema',
    description: 'Return the registered fields and caveats for one dataset id.',
    inputSchema: {
      dataset_id: z.string(),
    },
  },
  {
    name: 'score_pws_drinking_water_risk',
    description: 'Compute the Drinking Water Risk Score (DWRS) per Texas Public Water System from cached SDWIS rows.',
    inputSchema: {
      county: z.string().optional(),
      limit: z.number().int().positive().optional(),
      min_population: z.number().int().nonnegative().optional(),
    },
  },
  {
    name: 'get_county_analytics_summary',
    description: 'Wave 1/2 analytics-spine summary for one county: current snapshot, deltas, movement, scatter context.',
    inputSchema: {
      county: z.string(),
      history_limit: z.number().int().positive().optional(),
    },
  },
  {
    name: 'list_county_movers',
    description: 'List counties from county-movers.json with optional movement / county filter.',
    inputSchema: {
      movement: MOVEMENT.optional(),
      county: z.string().optional(),
      limit: z.number().int().positive().optional(),
    },
  },
  {
    name: 'get_pressure_risk_scatter',
    description: 'Statewide pressure-vs-risk scatter context with optional county or quadrant filter.',
    inputSchema: {
      county: z.string().optional(),
      quadrant: QUADRANT.optional(),
      limit: z.number().int().positive().optional(),
    },
  },
  {
    name: 'get_county_score_decomposition',
    description: 'Break a county view into the current risk axis, pressure axis, supporting counts, and top systems.',
    inputSchema: {
      county: z.string(),
    },
  },
  {
    name: 'list_protested_permits',
    description: 'Open CID items with aggregated filing counts and named filing organizations only (no individual commenter PII).',
    inputSchema: {
      county: z.string().optional(),
      program_area: z.string().optional(),
      min_hearing_requests: z.number().int().nonnegative().optional(),
      limit: z.number().int().positive().optional(),
      include_closed: z.boolean().optional(),
    },
  },
  {
    name: 'score_protest_density',
    description: 'Compute Atlas Protest Density (APD) per county from CID + ACS rows.',
    inputSchema: {
      county: z.string().optional(),
      scope: z.enum(['county']).optional(),
      limit: z.number().int().positive().optional(),
      min_population: z.number().int().nonnegative().optional(),
    },
  },
  {
    name: 'list_permit_filing_red_flags',
    description: 'Filing-level scrutiny candidates derived from permit concentration plus CID procedural pressure.',
    inputSchema: {
      county: z.string().optional(),
      limit: z.number().int().positive().optional(),
    },
  },
  {
    name: 'build_permit_protest_prep',
    description: 'Build a non-legal, public-record drafting pack for one filing.',
    inputSchema: {
      tceq_id: z.string(),
    },
  },
  {
    name: 'get_permit_filing_detail',
    description: 'Structured filing-detail workspace context for one TCEQ ID.',
    inputSchema: {
      tceq_id: z.string(),
    },
  },
  {
    name: 'list_county_pending_fights',
    description: 'County-filterable open fights ranked by procedural pressure for the county workspace lane.',
    inputSchema: {
      county: z.string().optional(),
      limit: z.number().int().positive().optional(),
    },
  },
  {
    name: 'get_pipeline_health',
    description: 'Latest staged refresh status from public/cache/pipeline-health.json.',
    inputSchema: {},
  },
  {
    name: 'summarize_water_risk_for_county',
    description: 'Composite county-level summary: DWRS top PWS + analytics snapshot + optional APD. Returns a sourced screening surface, not a regulatory finding.',
    inputSchema: {
      county: z.string(),
      max_words: z.number().int().positive().optional(),
      include_protest_density: z.boolean().optional(),
    },
  },
];

function envelopeToolResult(envelopeResult) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(envelopeResult, null, 2),
      },
    ],
    structuredContent: envelopeResult,
  };
}

export function createAtlasTxMcpServer(deps = {}) {
  const handlers = createAtlasTxMcpHandlers(deps);
  const server = new McpServer(SERVER_INFO, { instructions: SERVER_INSTRUCTIONS });

  for (const tool of TOOLS) {
    const handler = handlers[tool.name];
    if (typeof handler !== 'function') {
      throw new Error(`Atlas TX tool not registered in handlers: ${tool.name}`);
    }
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args) => {
        const result = await handler(args ?? {});
        return envelopeToolResult(result);
      },
    );
  }

  return server;
}

export async function runStdioServer(deps = {}) {
  const server = createAtlasTxMcpServer(deps);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStdioServer().catch((error) => {
    console.error('atlas-tx mcp server failed:', error);
    process.exit(1);
  });
}
