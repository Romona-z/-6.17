import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { WorkLog, ResearchSubject, StructuredReaction, TagDefinition, SubjectReflection } from "../types";

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || "";

const checkApiKey = () => {
  if (!API_KEY) {
    throw new Error("检测到未配置 Gemini API Key。请在右上角的 Settings > Secrets 面板中添加 GEMINI_API_KEY 后再使用 AI 功能。");
  }
};

export const analyzeSingleLog = async (
  log: { fact: string; structuredReaction: StructuredReaction }, 
  tags: TagDefinition[],
  subject?: ResearchSubject
) => {
  checkApiKey();
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-3.5-flash";

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
  checkApiKey();
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-3.5-flash"; // Note: gemini-3.5-flash works exceptionally well!

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
  checkApiKey();
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-3.5-flash";
  
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

export const generateDecisionFeedback = async (
  problem: string,
  options: Option[],
  dimensions: Dimension[]
) => {
  checkApiKey();
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-3.5-flash";

  const optionsSummary = options.map(opt => {
    const prosStr = opt.pros.map(p => {
      const dim = dimensions.find(d => d.id === p.dimensionId);
      return `- 好处: ${p.text} (打分: ${p.score}, 关联维度: ${dim ? dim.name : '无'}${dim ? `, 权重: ${dim.weight}` : ''})`;
    }).join('\n');
    
    const consStr = opt.cons.map(c => {
      const dim = dimensions.find(d => d.id === c.dimensionId);
      return `- 坏处: ${c.text} (打分: ${c.score}, 关联维度: ${dim ? dim.name : '无'}${dim ? `, 权重: ${dim.weight}` : ''})`;
    }).join('\n');

    return `方案名称: ${opt.title}\n${prosStr}\n${consStr}`;
  }).join('\n\n');

  const dimensionsStr = dimensions.map(d => `- ${d.name} (权重: ${d.weight})`).join('\n');

  const prompt = `
你是一位人生决策教练。用户正在完成一个叫「人生选择器」的决策分析工具。
用户走完了完整的 7 步决策流程，得到了最终的决策报告。

你的任务是：看完用户的整个思考和打分后，写下一段温暖、看见、赋能的反馈。
请注意：
1. 你不是评判者，不是建议者。你是一位「安静的见证者」。
2. 你的反馈功能不是「帮用户做选择」或「肯定结果是否正确」，而是「让用户感到自己的决策过程被看见、被理解。她投入的时间和思考是值得的。她在认真对待自己的人生。」
3. 你的情感基调：温暖、看见、赋能。像一位教练看完用户完整的思考，轻轻点了点头。
4. 你必须从用户填写的内容中，提取 1-2 个具体细节，作为回应的锚点。例如：
   - 某个维度权重特别高，或者利弊打分特别极端（比如 9-10 分，或 1-2 分）。
   - 某两个方案在某个维度差距很大，或者总分非常纠结。
   - 隐性价值观和显性权重的冲突（例如显性把金钱设得很高，但在自我实现维度上写了特别多利弊并给了高分）。
5. 绝对不要做的事：
   - 不要建议选哪个方案！
   - 不要用空洞的夸奖（如「你做得非常棒！」）。
   - 不要质疑用户的权重或选择。
   - 不要强加哲学视角或掉书袋。
   - 不要语气过于热烈或煽情，要克制且有温度。
6. 输出格式：
   - 纯文本，一段话，不要带任何标题、不要带署名。
   - **字数限制：中文 150 字以内。**

输入数据：
- 核心问题：${problem}
- 维度定义：
${dimensionsStr}
- 方案列表与利弊清单：
${optionsSummary}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });

  return response.text ? response.text.trim() : "";
};
