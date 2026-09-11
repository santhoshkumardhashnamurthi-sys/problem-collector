import { AIProvider, AIAnalysisResult } from './provider';
import { HeuristicAIProvider } from './heuristic';

export class OpenAIAIProvider implements AIProvider {
  private apiKey: string | undefined;
  private fallback: HeuristicAIProvider;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.fallback = new HeuristicAIProvider();
  }

  async analyzeProblem(
    description: string,
    userCategory?: string,
    userGroup?: string,
    userFreq?: string
  ): Promise<AIAnalysisResult> {
    if (!this.apiKey) {
      return this.fallback.analyzeProblem(description, userCategory, userGroup, userFreq);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an AI research assistant for ARTIX (a problem collection and intelligence platform).
Analyze the user problem. Do NOT offer solutions or repair steps.
Format your response as a valid JSON object with keys:
- normalized_problem: concise objective statement of the friction point (max 15 words)
- category: one of [Education, Technology, Business, Healthcare, Finance, Transport, Daily Life, Food, Environment, Government, Other]
- subcategory: specific thematic area
- keywords: array of 4-6 lowercase keywords
- affected_group: group facing this
- detected_frequency: Daily, Several times a week, Weekly, Monthly, Occasionally, Rarely
- detected_severity: Low, Moderate, High, or Critical
- confidence: number between 0.0 and 1.0`,
            },
            {
              role: 'user',
              content: `User Input: "${description}"\nUser Selected Category: "${userCategory || 'None'}"\nUser Selected Group: "${userGroup || 'None'}"\nUser Frequency: "${userFreq || 'None'}"`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        console.warn('OpenAI API returned non-200, falling back to heuristic provider');
        return this.fallback.analyzeProblem(description, userCategory, userGroup, userFreq);
      }

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);

      return {
        normalized_problem: parsed.normalized_problem || description,
        category: parsed.category || userCategory || 'Other',
        subcategory: parsed.subcategory || 'General Friction',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        affected_group: parsed.affected_group || userGroup || 'Everyone',
        detected_frequency: parsed.detected_frequency || userFreq || 'Daily',
        detected_severity: parsed.detected_severity || 'Moderate',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.92,
      };
    } catch (err) {
      console.error('Error invoking OpenAI provider, using heuristic fallback:', err);
      return this.fallback.analyzeProblem(description, userCategory, userGroup, userFreq);
    }
  }

  async detectSimilarity(text1: string, text2: string): Promise<number> {
    return this.fallback.detectSimilarity(text1, text2);
  }

  async classifyCategory(text: string): Promise<string> {
    const res = await this.analyzeProblem(text);
    return res.category;
  }
}

// Global default provider singleton
export const aiProvider = new OpenAIAIProvider();
