import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { WorkLog, ResearchSubject, StructuredReaction, TagDefinition, SubjectReflection } from "../types";

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || "";

export const analyzeSingleLog = async (
  log: { fact: string; structuredReaction: StructuredReaction }, 
  tags: TagDefinition[],
  subject?: ResearchSubject
) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-2.5-flash"; // Let's use gemini-2.5-flash which is standard and robust.

  const subjectContext = subject 
    ? `研究对象：${subject.alias} (角色: ${subject.role})。背景：${subject.context || '无'}`
    : "研究对象：未知";

  const r = log.structuredReaction;
  const reactionContext = `
    主观体验演化：
    1. 初始反应：
       - 情绪：${r.emotions.map(e => `${e.name}(${e.score}/10)`).join(', ')}
       - 生理/想法：${r.physicalSignals.join('/')} | ${r.immediateThoughts.join('/')}
    2. 认知催化：
       - 转折点：${r.turningPoint || '未记录'}
       - 运用策略：${r.appliedStrategies.join(', ') || '无'}
    3. 最终状态：
       - 定位：${r.finalMindsetLabel || '未命名'}
       - 自评：${r.shiftEvaluation || '无'}
       - 生存法则：${r.survivalRule || '未总结'}
  `;

  const prompt = `
  请基于以下事实和深度结构化反应进行实时日志分析。
  ${subjectContext}
  事实：${log.fact}
  ${reactionContext}

  请执行以下操作：
  1. 从提供的动态标签库中选择1-3个最相关的标签名称。
  2. 针对这种“从初始情绪到最终生存法则”的认知跨度，提出1-2个极具洞察力的追问，帮助用户巩固其“第三视角”。

  输出必须为JSON。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + `\n当前用户定义的标签库如下：\n${JSON.stringify(tags)}`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedTags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "选取的1-3个标签名称"
          },
          followUpQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "深度洞察追问"
          }
        },
        required: ["suggestedTags", "followUpQuestions"]
      }
    }
  });

  return JSON.parse(response.text.trim());
};

export const generatePeriodicAnalysis = async (
  logs: WorkLog[], 
  subjects: ResearchSubject[], 
  subjectReflections?: SubjectReflection[]
) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-2.5-pro"; // Note: gemini-2.5-pro works exceptionally well for periodic deep reasoning!

  const subjectsMap = subjects.reduce((acc, s) => ({...acc, [s.id]: s}), {} as Record<string, ResearchSubject>);

  const logsData = logs.map(l => ({
    date: l.date,
    subject: subjectsMap[l.subjectId]?.alias || '未知',
    tags: l.tags,
    fact: l.fact,
    survivalRule: l.structuredReaction.survivalRule,
    evolution: {
      from: l.structuredReaction.emotions.map(e => e.name),
      to: l.structuredReaction.finalMindsetLabel,
      strategy: l.structuredReaction.appliedStrategies
    }
  }));

  const reflectionsText = subjectReflections && subjectReflections.length > 0
    ? `\n研究工作记录员撰写的“研究员生存随笔（按观察主体合并）”：\n${subjectReflections.map(r => {
        const alias = r.subjectId === 'general_essay' ? '无对象' : (subjectsMap[r.subjectId]?.alias || '未知');
        return `- 对于研究对象/样本 [${alias}] 的连续心路历程 ✍️:\n${r.content}`;
      }).join('\n\n')}\n`
    : '';

  const prompt = `
  作为高级研究顾问，请对该研究员的“职场生存逻辑”进行模式分析。
  ${reflectionsText}
  记录集：${JSON.stringify(logsData)}

  重点分析：
  1. 标签与情绪的共现模式。
  2. 用户运用的认知策略（如#去人格化）在不同冲突场景下的有效性。
  3. 结合记录集以及研究员随笔（如果存在），总结用户正在构建的“生存法则”体系，评估是否存在认知失调、价值观偏移、过于消极防御或潜在同化的风险，并在 aiInsights 中客观且深刻地指出，提供能给研究员赋能的洞见。

  输出必须为JSON。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topTags: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tag: { type: Type.STRING },
                count: { type: Type.NUMBER }
              }
            }
          },
          correlations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tagA: { type: Type.STRING },
                tagB: { type: Type.STRING },
                count: { type: Type.NUMBER }
              }
            }
          },
          aiInsights: { type: Type.STRING },
          suggestedQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["topTags", "correlations", "aiInsights", "suggestedQuestions"]
      }
    }
  });

  return JSON.parse(response.text.trim());
};

// --- Life Selector v2 AI Suggester ---

export const getAISuggestions = async (problem: string, optionTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-2.5-flash";
  
  const response = await ai.models.generateContent({
    model,
    contents: `
      问题：${problem}
      方案：${optionTitle}
      
      请针对这个方案，提供3个潜在的好处（Pros）并说明理由，以及3个潜在的坏处（Cons）并说明理由。
      要求：简短有力，切中要害，符合生活实际。
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pros: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "利益/好处列表"
          },
          cons: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "代价/坏处列表"
          }
        },
        required: ["pros", "cons"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { pros: [], cons: [] };
  }
};
