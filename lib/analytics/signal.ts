// =============================================================================
// ARTIX Opportunity Signal Calculator
// Computes transparent scores (0-100) based strictly on measurable factors:
// 1. Report Volume (0-30 pts)
// 2. Contributor Diversity (0-20 pts)
// 3. Growth Momentum (0-20 pts)
// 4. Geographic Spread (0-10 pts)
// 5. Frequency of Occurrence (0-10 pts)
// 6. Severity & Pain Intensity (0-10 pts)
// =============================================================================

export interface SignalBreakdown {
  score: number;
  label: 'Emerging Signal' | 'Moderate Signal' | 'Strong Signal' | 'High Intensity Signal';
  factors: {
    volumeScore: number;
    diversityScore: number;
    growthScore: number;
    geographicScore: number;
    frequencyScore: number;
    severityScore: number;
  };
  explanation: string;
  disclaimer: string;
}

export function calculateOpportunitySignal(params: {
  reportCount: number;
  uniqueContributors: number;
  growthRate: number;
  locationCount: number;
  frequency: string;
  severity: string;
}): SignalBreakdown {
  const {
    reportCount,
    uniqueContributors,
    growthRate,
    locationCount,
    frequency,
    severity,
  } = params;

  // 1. Report Volume (max 30)
  // Scale logarithmic-like from 1 to 500+ reports
  const volumeScore = Math.min(30, Math.round((Math.log10(Math.max(1, reportCount)) / Math.log10(500)) * 30));

  // 2. Contributor Diversity (max 20)
  // Ratio of unique contributors to total reports
  const ratio = reportCount > 0 ? uniqueContributors / reportCount : 1;
  const diversityScore = Math.min(20, Math.round(ratio * 20));

  // 3. Growth Rate (max 20)
  // 0% to 50%+ monthly growth
  const growthScore = Math.min(20, Math.max(0, Math.round((Math.max(0, growthRate) / 50) * 20)));

  // 4. Geographic Spread (max 10)
  // 1 location = 3, 3 locations = 6, 5+ locations = 10
  const geographicScore = Math.min(10, Math.round((Math.min(locationCount, 5) / 5) * 10));

  // 5. Frequency (max 10)
  let frequencyScore = 4;
  if (frequency === 'Daily') frequencyScore = 10;
  else if (frequency === 'Several times a week') frequencyScore = 8;
  else if (frequency === 'Weekly') frequencyScore = 6;
  else if (frequency === 'Monthly') frequencyScore = 4;
  else frequencyScore = 2;

  // 6. Severity (max 10)
  let severityScore = 5;
  if (severity === 'Critical') severityScore = 10;
  else if (severity === 'High') severityScore = 8;
  else if (severity === 'Moderate') severityScore = 5;
  else severityScore = 2;

  const totalScore = Math.min(100, Math.max(1, volumeScore + diversityScore + growthScore + geographicScore + frequencyScore + severityScore));

  let label: SignalBreakdown['label'] = 'Moderate Signal';
  if (totalScore >= 85) label = 'High Intensity Signal';
  else if (totalScore >= 70) label = 'Strong Signal';
  else if (totalScore >= 50) label = 'Moderate Signal';
  else label = 'Emerging Signal';

  return {
    score: totalScore,
    label,
    factors: {
      volumeScore,
      diversityScore,
      growthScore,
      geographicScore,
      frequencyScore,
      severityScore,
    },
    explanation: 'This score indicates a strong pattern in the collected data. It is not a guarantee of business success.',
    disclaimer: 'Opportunity signals are based on collected real-world data and do not guarantee business or commercial success.',
  };
}
