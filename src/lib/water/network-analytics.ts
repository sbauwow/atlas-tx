type NumericNode = {
  countySlug: string;
  upstreamContributionScore: number;
  downstreamDependencyScore: number;
  contagionScore: number;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const xMean = mean(x);
  const yMean = mean(y);

  let numerator = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (let i = 0; i < x.length; i += 1) {
    const dx = x[i]! - xMean;
    const dy = y[i]! - yMean;
    numerator += dx * dy;
    xVariance += dx * dx;
    yVariance += dy * dy;
  }

  const denominator = Math.sqrt(xVariance * yVariance);
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function buildNetworkCorrelationSummary(nodes: NumericNode[]) {
  const upstream = nodes.map((node) => node.upstreamContributionScore);
  const downstream = nodes.map((node) => node.downstreamDependencyScore);
  const contagion = nodes.map((node) => node.contagionScore);

  return {
    count: nodes.length,
    upstreamVsDownstream: pearsonCorrelation(upstream, downstream),
    upstreamVsContagion: pearsonCorrelation(upstream, contagion),
    downstreamVsContagion: pearsonCorrelation(downstream, contagion),
  };
}
