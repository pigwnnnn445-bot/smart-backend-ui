import { useMemo, useState, useEffect } from "react";
import {
  Search,
  RotateCcw,
  Plus,
  Pencil,
  Power,
  ChevronDown,
  Maximize2,
  RefreshCw,
  Bell,
  User,
  Menu,
  FileText,
  Upload,
  Download,
  ArrowLeft,
  AlertTriangle,
  FlaskConical,
  Trash2,
  ArrowUp,
  ArrowDown,
  Languages,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// -------------------- 类型 --------------------
type SceneType = "场景词" | "品类词";
type SceneLang =
  | "en" | "zh-CN" | "zh-TW" | "it" | "es" | "fr" | "de" | "ja" | "ko"
  | "pt" | "nl" | "pl" | "tr" | "ar" | "th" | "vi" | "id" | "ms"
  | "ru" | "uk" | "hi" | "bn" | "fil" | "sv" | "da" | "no";
type SceneStatus = "草稿" | "已启用" | "已停用";
type ExprStatus = "草稿" | "已启用" | "已停用";
type TranslationStatus = "未生成" | "生成中" | "已生成" | "生成失败";
type GenSource = "主场景词" | "自动翻译" | "人工编辑";
type RecLevel = "主推" | "推荐" | "备选";
type RelStatus = "已启用" | "已停用";
type ProductStatus = "待上架" | "在售" | "售罄" | "已下架";
type SpuLibStatus = "未配置" | "草稿" | "启用" | "停用";
type SiteSellable = "是" | "否" | "部分站点可售";
type ProductSource = "GamsGo" | "C2C";
type PostGenStatus = "自动启用" | "生成后待确认";

interface SceneExpression {
  id: string;
  lang: SceneLang;
  content: string;
  standard: string;
  genSource: GenSource;
  translationStatus: TranslationStatus;
  status: ExprStatus;
  updater: string;
  updatedAt: string;
}

interface SceneSpu {
  spuId: string;
  spuName: string;
  source: ProductSource;
  category: string;
  productStatus: ProductStatus;
  spuLibStatus: SpuLibStatus;
  siteSellable: SiteSellable;
  recLevel: RecLevel;
  order: number;
  relStatus: RelStatus;
}

interface Scene {
  id: string;
  name: string;
  mainTerm: string;
  mainLang: SceneLang;
  sceneType: SceneType;
  status: SceneStatus;
  remark: string;
  targetLangs: SceneLang[];
  postGenStatus: PostGenStatus;
  overrideExisting: boolean;
  keepManual: boolean;
  expressions: SceneExpression[];
  spus: SceneSpu[];
  updater: string;
  updatedAt: string;
}

// -------------------- 常量 --------------------
const SCENE_TYPES: SceneType[] = ["场景词", "品类词"];
const ALL_LANGS: SceneLang[] = [
  "en","zh-CN","zh-TW","it","es","fr","de","ja","ko","pt","nl","pl","tr",
  "ar","th","vi","id","ms","ru","uk","hi","bn","fil","sv","da","no",
];
const LANG_NAMES: Record<SceneLang, string> = {
  en: "English", "zh-CN": "简体中文", "zh-TW": "繁體中文", it: "Italiano",
  es: "Español", fr: "Français", de: "Deutsch", ja: "日本語", ko: "한국어",
  pt: "Português", nl: "Nederlands", pl: "Polski", tr: "Türkçe", ar: "العربية",
  th: "ไทย", vi: "Tiếng Việt", id: "Bahasa Indonesia", ms: "Bahasa Melayu",
  ru: "Русский", uk: "Українська", hi: "हिन्दी", bn: "বাংলা", fil: "Filipino",
  sv: "Svenska", da: "Dansk", no: "Norsk",
};
const REC_LEVELS: RecLevel[] = ["主推", "推荐", "备选"];
const REC_RANK: Record<RecLevel, number> = { 主推: 0, 推荐: 1, 备选: 2 };

const ATTR_WORDS = ["4k", "family", "礼品码", "tv", "mac", "账号密码", "邀请链接"];
const SPU_DIRECT_STANDARDS = new Set(["openai", "chatgpt", "netflix", "spotify"]);

// -------------------- Mock 翻译词典 --------------------
const TRANSLATION_DICT: Record<string, Partial<Record<SceneLang, string>>> = {
  "AI工具": {
    "zh-CN": "AI工具", "zh-TW": "AI工具", en: "AI tools", it: "strumenti AI",
    es: "herramientas de IA", fr: "outils IA", de: "KI-Werkzeuge", ja: "AIツール",
    ko: "AI 도구", pt: "ferramentas de IA", nl: "AI-tools", pl: "narzędzia AI",
    tr: "AI araçları", ar: "أدوات الذكاء الاصطناعي", th: "เครื่องมือ AI",
    vi: "công cụ AI", id: "alat AI", ms: "alat AI", ru: "ИИ-инструменты",
    uk: "інструменти ШІ", hi: "AI टूल", bn: "AI টুলস", fil: "AI tools",
    sv: "AI-verktyg", da: "AI-værktøjer", no: "AI-verktøy",
  },
  "写论文": {
    "zh-CN": "写论文", "zh-TW": "寫論文", en: "essay writer", it: "scrivere tesi",
    es: "escribir tesis", fr: "rédaction de thèse", de: "Aufsatz schreiben",
    ja: "論文作成", ko: "논문 작성", pt: "escrever tese", nl: "scriptie schrijven",
    pl: "pisanie pracy", tr: "tez yazma", ar: "كتابة الأطروحة",
    th: "เขียนวิทยานิพนธ์", vi: "viết luận văn", id: "menulis tesis",
    ms: "menulis tesis", ru: "написание диссертации", uk: "написання дисертації",
    hi: "निबंध लेखन", bn: "প্রবন্ধ লেখা", fil: "pagsulat ng tesis",
    sv: "skriva uppsats", da: "skrive afhandling", no: "skrive oppgave",
  },
  "看剧": {
    "zh-CN": "看剧", "zh-TW": "看劇", en: "watch series", it: "guardare serie",
    es: "ver series", fr: "regarder séries", de: "Serien anschauen",
    ja: "ドラマ視聴", ko: "드라마 시청",
  },
  "AI绘图": {
    "zh-CN": "AI绘图", "zh-TW": "AI繪圖", en: "AI art", it: "immagine AI",
    es: "imagen IA", fr: "image IA", ja: "AIお絵描き", ko: "AI 그림",
  },
};

function translate(mainTerm: string, lang: SceneLang): string {
  const dict = TRANSLATION_DICT[mainTerm];
  if (dict && dict[lang]) return dict[lang] as string;
  return `${mainTerm} (${lang})`;
}

// -------------------- 工具 --------------------
function normalizeTerm(input: string): string {
  if (!input) return "";
  let s = input
    .replace(/[\uFF01-\uFF5E]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .replace(/\u3000/g, " ");
  s = s.toLowerCase().trim();
  if (!s) return "";
  s = s.replace(/([a-z0-9])\s+([a-z0-9])/g, "$1$2");
  s = s.replace(/[\s\-_.·()]/g, "");
  return s;
}

function nowStr() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// -------------------- 候选 SPU --------------------
const CANDIDATE_SPUS: Omit<SceneSpu, "recLevel" | "order" | "relStatus">[] = [
  { spuId: "SPU10001", spuName: "ChatGPT Plus", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10002", spuName: "Claude", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "停用", siteSellable: "是" },
  { spuId: "SPU10003", spuName: "Perplexity", source: "C2C", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10004", spuName: "Gemini", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10005", spuName: "Midjourney", source: "GamsGo", category: "AI绘图", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10006", spuName: "Stable Diffusion", source: "C2C", category: "AI绘图", productStatus: "在售", spuLibStatus: "启用", siteSellable: "部分站点可售" },
  { spuId: "SPU10007", spuName: "DALL·E", source: "GamsGo", category: "AI绘图", productStatus: "已下架", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10008", spuName: "Netflix", source: "GamsGo", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10009", spuName: "Disney+", source: "C2C", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10010", spuName: "HBO Max", source: "GamsGo", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "否" },
  { spuId: "SPU10011", spuName: "Spotify", source: "C2C", category: "音乐会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10012", spuName: "Apple Music", source: "GamsGo", category: "音乐会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
];

// -------------------- 自动生成表达 --------------------
function buildExpressionsFromMain(
  mainTerm: string,
  mainLang: SceneLang,
  targetLangs: SceneLang[],
  postGenStatus: PostGenStatus,
  prev: SceneExpression[],
  opts: { overrideExisting: boolean; keepManual: boolean },
): SceneExpression[] {
  const out: SceneExpression[] = [];
  const prevByLang = new Map(prev.map((e) => [e.lang, e]));
  const langs = Array.from(new Set<SceneLang>([mainLang, ...targetLangs]));
  const initStatus: ExprStatus = postGenStatus === "自动启用" ? "已启用" : "草稿";

  for (const lang of langs) {
    const existing = prevByLang.get(lang);
    const isMain = lang === mainLang;
    // 保留人工修改
    if (existing && existing.genSource === "人工编辑" && opts.keepManual && !opts.overrideExisting) {
      out.push(existing);
      continue;
    }
    const content = isMain ? mainTerm : translate(mainTerm, lang);
    out.push({
      id: existing?.id ?? uid("E"),
      lang,
      content,
      standard: normalizeTerm(content),
      genSource: isMain ? "主场景词" : "自动翻译",
      translationStatus: "已生成",
      status: existing?.status ?? initStatus,
      updater: "Alex",
      updatedAt: nowStr(),
    });
  }
  // 保留 targetLangs 之外、用户保留的语言（不删除已存在但不在目标列表中的）
  for (const e of prev) {
    if (!langs.includes(e.lang)) out.push(e);
  }
  return out;
}

// -------------------- 初始数据 --------------------
function seed(name: string, id: string, mainTerm: string, type: SceneType, status: SceneStatus, targets: SceneLang[], updater: string, updatedAt: string, spus: SceneSpu[], remark = ""): Scene {
  const exprs = buildExpressionsFromMain(mainTerm, "zh-CN", targets, "自动启用", [], { overrideExisting: false, keepManual: true });
  return {
    id, name, mainTerm, mainLang: "zh-CN", sceneType: type, status, remark,
    targetLangs: targets, postGenStatus: "自动启用", overrideExisting: false, keepManual: true,
    expressions: exprs, spus, updater, updatedAt,
  };
}

const FULL_TARGETS: SceneLang[] = ALL_LANGS;
const PARTIAL_TARGETS: SceneLang[] = ["en","zh-CN","zh-TW","it","es","fr","de","ja","ko"];

const initialScenes: Scene[] = [
  seed("AI 工具", "SC0001", "AI工具", "品类词", "已启用", FULL_TARGETS, "Alex", "2026-05-20 16:00:24", [
    { spuId: "SPU10001", spuName: "ChatGPT Plus", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "主推", order: 1, relStatus: "已启用" },
    { spuId: "SPU10002", spuName: "Claude", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "停用", siteSellable: "是", recLevel: "推荐", order: 2, relStatus: "已启用" },
    { spuId: "SPU10003", spuName: "Perplexity", source: "C2C", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "推荐", order: 3, relStatus: "已启用" },
    { spuId: "SPU10004", spuName: "Gemini", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "备选", order: 4, relStatus: "已停用" },
  ], "AI 工具品类入口"),
  seed("写论文", "SC0002", "写论文", "场景词", "已启用", FULL_TARGETS, "Linda", "2026-05-18 10:22:10", [
    { spuId: "SPU10001", spuName: "ChatGPT Plus", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "主推", order: 1, relStatus: "已启用" },
    { spuId: "SPU10002", spuName: "Claude", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "停用", siteSellable: "是", recLevel: "推荐", order: 2, relStatus: "已启用" },
    { spuId: "SPU10003", spuName: "Perplexity", source: "C2C", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "推荐", order: 3, relStatus: "已启用" },
  ]),
  seed("看剧", "SC0003", "看剧", "场景词", "已启用", PARTIAL_TARGETS, "Alex", "2026-05-15 09:11:00", [
    { spuId: "SPU10008", spuName: "Netflix", source: "GamsGo", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "主推", order: 1, relStatus: "已启用" },
    { spuId: "SPU10009", spuName: "Disney+", source: "C2C", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "推荐", order: 2, relStatus: "已启用" },
    { spuId: "SPU10010", spuName: "HBO Max", source: "GamsGo", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "否", recLevel: "推荐", order: 3, relStatus: "已启用" },
  ]),
  seed("AI 绘图", "SC0004", "AI绘图", "场景词", "已启用", FULL_TARGETS, "Mark", "2026-05-10 14:30:00", [
    { spuId: "SPU10005", spuName: "Midjourney", source: "GamsGo", category: "AI绘图", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "主推", order: 1, relStatus: "已启用" },
    { spuId: "SPU10006", spuName: "Stable Diffusion", source: "C2C", category: "AI绘图", productStatus: "在售", spuLibStatus: "启用", siteSellable: "部分站点可售", recLevel: "推荐", order: 2, relStatus: "已启用" },
    { spuId: "SPU10007", spuName: "DALL·E", source: "GamsGo", category: "AI绘图", productStatus: "已下架", spuLibStatus: "启用", siteSellable: "是", recLevel: "备选", order: 3, relStatus: "已启用" },
  ]),
  {
    id: "SC0005", name: "学习工具", mainTerm: "学习工具", mainLang: "zh-CN", sceneType: "场景词",
    status: "草稿", remark: "", targetLangs: FULL_TARGETS, postGenStatus: "自动启用",
    overrideExisting: false, keepManual: true,
    expressions: [], spus: [], updater: "Linda", updatedAt: "2026-05-08 19:00:00",
  },
];

// -------------------- 召回计算 --------------------
function computeRecall(scene: Scene, s: SceneSpu): { ok: boolean; reason: string } {
  if (scene.status !== "已启用") return { ok: false, reason: "场景未启用" };
  if (s.relStatus !== "已启用") return { ok: false, reason: "关联停用" };
  if (s.spuLibStatus !== "启用") return { ok: false, reason: "商品搜索状态未启用" };
  if (s.productStatus !== "在售") return { ok: false, reason: "商品下架" };
  if (s.siteSellable === "否") return { ok: false, reason: "当前站点不可售" };
  return { ok: true, reason: "" };
}

function statusBadge(status: SceneStatus | ExprStatus) {
  const map: Record<string, string> = {
    草稿: "bg-slate-100 text-slate-700",
    已启用: "bg-emerald-100 text-emerald-700",
    已停用: "bg-rose-100 text-rose-700",
  };
  return map[status];
}

function transStatusBadge(s: TranslationStatus) {
  const map: Record<TranslationStatus, string> = {
    未生成: "bg-slate-100 text-slate-600",
    生成中: "bg-amber-100 text-amber-700",
    已生成: "bg-emerald-100 text-emerald-700",
    生成失败: "bg-rose-100 text-rose-700",
  };
  return map[s];
}

function genSourceBadge(s: GenSource) {
  const map: Record<GenSource, string> = {
    主场景词: "bg-violet-100 text-violet-700",
    自动翻译: "bg-sky-100 text-sky-700",
    人工编辑: "bg-amber-100 text-amber-700",
  };
  return map[s];
}

function recLevelBadge(level: RecLevel) {
  const map: Record<RecLevel, string> = {
    主推: "bg-amber-100 text-amber-700",
    推荐: "bg-sky-100 text-sky-700",
    备选: "bg-slate-100 text-slate-700",
  };
  return map[level];
}

function sourceBadge(src: ProductSource) {
  return src === "GamsGo"
    ? "bg-indigo-100 text-indigo-700"
    : "bg-teal-100 text-teal-700";
}

// ============================================================
//                       主组件
// ============================================================
export function SceneTermManagement() {
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [view, setView] = useState<"list" | "detail">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  // 筛选
  const [fName, setFName] = useState("");
  const [fMain, setFMain] = useState("");
  const [fExpr, setFExpr] = useState("");
  const [fType, setFType] = useState("全部");
  const [fLang, setFLang] = useState("全部");
  const [fGen, setFGen] = useState("全部");
  const [fSpu, setFSpu] = useState("");
  const [fSource, setFSource] = useState("全部");
  const [fRecall, setFRecall] = useState("全部");
  const [fUpdater, setFUpdater] = useState("");

  const [testOpen, setTestOpen] = useState(false);
  const [testScene, setTestScene] = useState<Scene | null>(null);

  const decoratedRows = useMemo(() => {
    return scenes
      .map((sc) => {
        const target = sc.targetLangs.length;
        const generated = sc.expressions.filter((e) => e.translationStatus === "已生成").length;
        const enabled = sc.expressions.filter((e) => e.status === "已启用").length;
        const pending = sc.expressions.filter((e) => e.translationStatus !== "已生成" || e.status !== "已启用").length
          + Math.max(0, target - sc.expressions.length);
        let recallable = 0; let gamsRec = 0; let c2cRec = 0;
        sc.spus.forEach((s) => {
          if (computeRecall(sc, s).ok) {
            recallable++;
            if (s.source === "GamsGo") gamsRec++; else c2cRec++;
          }
        });
        return { ...sc, target, generated, enabled, pending, total: sc.spus.length, recallable, gamsRec, c2cRec };
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [scenes]);

  const filteredRows = useMemo(() => {
    return decoratedRows.filter((r) => {
      if (fName) {
        const k = fName.toLowerCase();
        if (!r.name.toLowerCase().includes(k) && !r.id.toLowerCase().includes(k)) return false;
      }
      if (fMain && !r.mainTerm.toLowerCase().includes(fMain.toLowerCase())) return false;
      if (fExpr) {
        const k = fExpr.toLowerCase();
        const hit = r.expressions.some(
          (e) => e.content.toLowerCase().includes(k) || e.standard.toLowerCase().includes(k),
        );
        if (!hit) return false;
      }
      if (fType !== "全部" && r.sceneType !== fType) return false;
      if (fLang !== "全部" && !r.expressions.some((e) => e.lang === fLang)) return false;
      if (fGen !== "全部") {
        const has = r.expressions.some((e) => e.translationStatus === fGen);
        const allFlag = fGen === "未生成" ? r.expressions.length < r.target : has;
        if (!allFlag) return false;
      }
      if (fSpu) {
        const k = fSpu.toLowerCase();
        const hit = r.spus.some(
          (s) => s.spuId.toLowerCase().includes(k) || s.spuName.toLowerCase().includes(k),
        );
        if (!hit) return false;
      }
      if (fSource !== "全部" && !r.spus.some((s) => s.source === fSource)) return false;
      if (fRecall === "有可召回 SPU" && r.recallable === 0) return false;
      if (fRecall === "无可召回 SPU" && r.recallable > 0) return false;
      if (fUpdater && !r.updater.toLowerCase().includes(fUpdater.toLowerCase())) return false;
      return true;
    });
  }, [decoratedRows, fName, fMain, fExpr, fType, fLang, fGen, fSpu, fSource, fRecall, fUpdater]);

  function resetFilters() {
    setFName(""); setFMain(""); setFExpr(""); setFType("全部"); setFLang("全部"); setFGen("全部");
    setFSpu(""); setFSource("全部"); setFRecall("全部"); setFUpdater("");
  }

  function openCreate() { setEditingId(null); setView("detail"); }
  function openEdit(id: string) { setEditingId(id); setView("detail"); }
  function backToList() { setView("list"); setEditingId(null); }

  function toggleStatus(row: Scene) {
    const next: SceneStatus = row.status === "已启用" ? "已停用" : "已启用";
    setScenes((prev) => prev.map((p) => (p.id === row.id ? { ...p, status: next, updatedAt: nowStr() } : p)));
    toast.success(`已${next === "已启用" ? "启用" : "停用"}：${row.name}`);
  }

  function saveScene(payload: Scene, isCreate: boolean) {
    setScenes((prev) => {
      if (isCreate) return [{ ...payload, updatedAt: nowStr() }, ...prev];
      return prev.map((p) => (p.id === payload.id ? { ...payload, updatedAt: nowStr() } : p));
    });
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
            <span className="text-slate-700">场景搜索配置</span>
            {view === "detail" && (
              <>
                <span className="px-1">/</span>
                <span className="text-slate-700">{editingId ? "编辑场景" : "新增场景"}</span>
              </>
            )}
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
                  <div className="py-1.5 cursor-pointer text-blue-600 font-medium">场景搜索配置</div>
                </div>
              </div>

              <div className="flex-1 min-w-0 p-4">
                {view === "list" ? (
                  <SceneListView
                    rows={filteredRows}
                    fName={fName} setFName={setFName}
                    fMain={fMain} setFMain={setFMain}
                    fExpr={fExpr} setFExpr={setFExpr}
                    fType={fType} setFType={setFType}
                    fLang={fLang} setFLang={setFLang}
                    fGen={fGen} setFGen={setFGen}
                    fSpu={fSpu} setFSpu={setFSpu}
                    fSource={fSource} setFSource={setFSource}
                    fRecall={fRecall} setFRecall={setFRecall}
                    fUpdater={fUpdater} setFUpdater={setFUpdater}
                    onReset={resetFilters}
                    onCreate={openCreate}
                    onEdit={openEdit}
                    onToggle={toggleStatus}
                    onTest={(sc) => { setTestScene(sc); setTestOpen(true); }}
                  />
                ) : (
                  <SceneDetailView
                    key={editingId ?? "new"}
                    existing={editingId ? scenes.find((s) => s.id === editingId) ?? null : null}
                    allScenes={scenes}
                    onBack={backToList}
                    onSave={saveScene}
                    onTest={(sc) => { setTestScene(sc); setTestOpen(true); }}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <SearchTestSheet open={testOpen} onOpenChange={setTestOpen} scene={testScene} />
    </div>
  );
}

// ============================================================
//                       列表
// ============================================================
interface ListProps {
  rows: (Scene & {
    target: number; generated: number; enabled: number; pending: number;
    total: number; recallable: number; gamsRec: number; c2cRec: number;
  })[];
  fName: string; setFName: (v: string) => void;
  fMain: string; setFMain: (v: string) => void;
  fExpr: string; setFExpr: (v: string) => void;
  fType: string; setFType: (v: string) => void;
  fLang: string; setFLang: (v: string) => void;
  fGen: string; setFGen: (v: string) => void;
  fStatus: string; setFStatus: (v: string) => void;
  fSpu: string; setFSpu: (v: string) => void;
  fSource: string; setFSource: (v: string) => void;
  fRecall: string; setFRecall: (v: string) => void;
  fUpdater: string; setFUpdater: (v: string) => void;
  onReset: () => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onToggle: (row: Scene) => void;
  onTest: (row: Scene) => void;
}

function SceneListView(p: ListProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">场景搜索配置</h1>
        <p className="mt-1 text-xs text-slate-500">
          维护用户在搜索中表达的需求场景。运营只需创建一个场景并填写一个主场景词，系统会自动生成多语言搜索表达，所有语言搜索词共用同一组关联 SPU。
        </p>
      </div>

      {/* 筛选区 */}
      <div className="rounded-md border border-slate-200 bg-white p-4 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-slate-500">场景名称 / 场景 ID</Label>
            <Input value={p.fName} onChange={(e) => p.setFName(e.target.value)} placeholder="请输入" className="mt-1 h-8" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">主场景词</Label>
            <Input value={p.fMain} onChange={(e) => p.setFMain(e.target.value)} placeholder="请输入" className="mt-1 h-8" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">多语言搜索词</Label>
            <Input value={p.fExpr} onChange={(e) => p.setFExpr(e.target.value)} placeholder="按任一表达搜索" className="mt-1 h-8" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">场景类型</Label>
            <Select value={p.fType} onValueChange={p.setFType}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                {SCENE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-slate-500">生成语言</Label>
            <Select value={p.fLang} onValueChange={p.setFLang}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                {ALL_LANGS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500">翻译生成状态</Label>
            <Select value={p.fGen} onValueChange={p.setFGen}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="未生成">未生成</SelectItem>
                <SelectItem value="生成中">生成中</SelectItem>
                <SelectItem value="已生成">已生成</SelectItem>
                <SelectItem value="生成失败">生成失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500">关联 SPU</Label>
            <Input value={p.fSpu} onChange={(e) => p.setFSpu(e.target.value)} placeholder="SPU 名称 / ID" className="mt-1 h-8" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-xs text-slate-500">商品来源</Label>
            <Select value={p.fSource} onValueChange={p.setFSource}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="GamsGo">GamsGo</SelectItem>
                <SelectItem value="C2C">C2C</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500">可召回状态</Label>
            <Select value={p.fRecall} onValueChange={p.setFRecall}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="有可召回 SPU">有可召回 SPU</SelectItem>
                <SelectItem value="无可召回 SPU">无可召回 SPU</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500">最近更新人</Label>
            <Input value={p.fUpdater} onChange={(e) => p.setFUpdater(e.target.value)} placeholder="请输入" className="mt-1 h-8" />
          </div>
          <div className="flex items-end gap-2 justify-end">
            <Button size="sm" className="h-8 bg-blue-500 hover:bg-blue-600"><Search className="h-3.5 w-3.5 mr-1" />查询</Button>
            <Button size="sm" variant="outline" className="h-8" onClick={p.onReset}><RotateCcw className="h-3.5 w-3.5 mr-1" />重置</Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" className="h-8 bg-blue-500 hover:bg-blue-600" onClick={p.onCreate}>
          <Plus className="h-3.5 w-3.5 mr-1" />新增场景
        </Button>
        <Button size="sm" variant="outline" className="h-8" onClick={() => toast.info("批量导入：mock")}>
          <Upload className="h-3.5 w-3.5 mr-1" />批量导入
        </Button>
        <Button size="sm" variant="outline" className="h-8" onClick={() => toast.info("批量导出：mock")}>
          <Download className="h-3.5 w-3.5 mr-1" />批量导出
        </Button>
      </div>

      <div className="rounded-md border border-slate-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">场景 ID</TableHead>
              <TableHead className="w-[120px]">场景名称</TableHead>
              <TableHead className="w-[120px]">主场景词</TableHead>
              <TableHead className="w-[70px]">类型</TableHead>
              <TableHead className="w-[70px] text-center">目标语言</TableHead>
              <TableHead className="w-[70px] text-center">已生成</TableHead>
              <TableHead className="w-[70px] text-center">已启用</TableHead>
              <TableHead className="w-[70px] text-center">待处理</TableHead>
              <TableHead className="w-[80px] text-center">关联 SPU</TableHead>
              <TableHead className="w-[80px] text-center">可召回</TableHead>
              <TableHead className="w-[80px] text-center">GamsGo</TableHead>
              <TableHead className="w-[70px] text-center">C2C</TableHead>
              <TableHead className="w-[70px]">状态</TableHead>
              <TableHead className="w-[80px]">更新人</TableHead>
              <TableHead className="w-[140px]">更新时间</TableHead>
              <TableHead className="w-[210px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {p.rows.length === 0 ? (
              <TableRow><TableCell colSpan={16} className="h-32 text-center text-slate-400">暂无场景配置</TableCell></TableRow>
            ) : (
              p.rows.map((r) => {
                const noRecall = r.total > 0 && r.recallable === 0;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-slate-500">{r.id}</TableCell>
                    <TableCell className="font-medium text-slate-800">{r.name}</TableCell>
                    <TableCell className="text-slate-700">{r.mainTerm}</TableCell>
                    <TableCell>
                      <span className="rounded px-1.5 py-0.5 text-xs bg-fuchsia-100 text-fuchsia-700">{r.sceneType}</span>
                    </TableCell>
                    <TableCell className="text-center">{r.target}</TableCell>
                    <TableCell className="text-center text-emerald-700">{r.generated}</TableCell>
                    <TableCell className="text-center text-blue-700">{r.enabled}</TableCell>
                    <TableCell className="text-center">
                      {r.pending > 0 ? <span className="text-amber-600">{r.pending}</span> : <span className="text-slate-400">0</span>}
                    </TableCell>
                    <TableCell className="text-center">{r.total}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn("inline-flex items-center gap-1", noRecall && "text-amber-600 font-medium")}>
                        {noRecall && <AlertTriangle className="h-3 w-3" />}
                        {r.recallable}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-indigo-600">{r.gamsRec}</TableCell>
                    <TableCell className="text-center text-teal-600">{r.c2cRec}</TableCell>
                    <TableCell>
                      <span className={cn("rounded px-1.5 py-0.5 text-xs", statusBadge(r.status))}>{r.status}</span>
                    </TableCell>
                    <TableCell className="text-slate-600">{r.updater}</TableCell>
                    <TableCell className="text-slate-500">{r.updatedAt}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-blue-600">
                        <button className="hover:underline inline-flex items-center gap-0.5" onClick={() => p.onEdit(r.id)}>
                          <Pencil className="h-3 w-3" />编辑
                        </button>
                        <button className="hover:underline inline-flex items-center gap-0.5" onClick={() => p.onTest(r)}>
                          <FlaskConical className="h-3 w-3" />测试
                        </button>
                        {r.status !== "草稿" && (
                          <button className="hover:underline inline-flex items-center gap-0.5" onClick={() => p.onToggle(r)}>
                            <Power className="h-3 w-3" />{r.status === "已启用" ? "停用" : "启用"}
                          </button>
                        )}
                        <button className="hover:underline inline-flex items-center gap-0.5 text-slate-500" onClick={() => toast.info("查看日志：mock")}>
                          <FileText className="h-3 w-3" />日志
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
          <div>共 {p.rows.length} 条</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7" disabled>上一页</Button>
            <span>1 / 1</span>
            <Button variant="outline" size="sm" className="h-7" disabled>下一页</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//                       详情视图
// ============================================================
interface DetailProps {
  existing: Scene | null;
  allScenes: Scene[];
  onBack: () => void;
  onSave: (payload: Scene, isCreate: boolean) => void;
  onTest: (sc: Scene) => void;
}

function makeBlank(): Scene {
  return {
    id: `SC${String(Date.now()).slice(-6)}`,
    name: "",
    mainTerm: "",
    mainLang: "zh-CN",
    sceneType: "场景词",
    status: "草稿",
    remark: "",
    targetLangs: ALL_LANGS,
    postGenStatus: "自动启用",
    overrideExisting: false,
    keepManual: true,
    expressions: [],
    spus: [],
    updater: "Alex",
    updatedAt: "",
  };
}

function SceneDetailView({ existing, allScenes, onBack, onSave, onTest }: DetailProps) {
  const isCreate = !existing;
  const [draft, setDraft] = useState<Scene>(() =>
    existing
      ? {
          ...existing,
          targetLangs: [...existing.targetLangs],
          expressions: existing.expressions.map((e) => ({ ...e })),
          spus: existing.spus.map((s) => ({ ...s })),
        }
      : makeBlank(),
  );
  const [addSpuOpen, setAddSpuOpen] = useState(false);
  const [exprEditing, setExprEditing] = useState<SceneExpression | null>(null);

  function update<K extends keyof Scene>(key: K, value: Scene[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  // 场景名称即主场景词来源；同步写回 mainTerm
  function updateName(v: string) {
    setDraft((d) => ({ ...d, name: v, mainTerm: v }));
  }

  const [langCfgOpen, setLangCfgOpen] = useState(false);

  function validate(forStatus: SceneStatus): string | null {
    if (!draft.name.trim()) return "请输入场景名称";
    if (forStatus === "已启用") {
      if (!draft.expressions.some((e) => e.status === "已启用"))
        return "请至少存在 1 个已启用多语言搜索词";
      if (draft.spus.length === 0) return "请至少关联 1 个 SPU";
      if (!draft.spus.some((s) => s.relStatus === "已启用"))
        return "请至少保留 1 个关联状态为已启用的 SPU";
    }
    return null;
  }

  function doSave(target: SceneStatus) {
    const err = validate(target);
    if (err) { toast.error(err); return; }
    if (target === "已启用") {
      const recallable = draft.spus.filter((s) => computeRecall({ ...draft, status: "已启用" }, s).ok).length;
      if (recallable === 0 && draft.spus.length > 0) {
        toast.warning("当前场景暂无可召回 SPU，启用后前台可能无结果，请检查关联 SPU 的商品搜索状态、商品状态或站点售卖配置。");
      }
    }
    onSave({ ...draft, mainTerm: draft.name, status: target }, isCreate);
    toast.success(`已保存：${draft.name}（${target}）`);
    onBack();
  }

  // 跨场景 / 直连词条 / 属性词 校验
  function runConflictChecks(name: string) {
    const std = normalizeTerm(name);
    if (!std) return;
    const cross = allScenes.find(
      (sc) => sc.id !== draft.id && sc.expressions.some((e) => e.standard === std),
    );
    if (cross) toast.warning(`该词已被场景"${cross.name}"使用，可能命中多个场景。`);
    if (SPU_DIRECT_STANDARDS.has(std)) toast.warning("该词已被配置为商品直连词条，明确商品结果将优先于场景结果。");
    if (ATTR_WORDS.includes(std)) toast.warning("该词更适合通过商品属性搜索数据自动参与搜索，不建议作为场景搜索词启用。");
  }

  // 保存多语言配置弹窗
  function saveLangConfig(rows: Array<{ lang: SceneLang; content: string; manual: boolean }>) {
    const prevByLang = new Map(draft.expressions.map((e) => [e.lang, e]));
    const next: SceneExpression[] = rows
      .filter((r) => r.content.trim() !== "")
      .map((r) => {
        const existing = prevByLang.get(r.lang);
        const isMain = r.lang === "zh-CN";
        return {
          id: existing?.id ?? uid("E"),
          lang: r.lang,
          content: r.content.trim(),
          standard: normalizeTerm(r.content),
          genSource: r.manual ? "人工编辑" : (isMain ? "主场景词" : "自动翻译"),
          translationStatus: "已生成",
          status: existing?.status ?? "已启用",
          updater: "Alex",
          updatedAt: nowStr(),
        };
      });
    setDraft((d) => ({ ...d, expressions: next, targetLangs: next.map((e) => e.lang) }));
    runConflictChecks(draft.name);
    toast.success(`已保存 ${next.length} 个多语言搜索词`);
    setLangCfgOpen(false);
  }

  // 单语言搜索词操作
  function regenOne(lang: SceneLang) {
    setDraft((d) => {
      const exprs = d.expressions.map((e) => {
        if (e.lang !== lang) return e;
        const isMain = lang === d.mainLang;
        const content = isMain ? d.mainTerm : translate(d.mainTerm, lang);
        return {
          ...e, content, standard: normalizeTerm(content),
          genSource: isMain ? "主场景词" : "自动翻译" as GenSource,
          translationStatus: "已生成" as TranslationStatus,
          updater: "Alex", updatedAt: nowStr(),
        };
      });
      return { ...d, expressions: exprs };
    });
    toast.success(`已重新生成：${lang}`);
  }
  function toggleExpr(id: string) {
    setDraft((d) => ({
      ...d,
      expressions: d.expressions.map((e) =>
        e.id === id ? { ...e, status: e.status === "已启用" ? "已停用" : "已启用", updatedAt: nowStr() } : e,
      ),
    }));
  }
  function removeExpr(id: string) {
    setDraft((d) => ({ ...d, expressions: d.expressions.filter((e) => e.id !== id) }));
  }
  function saveExprEdit(payload: SceneExpression) {
    const std = normalizeTerm(payload.content);
    if (!payload.content.trim()) { toast.error("搜索词内容不能为空"); return; }
    const dupSame = draft.expressions.find(
      (e) => e.id !== payload.id && e.lang === payload.lang && e.standard === std,
    );
    if (dupSame) { toast.error("当前场景下已存在相同语言和标准化词的搜索词。"); return; }
    setDraft((d) => ({
      ...d,
      expressions: d.expressions.map((e) =>
        e.id === payload.id
          ? { ...payload, standard: std, genSource: "人工编辑", translationStatus: "已生成", updater: "Alex", updatedAt: nowStr() }
          : e,
      ),
    }));
    setExprEditing(null);
  }

  // SPU 操作
  function addSpus(picked: typeof CANDIDATE_SPUS) {
    const existingIds = new Set(draft.spus.map((s) => s.spuId));
    const newOnes: SceneSpu[] = picked
      .filter((p) => !existingIds.has(p.spuId))
      .map((p, i) => ({ ...p, recLevel: "推荐" as RecLevel, order: draft.spus.length + i + 1, relStatus: "已启用" as RelStatus }));
    setDraft((d) => ({ ...d, spus: [...d.spus, ...newOnes] }));
    setAddSpuOpen(false);
  }
  function removeSpu(id: string) {
    setDraft((d) => ({ ...d, spus: d.spus.filter((s) => s.spuId !== id) }));
  }
  function updateSpu(id: string, patch: Partial<SceneSpu>) {
    setDraft((d) => ({ ...d, spus: d.spus.map((s) => (s.spuId === id ? { ...s, ...patch } : s)) }));
  }
  function moveSpu(id: string, dir: -1 | 1) {
    setDraft((d) => {
      const list = [...d.spus];
      const i = list.findIndex((s) => s.spuId === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return d;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...d, spus: list.map((s, k) => ({ ...s, order: k + 1 })) };
    });
  }

  const sortedSpus = useMemo(() => {
    return [...draft.spus].sort((a, b) => {
      const rd = REC_RANK[a.recLevel] - REC_RANK[b.recLevel];
      if (rd !== 0) return rd;
      return a.order - b.order;
    });
  }, [draft.spus]);

  const sortedExprs = useMemo(() => {
    return [...draft.expressions].sort((a, b) => {
      if (a.lang === "zh-CN") return -1;
      if (b.lang === "zh-CN") return 1;
      return a.lang.localeCompare(b.lang);
    });
  }, [draft.expressions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />返回
        </Button>
        <h1 className="text-lg font-semibold text-slate-800">{isCreate ? "新增场景" : "编辑场景"}</h1>
      </div>

      {/* 区域一：基础信息 */}
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">场景基础信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-600">场景名称 <span className="text-rose-500">*</span></Label>
            <div className="mt-1 flex items-center gap-2">
              <Input value={draft.name} onChange={(e) => updateName(e.target.value)} placeholder="例如：AI工具 / 写论文 / 看剧" className="h-8 flex-1" />
              <Button size="sm" variant="outline" className="h-8" onClick={() => {
                if (!draft.name.trim()) { toast.error("请先填写场景名称"); return; }
                setLangCfgOpen(true);
              }}>
                <Languages className="h-3.5 w-3.5 mr-1" />配置
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">点击"配置"打开多语言搜索词弹窗，可自动翻译填充各语言文案。</p>
          </div>
          <div>
            <Label className="text-xs text-slate-600">场景类型 <span className="text-rose-500">*</span></Label>
            <Select value={draft.sceneType} onValueChange={(v) => update("sceneType", v as SceneType)}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{SCENE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-600">备注</Label>
            <Textarea value={draft.remark} onChange={(e) => update("remark", e.target.value)} placeholder="运营说明" className="mt-1 min-h-[60px]" />
          </div>
        </div>
      </section>


      {/* 区域三：多语言搜索词结果 */}
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-slate-500" />多语言搜索词结果
              <span className="text-[11px] font-normal text-slate-400">
                共 {draft.expressions.length} 条 · 已启用 {draft.expressions.filter((e) => e.status === "已启用").length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              下表展示系统根据主场景词自动生成的多语言搜索表达。可编辑、停用或重新生成单个语言。
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">语言</TableHead>
                <TableHead className="w-[110px]">语言名称</TableHead>
                <TableHead>搜索词内容</TableHead>
                <TableHead>标准化词</TableHead>
                <TableHead className="w-[90px]">生成来源</TableHead>
                <TableHead className="w-[90px]">翻译状态</TableHead>
                <TableHead className="w-[80px]">词条状态</TableHead>
                <TableHead className="w-[80px]">更新人</TableHead>
                <TableHead className="w-[140px]">更新时间</TableHead>
                <TableHead className="w-[180px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExprs.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="h-24 text-center text-slate-400">尚未生成多语言搜索词，请填写主场景词并点击"生成多语言搜索词"。</TableCell></TableRow>
              ) : (
                sortedExprs.map((e) => {
                  const isMain = e.lang === draft.mainLang;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="text-slate-700 font-medium">
                        {e.lang}{isMain && <span className="ml-1 text-[10px] text-violet-600">(主)</span>}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">{LANG_NAMES[e.lang]}</TableCell>
                      <TableCell className="text-slate-800">{e.content}</TableCell>
                      <TableCell className="text-slate-600">{e.standard}</TableCell>
                      <TableCell><span className={cn("rounded px-1.5 py-0.5 text-xs", genSourceBadge(e.genSource))}>{e.genSource}</span></TableCell>
                      <TableCell><span className={cn("rounded px-1.5 py-0.5 text-xs", transStatusBadge(e.translationStatus))}>{e.translationStatus}</span></TableCell>
                      <TableCell><span className={cn("rounded px-1.5 py-0.5 text-xs", statusBadge(e.status))}>{e.status}</span></TableCell>
                      <TableCell className="text-slate-600">{e.updater}</TableCell>
                      <TableCell className="text-slate-500 text-xs">{e.updatedAt}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-blue-600 text-xs">
                          <button className="hover:underline inline-flex items-center gap-0.5" onClick={() => setExprEditing(e)}>
                            <Pencil className="h-3 w-3" />编辑
                          </button>
                          <button className="hover:underline inline-flex items-center gap-0.5" onClick={() => regenOne(e.lang)}>
                            <RefreshCw className="h-3 w-3" />重新生成
                          </button>
                          <button className="hover:underline inline-flex items-center gap-0.5" onClick={() => toggleExpr(e.id)}>
                            <Power className="h-3 w-3" />{e.status === "已启用" ? "停用" : "启用"}
                          </button>
                          {!isMain && (
                            <button className="text-rose-600 hover:underline inline-flex items-center gap-0.5" onClick={() => removeExpr(e.id)}>
                              <Trash2 className="h-3 w-3" />删除
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* 区域四：关联 SPU 配置 */}
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">关联 SPU 配置</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">所有多语言搜索词共用同一组关联 SPU。最终是否展示由商品搜索状态、商品状态、站点可售状态等条件决定。</p>
          </div>
          <Button size="sm" variant="outline" className="h-8" onClick={() => setAddSpuOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />添加 SPU
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">SPU ID</TableHead>
                <TableHead>SPU 名称</TableHead>
                <TableHead className="w-[90px]">SPU 分类</TableHead>
                <TableHead className="w-[110px]">商品搜索状态</TableHead>
                <TableHead className="w-[100px]">推荐级别</TableHead>
                <TableHead className="w-[110px]">场景内排序</TableHead>
                <TableHead className="w-[80px]">关联状态</TableHead>
                <TableHead className="w-[150px]">召回状态</TableHead>
                <TableHead className="w-[80px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSpus.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="h-24 text-center text-slate-400">暂无关联 SPU，点击"添加 SPU"开始配置</TableCell></TableRow>
              ) : (
                sortedSpus.map((s) => {
                  const r = computeRecall(draft, s);
                  return (
                    <TableRow key={s.spuId}>
                      <TableCell className="text-slate-500">{s.spuId}</TableCell>
                      <TableCell className="font-medium text-slate-800">{s.spuName}</TableCell>
                      <TableCell className="text-slate-600 text-xs">{s.category}</TableCell>
                      <TableCell className="text-xs">{s.spuLibStatus}</TableCell>
                      <TableCell>
                        <Select value={s.recLevel} onValueChange={(v) => updateSpu(s.spuId, { recLevel: v as RecLevel })}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{REC_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input type="number" value={s.order} onChange={(e) => updateSpu(s.spuId, { order: Number(e.target.value) || 1 })} className="h-7 w-14 text-xs" />
                          <button className="text-slate-400 hover:text-blue-600" onClick={() => moveSpu(s.spuId, -1)}><ArrowUp className="h-3 w-3" /></button>
                          <button className="text-slate-400 hover:text-blue-600" onClick={() => moveSpu(s.spuId, 1)}><ArrowDown className="h-3 w-3" /></button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={s.relStatus} onValueChange={(v) => updateSpu(s.spuId, { relStatus: v as RelStatus })}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="已启用">已启用</SelectItem>
                            <SelectItem value="已停用">已停用</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {r.ok ? <span className="text-xs text-emerald-600">可召回</span> : <span className="text-xs text-rose-600">不可召回：{r.reason}</span>}
                      </TableCell>
                      <TableCell>
                        <button className="text-rose-600 hover:underline text-xs inline-flex items-center gap-0.5" onClick={() => removeSpu(s.spuId)}>
                          <Trash2 className="h-3 w-3" />移除
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">排序优先级：主推 &gt; 推荐 &gt; 备选，同级别按"场景内排序"升序。</p>
      </section>

      {/* 操作区 */}
      <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-slate-100 py-2">
        <Button variant="outline" size="sm" className="h-8" onClick={onBack}>取消</Button>
        <Button variant="outline" size="sm" className="h-8" onClick={() => onTest(draft)}>
          <FlaskConical className="h-3.5 w-3.5 mr-1" />搜索测试
        </Button>
        <Button variant="outline" size="sm" className="h-8" onClick={() => doSave("草稿")}>保存草稿</Button>
        {draft.status !== "已停用" && (
          <Button size="sm" className="h-8 bg-blue-500 hover:bg-blue-600" onClick={() => doSave("已启用")}>保存并启用</Button>
        )}
        {!isCreate && draft.status !== "已停用" && (
          <Button size="sm" variant="outline" className="h-8" onClick={() => doSave("已停用")}>保存并停用</Button>
        )}
      </div>

      <AddSpuDialog open={addSpuOpen} onOpenChange={setAddSpuOpen} existingIds={draft.spus.map((s) => s.spuId)} onConfirm={addSpus} />
      <EditExprDialog editing={exprEditing} onOpenChange={(v) => { if (!v) setExprEditing(null); }} onSave={saveExprEdit} />
      <LangConfigDialog
        open={langCfgOpen}
        onOpenChange={setLangCfgOpen}
        sceneName={draft.name}
        expressions={draft.expressions}
        onSave={saveLangConfig}
      />
    </div>
  );
}

// ============================================================
//                       编辑单语言搜索词弹窗
// ============================================================
function EditExprDialog({
  editing, onOpenChange, onSave,
}: {
  editing: SceneExpression | null;
  onOpenChange: (v: boolean) => void;
  onSave: (payload: SceneExpression) => void;
}) {
  const open = !!editing;
  const [draft, setDraft] = useState<SceneExpression | null>(editing);
  useEffect(() => { setDraft(editing); }, [editing]);

  if (!draft) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>编辑</DialogTitle></DialogHeader></DialogContent>
      </Dialog>
    );
  }
  const std = normalizeTerm(draft.content);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>编辑单语言搜索词</DialogTitle>
          <DialogDescription>编辑后该语言的"生成来源"将变为"人工编辑"，重新生成时默认不会覆盖。</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">语言</Label>
            <Input value={`${draft.lang} · ${LANG_NAMES[draft.lang]}`} readOnly className="mt-1 h-8 bg-slate-50 cursor-not-allowed" />
          </div>
          <div>
            <Label className="text-xs">词条状态</Label>
            <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as ExprStatus })}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="草稿">草稿</SelectItem>
                <SelectItem value="已启用">已启用</SelectItem>
                <SelectItem value="已停用">已停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">搜索词内容 <span className="text-rose-500">*</span></Label>
            <Input value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} className="mt-1 h-8" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">标准化词（自动生成）</Label>
            <Input value={std} readOnly className="mt-1 h-8 bg-slate-50 cursor-not-allowed" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => onSave(draft)}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
//                       添加 SPU 弹窗
// ============================================================
function AddSpuDialog({
  open, onOpenChange, existingIds, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingIds: string[];
  onConfirm: (picked: typeof CANDIDATE_SPUS) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [source, setSource] = useState<string>("全部");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    return CANDIDATE_SPUS.filter((s) => {
      if (existingIds.includes(s.spuId)) return false;
      if (source !== "全部" && s.source !== source) return false;
      if (!keyword) return true;
      const k = keyword.toLowerCase();
      return s.spuId.toLowerCase().includes(k) || s.spuName.toLowerCase().includes(k) || s.category.toLowerCase().includes(k);
    });
  }, [keyword, source, existingIds]);

  function toggle(id: string) {
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setPicked(new Set()); setKeyword(""); setSource("全部"); } }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>添加 SPU</DialogTitle>
          <DialogDescription>按 SPU 名称 / ID / 分类搜索，可按商品来源过滤，勾选后批量添加。</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索 SPU ID / 名称 / 分类" className="h-8 flex-1" />
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部来源</SelectItem>
                <SelectItem value="GamsGo">GamsGo</SelectItem>
                <SelectItem value="C2C">C2C</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="max-h-[400px] overflow-auto rounded border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[90px]">SPU ID</TableHead>
                  <TableHead>SPU 名称</TableHead>
                  <TableHead className="w-[80px]">来源</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>商品状态</TableHead>
                  <TableHead>词库状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s) => (
                  <TableRow key={s.spuId} className="cursor-pointer" onClick={() => toggle(s.spuId)}>
                    <TableCell><input type="checkbox" checked={picked.has(s.spuId)} onChange={() => toggle(s.spuId)} /></TableCell>
                    <TableCell className="text-slate-500">{s.spuId}</TableCell>
                    <TableCell className="font-medium">{s.spuName}</TableCell>
                    <TableCell><span className={cn("rounded px-1.5 py-0.5 text-xs", sourceBadge(s.source))}>{s.source}</span></TableCell>
                    <TableCell>{s.category}</TableCell>
                    <TableCell>{s.productStatus}</TableCell>
                    <TableCell>{s.spuLibStatus}</TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="h-20 text-center text-slate-400">无匹配 SPU</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600" disabled={picked.size === 0} onClick={() => onConfirm(list.filter((s) => picked.has(s.spuId)))}>
            添加 {picked.size > 0 ? `(${picked.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
//                       搜索测试侧拉
// ============================================================
function SearchTestSheet({
  open, onOpenChange, scene,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scene: Scene | null;
}) {
  const [keyword, setKeyword] = useState("");
  const [site, setSite] = useState("全球站");
  const [lang, setLang] = useState<SceneLang>("zh-CN");
  const [userState, setUserState] = useState("全部");

  if (!scene) return null;

  const input = keyword || (scene.expressions.find((e) => e.lang === lang)?.content ?? scene.mainTerm);
  const std = normalizeTerm(input);
  // 命中规则：标准化词匹配，且当前语言搜索词已启用
  const hitExpr = scene.expressions.find(
    (e) => e.standard === std && e.lang === lang && e.status === "已启用",
  );

  const ranked = [...scene.spus]
    .sort((a, b) => {
      const rd = REC_RANK[a.recLevel] - REC_RANK[b.recLevel];
      if (rd !== 0) return rd;
      return a.order - b.order;
    })
    .map((s) => ({ ...s, recall: computeRecall(scene, s) }));

  const recallable = ranked.filter((s) => s.recall.ok);
  const gamsRec = recallable.filter((s) => s.source === "GamsGo").length;
  const c2cRec = recallable.filter((s) => s.source === "C2C").length;

  const finalGams = recallable.filter((s) => s.source === "GamsGo").slice(0, 5);
  const finalC2c = recallable.filter((s) => s.source === "C2C").slice(0, 5);
  let final = [...finalGams, ...finalC2c];
  if (final.length < 10) {
    const remainGams = recallable.filter((s) => s.source === "GamsGo" && !final.includes(s));
    const remainC2c = recallable.filter((s) => s.source === "C2C" && !final.includes(s));
    final = [...final, ...remainGams, ...remainC2c].slice(0, 10);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[720px] sm:max-w-[720px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>搜索测试 — {scene.name}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">测试搜索词</Label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={scene.mainTerm} className="mt-1 h-8" />
            </div>
            <div>
              <Label className="text-xs">站点</Label>
              <Select value={site} onValueChange={setSite}>
                <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="全球站">全球站</SelectItem>
                  <SelectItem value="意大利站">意大利站</SelectItem>
                  <SelectItem value="美国站">美国站</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">语言</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as SceneLang)}>
                <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_LANGS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">用户状态</Label>
              <Select value={userState} onValueChange={setUserState}>
                <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部</SelectItem>
                  <SelectItem value="登录">登录</SelectItem>
                  <SelectItem value="未登录">未登录</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
            <div><span className="text-slate-500">原始搜索词：</span>{input}</div>
            <div><span className="text-slate-500">标准化搜索词：</span>{std}</div>
            <div><span className="text-slate-500">命中场景：</span>{hitExpr ? scene.name : <span className="text-rose-600">未命中</span>}</div>
            <div><span className="text-slate-500">命中语言 / 搜索词：</span>{hitExpr ? `${hitExpr.lang} · ${hitExpr.content}` : "—"}</div>
            <div><span className="text-slate-500">生成来源：</span>{hitExpr?.genSource ?? "—"}</div>
            <div><span className="text-slate-500">场景类型 / 状态：</span>{scene.sceneType} / {scene.status}</div>
            <div><span className="text-slate-500">关联 / 可召回：</span>{scene.spus.length} / {recallable.length}（GamsGo {gamsRec} · C2C {c2cRec}）</div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">最终召回结果（最多 10 个）</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>SPU</TableHead>
                  <TableHead className="w-[80px]">来源</TableHead>
                  <TableHead className="w-[80px]">推荐级别</TableHead>
                  <TableHead className="w-[60px]">排序</TableHead>
                  <TableHead>召回状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {final.map((s, i) => (
                  <TableRow key={s.spuId}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{s.spuName}</TableCell>
                    <TableCell><span className={cn("rounded px-1.5 py-0.5 text-xs", sourceBadge(s.source))}>{s.source}</span></TableCell>
                    <TableCell><span className={cn("rounded px-1.5 py-0.5 text-xs", recLevelBadge(s.recLevel))}>{s.recLevel}</span></TableCell>
                    <TableCell>{s.order}</TableCell>
                    <TableCell><span className="text-emerald-600 text-xs">可召回</span></TableCell>
                  </TableRow>
                ))}
                {final.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="h-20 text-center text-slate-400">无可召回结果</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {ranked.some((s) => !s.recall.ok) && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">不可召回 SPU 明细</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SPU</TableHead>
                    <TableHead className="w-[80px]">来源</TableHead>
                    <TableHead>原因</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranked.filter((s) => !s.recall.ok).map((s) => (
                    <TableRow key={s.spuId}>
                      <TableCell className="font-medium">{s.spuName}</TableCell>
                      <TableCell><span className={cn("rounded px-1.5 py-0.5 text-xs", sourceBadge(s.source))}>{s.source}</span></TableCell>
                      <TableCell className="text-rose-600 text-xs">{s.recall.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
// ============================================================
//                       多语言配置弹窗
// ============================================================
function LangConfigDialog({
  open, onOpenChange, sceneName, expressions, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sceneName: string;
  expressions: SceneExpression[];
  onSave: (rows: Array<{ lang: SceneLang; content: string; manual: boolean }>) => void;
}) {
  type Row = { lang: SceneLang; content: string; manual: boolean };
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!open) return;
    const byLang = new Map(expressions.map((e) => [e.lang, e]));
    const ordered: SceneLang[] = ["zh-CN", "en", ...ALL_LANGS.filter((l) => l !== "zh-CN" && l !== "en")];
    setRows(
      ordered.map((l) => {
        const e = byLang.get(l);
        return {
          lang: l,
          content: e?.content ?? "",
          manual: e?.genSource === "人工编辑",
        };
      }),
    );
  }, [open, expressions]);

  function setContent(lang: SceneLang, val: string) {
    setRows((rs) => rs.map((r) => (r.lang === lang ? { ...r, content: val, manual: true } : r)));
  }

  function fillMain() {
    if (!sceneName.trim()) { toast.error("场景名称为空"); return; }
    setRows((rs) => rs.map((r) => (r.lang === "zh-CN" ? { ...r, content: sceneName, manual: false } : r)));
    toast.success("已填充简体中文");
  }

  function translateAll() {
    const zh = rows.find((r) => r.lang === "zh-CN")?.content.trim() || sceneName.trim();
    if (!zh) { toast.error("请先填写简体中文文案"); return; }
    setRows((rs) =>
      rs.map((r) => {
        if (r.lang === "zh-CN") return { ...r, content: zh, manual: false };
        return { ...r, content: translate(zh, r.lang), manual: false };
      }),
    );
    toast.success("已全部翻译");
  }

  function translateNonManual() {
    const zh = rows.find((r) => r.lang === "zh-CN")?.content.trim() || sceneName.trim();
    if (!zh) { toast.error("请先填写简体中文文案"); return; }
    setRows((rs) =>
      rs.map((r) => {
        if (r.manual) return r;
        if (r.lang === "zh-CN") return { ...r, content: zh, manual: false };
        return { ...r, content: translate(zh, r.lang), manual: false };
      }),
    );
    toast.success("已翻译非人工部分");
  }

  function handleSave() {
    const zh = rows.find((r) => r.lang === "zh-CN");
    const en = rows.find((r) => r.lang === "en");
    if (!zh?.content.trim()) { toast.error("简体中文文案为必填"); return; }
    if (!en?.content.trim()) { toast.error("英语文案为必填"); return; }
    onSave(rows);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>配置内容</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700">文案</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7" onClick={fillMain}>填充</Button>
            <Button size="sm" variant="outline" className="h-7" onClick={translateAll}>全部翻译</Button>
            <Button size="sm" variant="outline" className="h-7" onClick={translateNonManual}>非人工部分翻译</Button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-auto rounded border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">语言</TableHead>
                <TableHead>文案</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const required = r.lang === "zh-CN" || r.lang === "en";
                return (
                  <TableRow key={r.lang}>
                    <TableCell className="text-slate-700 text-xs">
                      {LANG_NAMES[r.lang]}[{r.lang}]
                      {required && <span className="ml-1 text-rose-500">*</span>}
                      {r.manual && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-700">人工</span>}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={r.content}
                        onChange={(e) => setContent(r.lang, e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
