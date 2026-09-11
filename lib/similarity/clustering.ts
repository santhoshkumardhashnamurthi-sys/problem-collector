import { ProblemCluster } from '../db/schema';
import { calculateOpportunitySignal } from '../analytics/signal';

export interface ClusterAssignmentResult {
  cluster: ProblemCluster;
  isNewCluster: boolean;
  similarityScore: number;
}

export function findOrCreateCluster(
  newProblem: {
    raw_description: string;
    normalized_problem: string;
    category_id: string | null;
    category_name: string;
    city: string | null;
    frequency: string;
    severity: string;
  },
  existingClusters: ProblemCluster[]
): ClusterAssignmentResult {
  const normWords = new Set(
    newProblem.normalized_problem
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );

  let bestMatch: ProblemCluster | null = null;
  let highestScore = 0;

  for (const cluster of existingClusters) {
    // Only match within same category
    if (cluster.category_id && newProblem.category_id && cluster.category_id !== newProblem.category_id) {
      continue;
    }

    const clusterWords = new Set(
      (cluster.name + ' ' + cluster.description)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );

    let matchCount = 0;
    normWords.forEach(w => {
      if (clusterWords.has(w)) matchCount++;
    });

    const score = normWords.size > 0 ? matchCount / normWords.size : 0;
    if (score > highestScore) {
      highestScore = score;
      bestMatch = cluster;
    }
  }

  // If match score exceeds threshold (e.g. 0.35), link to existing cluster
  if (bestMatch && highestScore >= 0.35) {
    const updatedReportCount = bestMatch.report_count + 1;
    const updatedContributors = bestMatch.unique_contributors + 1;
    const topLocations = bestMatch.top_locations ? [...bestMatch.top_locations] : [];
    if (newProblem.city && !topLocations.includes(newProblem.city)) {
      topLocations.push(newProblem.city);
    }

    const signalBreakdown = calculateOpportunitySignal({
      reportCount: updatedReportCount,
      uniqueContributors: updatedContributors,
      growthRate: bestMatch.growth_rate + 2.5,
      locationCount: topLocations.length,
      frequency: newProblem.frequency,
      severity: newProblem.severity,
    });

    const updatedCluster: ProblemCluster = {
      ...bestMatch,
      report_count: updatedReportCount,
      unique_contributors: updatedContributors,
      growth_rate: Number((bestMatch.growth_rate + 1.2).toFixed(1)),
      signal_score: signalBreakdown.score,
      top_locations: topLocations.slice(0, 5),
      updated_at: new Date().toISOString(),
    };

    return {
      cluster: updatedCluster,
      isNewCluster: false,
      similarityScore: Number(highestScore.toFixed(2)),
    };
  }

  // Create a brand new cluster
  const clusterSlug = newProblem.normalized_problem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 60);

  const initialSignal = calculateOpportunitySignal({
    reportCount: 1,
    uniqueContributors: 1,
    growthRate: 0,
    locationCount: newProblem.city ? 1 : 0,
    frequency: newProblem.frequency,
    severity: newProblem.severity,
  });

  const newCluster: ProblemCluster = {
    id: 'cluster-' + Math.random().toString(36).substring(2, 10),
    name: newProblem.normalized_problem,
    slug: clusterSlug || 'cluster-' + Date.now(),
    description: `Real-world reports regarding ${newProblem.normalized_problem.toLowerCase()}`,
    category_id: newProblem.category_id,
    category_name: newProblem.category_name,
    report_count: 1,
    unique_contributors: 1,
    growth_rate: 5.0,
    signal_score: initialSignal.score,
    top_locations: newProblem.city ? [newProblem.city] : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    cluster: newCluster,
    isNewCluster: true,
    similarityScore: 1.0,
  };
}
