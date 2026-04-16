// ─────────────────────────────────────────────────────────────
// topic_id 추론 — 키워드 매칭 기반
// concept_extractions 저장 시 topic_id 자동 보정용.
// ─────────────────────────────────────────────────────────────

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'F1-M1': ['relevance', 'materiality', 'faithful representation', 'comprehensive income', 'qualitative'],
  'F1-M2': ['eps', 'diluted eps', 'segment reporting', 'treasury stock method', 'reportable segment'],
  'F1-M3': ['stockholders equity', 'apic', 'stock dividend', 'treasury stock', 'par value'],
  'F2-M1': ['revenue recognition', 'asc 606', 'performance obligation', 'five-step', 'transaction price'],
  'F2-M2': ['accounting change', 'error correction', 'retrospective', 'aoci', 'reclassification'],
  'F3-M1': ['cash equivalent', 'bank overdraft', 'restricted cash'],
  'F3-M2': ['allowance', 'bad debt', 'nrv', 'factoring', 'receivable', 'write-off'],
  'F3-M3': ['fifo', 'lifo', 'inventory', 'lcnrv', 'weighted average', 'lifo reserve'],
  'F3-M5': ['depreciation', 'ddb', 'syd', 'straight-line', 'pp&e', 'salvage value', 'useful life'],
  'F3-M6': ['goodwill', 'intangible', 'r&d', 'amortization', 'software capitalization'],
  'F4-M2': ['contingency', 'probable', 'estimable', 'gain contingency', 'loss contingency'],
  'F4-M4': ['bond', 'discount', 'premium', 'effective interest', 'carrying value', 'extinguishment'],
  'F4-M7': ['lease', 'asc 842', 'rou', 'finance lease', 'operating lease', 'lessee'],
  'F5-M1': ['investment', 'equity method', 'afs', 'htm', 'trading securities', 'fvtoci'],
  'F5-M3': ['business combination', 'consolidation', 'nci', 'acquisition method', 'bargain purchase'],
  'F5-M5': ['cash flow', 'indirect method', 'operating activities', 'investing activities', 'financing activities'],
  'F5-M6': ['deferred tax', 'dta', 'dtl', 'temporary difference', 'valuation allowance', 'tax basis'],
  'F6-M1': ['not-for-profit', 'nfp', 'donor restriction', 'endowment', 'net assets', 'contributed services'],
  'F6-M5': ['governmental', 'modified accrual', 'fund accounting', 'encumbrance', 'graspp', 'general fund'],
};

/**
 * concepts + topicTags + ascRefs 기반으로 가장 적합한 topic_id 추론.
 *
 * @returns corrected=true 면 givenTopicId와 다른 topicId로 보정됨.
 *          최소 2개 키워드 매칭 + 기존 대비 2점 이상 차이 시에만 보정 (보수적).
 */
export function inferTopicId(
  concepts: string[],
  topicTags: string[],
  ascRefs: string[],
  givenTopicId: string | null,
): { topicId: string | null; corrected: boolean } {
  // 모든 입력을 하나의 소문자 blob으로 합침
  const blob = [...concepts, ...topicTags, ...ascRefs]
    .join(' ')
    .toLowerCase();

  if (!blob.trim()) {
    return { topicId: givenTopicId, corrected: false };
  }

  let bestId: string | null = null;
  let bestScore = 0;
  let givenScore = 0;

  for (const [topicId, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (blob.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = topicId;
    }
    if (topicId === givenTopicId) {
      givenScore = score;
    }
  }

  // 보수적 보정: 최소 2개 매칭 + 기존 대비 2점 이상 차이
  if (
    bestId &&
    bestScore >= 2 &&
    bestId !== givenTopicId &&
    bestScore >= givenScore + 2
  ) {
    return { topicId: bestId, corrected: true };
  }

  return { topicId: givenTopicId, corrected: false };
}
