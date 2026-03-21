
import { GoogleGenAI, Type } from "@google/genai";

const getCurrentUser = () => {
  try {
    const saved = sessionStorage.getItem('sil_current_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error("Error parsing user data from sessionStorage:", e);
    return null;
  }
};

export const getGeminiKey = () => {
  const user = getCurrentUser();
  const key = user?.apiKeys?.gemini;
  return (key && key.trim()) ? key.trim() : null;
};

export const getOpenAIKey = () => {
  const user = getCurrentUser();
  const key = user?.apiKeys?.openai;
  return (key && key.trim()) ? key.trim() : null;
};

const getAI = () => {
  const key = getGeminiKey();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

// Helper to ensure at least one AI is available
const checkAIAvailability = () => {
  if (!getGeminiKey() && !getOpenAIKey()) {
    throw new Error("AUTH_REQUIRED: [설정] 메뉴에서 Gemini 또는 OpenAI API 키를 입력해주세요.");
  }
};

// Existing Marketing functions...
// Helper to safely parse JSON from AI responses
const safeJsonParse = (text: string | null | undefined) => {
  if (!text) return {};
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Original text:", text);
    // Try to extract JSON if it's embedded in text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        return {};
      }
    }
    return {};
  }
};

// Helper to call OpenAI with fetch (more robust in browser environments)
const callOpenAI = async (params: any, timeoutMs: number = 60000) => {
  const apiKey = getOpenAIKey();
  if (!apiKey) throw new Error("OpenAI API key is missing");

  console.log(`Calling OpenAI (fetch) with model: ${params.model}...`);
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(params),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("OpenAI response received successfully.");
    return data;
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error("OpenAI request timed out");
    }
    console.error("callOpenAI Error:", error);
    throw error;
  }
};

// Helper to call Gemini with timeout and retry logic
const callGemini = async (ai: any, modelName: string, params: any, timeoutMs: number = 60000, maxRetries: number = 3) => {
  console.log(`Calling Gemini with model: ${modelName}...`);
  
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retry attempt ${attempt} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Gemini request timed out")), timeoutMs)
      );
      
      const response = await Promise.race([
        ai.models.generateContent({ model: modelName, ...params }),
        timeout
      ]);
      
      console.log("Gemini response received successfully.");
      return response as any;
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || "";
      
      // Only retry on rate limit or transient errors
      if (errorMessage.includes("429") || errorMessage.includes("Rate exceeded") || errorMessage.includes("Quota exceeded")) {
        console.warn(`Rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}).`);
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw lastError;
};

export const optimizeMarketingTopic = async (userTopic: string) => {
  checkAIAvailability();
  const openaiKey = getOpenAIKey();
  
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 2026년 현재의 트렌드를 꿰뚫고 있는 20년 경력의 SEO 전문가이자 마케팅 컨설턴트입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: `사용자가 입력한 초기 주제: "${userTopic}". 
          현재 시점은 2026년입니다. 2026년의 최신 검색 트렌드와 사용자 의도(Search Intent)를 분석하여, 
          클릭률(CTR)과 체류 시간을 극대화할 수 있는 5가지 최적화 주제를 추천하세요.
          '2026년'이라는 단어를 직접적으로 너무 자주 언급하기보다는, 현재가 2026년임을 전제로 한 최신 트렌드를 자연스럽게 반영해주세요.
          
          [분석 가이드라인]
          1. **검색 의도 분석**: 정보성, 상업성, 탐색성 의도를 구분하여 제안하세요.
          2. **롱테일 키워드 전략**: 경쟁은 낮고 전환율은 높은 구체적인 주제를 포함하세요.
          3. **타겟 세분화**: 연령, 성별, 관심사뿐만 아니라 '고민 지점(Pain Point)'을 명시하세요.
          
          결과는 반드시 {"topics": [{"optimizedTopic": "...", "targetAudience": "...", "reason": "..."}]} 형식의 JSON 객체여야 합니다.` }
        ],
        response_format: { type: "json_object" }
      });
      const parsed = safeJsonParse(data.choices[0].message.content);
      
      let topics = [];
      if (Array.isArray(parsed)) topics = parsed;
      else if (parsed.topics && Array.isArray(parsed.topics)) topics = parsed.topics;
      else if (parsed.data && Array.isArray(parsed.data.topics)) topics = parsed.data.topics;
      else topics = Object.values(parsed).find(v => Array.isArray(v)) || [];
      
      return topics.map((t: any) => ({
        optimizedTopic: t.optimizedTopic || "분석된 주제",
        targetAudience: t.targetAudience || "전체 타겟",
        reason: t.reason || "SEO 최적화 권장"
      }));
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing and OpenAI failed.");

  const response = await callGemini(ai, 'gemini-3-flash-preview', {
    contents: `사용자가 입력한 초기 주제: "${userTopic}". 
    현재 시점은 2026년입니다. 당신은 2026년의 트렌드를 완벽히 파악하고 있는 20년 경력의 SEO 전문가이자 마케팅 컨설턴트입니다. 
    네이버, 구글, 유튜브의 2026년 최신 검색 트렌드와 사용자 의도(Search Intent)를 분석하여, 
    클릭률(CTR)과 체류 시간을 극대화할 수 있는 5가지 최적화 주제를 추천하세요.
    '2026년'이라는 단어의 직접적인 반복은 피하되, 최신성을 충분히 반영한 자연스러운 서술을 사용하세요.
    
    [분석 가이드라인]
    1. **검색 의도 분석**: 정보성, 상업성, 탐색성 의도를 구분하여 제안하세요.
    2. **롱테일 키워드 전략**: 경쟁은 낮고 전환율은 높은 구체적인 주제를 포함하세요.
    3. **타겟 세분화**: 연령, 성별, 관심사뿐만 아니라 '고민 지점(Pain Point)'을 명시하세요.
    
    결과는 반드시 JSON 형식이어야 합니다.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            optimizedTopic: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["optimizedTopic", "targetAudience", "reason"]
        }
      }
    }
  });
  const result = safeJsonParse(response.text);
  return Array.isArray(result) ? result : [];
};

export const generateGoldenKeywords = async (topic: string, target: string) => {
  checkAIAvailability();
  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 2026년 현재의 시장 상황을 완벽히 이해하고 있는 천재 블로거이자 키워드 분석 전문가입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: `주제: "${topic}", 타겟: "${target}". 
          현재 시점은 2026년입니다. 당신은 2026년의 데이터 기반 키워드 분석 전문가입니다. 
          2026년 현재 검색량은 많지만 경쟁은 적은 '황금 키워드' 20개를 추출하세요.
          
          [키워드 선정 기준]
          1. **LSI 키워드**: 2026년의 언어 사용 트렌드와 주제와 연관된 의미적 키워드를 포함하여 SEO 점수를 높이세요.
          2. **구매 여정 단계**: 인지, 고려, 결정 단계별 키워드를 고르게 배치하세요.
          3. **데이터 추정**: 2026년 기준 검색량(Volume), 경쟁 정도(Competition), 수익성(Profitability)을 상/중/하로 평가하세요.
          
          결과는 반드시 다음 구조의 JSON 객체여야 합니다:
          {
            "keywords": [
              { "keyword": "...", "category": "...", "intent": "...", "competition": "하/중/상", "volume": "상/중/하", "profitability": "상/중/하", "naverPop": "상/중/하" }
            ],
            "top5Recommendations": [
              { "keyword": "...", "reason": "..." }
            ]
          }` }
        ],
        response_format: { type: "json_object" }
      });
      const result = safeJsonParse(data.choices[0].message.content);
      
      // Normalization
      const normalized = result.keywords ? result : (result.data || result || {});
      if (!normalized.keywords) normalized.keywords = [];
      if (!normalized.top5Recommendations) normalized.top5Recommendations = [];
      return normalized;
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing and OpenAI failed.");

  const response = await callGemini(ai, 'gemini-3-flash-preview', {
    contents: `현재 시점은 2026년입니다. 당신은 2026년의 데이터 기반 키워드 분석 전문가입니다. 주제: "${topic}", 타겟: "${target}". 
    2026년 현재 검색량은 많지만 경쟁은 적은 '황금 키워드' 20개를 추출하고 메타데이터를 포함하세요. 
    2026년의 LSI 키워드와 구매 여정 단계를 고려하세요.
    결과는 JSON 형식이어야 합니다.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywords: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keyword: { type: Type.STRING }, category: { type: Type.STRING }, intent: { type: Type.STRING }, competition: { type: Type.STRING }, volume: { type: Type.STRING }, profitability: { type: Type.STRING }, naverPop: { type: Type.STRING } } } },
          top5Recommendations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keyword: { type: Type.STRING }, reason: { type: Type.STRING } } } }
        }
      }
    }
  });
  const result = safeJsonParse(response.text);
  if (!result.keywords) result.keywords = [];
  if (!result.top5Recommendations) result.top5Recommendations = [];
  return result;
};

export const generateGoldenTitles = async (keywords: string[]) => {
  checkAIAvailability();
  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 2026년의 트렌드를 반영한 SEO 제목 최적화 전문가입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: `현재 시점은 2026년입니다. 키워드: [${keywords.join(", ")}]. 2026년의 최신 감각을 반영한 SEO 최적화 황금 제목 5개를 생성하세요. 결과는 반드시 {"titles": ["제목1", "제목2", ...]} 형식의 JSON 객체여야 합니다.` }
        ],
        response_format: { type: "json_object" }
      });
      const parsed = safeJsonParse(data.choices[0].message.content);
      let titles = [];
      if (Array.isArray(parsed)) titles = parsed;
      else if (parsed.titles && Array.isArray(parsed.titles)) titles = parsed.titles;
      else if (parsed.data && Array.isArray(parsed.data.titles)) titles = parsed.data.titles;
      else titles = Object.values(parsed).find(v => Array.isArray(v)) || [];
      
      return titles.length > 0 ? titles : ["최적화된 블로그 제목입니다."];
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing and OpenAI failed.");

  const response = await callGemini(ai, 'gemini-3-flash-preview', {
    contents: `현재 시점은 2026년입니다. 키워드: [${keywords.join(", ")}]. 2026년의 최신 트렌드를 반영한 SEO 최적화 황금 제목 5개를 생성하세요.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  const result = safeJsonParse(response.text);
  return Array.isArray(result) ? result : [];
};

export const generateBlogPost = async (title: string, keywords: string[], style: string, target: string) => {
  checkAIAvailability();
  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 2026년 현재 가장 영향력 있는 천재 블로거이자 보험 마케팅 전문가입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: `현재 시점은 2026년입니다.
          제목: "${title}"
          사용 키워드: [${keywords.join(", ")}]
          말투 스타일: "${style}"
          타겟 독자: "${target}"
          
          [SEO 및 품질 최적화 규칙]
          1. **전문성 및 신뢰성(E-E-A-T)**: 2026년 현재 해당 분야의 20년 경력 전문가가 작성한 것처럼 깊이 있는 통찰력과 구체적인 사례를 포함하세요.
          2. **최신성 유지**: 2026년의 최신 트렌드와 정보를 반영하되, '2026년'이라는 단어의 직접적인 반복은 피하고 자연스럽게 현재가 2026년임을 알 수 있도록 서술하세요.
          3. **SEO 구조**: 
             - 서론: 독자의 문제점을 공감하고 해결책을 제시하는 강력한 훅(Hook)으로 시작하세요.
             - 본론: 정보성 가치가 높은 내용을 3개 이상의 소제목(##)으로 나누어 상세히 설명하세요.
             - 결론: 핵심 내용을 요약하고 독자의 행동을 유도하는 강력한 CTA(Call to Action)를 포함하세요.
          4. **키워드 배치**: 선택된 키워드들을 서론, 소제목, 본문 내용에 자연스럽게 녹여내어 검색 엔진 최적화를 극대화하세요.
          5. **가독성 최적화**: 
             - 중요한 키워드나 문구는 **강조** 기호를 사용하여 강조하세요.
             - 한 문장은 짧고 명확하게 작성하세요.
             - 복잡한 정보는 불렛 포인트나 번호 매기기를 활용하여 시각적으로 정리하세요.
             - 한 문단은 3줄을 넘지 않도록 구성하세요.
          6. **해시태그**: 2026년의 검색 트렌드를 반영한 최적의 해시태그를 반드시 20개 이상 생성하세요.
          7. **이미지 전략**: [IMAGE_PLACEHOLDER_1], [IMAGE_PLACEHOLDER_2], [IMAGE_PLACEHOLDER_3]를 서론 하단, 본론 중간, 결론 상단에 배치하세요.
          8. **이미지 프롬프트(imagePrompts)**: 2026년의 감각에 맞는 고품질 이미지 묘사를 영문으로 작성하세요. 
             - "High-end professional photography", "Cinematic lighting", "Minimalist aesthetic" 등의 표현을 활용하세요.
          
          결과는 반드시 {"finalTitle": "...", "metaDescription": "...", "content": "...", "hashtags": [...], "imagePrompts": [...]} 형식의 JSON 객체여야 합니다.` }
        ],
        response_format: { type: "json_object" }
      }, 60000); // 60s timeout for long blog posts
      const result = safeJsonParse(data.choices[0].message.content);
      const normalized = result.content ? result : (result.data || result || {});
      
      return {
        finalTitle: normalized.finalTitle || title,
        content: normalized.content || "본문 생성에 실패했습니다.",
        hashtags: Array.isArray(normalized.hashtags) ? normalized.hashtags : [],
        imagePrompts: Array.isArray(normalized.imagePrompts) ? normalized.imagePrompts : ["insurance office", "happy family", "financial security"]
      };
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing and OpenAI failed.");

  const response = await callGemini(ai, 'gemini-3-flash-preview', {
    contents: `현재 시점은 2026년입니다.
    제목: "${title}"
    사용 키워드: [${keywords.join(", ")}]
    말투 스타일: "${style}"
    타겟 독자: "${target}"
    
    [SEO 및 품질 최적화 규칙]
    1. **전문성 및 신뢰성(E-E-A-T)**: 2026년 현재의 전문가가 작성한 것처럼 깊이 있는 통찰력을 포함하세요.
    2. **최신성**: 2026년의 최신 트렌드를 반영하되, '2026년' 단어의 과도한 반복은 피하고 자연스럽게 서술하세요.
    3. **SEO 구조**: 서론(훅), 본론(3개 이상의 소제목), 결론(CTA) 구조를 엄격히 지키세요.
    4. **키워드 배치**: 키워드들을 자연스럽게 문맥에 녹여내세요.
    5. **가독성**: 중요한 문구는 **강조** 기호를 사용하고, 문장은 짧게, 문단은 3줄 이내로, 불렛 포인트를 적극 활용하세요.
    6. **해시태그**: 2026년 트렌드에 맞는 해시태그를 반드시 20개 이상 생성하세요.
    7. **이미지 전략**: [IMAGE_PLACEHOLDER_1, 2, 3]을 적절한 위치에 배치하세요.
    8. **이미지 프롬프트**: 2026년 감각의 "High-end professional photography", "Modern Korean lifestyle" 스타일 영문 프롬프트를 생성하세요.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          finalTitle: { type: Type.STRING },
          metaDescription: { type: Type.STRING, description: "SEO meta description for the post" },
          content: { type: Type.STRING },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          imagePrompts: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["finalTitle", "metaDescription", "content", "hashtags", "imagePrompts"]
      }
    }
  });
  const result = safeJsonParse(response.text);
  return {
    finalTitle: result.finalTitle || title,
    content: result.content || "본문 생성에 실패했습니다.",
    hashtags: Array.isArray(result.hashtags) ? result.hashtags : [],
    imagePrompts: Array.isArray(result.imagePrompts) ? result.imagePrompts : ["insurance office", "happy family", "financial security"]
  };
};

export const generateBlogImage = async (prompt: string) => {
  checkAIAvailability();
  
  // Enhance prompt with high-end photography and Korean context
  const enhancedPrompt = `${prompt}, high-end professional photography, cinematic lighting, studio quality, highly detailed, 8k resolution, minimalist aesthetic. If people are featured, they must be modern Korean people with natural expressions.`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json"
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI Image error: ${response.status}`);
      }
      
      const data = await response.json();
      return `data:image/png;base64,${data.data[0].b64_json}`;
    } catch (error) {
      console.error("OpenAI Image Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) return null;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: enhancedPrompt }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`; }
  return null;
};

export const rewriteBlogPostForFCPA = async (post: any) => {
  checkAIAvailability();
  const prompt = `
    당신은 보험 광고 심의 및 금융소비자보호법(금소법) 전문가입니다. 
    다음 블로그 포스팅 내용을 금소법 가이드라인에 맞게 수정하여 재작성해주세요.

    [금소법 준수 가이드라인]
    1. '최고', '보장', '확정', '무조건', '단 한 번' 등 과장되거나 오해를 불러일으킬 수 있는 단어를 순화하거나 삭제하세요.
    2. 보험 상품의 장점뿐만 아니라 주의사항이나 위험성도 균형 있게 언급하세요.
    3. "보험계약 체결 전 상품설명서 및 약관을 반드시 읽어보시기 바랍니다"와 같은 필수 안내 문구를 적절한 위치에 삽입하세요.
    4. "이 포스팅은 금융소비자보호법 및 관련 법령을 준수하여 작성되었습니다"라는 문구를 마지막에 추가하세요.
    5. 기존의 마크다운 구조(##, ###, [IMAGE_PLACEHOLDER_n])는 그대로 유지하세요.
    6. 가독성을 위해 문장을 짧게 유지하고 줄바꿈을 자주 하세요.

    [원본 데이터]
    제목: ${post.finalTitle}
    메타 설명: ${post.metaDescription || ''}
    본문: ${post.content}

    결과는 반드시 {"finalTitle": "수정된 제목", "metaDescription": "수정된 메타 설명", "content": "수정된 본문"} 형식의 JSON 객체여야 합니다.
  `;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 금소법 전문가입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      const result = safeJsonParse(data.choices[0].message.content);
      return {
        finalTitle: result.finalTitle || post.finalTitle,
        metaDescription: result.metaDescription || post.metaDescription,
        content: result.content || post.content,
        hashtags: post.hashtags,
        imagePrompts: post.imagePrompts
      };
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing and OpenAI failed.");

  const response = await callGemini(ai, 'gemini-3-flash-preview', {
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          finalTitle: { type: Type.STRING },
          metaDescription: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["finalTitle", "metaDescription", "content"]
      }
    }
  });
  
  const result = safeJsonParse(response.text);
  return {
    finalTitle: result.finalTitle || post.finalTitle,
    metaDescription: result.metaDescription || post.metaDescription,
    content: result.content || post.content,
    hashtags: post.hashtags,
    imagePrompts: post.imagePrompts
  };
};

// --- NEW ENHANCED INSURANCE DESIGN SERVICE ---

export const designInsurancePlan = async (customerInput: string) => {
  console.log("Insurance Design: Starting analysis process...");
  try {
    checkAIAvailability();
  } catch (e: any) {
    console.error("Insurance Design: Availability check failed:", e);
    throw e;
  }

  const systemInstruction = `
    당신은 세계 최고의 경력과 전문성을 가진 베테랑 보험 컨설턴트이자 리스크 매니저입니다.
    고객의 상황을 정밀 분석하여 최적의 보장 포트폴리오(A/B/C안)를 제시하세요.
 
    [개인정보 보호 및 안전 규칙]
    - 주민등록번호 등 과도한 식별정보는 무시하거나 삭제 권고하세요.
    - 단정적 표현 대신 "가정(Assumptions)"을 명시하세요.
    - 불법적인 요청은 즉시 거절하세요.
 
    [워크플로우]
    1. 데이터 유효성 점검 및 부족 시 합리적 가정 설정.
    2. 고객 프로필 요약(생애주기, 소득, 위험도 등).
    3. GAP 분석(기존 vs 필요 보장) 및 Top 5 리스크 선정.
    4. 3가지 설계안 제시: 
       - A안(보수형): 최소필수+비용효율
       - B안(균형형): 표준 추천안
       - C안(강화형): 보장범위 및 한도 극대화
    5. 설명 책임: 추천 논리 및 요약.
 
    [출력 형식]
    반드시 다음 구조의 JSON 텍스트만 출력하세요. 다른 설명은 일절 배제하세요.
    마크다운 리포트는 "report_markdown" 필드에 상세히 작성하세요.
    중요: "report_markdown" 내부에 <h1>, <p> 등 HTML 태그를 절대 사용하지 마세요. 순수 마크다운(##, ###, **, - 등)만 사용하세요.
    {
      "profile_summary": { "life_cycle": "...", "risk_appetite": "...", "priority_goal": "..." },
      "risk_priority_top5": ["...", "...", "...", "...", "..."],
      "plans": {
        "A_conservative": { "monthly_premium": "...", "key_coverages": ["...", "..."], "reason": "..." },
        "B_balanced": { "monthly_premium": "...", "key_coverages": ["...", "..."], "reason": "..." },
        "C_enhanced": { "monthly_premium": "...", "key_coverages": ["...", "..."], "reason": "..." }
      },
      "report_markdown": "...",
      "action_items": ["...", "..."]
    }
  `;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      console.log("Insurance Design: Attempting with OpenAI (gpt-4o-mini)...");
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction + " 반드시 유효한 JSON 형식으로만 응답하세요." },
          { role: "user", content: `고객 데이터: "${customerInput}"` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      }, 60000); 
      
      const content = data.choices[0].message.content;
      console.log("Insurance Design: OpenAI response received. Length:", content?.length);
      
      if (!content) throw new Error("OpenAI returned empty content");
      
      const result = safeJsonParse(content);
      const normalized = normalizeInsuranceResult(result);
      console.log("Insurance Design: Analysis complete (OpenAI).");
      return normalized;
    } catch (error) {
      console.error("Insurance Design: OpenAI Error:", error);
      if (!getGeminiKey()) {
        console.error("Insurance Design: No Gemini fallback available. Rethrowing.");
        throw error;
      }
      console.log("Insurance Design: Falling back to Gemini...");
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing and OpenAI failed.");

  try {
    console.log("Insurance Design: Attempting with Gemini (gemini-3.1-pro-preview)...");
    const response = await callGemini(ai, 'gemini-3.1-pro-preview', {
      contents: `고객 데이터: "${customerInput}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            profile_summary: {
              type: Type.OBJECT,
              properties: {
                life_cycle: { type: Type.STRING },
                risk_appetite: { type: Type.STRING },
                priority_goal: { type: Type.STRING }
              }
            },
            risk_priority_top5: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            plans: {
              type: Type.OBJECT,
              properties: {
                A_conservative: {
                  type: Type.OBJECT,
                  properties: {
                    monthly_premium: { type: Type.STRING },
                    key_coverages: { type: Type.ARRAY, items: { type: Type.STRING } },
                    reason: { type: Type.STRING }
                  }
                },
                B_balanced: {
                  type: Type.OBJECT,
                  properties: {
                    monthly_premium: { type: Type.STRING },
                    key_coverages: { type: Type.ARRAY, items: { type: Type.STRING } },
                    reason: { type: Type.STRING }
                  }
                },
                C_enhanced: {
                  type: Type.OBJECT,
                  properties: {
                    monthly_premium: { type: Type.STRING },
                    key_coverages: { type: Type.ARRAY, items: { type: Type.STRING } },
                    reason: { type: Type.STRING }
                  }
                }
              }
            },
            report_markdown: { type: Type.STRING },
            action_items: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["profile_summary", "risk_priority_top5", "plans", "report_markdown"]
        }
      }
    });

    const result = safeJsonParse(response.text);
    const normalized = normalizeInsuranceResult(result);
    console.log("Insurance Design: Analysis complete (Gemini).");
    return normalized;
  } catch (error) {
    console.error("Insurance Design: Gemini Error:", error);
    throw error;
  }
};

// Extracted normalization logic for reuse and clarity
const normalizeInsuranceResult = (result: any) => {
  const normalized = result.plans ? result : (result.data || result || {});
  
  if (!normalized.profile_summary) normalized.profile_summary = {};
  normalized.profile_summary.life_cycle = normalized.profile_summary.life_cycle || "분석 불가";
  normalized.profile_summary.risk_appetite = normalized.profile_summary.risk_appetite || "분석 불가";
  normalized.profile_summary.priority_goal = normalized.profile_summary.priority_goal || "분석 불가";
  
  if (!Array.isArray(normalized.risk_priority_top5)) normalized.risk_priority_top5 = ["분석 중", "분석 중", "분석 중", "분석 중", "분석 중"];
  
  if (!normalized.plans) normalized.plans = {};
  const planKeys = ['A_conservative', 'B_balanced', 'C_enhanced'];
  planKeys.forEach(key => {
    if (!normalized.plans[key]) normalized.plans[key] = {};
    normalized.plans[key].monthly_premium = normalized.plans[key].monthly_premium || "0";
    if (!Array.isArray(normalized.plans[key].key_coverages)) normalized.plans[key].key_coverages = ["보장 분석 불가"];
    normalized.plans[key].reason = normalized.plans[key].reason || "설계 데이터 부족";
  });
  
  if (!normalized.report_markdown) normalized.report_markdown = "리포트를 생성할 수 없습니다. 입력 정보를 확인해주세요.";
  if (!Array.isArray(normalized.action_items)) normalized.action_items = ["추가 정보 입력 권장"];
  
  return normalized;
};

export const generateSNSContent = async (platform: string, topic: string) => {
  checkAIAvailability();
  const prompt = `${platform} 플랫폼에 올릴 ${topic} 관련 홍보 콘텐츠를 작성해줘. 사람들의 관심을 끌 수 있는 매력적인 문구와 해시태그를 포함해줘.`;
  
  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      });
      return data.choices[0].message.content || "";
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing and OpenAI failed.");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text || "";
};

export const generateLandingPageContent = async (industry: string, requirements: string) => {
  checkAIAvailability();
  const prompt = `${industry} 업종을 위한 고전환 가망고객 수집용 랜딩페이지 콘텐츠를 생성해줘. 
  특히 사용자의 다음 요구사항을 반드시 반영해서 작성해줘: "${requirements}"
  
  다음 항목을 포함한 JSON 형식으로 응답해줘:
  {
    "headline": "강력한 헤드라인",
    "subheadline": "설득력 있는 서브 헤드라인",
    "benefits": ["혜택1", "혜택2", "혜택3"],
    "cta": "버튼 문구",
    "trustPoints": ["신뢰 포인트1", "신뢰 포인트2"]
  }`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 랜딩페이지 전문가입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: prompt + " 결과는 반드시 JSON 객체 형식이어야 합니다." }
        ],
        response_format: { type: "json_object" }
      });
      const result = safeJsonParse(data.choices[0].message.content);
      const normalized = result.headline ? result : (result.data || result || {});
      
      return {
        headline: normalized.headline || "환영합니다",
        subheadline: normalized.subheadline || "최고의 서비스를 경험하세요",
        benefits: Array.isArray(normalized.benefits) ? normalized.benefits : [],
        cta: normalized.cta || "지금 시작하기",
        trustPoints: Array.isArray(normalized.trustPoints) ? normalized.trustPoints : []
      };
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing and OpenAI failed.");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          subheadline: { type: Type.STRING },
          benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
          cta: { type: Type.STRING },
          trustPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["headline", "subheadline", "benefits", "cta", "trustPoints"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

// Keep for backward compatibility or replace
export const analyzeInsuranceGap = designInsurancePlan;

// --- USEFUL TOOLS SERVICES ---

export const analyzeKeyword = async (keyword: string) => {
  checkAIAvailability();
  const prompt = `키워드 "${keyword}"에 대한 심층 분석을 수행하세요. 
  다음 항목을 포함한 JSON 형식으로 응답해줘:
  {
    "searchVolume": "검색량 수준 (높음/중간/낮음)",
    "competition": "경쟁 강도 (높음/중간/낮음)",
    "trend": "최근 트렌드 설명",
    "relatedKeywords": ["연관 키워드1", "연관 키워드2", "연관 키워드3", "연관 키워드4", "연관 키워드5"],
    "marketingStrategy": "이 키워드를 활용한 마케팅 전략 제안"
  }`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 키워드 분석 전문가입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      return safeJsonParse(data.choices[0].message.content);
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing.");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          searchVolume: { type: Type.STRING },
          competition: { type: Type.STRING },
          trend: { type: Type.STRING },
          relatedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          marketingStrategy: { type: Type.STRING }
        },
        required: ["searchVolume", "competition", "trend", "relatedKeywords", "marketingStrategy"]
      }
    }
  });
  return safeJsonParse(response.text);
};

export const analyzeDiseaseCode = async (code: string) => {
  checkAIAvailability();
  const prompt = `질병코드(KCD) "${code}"에 대한 상세 분석을 수행하세요. 
  다음 항목을 포함한 JSON 형식으로 응답해줘:
  {
    "diseaseName": "질병명",
    "definition": "질병의 정의",
    "symptoms": ["주요 증상1", "주요 증상2"],
    "insuranceImplication": "보험 심사 시 주요 고려사항 및 보장 관련 팁",
    "relatedCodes": ["연관 질병코드1", "연관 질병코드2"]
  }`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 질병코드 및 보험 심사 전문가입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      return safeJsonParse(data.choices[0].message.content);
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing.");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diseaseName: { type: Type.STRING },
          definition: { type: Type.STRING },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          insuranceImplication: { type: Type.STRING },
          relatedCodes: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["diseaseName", "definition", "symptoms", "insuranceImplication", "relatedCodes"]
      }
    }
  });
  return safeJsonParse(response.text);
};

export const getFinancialLawGuide = async (query: string) => {
  checkAIAvailability();
  const prompt = `금융소비자보호법(금소법) 관련 문의: "${query}". 
  보험 설계사가 반드시 지켜야 할 사항과 위반 시 불이익, 그리고 올바른 응대 가이드를 상세히 설명해줘.
  다음 항목을 포함한 JSON 형식으로 응답해줘:
  {
    "summary": "문의 내용에 대한 법적 요약",
    "keyRules": ["준수해야 할 핵심 원칙1", "준수해야 할 핵심 원칙2"],
    "prohibitedActions": ["절대 해서는 안 될 행동1", "절대 해서는 안 될 행동2"],
    "penalty": "위반 시 처벌 수준",
    "bestPractice": "권장되는 올바른 업무 처리 방식"
  }`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 금융소비자보호법 전문가입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      return safeJsonParse(data.choices[0].message.content);
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing.");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyRules: { type: Type.ARRAY, items: { type: Type.STRING } },
          prohibitedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
          penalty: { type: Type.STRING },
          bestPractice: { type: Type.STRING }
        },
        required: ["summary", "keyRules", "prohibitedActions", "penalty", "bestPractice"]
      }
    }
  });
  return safeJsonParse(response.text);
};

export const generateBusinessCardSlogan = async (name: string, title: string, intro: string) => {
  checkAIAvailability();
  const prompt = `이름: "${name}", 직함: "${title}", 자기소개: "${intro}". 이 정보를 바탕으로 신뢰감을 주는 짧고 강렬한 보험 설계사 명함용 슬로건 3개를 추천해줘. 결과는 반드시 {"slogans": ["슬로건1", "슬로건2", "슬로건3"]} 형식의 JSON 객체여야 합니다.`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 카피라이팅 전문가입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      return safeJsonParse(data.choices[0].message.content);
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing.");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          slogans: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["slogans"]
      }
    }
  });
  return safeJsonParse(response.text);
};

export const generateInsuranceAgeTip = async (age: number, birthDate: string) => {
  checkAIAvailability();
  const prompt = `보험나이: ${age}세, 생년월일: ${birthDate}. 이 고객을 위해 보험나이와 상령일의 중요성을 설명하고, 현재 나이에서 가장 주의 깊게 살펴봐야 할 보험 가입 팁 1가지를 제안해줘. 결과는 반드시 {"tip": "팁 내용"} 형식의 JSON 객체여야 합니다.`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 보험 전문가입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      return safeJsonParse(data.choices[0].message.content);
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing.");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tip: { type: Type.STRING }
        },
        required: ["tip"]
      }
    }
  });
  return safeJsonParse(response.text);
};

// --- GOLDEN KEYWORD WRITING SPECIFIC SERVICES ---

export const getGoldenCategoryRecommendations = async (category: string) => {
  checkAIAvailability();
  const prompt = `사용자가 입력한 카테고리: "${category}". 
  검색 최적화(SEO) 관점에서 블로그 수익화에 유리한 세부 카테고리 5개를 추천해주세요. 
  결과는 반드시 ["카테고리1", "카테고리2", ...] 형식의 JSON 배열이어야 합니다.`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 블로그 마케팅 전문가입니다. 반드시 JSON 배열 형식으로 응답하세요." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      const result = safeJsonParse(data.choices[0].message.content);
      return Array.isArray(result) ? result : (result.categories || []);
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing.");

  const response = await callGemini(ai, 'gemini-3-flash-preview', {
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  return safeJsonParse(response.text);
};

export const getGoldenTopicRecommendations = async (category: string, topic: string) => {
  checkAIAvailability();
  const prompt = `카테고리: "${category}", 사용자 입력 주제: "${topic}". 
  해당 카테고리 내에서 검색 유입이 높고 체류 시간이 길어질 수 있는 구체적인 블로그 주제 5개를 추천해주세요. 
  사용자가 "랜덤" 또는 "random"을 입력했다면, 현재 시점(2026년 3월) 기준 향후 1개월 내 유망한 트렌드 주제를 추천하세요.
  결과는 반드시 ["주제1", "주제2", ...] 형식의 JSON 배열이어야 합니다.`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 블로그 콘텐츠 전략가입니다. 반드시 JSON 배열 형식으로 응답하세요." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      const result = safeJsonParse(data.choices[0].message.content);
      return Array.isArray(result) ? result : (result.topics || []);
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing.");

  const response = await callGemini(ai, 'gemini-3-flash-preview', {
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  return safeJsonParse(response.text);
};

export const getGoldenPersonaRecommendations = async (category: string, topic: string) => {
  checkAIAvailability();
  const prompt = `카테고리: "${category}", 주제: "${topic}". 
  이 글을 읽을 가장 적합한 타겟 독자(페르소나) 5명을 추천해주세요. 
  예: "30대 재테크에 관심 있는 직장인", "아이 교육에 고민이 많은 초보 부모" 등.
  결과는 반드시 ["페르소나1", "페르소나2", ...] 형식의 JSON 배열이어야 합니다.`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 타겟 마케팅 전문가입니다. 반드시 JSON 배열 형식으로 응답하세요." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      const result = safeJsonParse(data.choices[0].message.content);
      return Array.isArray(result) ? result : (result.personas || []);
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing.");

  const response = await callGemini(ai, 'gemini-3-flash-preview', {
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  return safeJsonParse(response.text);
};

export const getGoldenKeywordRecommendations = async (category: string, topic: string, persona: string) => {
  checkAIAvailability();
  const prompt = `카테고리: "${category}", 주제: "${topic}", 타겟: "${persona}". 
  위 정보를 종합 분석하여 검색 노출에 유리한 황금 키워드를 추천해주세요. 
  주요 키워드, 보조 키워드, 롱테일 키워드를 포함해야 합니다.
  
  [분석 기준]
  - 주제 핵심성, 검색 의도 적합성, 경쟁 강도, 예상 검색량, 수익성, 한국 사용자 친화성 등
  
  [제외 규칙]
  - 일반적인 단일 단어, 특정 브랜드명, 비속어, 경쟁 과도 키워드 제외
  
  결과는 반드시 다음 구조의 JSON 객체여야 합니다:
  {
    "keywords": [
      {
        "keyword": "키워드",
        "category": "카테고리",
        "type": "주요/보조/롱테일",
        "intent": "정보/구매/비교 등",
        "competition": "하/중/상",
        "searchVolume": "수치",
        "seasonality": "사계절/봄/여름 등",
        "profitability": "하/중/상",
        "ageSuitability": "2030/4050 등",
        "googlePopularity": "0-100",
        "naverPopularity": "0-100",
        "daumPopularity": "0-100"
      }
    ],
    "longtailKeywords": ["롱테일1", "롱테일2", ...]
  }`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 검색 엔진 최적화(SEO) 전문가입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      const result = safeJsonParse(data.choices[0].message.content);
      return {
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        longtailKeywords: Array.isArray(result.longtailKeywords) ? result.longtailKeywords : []
      };
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing.");

  const response = await callGemini(ai, 'gemini-3-flash-preview', {
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                keyword: { type: Type.STRING },
                category: { type: Type.STRING },
                type: { type: Type.STRING },
                intent: { type: Type.STRING },
                competition: { type: Type.STRING },
                searchVolume: { type: Type.STRING },
                seasonality: { type: Type.STRING },
                profitability: { type: Type.STRING },
                ageSuitability: { type: Type.STRING },
                googlePopularity: { type: Type.STRING },
                naverPopularity: { type: Type.STRING },
                daumPopularity: { type: Type.STRING }
              }
            }
          },
          longtailKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return safeJsonParse(response.text);
};

export const getGoldenTitleRecommendations = async (keywords: string[]) => {
  checkAIAvailability();
  const prompt = `선택된 키워드: [${keywords.join(", ")}]. 
  검색 최적화(SEO)가 적용된 매력적인 블로그 제목 5개를 추천해주세요. 
  결과는 반드시 ["제목1", "제목2", ...] 형식의 JSON 배열이어야 합니다.`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 카피라이팅 전문가입니다. 반드시 JSON 배열 형식으로 응답하세요." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      const result = safeJsonParse(data.choices[0].message.content);
      return Array.isArray(result) ? result : (result.titles || []);
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing.");

  const response = await callGemini(ai, 'gemini-3-flash-preview', {
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  return safeJsonParse(response.text);
};

export const generateGoldenBlogPost = async (data: {
  category: string;
  topic: string;
  persona: string;
  keywords: string[];
  title: string;
  toneStyle: string;
}) => {
  checkAIAvailability();
  const prompt = `
  [블로그 글 생성 요청]
  카테고리: ${data.category}
  주제: ${data.topic}
  타겟: ${data.persona}
  키워드: ${data.keywords.join(", ")}
  제목: ${data.title}
  말투 스타일: ${data.toneStyle}
  
  [필수 규칙]
  1. 자연스럽고 사람처럼 읽히는 문체 (AI 느낌 제거)
  2. 분량: 1500~2000자
  3. 구조: 제목, 서론(300-400자), 본론(800-1200자), 결론(300-400자), 콜투액션, 해시태그(7-10개)
  4. 가독성: 짧고 명료한 문장, 소제목 적극 사용, 핵심 정보 상단 배치
  5. 키워드 배치: 핵심 키워드 2-3개, 보조 키워드 5-7개를 제목, 서론, 소제목, 결론에 자연스럽게 배치 (스터핑 금지)
  6. 언어: 자연스러운 한국어 (번역투 금지, 맞춤법 준수)
  7. 신뢰성: 사실 기반 정보, 불확실한 정보 단정 금지, 구체적 상업시설명 언급 금지
  8. 이미지 배치: [IMAGE_PLACEHOLDER_1] (서론), [IMAGE_PLACEHOLDER_2] (본론), [IMAGE_PLACEHOLDER_3] (결론)
  9. 이미지 프롬프트: 각 이미지 위치에 맞는 고품질 실사 이미지 묘사 (영문으로 작성, 한국인이 등장할 경우 "Korean person" 명시)
  
  결과는 반드시 다음 구조의 JSON 객체여야 합니다:
  {
    "title": "최종 제목",
    "content": "마크다운 형식의 본문 (이미지 플레이스홀더 포함)",
    "hashtags": ["태그1", "태그2", ...],
    "imagePrompts": ["프롬프트1", "프롬프트2", "프롬프트3"]
  }`;

  const openaiKey = getOpenAIKey();
  if (openaiKey) {
    try {
      const data = await callOpenAI({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "당신은 상위 1% 블로그 마케팅 전문가이자 SEO 전문가입니다. 반드시 JSON 형식으로 응답하세요." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      }, 90000);
      const result = safeJsonParse(data.choices[0].message.content);
      return {
        title: result.title || data.title,
        content: result.content || "본문 생성에 실패했습니다.",
        hashtags: Array.isArray(result.hashtags) ? result.hashtags : [],
        imagePrompts: Array.isArray(result.imagePrompts) ? result.imagePrompts : ["blogging", "writing", "creativity"]
      };
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (!getGeminiKey()) throw error;
    }
  }

  const ai = getAI();
  if (!ai) throw new Error("Gemini API key is missing.");

  const response = await callGemini(ai, 'gemini-3.1-pro-preview', {
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          imagePrompts: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  const result = safeJsonParse(response.text);
  return {
    title: result.title || data.title,
    content: result.content || "본문 생성에 실패했습니다.",
    hashtags: Array.isArray(result.hashtags) ? result.hashtags : [],
    imagePrompts: Array.isArray(result.imagePrompts) ? result.imagePrompts : ["blogging", "writing", "creativity"]
  };
};
