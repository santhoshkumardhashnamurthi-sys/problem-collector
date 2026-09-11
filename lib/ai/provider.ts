export interface AIAnalysisResult {
  normalized_problem: string;
  category: string;
  subcategory: string;
  keywords: string[];
  affected_group: string;
  detected_frequency: string;
  detected_severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  confidence: number;
}

export interface AIProvider {
  analyzeProblem(description: string, userCategory?: string, userGroup?: string, userFreq?: string): Promise<AIAnalysisResult>;
  generateEmbedding?(text: string): Promise<number[]>;
  detectSimilarity?(text1: string, text2: string): Promise<number>;
  classifyCategory?(text: string): Promise<string>;
}
