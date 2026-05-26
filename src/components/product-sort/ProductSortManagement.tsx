import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { RefreshCw, Search, History, Menu, ChevronDown, Maximize2, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ============ Default config ============

type RecallSource = {
  name: string;
  code: string;
  enabled: boolean;
  weight: number;
  stage: "一期启用" | "二期预留" | "暂不启用";
  desc: string;
  updatedBy: string;
  updatedAt: string;
};

const DEFAULT_RECALL: RecallSource[] = [
  { name: "SPU词条召回", code: "SPU_TERM", enabled: true, weight: 100, stage: "一期启用", desc: "用户输入命中后台配置的 SPU 词条", updatedBy: "—", updatedAt: "—" },
  { name: "商品名前缀匹配兜底", code: "SPU_NAME_PREFIX", enabled: true, weight: 70, stage: "一期启用", desc: "未命中词条时，使用商品名前缀匹配兜底召回", updatedBy: "—", updatedAt: "—" },
  { name: "场景词召回", code: "SCENE_TERM", enabled: false, weight: 60, stage: "二期预留", desc: "用户输入场景词后召回一组关联 SPU", updatedBy: "—", updatedAt: "—" },
  { name: "商品属性词召回", code: "ATTRIBUTE_TERM", enabled: false, weight: 50, stage: "二期预留", desc: "用户输入 4K、Family、礼品码等属性词", updatedBy: "—", updatedAt: "—" },
];

type TermType = {
  name: string;
  code: string;
  weight: number;
  match: string;
  desc: string;
  updatedBy: string;
  updatedAt: string;
};

const DEFAULT_TERM_TYPES: TermType[] = [
  { name: "商品词", code: "PRODUCT_TERM", weight: 100, match: "精准匹配 / 前缀匹配", desc: "商品正式名称或核心商品名", updatedBy: "—", updatedAt: "—" },
  { name: "品牌词", code: "BRAND_TERM", weight: 90, match: "精准匹配 / 前缀匹配", desc: "品牌、服务名、公司名", updatedBy: "—", updatedAt: "—" },
  { name: "别名词", code: "ALIAS_TERM", weight: 85, match: "精准匹配", desc: "用户常见叫法或变体写法", updatedBy: "—", updatedAt: "—" },
  { name: "错词", code: "TYPO_TERM", weight: 75, match: "精准匹配", desc: "用户常见拼写错误", updatedBy: "—", updatedAt: "—" },
  { name: "短词", code: "SHORT_TERM", weight: 60, match: "精准匹配", desc: "用户常用简称或缩写", updatedBy: "—", updatedAt: "—" },
];

type MatchType = { name: string; code: string; weight: number; desc: string; updatedBy: string; updatedAt: string };

const DEFAULT_MATCH: MatchType[] = [
  { name: "精准匹配", code: "EXACT", weight: 100, desc: "用户输入标准化词与后台标准化词完全一致", updatedBy: "—", updatedAt: "—" },
  { name: "前缀匹配", code: "PREFIX", weight: 70, desc: "用户输入标准化词是后台标准化词的前缀", updatedBy: "—", updatedAt: "—" },
];

type ExtraFactors = {
  exactSpuBoost: number;
  hotnessUnit: number;
  hotnessCap: number;
  gamsgoBoost: number;
  multiHitEnabled: boolean;
  multiHitPer: number;
  multiHitMax: number;
};

const DEFAULT_EXTRA: ExtraFactors = {
  exactSpuBoost: 20,
  hotnessUnit: 5,
  hotnessCap: 25,
  gamsgoBoost: 30,
  multiHitEnabled: true,
  multiHitPer: 5,
  multiHitMax: 3,
};


type LogEntry = {
  time: string;
  operator: string;
  module: string;
  type: string;
  before: string;
  after: string;
  remark: string;
};

// ============ Helpers ============

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function nowStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ============ Search test mock data & simulator ============

type MockSpu = {
  id: string;
  name: string;
  source: "official" | "c2c";
  title: string;
  stock: boolean;
  spuEnabled: boolean;
  skuEnabled: boolean;
  regions: string[]; // 可售区域，"*" = 全球
  baseScore: number; // 商品排序分
  loginOnly?: boolean;
};

const MOCK_SPUS: MockSpu[] = [
  { id: "S001", name: "Netflix", source: "official", title: "Netflix Premium", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 90 },
  { id: "S002", name: "Netflix Recharge", source: "official", title: "Netflix Recharge Card", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 70 },
  { id: "S003", name: "Old Netflix Plan", source: "official", title: "Netflix Basic", stock: false, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 60 },
  { id: "S004", name: "Netflix C2C Account", source: "c2c", title: "Netflix Shared C2C", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 55 },
  { id: "S010", name: "YouTube Premium", source: "official", title: "YouTube Premium", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 88 },
  { id: "S011", name: "YouTube Music", source: "official", title: "YouTube Music", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 75 },
  { id: "S020", name: "Spotify", source: "official", title: "Spotify Premium", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 86 },
  { id: "S021", name: "Spotify Family", source: "official", title: "Spotify Family", stock: true, spuEnabled: true, skuEnabled: true, regions: ["US", "IT"], baseScore: 70 },
  { id: "S030", name: "ChatGPT Plus", source: "official", title: "ChatGPT Plus", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 92 },
  { id: "S031", name: "Gemini Advanced", source: "official", title: "Gemini Advanced", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 82 },
  { id: "S032", name: "Claude Pro", source: "official", title: "Claude Pro", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 80 },
  { id: "S040", name: "NordVPN", source: "official", title: "NordVPN Subscription", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 84 },
  { id: "S041", name: "ExpressVPN", source: "official", title: "ExpressVPN", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 78 },
  { id: "S042", name: "Surfshark VPN", source: "c2c", title: "Surfshark C2C", stock: true, spuEnabled: true, skuEnabled: true, regions: ["US"], baseScore: 60 },
  { id: "S050", name: "Disney+", source: "official", title: "Disney Plus", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 76 },
  { id: "S051", name: "Apple Music", source: "official", title: "Apple Music", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 74 },
  { id: "S052", name: "Tidal HiFi", source: "c2c", title: "Tidal HiFi C2C", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 50 },
  { id: "S060", name: "IPTV Account", source: "c2c", title: "IPTV Premium Account", stock: true, spuEnabled: true, skuEnabled: true, regions: ["*"], baseScore: 45 },
];

// 人工词条库：term → 命中的 SPU
type TermEntry = {
  term: string;
  spuIds: string[];
  match: "exact" | "prefix";
  label: "商品词" | "品牌词" | "别名词" | "错词" | "短词";
  enabled: boolean;
};

const MOCK_TERMS: TermEntry[] = [
  { term: "netflix", spuIds: ["S001", "S002"], match: "exact", label: "品牌词", enabled: true },
  { term: "nf", spuIds: ["S001"], match: "exact", label: "短词", enabled: true },
  { term: "netflex", spuIds: ["S001"], match: "exact", label: "错词", enabled: true },
  { term: "youtube", spuIds: ["S010", "S011"], match: "exact", label: "品牌词", enabled: true },
  { term: "yt", spuIds: ["S010"], match: "prefix", label: "短词", enabled: true },
  { term: "spotify", spuIds: ["S020", "S021"], match: "exact", label: "品牌词", enabled: true },
  { term: "spotfy", spuIds: ["S020"], match: "exact", label: "错词", enabled: true },
  { term: "chatgpt", spuIds: ["S030"], match: "exact", label: "商品词", enabled: true },
  { term: "gpt", spuIds: ["S030"], match: "prefix", label: "短词", enabled: true },
  { term: "claude", spuIds: ["S032"], match: "exact", label: "商品词", enabled: true },
  { term: "gemini", spuIds: ["S031"], match: "exact", label: "商品词", enabled: true },
  { term: "vpn", spuIds: ["S040", "S041", "S042"], match: "prefix", label: "商品词", enabled: true },
  { term: "nord", spuIds: ["S040"], match: "prefix", label: "品牌词", enabled: true },
];

// 场景词配置：场景关键词 → SPU 列表
const MOCK_SCENES: { term: string; spuIds: string[] }[] = [
  { term: "music", spuIds: ["S020", "S011", "S051", "S052"] },
  { term: "ai", spuIds: ["S030", "S031", "S032"] },
  { term: "video", spuIds: ["S001", "S010", "S050"] },
];

const SOURCE_WEIGHT: Record<HitSource, number> = {
  人工词库精准命中: 100,
  人工词库前缀命中: 80,
  场景词精准命中: 70,
  商品标题前缀命中: 50,
  商品标题模糊命中: 30,
  官方商品补位: 10,
  "C2C商品补位": 5,
};

type HitSource =
  | "人工词库精准命中"
  | "人工词库前缀命中"
  | "场景词精准命中"
  | "商品标题前缀命中"
  | "商品标题模糊命中"
  | "官方商品补位"
  | "C2C商品补位";

type Candidate = {
  spu: MockSpu;
  source: HitSource;
  matchedTerm: string;
  termLabel: string;
  match: "精准匹配" | "前缀匹配" | "模糊匹配" | "—";
  filterReason: string | null;
  score: number;
};

type SearchTestInput = {
  term: string;
  region: string;
  userStatus: "login" | "guest";
  site: string;
};

type SearchTestResult = {
  rawTerm: string;
  normTerm: string;
  mainSource: HitSource | "无结果";
  matchedTerm: string;
  hitCount: number;
  filteredCount: number;
  triggeredFill: boolean;
  finalCount: number;
  candidates: Candidate[];
  finalList: {
    spu: MockSpu;
    displaySource: "命中结果" | "官方补位" | "C2C补位";
    hitSource: HitSource | "—";
    displayType: "正常可购买" | "缺货展示" | "补位展示";
    score: number;
  }[];
};

const FINAL_LIMIT = 10;

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, "");
}

function checkFilter(spu: MockSpu, region: string, userStatus: "login" | "guest"): string | null {
  if (!spu.spuEnabled) return "SPU 不可展示";
  if (!spu.skuEnabled) return "SKU 未启用";
  if (!spu.regions.includes("*") && !spu.regions.includes(region)) return "区域不可售";
  if (spu.loginOnly && userStatus !== "login") return "用户状态不满足";
  return null;
}

function runSearchTest(input: SearchTestInput): SearchTestResult {
  const raw = input.term;
  const norm = normalize(raw);
  const result: SearchTestResult = {
    rawTerm: raw,
    normTerm: norm,
    mainSource: "无结果",
    matchedTerm: "—",
    hitCount: 0,
    filteredCount: 0,
    triggeredFill: false,
    finalCount: 0,
    candidates: [],
    finalList: [],
  };

  if (!norm) return result;

  const seen = new Set<string>();
  const pickSpus = (ids: string[], source: HitSource, term: string, label: string, match: Candidate["match"]) => {
    ids.forEach((id) => {
      if (seen.has(id)) return;
      const spu = MOCK_SPUS.find((s) => s.id === id);
      if (!spu) return;
      seen.add(id);
      const filterReason = checkFilter(spu, input.region, input.userStatus);
      // 库存：人工词库精准命中保留为候选(缺货展示)，其他来源若无库存直接过滤
      let reason = filterReason;
      if (!reason && !spu.stock) {
        if (source === "人工词库精准命中") {
          reason = null; // 保留，但标记为缺货展示
        } else {
          reason = "无库存";
        }
      }
      const score =
        SOURCE_WEIGHT[source] +
        spu.baseScore +
        (spu.source === "official" ? 5 : 0);
      result.candidates.push({ spu, source, matchedTerm: term, termLabel: label, match, filterReason: reason, score });
    });
  };

  // 1. 人工词库精准命中
  const exactTerm = MOCK_TERMS.find((t) => t.enabled && t.match === "exact" && t.term === norm);
  if (exactTerm) pickSpus(exactTerm.spuIds, "人工词库精准命中", exactTerm.term, exactTerm.label, "精准匹配");

  // 2. 人工词库前缀命中
  if (result.candidates.length === 0) {
    const prefixTerm = MOCK_TERMS.find((t) => t.enabled && t.match === "prefix" && norm.startsWith(t.term));
    if (prefixTerm) pickSpus(prefixTerm.spuIds, "人工词库前缀命中", prefixTerm.term, prefixTerm.label, "前缀匹配");
  }

  // 3. 场景词精准命中
  if (result.candidates.length === 0) {
    const scene = MOCK_SCENES.find((s) => s.term === norm);
    if (scene) pickSpus(scene.spuIds, "场景词精准命中", scene.term, "场景词", "精准匹配");
  }

  // 4. 商品标题前缀命中
  if (result.candidates.length === 0) {
    const ids = MOCK_SPUS.filter((s) => normalize(s.title).startsWith(norm)).map((s) => s.id);
    if (ids.length > 0) pickSpus(ids, "商品标题前缀命中", norm, "商品标题", "前缀匹配");
  }

  // 5. 商品标题模糊命中
  if (result.candidates.length === 0) {
    const ids = MOCK_SPUS.filter((s) => normalize(s.title).includes(norm)).map((s) => s.id);
    if (ids.length > 0) pickSpus(ids, "商品标题模糊命中", norm, "商品标题", "模糊匹配");
  }

  // 主命中来源
  if (result.candidates.length > 0) {
    result.mainSource = result.candidates[0].source;
    result.matchedTerm = result.candidates[0].matchedTerm;
  }

  // 排序
  result.candidates.sort((a, b) => b.score - a.score);

  // 命中数 / 过滤数
  result.hitCount = result.candidates.length;
  result.filteredCount = result.candidates.filter((c) => c.filterReason).length;

  // 最终展示：未被过滤的候选
  const displayed: SearchTestResult["finalList"] = result.candidates
    .filter((c) => !c.filterReason)
    .map((c) => ({
      spu: c.spu,
      displaySource: "命中结果" as const,
      hitSource: c.source,
      displayType: (c.spu.stock ? "正常可购买" : "缺货展示") as "正常可购买" | "缺货展示",
      score: c.score,
    }));

  // 补位：官方
  if (displayed.length < FINAL_LIMIT) {
    const usedIds = new Set(displayed.map((d) => d.spu.id));
    const officialFill = MOCK_SPUS.filter(
      (s) =>
        !usedIds.has(s.id) &&
        s.source === "official" &&
        s.stock &&
        !checkFilter(s, input.region, input.userStatus),
    )
      .sort((a, b) => b.baseScore - a.baseScore)
      .slice(0, FINAL_LIMIT - displayed.length);
    if (officialFill.length > 0) {
      result.triggeredFill = true;
      officialFill.forEach((s) =>
        displayed.push({
          spu: s,
          displaySource: "官方补位",
          hitSource: "—",
          displayType: "补位展示",
          score: s.baseScore,
        }),
      );
    }
  }

  // 补位：C2C
  if (displayed.length < FINAL_LIMIT) {
    const usedIds = new Set(displayed.map((d) => d.spu.id));
    const c2cFill = MOCK_SPUS.filter(
      (s) =>
        !usedIds.has(s.id) &&
        s.source === "c2c" &&
        s.stock &&
        !checkFilter(s, input.region, input.userStatus),
    )
      .sort((a, b) => b.baseScore - a.baseScore)
      .slice(0, FINAL_LIMIT - displayed.length);
    if (c2cFill.length > 0) {
      result.triggeredFill = true;
      c2cFill.forEach((s) =>
        displayed.push({
          spu: s,
          displaySource: "C2C补位",
          hitSource: "—",
          displayType: "补位展示",
          score: s.baseScore,
        }),
      );
    }
  }

  result.finalList = displayed.slice(0, FINAL_LIMIT);
  result.finalCount = result.finalList.length;
  return result;
}

// ============ Component ============

export function ProductSortManagement() {
  const [recall, setRecall] = useState<RecallSource[]>(clone(DEFAULT_RECALL));
  const [termTypes, setTermTypes] = useState<TermType[]>(clone(DEFAULT_TERM_TYPES));
  const [matchTypes, setMatchTypes] = useState<MatchType[]>(clone(DEFAULT_MATCH));
  const [extra, setExtra] = useState<ExtraFactors>(clone(DEFAULT_EXTRA));

  type Meta = { updatedBy: string; updatedAt: string };
  const EMPTY_META: Meta = { updatedBy: "—", updatedAt: "—" };
  const [extraMeta, setExtraMeta] = useState<Record<string, Meta>>({});
  const getExtraMeta = (k: string) => extraMeta[k] ?? EMPTY_META;
  const stampExtra = (k: string) =>
    setExtraMeta((p) => ({ ...p, [k]: { updatedBy: "admin", updatedAt: nowStr() } }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});

  const [logOpen, setLogOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<
    | { title: string; description?: string; run: () => void }
    | null
  >(null);
  const [testOpen, setTestOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  // 搜索测试输入与结果
  const [testTerm, setTestTerm] = useState("");
  const [testRegion, setTestRegion] = useState("US");
  const [testUserStatus, setTestUserStatus] = useState<"login" | "guest">("guest");
  const [testSite, setTestSite] = useState("gamsgo.com");
  const [testResult, setTestResult] = useState<SearchTestResult | null>(null);
  const [tab, setTab] = useState<
    "intro" | "recall" | "term" | "match" | "exact"
  >("intro");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<RecallSource | null>(null);
  const [termEditIdx, setTermEditIdx] = useState<number | null>(null);
  const [termEditDraft, setTermEditDraft] = useState<TermType | null>(null);
  const [matchEditIdx, setMatchEditIdx] = useState<number | null>(null);
  const [matchEditDraft, setMatchEditDraft] = useState<MatchType | null>(null);

  // 明确指向当前SPU 配置
  type ExactSpuConfig = {
    weight: number;
    desc: string;
    updatedBy: string;
    updatedAt: string;
  };
  const DEFAULT_EXACT_SPU: ExactSpuConfig = {
    weight: 20,
    desc: "用户输入命中商品自身词条时，对当前SPU额外加权，确保明确指向的商品排序靠前",
    updatedBy: "—",
    updatedAt: "—",
  };
  const [exactSpu, setExactSpu] = useState<ExactSpuConfig>(clone(DEFAULT_EXACT_SPU));
  const [exactEditOpen, setExactEditOpen] = useState(false);
  const [exactEditDraft, setExactEditDraft] = useState<ExactSpuConfig | null>(null);

  // 排序开关：控制各排序因子是否参与最终排序计算
  type SortFactorKey = "termType" | "termSource" | "matchType" | "exactSpu";

  type SortFactor = {
    key: SortFactorKey;
    name: string;
    desc: string;
    enabled: boolean;
    updatedBy: string;
    updatedAt: string;
  };

  const DEFAULT_SORT_FACTORS: SortFactor[] = [
    { key: "termType", name: "召回方式", enabled: true, desc: "SPU词条召回和SPU商品名前缀匹配兜底不同权重参与排序", updatedBy: "—", updatedAt: "—" },
    { key: "termSource", name: "词条类型", enabled: true, desc: "SPU词条 / 商品名前缀兜底 / 场景词 / 属性词 等召回来源权重参与排序", updatedBy: "—", updatedAt: "—" },
    { key: "matchType", name: "匹配方式", enabled: true, desc: "精准匹配 / 前缀匹配 的权重参与排序", updatedBy: "—", updatedAt: "—" },
    { key: "exactSpu", name: "明确指向当前SPU", enabled: true, desc: "用户输入命中商品自身词条时的额外加权参与排序", updatedBy: "—", updatedAt: "—" },
  ];

  const [sortFactors, setSortFactors] = useState<SortFactor[]>(clone(DEFAULT_SORT_FACTORS));
  const [sortEditIdx, setSortEditIdx] = useState<number | null>(null);
  const [sortEditDraft, setSortEditDraft] = useState<SortFactor | null>(null);

  function isInt(n: unknown) {
    return typeof n === "number" && Number.isInteger(n) && !Number.isNaN(n);
  }

  function validate(): { errs: Record<string, string>; warns: Record<string, string> } {
    const errs: Record<string, string> = {};
    const warns: Record<string, string> = {};

    // recall
    recall.forEach((r, i) => {
      if (!isInt(r.weight) || r.weight < 0 || r.weight > 999) {
        errs[`recall_${i}`] = "请输入 0-999 之间的整数权重";
      } else if (r.enabled && r.weight < 1) {
        errs[`recall_${i}`] = "已启用的召回方式权重不能小于 1";
      }
    });
    if (recall.every((r) => !r.enabled)) {
      errs["recall_enabled"] = "至少需要启用 1 个召回方式";
    }

    // term types
    termTypes.forEach((t, i) => {
      if (!isInt(t.weight) || t.weight < 0 || t.weight > 999) {
        errs[`term_${i}`] = "请输入 0-999 之间的整数权重";
      }
    });
    const product = termTypes.find((t) => t.code === "PRODUCT_TERM");
    const short = termTypes.find((t) => t.code === "SHORT_TERM");
    if (product && short && short.weight > product.weight) {
      warns["term_short"] = "短词权重高于商品词可能导致短输入误召回，请确认是否继续保存。";
    }

    // match
    matchTypes.forEach((m, i) => {
      if (!isInt(m.weight) || m.weight < 0 || m.weight > 999) {
        errs[`match_${i}`] = "请输入 0-999 之间的整数权重";
      }
    });
    const exact = matchTypes.find((m) => m.code === "EXACT");
    const prefix = matchTypes.find((m) => m.code === "PREFIX");
    if (exact && prefix && prefix.weight > exact.weight) {
      errs["match_order"] = "精准匹配权重不能低于前缀匹配权重";
    }

    // extra
    const intFields: [keyof ExtraFactors, string][] = [
      ["exactSpuBoost", "明确指向当前SPU加权"],
      ["hotnessUnit", "商品热度分单位"],
      ["hotnessCap", "商品热度分上限"],
      ["gamsgoBoost", "GamsGo自营加权"],
      ["multiHitPer", "单个额外命中奖励分"],
    ];
    intFields.forEach(([k, label]) => {
      const v = extra[k] as number;
      if (!isInt(v) || v < 0 || v > 999) {
        errs[`extra_${k}`] = `${label} 只能输入 0-999 的整数`;
      }
    });
    if (!isInt(extra.multiHitMax) || extra.multiHitMax < 0 || extra.multiHitMax > 10) {
      errs["extra_multiHitMax"] = "多命中奖励上限次数只能输入 0-10 的整数";
    }
    if (extra.hotnessCap < extra.hotnessUnit) {
      errs["extra_hotnessCap"] = "商品热度分上限不能小于商品热度分单位";
    }
    if (exact && extra.multiHitPer > exact.weight) {
      errs["extra_multiHitPer"] = "单个额外命中奖励分不能高于精准匹配权重";
    }


    return { errs, warns };
  }


  return (
    <div className="flex min-h-screen bg-slate-100 text-sm text-slate-800">
      <aside className="flex w-56 shrink-0 flex-col bg-white border-r border-slate-200">
        <div className="flex h-12 items-center px-4 border-b border-slate-200 font-semibold text-slate-700">
          后台管理系统
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <div>
            <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50">
              <span className="flex items-center gap-2 text-slate-700">
                <Menu className="h-4 w-4 text-slate-400" />
                SPU配置
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 rotate-180" />
            </div>
            <div className="bg-slate-50 pb-2">
              <div className="pl-12 py-2 cursor-pointer hover:bg-blue-50 text-slate-700">SPU基础配置</div>
              <div className="pl-12 py-2 cursor-pointer hover:bg-blue-50 text-slate-700">SPU管理</div>
              <div className="pl-12 py-2 cursor-pointer bg-blue-500 text-white hover:bg-blue-500">
                SPU搜索配置
              </div>
              <div className="pl-12 py-2 cursor-pointer hover:bg-blue-50 text-slate-700">SPU内容配置</div>
            </div>
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <Menu className="h-4 w-4 text-slate-500" />
          <RefreshCw className="h-4 w-4 text-slate-500" />
          <div className="text-slate-500">
            SPU配置 <span className="px-1">/</span>
            <span className="text-slate-700">SPU搜索配置</span>
            <span className="px-1">/</span>
            <span className="text-slate-700">商品排序管理</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-72"><Input placeholder="通过名称搜索页面" className="h-8" /></div>
            <Maximize2 className="h-4 w-4 text-slate-500" />
            <Bell className="h-4 w-4 text-slate-500" />
            <User className="h-4 w-4 text-slate-500" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="rounded-md bg-white shadow-sm">
            <div className="flex">
              <div className="w-44 shrink-0 border-r border-slate-200 p-4">
                <div className="space-y-2 text-slate-700">
                  <Link to="/" className="block py-1.5 cursor-pointer hover:text-blue-600">SPU词库管理</Link>
                  <Link to="/" className="block py-1.5 cursor-pointer hover:text-blue-600">SPU词条管理</Link>
                  <Link to="/scene" className="block py-1.5 cursor-pointer hover:text-blue-600">场景搜索配置</Link>
                  <div className="py-1.5 cursor-pointer text-blue-600 font-medium">商品排序管理</div>
                </div>
              </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Tabs row */}
              <div className="flex items-center border-b border-slate-200 px-6">
                {[
                  { k: "intro", label: "排序开关" },
                  { k: "recall", label: "词条类型权重" },
                  { k: "term", label: "词条来源权重" },
                  { k: "match", label: "匹配方式权重" },
                  { k: "exact", label: "明确指向当前SPU" },
                ].map((t) => {
                  const active = tab === t.k;
                  return (
                    <button
                      key={t.k}
                      onClick={() => setTab(t.k as typeof tab)}
                      className={`relative mr-8 py-3 text-sm transition-colors ${
                        active ? "text-blue-600 font-medium" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {t.label}
                      {active && (
                        <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action toolbar */}
              <div className="flex items-center justify-end px-6 pt-5">
                <div className="flex items-center gap-3 text-slate-500">
                  <button
                    onClick={() => setTestOpen(true)}
                    className="flex items-center gap-1 text-xs hover:text-blue-600"
                    title="搜索测试"
                  >
                    <Search className="h-4 w-4" /> 搜索测试
                  </button>
                  <button
                    onClick={() => setLogOpen(true)}
                    className="flex items-center gap-1 text-xs hover:text-blue-600"
                    title="操作日志"
                  >
                    <History className="h-4 w-4" /> 操作日志
                  </button>
                </div>
              </div>

              <div className="px-6 pb-8 pt-4">
                {tab === "intro" && (
                  <div>
                    <p className="mb-3 text-xs text-slate-500">
                      控制下列召回商品排序因子是否参与最终排序计算。关闭后该因子在排序分中按 0 计算，相关权重配置仍可保留。
                    </p>
                    <FlatTable headers={["召回商品排序因子", "是否参与排序", "说明", "变更人", "变更时间", "操作"]}>
                      {sortFactors.map((f, i) => (
                        <FlatRow key={f.key}>
                          <FlatCell>{f.name}</FlatCell>
                          <FlatCell>
                            <span className={f.enabled ? "text-green-600" : "text-slate-400"}>{f.enabled ? "是" : "否"}</span>
                          </FlatCell>
                          <FlatCell className="text-slate-500">{f.desc}</FlatCell>
                          <FlatCell className="text-slate-500">{f.updatedBy}</FlatCell>
                          <FlatCell className="text-slate-500">{f.updatedAt}</FlatCell>
                          <FlatCell>
                            <button
                              className="text-xs text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                setSortEditIdx(i);
                                setSortEditDraft({ ...f });
                              }}
                            >
                              编辑
                            </button>
                          </FlatCell>
                        </FlatRow>
                      ))}
                    </FlatTable>
                  </div>
                )}

                {tab === "recall" && (
                  <div>
                    {errors["recall_enabled"] && (
                      <p className="mb-3 text-xs text-red-500">{errors["recall_enabled"]}</p>
                    )}
                    <FlatTable headers={["词条类型", "是否启用", "权重分", "说明", "变更人", "变更时间", "操作"]}>
                      {recall.map((r, i) => (
                        <FlatRow key={r.code}>
                          <FlatCell>{r.name}</FlatCell>
                          <FlatCell>
                            <span className={r.enabled ? "text-green-600" : "text-slate-400"}>{r.enabled ? "是" : "否"}</span>
                          </FlatCell>
                          <FlatCell>
                            <span className="text-sm text-slate-700">{r.weight}</span>
                          </FlatCell>
                          <FlatCell className="text-slate-500">{r.desc}</FlatCell>
                          <FlatCell className="text-slate-500">{r.updatedBy}</FlatCell>
                          <FlatCell className="text-slate-500">{r.updatedAt}</FlatCell>
                          <FlatCell>
                            <button
                              className="text-xs text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                setEditIdx(i);
                                setEditDraft({ ...r });
                              }}
                            >
                              编辑
                            </button>
                          </FlatCell>
                        </FlatRow>
                      ))}
                    </FlatTable>
                  </div>
                )}

                {tab === "term" && (
                  <div>
                    {warnings["term_short"] && (
                      <p className="mb-3 text-xs text-amber-600">{warnings["term_short"]}</p>
                    )}
                    <FlatTable headers={["词条来源", "权重分", "说明", "变更人", "变更时间", "操作"]}>
                      {termTypes.map((t, i) => (
                        <FlatRow key={t.code}>
                          <FlatCell>{t.name}</FlatCell>
                          <FlatCell>
                            <span className="text-sm text-slate-700">{t.weight}</span>
                          </FlatCell>
                          <FlatCell className="text-slate-500">{t.desc}</FlatCell>
                          <FlatCell className="text-slate-500">{t.updatedBy}</FlatCell>
                          <FlatCell className="text-slate-500">{t.updatedAt}</FlatCell>
                          <FlatCell>
                            <button
                              className="text-xs text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                setTermEditIdx(i);
                                setTermEditDraft({ ...t });
                              }}
                            >
                              编辑
                            </button>
                          </FlatCell>
                        </FlatRow>
                      ))}
                    </FlatTable>
                  </div>
                )}

                {tab === "match" && (
                  <div>
                    {errors["match_order"] && (
                      <p className="mb-3 text-xs text-red-500">{errors["match_order"]}</p>
                    )}
                    <FlatTable headers={["匹配方式", "权重分", "说明", "变更人", "变更时间", "操作"]}>
                      {matchTypes.map((m, i) => (
                        <FlatRow key={m.code}>
                          <FlatCell>{m.name}</FlatCell>
                          <FlatCell>
                            <span className={errors[`match_${i}`] ? "text-red-500" : ""}>{m.weight}</span>
                          </FlatCell>
                          <FlatCell className="text-slate-500">{m.desc}</FlatCell>
                          <FlatCell className="text-slate-500">{m.updatedBy}</FlatCell>
                          <FlatCell className="text-slate-500">{m.updatedAt}</FlatCell>
                          <FlatCell>
                            <button
                              className="text-xs text-blue-600 hover:underline"
                              onClick={() => {
                                setMatchEditIdx(i);
                                setMatchEditDraft({ ...m });
                              }}
                            >
                              编辑
                            </button>
                          </FlatCell>
                        </FlatRow>
                      ))}
                    </FlatTable>
                  </div>
                )}

                {tab === "exact" && (
                  <div>
                    <p className="mb-3 text-xs text-slate-500">
                      当用户输入命中商品自身词条时，对该 SPU 在最终排序分中额外加权，确保明确指向当前商品的搜索请求能将该 SPU 排在最前。
                    </p>
                    <FlatTable headers={["配置项", "加权分", "说明", "变更人", "变更时间", "操作"]}>
                      <FlatRow>
                        <FlatCell>明确指向当前SPU加权</FlatCell>
                        <FlatCell>
                          <span className="text-sm text-slate-700">{exactSpu.weight}</span>
                        </FlatCell>
                        <FlatCell className="text-slate-500">{exactSpu.desc}</FlatCell>
                        <FlatCell className="text-slate-500">{exactSpu.updatedBy}</FlatCell>
                        <FlatCell className="text-slate-500">{exactSpu.updatedAt}</FlatCell>
                        <FlatCell>
                          <button
                            className="text-xs text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              setExactEditDraft({ ...exactSpu });
                              setExactEditOpen(true);
                            }}
                          >
                            编辑
                          </button>
                        </FlatCell>
                      </FlatRow>
                    </FlatTable>
                  </div>
                )}


              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Per-row save confirmation */}
      <Dialog open={!!pendingConfirm} onOpenChange={(o) => !o && setPendingConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{pendingConfirm?.title ?? "确认保存修改？"}</DialogTitle>
            <DialogDescription>
              {pendingConfirm?.description ?? "保存后该配置立即生效，影响前台搜索排序结果。请确认无误。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingConfirm(null)}>取消</Button>
            <Button
              onClick={() => {
                pendingConfirm?.run();
                setPendingConfirm(null);
              }}
            >
              确认保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit recall source dialog */}
      <Dialog
        open={editIdx !== null}
        onOpenChange={(o) => {
          if (!o) {
            setEditIdx(null);
            setEditDraft(null);
          }
        }}
      >
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-semibold">编辑词条类型</DialogTitle>
          </DialogHeader>
          {editDraft && (
            <div className="px-6 pb-2 space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm">
                    <span className="text-red-500 mr-1">*</span>词条类型
                  </label>
                  <div className="h-10 px-3 flex items-center rounded-md border bg-muted/40 text-foreground">
                    {editDraft.name}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm">
                    <span className="text-red-500 mr-1">*</span>是否启用
                  </label>
                  <div className="h-10 px-3 flex items-center justify-between rounded-md border">
                    <span className="text-muted-foreground">
                      {editDraft.enabled ? "已启用" : "已停用"}
                    </span>
                    <Switch
                      checked={editDraft.enabled}
                      onCheckedChange={(v) => setEditDraft({ ...editDraft, enabled: !!v })}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm">
                  <span className="text-red-500 mr-1">*</span>权重分（0-999）
                </label>
                <Input
                  type="number"
                  value={Number.isNaN(editDraft.weight) ? "" : editDraft.weight}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setEditDraft({ ...editDraft, weight: Number.isNaN(n) ? 0 : n });
                  }}
                  placeholder="请输入权重分"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm">说明</label>
                <Textarea
                  value={editDraft.desc}
                  onChange={(e) => setEditDraft({ ...editDraft, desc: e.target.value })}
                  rows={4}
                  placeholder="请输入说明"
                />
              </div>
            </div>
          )}
          <DialogFooter className="px-6 py-4 border-t bg-muted/20">
            <Button
              variant="outline"
              onClick={() => {
                setEditIdx(null);
                setEditDraft(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (editIdx === null || !editDraft) return;
                const orig = DEFAULT_RECALL[editIdx];
                if (!orig) return;
                setEditDraft({ ...orig });
                toast.info("已恢复该词条类型默认值，点击保存后生效。");
              }}
            >
              恢复默认值
            </Button>
            <Button
              onClick={() => {
                if (editIdx === null || !editDraft) return;
                const idx = editIdx;
                const draft = editDraft;
                setPendingConfirm({
                  title: "确认保存该词条类型修改？",
                  description: "保存后立即生效，影响前台搜索排序。",
                  run: () => {
                    const next = [...recall];
                    next[idx] = { ...draft, updatedBy: "admin", updatedAt: nowStr() };
                    setRecall(next);
                    setEditIdx(null);
                    setEditDraft(null);
                    toast.success("已保存并生效");
                  },
                });
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit term type dialog */}
      <Dialog
        open={termEditIdx !== null}
        onOpenChange={(o) => {
          if (!o) {
            setTermEditIdx(null);
            setTermEditDraft(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑词条来源</DialogTitle>
            <DialogDescription>修改该词条来源的权重和说明。</DialogDescription>
          </DialogHeader>
          {termEditDraft && (
            <div className="space-y-4 text-sm">
              <div className="rounded-md bg-slate-50 p-3">
                <div className="mb-1 text-xs text-slate-500">词条来源</div>
                <div className="font-medium text-slate-800">{termEditDraft.name}</div>
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-600">权重分（0-999）</div>
                <Input
                  type="number"
                  className="h-8 w-32"
                  value={Number.isNaN(termEditDraft.weight) ? "" : termEditDraft.weight}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setTermEditDraft({ ...termEditDraft, weight: Number.isNaN(n) ? 0 : n });
                  }}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-600">说明</div>
                <Input
                  value={termEditDraft.desc}
                  onChange={(e) => setTermEditDraft({ ...termEditDraft, desc: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTermEditIdx(null);
                setTermEditDraft(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (termEditIdx === null || !termEditDraft) return;
                const orig = DEFAULT_TERM_TYPES[termEditIdx];
                if (!orig) return;
                setTermEditDraft({ ...orig });
                toast.info("已恢复该词条来源默认值，点击保存后生效。");
              }}
            >
              恢复默认值
            </Button>
            <Button
              onClick={() => {
                if (termEditIdx === null || !termEditDraft) return;
                const idx = termEditIdx;
                const draft = termEditDraft;
                setPendingConfirm({
                  title: "确认保存该词条来源修改？",
                  description: "保存后立即生效，影响前台搜索排序。",
                  run: () => {
                    const next = [...termTypes];
                    next[idx] = { ...draft, updatedBy: "admin", updatedAt: nowStr() };
                    setTermTypes(next);
                    setTermEditIdx(null);
                    setTermEditDraft(null);
                    toast.success("已保存并生效");
                  },
                });
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit match type dialog */}
      <Dialog
        open={matchEditIdx !== null}
        onOpenChange={(o) => {
          if (!o) {
            setMatchEditIdx(null);
            setMatchEditDraft(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑匹配方式</DialogTitle>
            <DialogDescription>修改该匹配方式的权重和说明。</DialogDescription>
          </DialogHeader>
          {matchEditDraft && (
            <div className="space-y-4 text-sm">
              <div className="rounded-md bg-slate-50 p-3">
                <div className="mb-1 text-xs text-slate-500">匹配方式</div>
                <div className="font-medium text-slate-800">{matchEditDraft.name}</div>
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-600">权重分（0-999）</div>
                <Input
                  type="number"
                  className="h-8 w-32"
                  value={Number.isNaN(matchEditDraft.weight) ? "" : matchEditDraft.weight}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setMatchEditDraft({ ...matchEditDraft, weight: Number.isNaN(n) ? 0 : n });
                  }}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-600">说明</div>
                <Input
                  value={matchEditDraft.desc}
                  onChange={(e) => setMatchEditDraft({ ...matchEditDraft, desc: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMatchEditIdx(null);
                setMatchEditDraft(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (matchEditIdx === null || !matchEditDraft) return;
                const orig = DEFAULT_MATCH[matchEditIdx];
                if (!orig) return;
                setMatchEditDraft({ ...orig });
                toast.info("已恢复该匹配方式默认值，点击保存后生效。");
              }}
            >
              恢复默认值
            </Button>
            <Button
              onClick={() => {
                if (matchEditIdx === null || !matchEditDraft) return;
                const idx = matchEditIdx;
                const draft = matchEditDraft;
                setPendingConfirm({
                  title: "确认保存该匹配方式修改？",
                  description: "保存后立即生效，影响前台搜索排序。",
                  run: () => {
                    const next = [...matchTypes];
                    next[idx] = { ...draft, updatedBy: "admin", updatedAt: nowStr() };
                    setMatchTypes(next);
                    setMatchEditIdx(null);
                    setMatchEditDraft(null);
                    toast.success("已保存并生效");
                  },
                });
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sort factor edit dialog */}
      <Dialog
        open={sortEditIdx !== null}
        onOpenChange={(o) => {
          if (!o) {
            setSortEditIdx(null);
            setSortEditDraft(null);
          }
        }}
      >
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-semibold">编辑排序因子</DialogTitle>
          </DialogHeader>
          {sortEditDraft && (
            <div className="px-6 pb-2 space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm">
                    <span className="text-red-500 mr-1">*</span>排序因子
                  </label>
                  <div className="h-10 px-3 flex items-center rounded-md border bg-muted/40 text-foreground">
                    {sortEditDraft.name}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm">
                    <span className="text-red-500 mr-1">*</span>是否参与排序
                  </label>
                  <div className="h-10 px-3 flex items-center justify-between rounded-md border">
                    <span className="text-muted-foreground">
                      {sortEditDraft.enabled ? "已启用" : "已停用"}
                    </span>
                    <Switch
                      checked={sortEditDraft.enabled}
                      onCheckedChange={(v) => setSortEditDraft({ ...sortEditDraft, enabled: !!v })}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm">说明</label>
                <Textarea
                  value={sortEditDraft.desc}
                  onChange={(e) => setSortEditDraft({ ...sortEditDraft, desc: e.target.value })}
                  rows={4}
                  placeholder="请输入说明"
                />
              </div>
            </div>
          )}
          <DialogFooter className="px-6 py-4 border-t bg-muted/20">
            <Button
              variant="outline"
              onClick={() => {
                setSortEditIdx(null);
                setSortEditDraft(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                if (sortEditIdx === null || !sortEditDraft) return;
                const idx = sortEditIdx;
                const draft = sortEditDraft;
                setPendingConfirm({
                  title: "确认保存该排序因子修改？",
                  description: "保存后立即生效，影响前台搜索排序计算。",
                  run: () => {
                    const next = [...sortFactors];
                    next[idx] = { ...draft, updatedBy: "admin", updatedAt: nowStr() };
                    setSortFactors(next);
                    setSortEditIdx(null);
                    setSortEditDraft(null);
                    toast.success("已保存并生效");
                  },
                });
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs dialog */}
      {/* Edit exact-spu dialog */}
      <Dialog
        open={exactEditOpen}
        onOpenChange={(o) => {
          if (!o) {
            setExactEditOpen(false);
            setExactEditDraft(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑明确指向当前SPU</DialogTitle>
            <DialogDescription>修改当用户输入命中商品自身词条时的额外加权和说明。</DialogDescription>
          </DialogHeader>
          {exactEditDraft && (
            <div className="space-y-4 text-sm">
              <div className="rounded-md bg-slate-50 p-3">
                <div className="mb-1 text-xs text-slate-500">配置项</div>
                <div className="font-medium text-slate-800">明确指向当前SPU加权</div>
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-600">加权分（0-999）</div>
                <Input
                  type="number"
                  className="h-8 w-32"
                  value={Number.isNaN(exactEditDraft.weight) ? "" : exactEditDraft.weight}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setExactEditDraft({ ...exactEditDraft, weight: Number.isNaN(n) ? 0 : n });
                  }}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-600">说明</div>
                <Input
                  value={exactEditDraft.desc}
                  onChange={(e) => setExactEditDraft({ ...exactEditDraft, desc: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExactEditOpen(false);
                setExactEditDraft(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setExactEditDraft({ ...DEFAULT_EXACT_SPU });
                toast.info("已恢复默认值，点击保存后生效。");
              }}
            >
              恢复默认值
            </Button>
            <Button
              onClick={() => {
                if (!exactEditDraft) return;
                const draft = exactEditDraft;
                setPendingConfirm({
                  title: "确认保存该配置修改？",
                  description: "保存后立即生效，影响前台搜索排序。",
                  run: () => {
                    setExactSpu({ ...draft, updatedBy: "admin", updatedAt: nowStr() });
                    setExactEditOpen(false);
                    setExactEditDraft(null);
                    toast.success("已保存并生效");
                  },
                });
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>操作日志</DialogTitle>
            <DialogDescription>记录排序规则配置的变更历史</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-2 text-left">操作时间</th>
                  <th className="p-2 text-left">操作人</th>
                  <th className="p-2 text-left">操作模块</th>
                  <th className="p-2 text-left">操作类型</th>
                  <th className="p-2 text-left">变更前</th>
                  <th className="p-2 text-left">变更后</th>
                  <th className="p-2 text-left">备注</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">暂无日志</td>
                  </tr>
                ) : (
                  logs.map((l, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="p-2 text-slate-700">{l.time}</td>
                      <td className="p-2 text-slate-700">{l.operator}</td>
                      <td className="p-2 text-slate-700">{l.module}</td>
                      <td className="p-2 text-slate-700">{l.type}</td>
                      <td className="p-2 text-slate-500">{l.before}</td>
                      <td className="p-2 text-slate-500">{l.after}</td>
                      <td className="p-2 text-slate-500">{l.remark}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search test dialog (placeholder) */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>搜索测试</DialogTitle>
            <DialogDescription>
              输入搜索词与访问条件，预览该搜索词在当前配置下的命中、过滤、排序和最终展示结果。该工具仅做后台调试，不影响线上数据。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 1. 测试条件区 */}
            <div className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 text-xs font-medium text-slate-700">测试条件</div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <div className="mb-1 text-xs text-slate-600">搜索词 *</div>
                  <Input
                    value={testTerm}
                    onChange={(e) => setTestTerm(e.target.value)}
                    placeholder="如 Netflix、yt、ai、vpn"
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs text-slate-600">访问站点</div>
                  <Select value={testSite} onValueChange={setTestSite}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gamsgo.com">gamsgo.com</SelectItem>
                      <SelectItem value="gamsgo.it">gamsgo.it</SelectItem>
                      <SelectItem value="gamsgo.jp">gamsgo.jp</SelectItem>
                      <SelectItem value="gamsgo.kr">gamsgo.kr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="mb-1 text-xs text-slate-600">访问区域</div>
                  <Select value={testRegion} onValueChange={setTestRegion}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">US</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="JP">JP</SelectItem>
                      <SelectItem value="KR">KR</SelectItem>
                      <SelectItem value="DE">DE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="mb-1 text-xs text-slate-600">用户状态</div>
                  <Select
                    value={testUserStatus}
                    onValueChange={(v) => setTestUserStatus(v as "login" | "guest")}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">未登录</SelectItem>
                      <SelectItem value="login">已登录</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Badge variant="outline" className="font-normal">基于已发布配置</Badge>
                <span>后台调试不计入用户搜索埋点</span>
              </div>
            </div>

            {testResult && (
              <>
                {/* 2. 命中摘要区 */}
                <div className="rounded-md border border-slate-200 p-3">
                  <div className="mb-2 text-xs font-medium text-slate-700">命中摘要</div>
                  {testResult.mainSource === "无结果" ? (
                    <div className="rounded bg-amber-50 p-3 text-xs text-amber-700">
                      当前搜索词未命中人工词库、场景搜索配置、商品标题或模糊匹配。
                      {testResult.finalCount > 0
                        ? " 已展示默认补位商品。"
                        : " 当前无可用补位商品。"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-x-6 gap-y-2 text-xs">
                      <div><span className="text-slate-500">原始搜索词：</span>{testResult.rawTerm}</div>
                      <div><span className="text-slate-500">标准化搜索词：</span>{testResult.normTerm}</div>
                      <div><span className="text-slate-500">主要命中来源：</span><span className="text-blue-600">{testResult.mainSource}</span></div>
                      <div><span className="text-slate-500">命中词条：</span>{testResult.matchedTerm}</div>
                      <div><span className="text-slate-500">命中 SPU 数：</span>{testResult.hitCount}</div>
                      <div><span className="text-slate-500">过滤 SPU 数：</span>{testResult.filteredCount}</div>
                      <div><span className="text-slate-500">是否触发补位：</span>{testResult.triggeredFill ? "是" : "否"}</div>
                      <div><span className="text-slate-500">最终展示数量：</span>{testResult.finalCount}</div>
                    </div>
                  )}
                  {testResult.hitCount > 0 && testResult.filteredCount === testResult.hitCount && (
                    <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-700">
                      当前搜索词已命中候选商品，但候选商品因库存、区域、状态等原因未进入最终展示。
                    </div>
                  )}
                  {testResult.finalCount > 0 && testResult.finalCount < FINAL_LIMIT && (
                    <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-700">
                      命中结果不足，且当前条件下可用补位商品不足，最终展示数量少于 {FINAL_LIMIT} 个。
                    </div>
                  )}
                </div>

                {/* 3. 候选 SPU 明细区 */}
                <div className="rounded-md border border-slate-200">
                  <div className="border-b border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">
                    候选 SPU 明细（{testResult.candidates.length}）
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-2 py-2 text-left">#</th>
                          <th className="px-2 py-2 text-left">SPU ID</th>
                          <th className="px-2 py-2 text-left">SPU 名称</th>
                          <th className="px-2 py-2 text-left">来源</th>
                          <th className="px-2 py-2 text-left">命中来源</th>
                          <th className="px-2 py-2 text-left">命中词条</th>
                          <th className="px-2 py-2 text-left">词条标签</th>
                          <th className="px-2 py-2 text-left">匹配方式</th>
                          <th className="px-2 py-2 text-left">排序分</th>
                          <th className="px-2 py-2 text-left">最终展示</th>
                          <th className="px-2 py-2 text-left">过滤/降级原因</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testResult.candidates.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="px-2 py-4 text-center text-slate-500">
                              无候选 SPU
                            </td>
                          </tr>
                        ) : (
                          testResult.candidates.map((c, i) => {
                            const finalPos =
                              testResult.finalList.findIndex((d) => d.spu.id === c.spu.id) + 1;
                            return (
                              <tr key={c.spu.id} className="border-t border-slate-100">
                                <td className="px-2 py-2">{i + 1}</td>
                                <td className="px-2 py-2 text-slate-500">{c.spu.id}</td>
                                <td className="px-2 py-2">{c.spu.name}</td>
                                <td className="px-2 py-2">
                                  <Badge variant="outline" className="font-normal">
                                    {c.spu.source === "official" ? "GamsGo官方" : "C2C"}
                                  </Badge>
                                </td>
                                <td className="px-2 py-2 text-blue-600">{c.source}</td>
                                <td className="px-2 py-2">{c.matchedTerm}</td>
                                <td className="px-2 py-2 text-slate-500">{c.termLabel}</td>
                                <td className="px-2 py-2">{c.match}</td>
                                <td className="px-2 py-2">{c.score}</td>
                                <td className="px-2 py-2">
                                  {finalPos > 0 ? (
                                    <span className="text-green-600">是 · 第 {finalPos} 位</span>
                                  ) : (
                                    <span className="text-slate-400">否</span>
                                  )}
                                </td>
                                <td className="px-2 py-2 text-amber-600">
                                  {c.filterReason ?? "—"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. 最终展示结果区 */}
                <div className="rounded-md border border-slate-200">
                  <div className="border-b border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">
                    最终展示结果（{testResult.finalCount}）
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-2 py-2 text-left">展示位</th>
                          <th className="px-2 py-2 text-left">SPU ID</th>
                          <th className="px-2 py-2 text-left">商品名称</th>
                          <th className="px-2 py-2 text-left">商品来源</th>
                          <th className="px-2 py-2 text-left">展示来源</th>
                          <th className="px-2 py-2 text-left">命中来源</th>
                          <th className="px-2 py-2 text-left">展示类型</th>
                          <th className="px-2 py-2 text-left">排序分</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testResult.finalList.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-2 py-4 text-center text-slate-500">
                              无最终展示结果
                            </td>
                          </tr>
                        ) : (
                          testResult.finalList.map((d, i) => (
                            <tr key={d.spu.id} className="border-t border-slate-100">
                              <td className="px-2 py-2">{i + 1}</td>
                              <td className="px-2 py-2 text-slate-500">{d.spu.id}</td>
                              <td className="px-2 py-2">{d.spu.name}</td>
                              <td className="px-2 py-2">
                                <Badge variant="outline" className="font-normal">
                                  {d.spu.source === "official" ? "GamsGo官方" : "C2C"}
                                </Badge>
                              </td>
                              <td className="px-2 py-2">
                                <span
                                  className={
                                    d.displaySource === "命中结果"
                                      ? "text-green-600"
                                      : d.displaySource === "官方补位"
                                        ? "text-blue-600"
                                        : "text-purple-600"
                                  }
                                >
                                  {d.displaySource}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-slate-500">{d.hitSource}</td>
                              <td className="px-2 py-2">{d.displayType}</td>
                              <td className="px-2 py-2">{d.score}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTestOpen(false);
                setTestResult(null);
              }}
            >
              关闭
            </Button>
            <Button
              onClick={() => {
                if (!testTerm.trim()) {
                  toast.error("请输入搜索词后再执行测试。");
                  return;
                }
                const r = runSearchTest({
                  term: testTerm,
                  region: testRegion,
                  userStatus: testUserStatus,
                  site: testSite,
                });
                setTestResult(r);
              }}
            >
              执行测试
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

// ============ Subcomponents ============

function FlatTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 text-slate-500">
          {headers.map((h) => (
            <th
              key={h}
              className="px-4 py-3 text-left text-xs font-normal first:rounded-l-md last:rounded-r-md"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function FlatRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-slate-100 last:border-b-0">{children}</tr>;
}

function FlatCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-4 align-middle text-slate-700 ${className ?? ""}`}>
      {children}
    </td>
  );
}

function NumberField({
  value,
  onChange,
  error,
}: {
  value: number;
  onChange: (v: number) => void;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <Input
        type="number"
        className={`h-8 w-24 ${error ? "border-red-400" : ""}`}
        value={Number.isNaN(value) ? "" : value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange(NaN);
          } else {
            const n = parseInt(raw, 10);
            onChange(Number.isNaN(n) ? NaN : n);
          }
        }}
      />
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function StageBadge({ stage }: { stage: RecallSource["stage"] }) {
  const cls =
    stage === "一期启用"
      ? "bg-emerald-100 text-emerald-700"
      : stage === "二期预留"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600";
  return <Badge className={`${cls} border-0 font-normal`}>{stage}</Badge>;
}