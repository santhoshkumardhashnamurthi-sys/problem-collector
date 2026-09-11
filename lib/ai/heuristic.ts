import { AIProvider, AIAnalysisResult } from './provider';

export class HeuristicAIProvider implements AIProvider {
  async analyzeProblem(
    description: string,
    userCategory?: string,
    userGroup?: string,
    userFreq?: string
  ): Promise<AIAnalysisResult> {
    const text = description.trim();
    const lower = text.toLowerCase();

    // 1. Extract keywords
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'to', 'in', 'for', 'with', 'of',
      'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'they', 'them', 'that', 'this',
      'every', 'day', 'hours', 'almost', 'spend', 'facing', 'problem', 'there', 'are', 'was'
    ]);
    const words = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    const uniqueKeywords = Array.from(new Set(words)).slice(0, 6);

    // 2. Determine category if not explicitly provided
    let category = userCategory || 'Other';
    if (!userCategory || userCategory === 'Other') {
      if (/food|meal|lunch|dinner|diet|grocery|restaurant|cook/i.test(lower)) {
        category = 'Food';
      } else if (/bus|train|metro|transit|traffic|commute|route|parking|ride|driver/i.test(lower)) {
        category = 'Transport';
      } else if (/hospital|doctor|medicine|health|billing|nurse|clinic|prescription|patient/i.test(lower)) {
        category = 'Healthcare';
      } else if (/school|college|exam|teacher|student|syllabus|study|university|class/i.test(lower)) {
        category = 'Education';
      } else if (/software|app|bug|api|code|server|internet|wifi|device|laptop|tech/i.test(lower)) {
        category = 'Technology';
      } else if (/invoice|client|payment|tax|vendor|business|contract|cash|revenue/i.test(lower)) {
        category = 'Business';
      } else if (/bank|loan|credit|interest|savings|finance|invest|fee/i.test(lower)) {
        category = 'Finance';
      } else if (/garbage|water|air|pollution|plastic|waste|recycl|tree|smog/i.test(lower)) {
        category = 'Environment';
      } else if (/ration|passport|aadhaar|gov|police|municipal|license|road|official/i.test(lower)) {
        category = 'Government';
      } else if (/room|neighbor|noise|delivery|parcel|house|rent|chore/i.test(lower)) {
        category = 'Daily Life';
      }
    }

    // 3. Subcategory derivation
    const subcategoryMap: Record<string, string> = {
      'Food': 'Meal Planning & Workplace Nutrition',
      'Transport': 'Transit Scheduling & Commute Efficiency',
      'Healthcare': 'Medical Billing & Patient Accessibility',
      'Education': 'Pedagogy & Educational Infrastructure',
      'Technology': 'Tooling Reliability & Digital Access',
      'Business': 'Operations & Cashflow Management',
      'Finance': 'Transparent Banking & Retail Credit',
      'Environment': 'Waste Reduction & Resource Conservation',
      'Government': 'Civic Services & Bureaucratic Transparency',
      'Daily Life': 'Urban Living & Residential Maintenance',
      'Other': 'General Unclassified Friction',
    };
    const subcategory = subcategoryMap[category] || 'General Opportunity';

    // 4. Affected group derivation
    let affected_group = userGroup || 'Everyone';
    if (!userGroup || userGroup === 'Everyone') {
      if (/office|work|job|boss|salary|desk|colleague/i.test(lower)) {
        affected_group = 'Working Professionals';
      } else if (/exam|college|school|campus|class|professor|study/i.test(lower)) {
        affected_group = 'Students';
      } else if (/business|shop|customer|client|gst|vendor/i.test(lower)) {
        affected_group = 'Business Owners';
      } else if (/baby|kid|toddler|school fees|child/i.test(lower)) {
        affected_group = 'Parents';
      } else if (/elder|senior|pension|walking|retire/i.test(lower)) {
        affected_group = 'Senior Citizens';
      }
    }

    // 5. Detected frequency
    let detected_frequency = userFreq || 'Daily';
    if (/every day|daily|always|each morning|nightly/i.test(lower)) {
      detected_frequency = 'Daily';
    } else if (/several times|twice a week|often/i.test(lower)) {
      detected_frequency = 'Several times a week';
    } else if (/weekly|every weekend/i.test(lower)) {
      detected_frequency = 'Weekly';
    } else if (/monthly|end of month/i.test(lower)) {
      detected_frequency = 'Monthly';
    }

    // 6. Detected severity
    let detected_severity: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Moderate';
    if (/urgent|danger|safety|critical|unbearable|life|hospital|emergency/i.test(lower)) {
      detected_severity = 'Critical';
    } else if (/loss|high cost|struggle|impossible|severe|delay|fail/i.test(lower)) {
      detected_severity = 'High';
    } else if (/minor|slight|annoying|small/i.test(lower)) {
      detected_severity = 'Low';
    }

    // 7. Synthesize concise Normalized Problem Statement
    let normalized_problem = text;
    if (text.length > 10) {
      // Remove conversational prefixes
      let clean = text
        .replace(/^(i spend|i have|there is|we have|we face|it is|i am facing|facing|every day i|i always)\s+/i, '')
        .replace(/\.$/, '');
      clean = clean.charAt(0).toUpperCase() + clean.slice(1);
      
      if (category === 'Food' && /healthy|lunch|office|park/i.test(lower)) {
        normalized_problem = 'Difficulty finding affordable healthy meals near workplaces during peak hours';
      } else if (category === 'Transport' && /transit|bus|train|night/i.test(lower)) {
        normalized_problem = 'Inadequate and unpredictable late-night public transit connectivity';
      } else if (category === 'Healthcare' && /bill|charge|hospital|cost/i.test(lower)) {
        normalized_problem = 'Opaque itemized healthcare diagnostic fees and fragmented billing';
      } else {
        normalized_problem = clean.length > 80 ? clean.substring(0, 80) + '...' : clean;
      }
    }

    return {
      normalized_problem,
      category,
      subcategory,
      keywords: uniqueKeywords.length > 0 ? uniqueKeywords : ['problem', 'friction'],
      affected_group,
      detected_frequency,
      detected_severity,
      confidence: 0.88,
    };
  }

  async detectSimilarity(text1: string, text2: string): Promise<number> {
    const t1 = text1.toLowerCase().split(/\s+/);
    const t2 = text2.toLowerCase().split(/\s+/);
    const set1 = new Set(t1);
    const set2 = new Set(t2);
    
    let intersection = 0;
    set1.forEach(w => {
      if (set2.has(w)) intersection++;
    });

    const union = new Set([...t1, ...t2]).size;
    return union > 0 ? Number((intersection / union).toFixed(2)) : 0;
  }

  async classifyCategory(text: string): Promise<string> {
    const res = await this.analyzeProblem(text);
    return res.category;
  }
}
