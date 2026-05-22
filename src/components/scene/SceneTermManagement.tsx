import { useMemo, useState } from "react";
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
  | "全语言通用"
  | "en"
  | "zh-CN"
  | "zh-TW"
  | "it"
  | "ko"
  | "ja"
  | "de"
  | "fr"
  | "es";
type MatchType = "精准匹配";
type SceneStatus = "草稿" | "已启用" | "已停用";
type ExprStatus = "草稿" | "已启用" | "已停用";
type RecLevel = "主推" | "推荐" | "备选";
type RelStatus = "已启用" | "已停用";
type ProductStatus = "待上架" | "在售" | "售罄" | "已下架";
type SpuLibStatus = "未配置" | "草稿" | "启用" | "停用";
type SiteSellable = "是" | "否" | "部分站点可售";
type ProductSource = "GamsGo" | "C2C";

interface SceneExpression {
  id: string;
  content: string;
  standard: string;
  lang: SceneLang;
  matchType: MatchType;
  status: ExprStatus;
  remark?: string;
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
  sceneType: SceneType;
  status: SceneStatus;
  remark: string;
  expressions: SceneExpression[];
  spus: SceneSpu[];
  updater: string;
  updatedAt: string;
}

// -------------------- 常量 --------------------
const SCENE_TYPES: SceneType[] = ["场景词", "品类词"];
const LANGS: SceneLang[] = [
  "全语言通用",
  "en",
  "zh-CN",
  "zh-TW",
  "it",
  "ko",
  "ja",
  "de",
  "fr",
  "es",
];
const REC_LEVELS: RecLevel[] = ["主推", "推荐", "备选"];
const REC_RANK: Record<RecLevel, number> = { 主推: 0, 推荐: 1, 备选: 2 };

const ATTR_WORDS = ["4k", "family", "礼品码", "tv", "mac", "账号密码", "邀请链接"];
const SPU_DIRECT_STANDARDS = new Set(["openai", "chatgpt", "netflix", "spotify"]);

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
  s = s.replace(/[\s\-_.·]/g, "");
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

// -------------------- 初始数据 --------------------
const initialScenes: Scene[] = [
  {
    id: "SC0001",
    name: "AI 工具",
    sceneType: "品类词",
    status: "已启用",
    remark: "AI 工具品类入口",
    updater: "Alex",
    updatedAt: "2026-05-20 16:00:24",
    expressions: [
      { id: uid("E"), content: "AI tools", standard: "aitools", lang: "全语言通用", matchType: "精准匹配", status: "已启用", updater: "Alex", updatedAt: "2026-05-20 16:00:24" },
      { id: uid("E"), content: "AI tool", standard: "aitool", lang: "全语言通用", matchType: "精准匹配", status: "已启用", updater: "Alex", updatedAt: "2026-05-20 16:00:24" },
      { id: uid("E"), content: "AI工具", standard: "ai工具", lang: "zh-CN", matchType: "精准匹配", status: "已启用", updater: "Alex", updatedAt: "2026-05-20 16:00:24" },
      { id: uid("E"), content: "人工智能工具", standard: "人工智能工具", lang: "zh-CN", matchType: "精准匹配", status: "已启用", updater: "Alex", updatedAt: "2026-05-20 16:00:24" },
      { id: uid("E"), content: "strumenti AI", standard: "strumentiai", lang: "it", matchType: "精准匹配", status: "已启用", updater: "Alex", updatedAt: "2026-05-20 16:00:24" },
      { id: uid("E"), content: "herramientas de IA", standard: "herramientasdeia", lang: "es", matchType: "精准匹配", status: "已启用", updater: "Alex", updatedAt: "2026-05-20 16:00:24" },
    ],
    spus: [
      { spuId: "SPU10001", spuName: "ChatGPT Plus", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "主推", order: 1, relStatus: "已启用" },
      { spuId: "SPU10002", spuName: "Claude", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "停用", siteSellable: "是", recLevel: "推荐", order: 2, relStatus: "已启用" },
      { spuId: "SPU10003", spuName: "Perplexity", source: "C2C", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "推荐", order: 3, relStatus: "已启用" },
      { spuId: "SPU10004", spuName: "Gemini", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "备选", order: 4, relStatus: "已停用" },
    ],
  },
  {
    id: "SC0002",
    name: "写论文",
    sceneType: "场景词",
    status: "已启用",
    remark: "AI 写作类需求",
    updater: "Linda",
    updatedAt: "2026-05-18 10:22:10",
    expressions: [
      { id: uid("E"), content: "写论文", standard: "写论文", lang: "zh-CN", matchType: "精准匹配", status: "已启用", updater: "Linda", updatedAt: "2026-05-18 10:22:10" },
      { id: uid("E"), content: "AI写论文", standard: "ai写论文", lang: "zh-CN", matchType: "精准匹配", status: "已启用", updater: "Linda", updatedAt: "2026-05-18 10:22:10" },
      { id: uid("E"), content: "essay writer", standard: "essaywriter", lang: "en", matchType: "精准匹配", status: "已启用", updater: "Linda", updatedAt: "2026-05-18 10:22:10" },
      { id: uid("E"), content: "write essay", standard: "writeessay", lang: "en", matchType: "精准匹配", status: "已启用", updater: "Linda", updatedAt: "2026-05-18 10:22:10" },
      { id: uid("E"), content: "scrivere tesi", standard: "scriveretesi", lang: "it", matchType: "精准匹配", status: "已启用", updater: "Linda", updatedAt: "2026-05-18 10:22:10" },
    ],
    spus: [
      { spuId: "SPU10001", spuName: "ChatGPT Plus", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "主推", order: 1, relStatus: "已启用" },
      { spuId: "SPU10002", spuName: "Claude", source: "GamsGo", category: "AI工具", productStatus: "在售", spuLibStatus: "停用", siteSellable: "是", recLevel: "推荐", order: 2, relStatus: "已启用" },
      { spuId: "SPU10003", spuName: "Perplexity", source: "C2C", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "推荐", order: 3, relStatus: "已启用" },
    ],
  },
  {
    id: "SC0003",
    name: "看剧",
    sceneType: "场景词",
    status: "已启用",
    remark: "",
    updater: "Alex",
    updatedAt: "2026-05-15 09:11:00",
    expressions: [
      { id: uid("E"), content: "看剧", standard: "看剧", lang: "zh-CN", matchType: "精准匹配", status: "已启用", updater: "Alex", updatedAt: "2026-05-15 09:11:00" },
      { id: uid("E"), content: "watch series", standard: "watchseries", lang: "en", matchType: "精准匹配", status: "已启用", updater: "Alex", updatedAt: "2026-05-15 09:11:00" },
      { id: uid("E"), content: "guardare serie", standard: "guardareserie", lang: "it", matchType: "精准匹配", status: "已启用", updater: "Alex", updatedAt: "2026-05-15 09:11:00" },
      { id: uid("E"), content: "影视会员", standard: "影视会员", lang: "zh-CN", matchType: "精准匹配", status: "草稿", updater: "Alex", updatedAt: "2026-05-15 09:11:00" },
    ],
    spus: [
      { spuId: "SPU10008", spuName: "Netflix", source: "GamsGo", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "主推", order: 1, relStatus: "已启用" },
      { spuId: "SPU10009", spuName: "Disney+", source: "C2C", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "推荐", order: 2, relStatus: "已启用" },
      { spuId: "SPU10010", spuName: "HBO Max", source: "GamsGo", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "否", recLevel: "推荐", order: 3, relStatus: "已启用" },
    ],
  },
  {
    id: "SC0004",
    name: "AI 绘图",
    sceneType: "场景词",
    status: "已启用",
    remark: "",
    updater: "Mark",
    updatedAt: "2026-05-10 14:30:00",
    expressions: [
      { id: uid("E"), content: "AI art", standard: "aiart", lang: "全语言通用", matchType: "精准匹配", status: "已启用", updater: "Mark", updatedAt: "2026-05-10 14:30:00" },
      { id: uid("E"), content: "AI绘图", standard: "ai绘图", lang: "zh-CN", matchType: "精准匹配", status: "已启用", updater: "Mark", updatedAt: "2026-05-10 14:30:00" },
      { id: uid("E"), content: "AI image", standard: "aiimage", lang: "en", matchType: "精准匹配", status: "已启用", updater: "Mark", updatedAt: "2026-05-10 14:30:00" },
      { id: uid("E"), content: "imagen IA", standard: "imagenia", lang: "es", matchType: "精准匹配", status: "已启用", updater: "Mark", updatedAt: "2026-05-10 14:30:00" },
      { id: uid("E"), content: "immagine AI", standard: "immagineai", lang: "it", matchType: "精准匹配", status: "已启用", updater: "Mark", updatedAt: "2026-05-10 14:30:00" },
    ],
    spus: [
      { spuId: "SPU10005", spuName: "Midjourney", source: "GamsGo", category: "AI绘图", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "主推", order: 1, relStatus: "已启用" },
      { spuId: "SPU10006", spuName: "Stable Diffusion", source: "C2C", category: "AI绘图", productStatus: "在售", spuLibStatus: "启用", siteSellable: "部分站点可售", recLevel: "推荐", order: 2, relStatus: "已启用" },
      { spuId: "SPU10007", spuName: "DALL·E", source: "GamsGo", category: "AI绘图", productStatus: "已下架", spuLibStatus: "启用", siteSellable: "是", recLevel: "备选", order: 3, relStatus: "已启用" },
    ],
  },
  {
    id: "SC0005",
    name: "学习工具",
    sceneType: "场景词",
    status: "草稿",
    remark: "",
    updater: "Linda",
    updatedAt: "2026-05-08 19:00:00",
    expressions: [
      { id: uid("E"), content: "学习工具", standard: "学习工具", lang: "zh-CN", matchType: "精准匹配", status: "草稿", updater: "Linda", updatedAt: "2026-05-08 19:00:00" },
      { id: uid("E"), content: "study tools", standard: "studytools", lang: "en", matchType: "精准匹配", status: "草稿", updater: "Linda", updatedAt: "2026-05-08 19:00:00" },
    ],
    spus: [],
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

function langBadge(lang: SceneLang) {
  return lang === "全语言通用"
    ? "bg-violet-100 text-violet-700"
    : "bg-sky-100 text-sky-700";
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
  const [fExpr, setFExpr] = useState("");
  const [fType, setFType] = useState("全部");
  const [fLang, setFLang] = useState("全部");
  const [fStatus, setFStatus] = useState("全部");
  const [fSpu, setFSpu] = useState("");
  const [fSource, setFSource] = useState("全部");
  const [fRecall, setFRecall] = useState("全部");
  const [fUpdater, setFUpdater] = useState("");

  const [testOpen, setTestOpen] = useState(false);
  const [testScene, setTestScene] = useState<Scene | null>(null);

  const decoratedRows = useMemo(() => {
    return scenes
      .map((sc) => {
        const exprCount = sc.expressions.length;
        const langSet = new Set(sc.expressions.map((e) => e.lang));
        const hasUniversal = langSet.has("全语言通用");
        const langCount = langSet.size;
        let recallable = 0;
        let gamsRec = 0;
        let c2cRec = 0;
        sc.spus.forEach((s) => {
          if (computeRecall(sc, s).ok) {
            recallable++;
            if (s.source === "GamsGo") gamsRec++;
            else c2cRec++;
          }
        });
        return {
          ...sc,
          exprCount,
          langCount,
          hasUniversal,
          total: sc.spus.length,
          recallable,
          gamsRec,
          c2cRec,
        };
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [scenes]);

  const filteredRows = useMemo(() => {
    return decoratedRows.filter((r) => {
      if (fName) {
        const k = fName.toLowerCase();
        if (!r.name.toLowerCase().includes(k) && !r.id.toLowerCase().includes(k)) return false;
      }
      if (fExpr) {
        const k = fExpr.toLowerCase();
        const hit = r.expressions.some(
          (e) => e.content.toLowerCase().includes(k) || e.standard.toLowerCase().includes(k),
        );
        if (!hit) return false;
      }
      if (fType !== "全部" && r.sceneType !== fType) return false;
      if (fLang !== "全部" && !r.expressions.some((e) => e.lang === fLang)) return false;
      if (fStatus !== "全部" && r.status !== fStatus) return false;
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
  }, [decoratedRows, fName, fExpr, fType, fLang, fStatus, fSpu, fSource, fRecall, fUpdater]);

  function resetFilters() {
    setFName(""); setFExpr(""); setFType("全部"); setFLang("全部"); setFStatus("全部");
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
                    fExpr={fExpr} setFExpr={setFExpr}
                    fType={fType} setFType={setFType}
                    fLang={fLang} setFLang={setFLang}
                    fStatus={fStatus} setFStatus={setFStatus}
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
    exprCount: number; langCount: number; hasUniversal: boolean;
    total: number; recallable: number; gamsRec: number; c2cRec: number;
  })[];
  fName: string; setFName: (v: string) => void;
  fExpr: string; setFExpr: (v: string) => void;
  fType: string; setFType: (v: string) => void;
  fLang: string; setFLang: (v: string) => void;
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
          维护用户在搜索中表达的需求场景。每个场景可以配置多个不同语言的搜索词表达，并统一关联一组可召回的 SPU。用户搜索命中任一表达后，系统会进入对应场景，并根据关联 SPU、商品搜索状态、商品状态、站点可售状态返回符合条件的商品。
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
            <Label className="text-xs text-slate-500">搜索词表达</Label>
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
          <div>
            <Label className="text-xs text-slate-500">覆盖语言</Label>
            <Select value={p.fLang} onValueChange={p.setFLang}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                {LANGS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-slate-500">场景状态</Label>
            <Select value={p.fStatus} onValueChange={p.setFStatus}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="草稿">草稿</SelectItem>
                <SelectItem value="已启用">已启用</SelectItem>
                <SelectItem value="已停用">已停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500">关联 SPU</Label>
            <Input value={p.fSpu} onChange={(e) => p.setFSpu(e.target.value)} placeholder="SPU 名称 / ID" className="mt-1 h-8" />
          </div>
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
        </div>
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-xs text-slate-500">最近更新人</Label>
            <Input value={p.fUpdater} onChange={(e) => p.setFUpdater(e.target.value)} placeholder="请输入" className="mt-1 h-8" />
          </div>
          <div className="col-span-3 flex items-end gap-2 justify-end">
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

      <div className="rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">场景 ID</TableHead>
              <TableHead>场景名称</TableHead>
              <TableHead className="w-[80px]">场景类型</TableHead>
              <TableHead className="w-[90px] text-center">表达数</TableHead>
              <TableHead className="w-[90px] text-center">语言数</TableHead>
              <TableHead className="w-[110px] text-center">全语言通用</TableHead>
              <TableHead className="w-[90px] text-center">关联 SPU</TableHead>
              <TableHead className="w-[100px] text-center">可召回 SPU</TableHead>
              <TableHead className="w-[110px] text-center">GamsGo 可召回</TableHead>
              <TableHead className="w-[90px] text-center">C2C 可召回</TableHead>
              <TableHead className="w-[80px]">场景状态</TableHead>
              <TableHead className="w-[90px]">更新人</TableHead>
              <TableHead className="w-[150px]">更新时间</TableHead>
              <TableHead className="w-[200px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {p.rows.length === 0 ? (
              <TableRow><TableCell colSpan={14} className="h-32 text-center text-slate-400">暂无场景配置</TableCell></TableRow>
            ) : (
              p.rows.map((r) => {
                const noRecall = r.total > 0 && r.recallable === 0;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-slate-500">{r.id}</TableCell>
                    <TableCell className="font-medium text-slate-800">{r.name}</TableCell>
                    <TableCell>
                      <span className="rounded px-1.5 py-0.5 text-xs bg-fuchsia-100 text-fuchsia-700">{r.sceneType}</span>
                    </TableCell>
                    <TableCell className="text-center">{r.exprCount}</TableCell>
                    <TableCell className="text-center">{r.langCount}</TableCell>
                    <TableCell className="text-center">
                      {r.hasUniversal ? (
                        <span className="text-xs text-violet-700">是</span>
                      ) : (
                        <span className="text-xs text-slate-400">否</span>
                      )}
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
    sceneType: "场景词",
    status: "草稿",
    remark: "",
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
          expressions: existing.expressions.map((e) => ({ ...e })),
          spus: existing.spus.map((s) => ({ ...s })),
        }
      : makeBlank(),
  );
  const [addSpuOpen, setAddSpuOpen] = useState(false);
  const [exprOpen, setExprOpen] = useState(false);
  const [editingExpr, setEditingExpr] = useState<SceneExpression | null>(null);

  function update<K extends keyof Scene>(key: K, value: Scene[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function validate(forStatus: SceneStatus): string | null {
    if (!draft.name.trim()) return "请输入场景名称";
    if (forStatus === "已启用") {
      if (!draft.expressions.some((e) => e.status === "已启用"))
        return "请至少配置 1 个已启用的搜索词表达";
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
    onSave({ ...draft, status: target }, isCreate);
    toast.success(`已保存：${draft.name}（${target}）`);
    onBack();
  }

  // 表达式操作
  function openExprNew() { setEditingExpr(null); setExprOpen(true); }
  function openExprEdit(e: SceneExpression) { setEditingExpr(e); setExprOpen(true); }
  function saveExpr(payload: SceneExpression, isNew: boolean) {
    const std = normalizeTerm(payload.content);
    if (!payload.content.trim()) { toast.error("请输入搜索词内容"); return; }
    // 同场景同语言重复
    const dupSame = draft.expressions.find(
      (e) => e.id !== payload.id && e.lang === payload.lang && e.standard === std,
    );
    if (dupSame) { toast.error("当前场景下已存在相同语言和标准化词的搜索词表达，请勿重复配置。"); return; }
    // 跨场景冲突提示
    const crossScene = allScenes.find(
      (sc) => sc.id !== draft.id && sc.expressions.some((e) => e.lang === payload.lang && e.standard === std),
    );
    if (crossScene) toast.warning(`当前搜索词表达已被场景"${crossScene.name}"使用，可能导致同一搜索词命中多个场景。`);
    if (SPU_DIRECT_STANDARDS.has(std)) toast.warning("当前搜索词已被配置为商品直连词条，搜索时明确商品结果将优先于场景结果。");
    if (ATTR_WORDS.includes(std)) toast.warning("当前词更适合通过商品属性搜索数据自动参与搜索，不建议配置为场景搜索词。");

    const finalExpr: SceneExpression = { ...payload, standard: std, updatedAt: nowStr(), updater: payload.updater || "Alex" };
    setDraft((d) => ({
      ...d,
      expressions: isNew
        ? [...d.expressions, finalExpr]
        : d.expressions.map((e) => (e.id === payload.id ? finalExpr : e)),
    }));
    setExprOpen(false);
  }
  function removeExpr(id: string) {
    setDraft((d) => ({ ...d, expressions: d.expressions.filter((e) => e.id !== id) }));
  }
  function toggleExpr(id: string) {
    setDraft((d) => ({
      ...d,
      expressions: d.expressions.map((e) =>
        e.id === id ? { ...e, status: e.status === "已启用" ? "已停用" : "已启用", updatedAt: nowStr() } : e,
      ),
    }));
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />返回
        </Button>
        <h1 className="text-lg font-semibold text-slate-800">{isCreate ? "新增场景" : "编辑场景"}</h1>
      </div>

      {/* 基础信息 */}
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">场景基础信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-600">场景名称 <span className="text-rose-500">*</span></Label>
            <Input value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder="例如：AI 工具 / 写论文 / 看剧" className="mt-1 h-8" />
            <p className="mt-1 text-[11px] text-slate-400">场景名称表示一个搜索意图，仅用于后台识别。</p>
          </div>
          <div>
            <Label className="text-xs text-slate-600">场景类型 <span className="text-rose-500">*</span></Label>
            <Select value={draft.sceneType} onValueChange={(v) => update("sceneType", v as SceneType)}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{SCENE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-600">场景状态</Label>
            <Input value={draft.status} readOnly className="mt-1 h-8 bg-slate-50 cursor-not-allowed" />
            <p className="mt-1 text-[11px] text-slate-400">通过底部"保存并启用 / 保存并停用"修改</p>
          </div>
          <div>
            <Label className="text-xs text-slate-600">备注</Label>
            <Textarea value={draft.remark} onChange={(e) => update("remark", e.target.value)} placeholder="运营说明" className="mt-1 min-h-[60px]" />
          </div>
        </div>
      </section>

      {/* 多语言搜索词表达 */}
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-slate-500" />多语言搜索词表达
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              同一个场景可配置多个不同语言的搜索词表达，它们共用同一组关联 SPU。"全语言通用"在所有语言环境下可命中。
            </p>
          </div>
          <Button size="sm" variant="outline" className="h-8" onClick={openExprNew}>
            <Plus className="h-3.5 w-3.5 mr-1" />新增表达
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>搜索词内容</TableHead>
              <TableHead>标准化词</TableHead>
              <TableHead className="w-[110px]">词条语言</TableHead>
              <TableHead className="w-[90px]">匹配方式</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead className="w-[90px]">更新人</TableHead>
              <TableHead className="w-[150px]">更新时间</TableHead>
              <TableHead className="w-[160px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draft.expressions.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-20 text-center text-slate-400">暂无搜索词表达，点击"新增表达"开始配置</TableCell></TableRow>
            ) : (
              draft.expressions.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium text-slate-800">{e.content}</TableCell>
                  <TableCell className="text-slate-600">{e.standard}</TableCell>
                  <TableCell><span className={cn("rounded px-1.5 py-0.5 text-xs", langBadge(e.lang))}>{e.lang}</span></TableCell>
                  <TableCell className="text-slate-600 text-xs">{e.matchType}</TableCell>
                  <TableCell><span className={cn("rounded px-1.5 py-0.5 text-xs", statusBadge(e.status))}>{e.status}</span></TableCell>
                  <TableCell className="text-slate-600">{e.updater}</TableCell>
                  <TableCell className="text-slate-500 text-xs">{e.updatedAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-blue-600 text-xs">
                      <button className="hover:underline inline-flex items-center gap-0.5" onClick={() => openExprEdit(e)}>
                        <Pencil className="h-3 w-3" />编辑
                      </button>
                      <button className="hover:underline inline-flex items-center gap-0.5" onClick={() => toggleExpr(e.id)}>
                        <Power className="h-3 w-3" />{e.status === "已启用" ? "停用" : "启用"}
                      </button>
                      <button className="text-rose-600 hover:underline inline-flex items-center gap-0.5" onClick={() => removeExpr(e.id)}>
                        <Trash2 className="h-3 w-3" />删除
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      {/* 关联 SPU 配置 */}
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">关联 SPU 配置</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">场景命中后，系统以下列 SPU 为候选商品，最终是否展示由商品搜索状态、商品状态、站点可售状态等条件决定。</p>
          </div>
          <Button size="sm" variant="outline" className="h-8" onClick={() => setAddSpuOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />添加 SPU
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">SPU ID</TableHead>
              <TableHead>SPU 名称</TableHead>
              <TableHead className="w-[80px]">商品来源</TableHead>
              <TableHead className="w-[90px]">SPU 分类</TableHead>
              <TableHead className="w-[80px]">商品状态</TableHead>
              <TableHead className="w-[110px]">商品搜索状态</TableHead>
              <TableHead className="w-[110px]">当前站点可售</TableHead>
              <TableHead className="w-[100px]">推荐级别</TableHead>
              <TableHead className="w-[110px]">场景内排序</TableHead>
              <TableHead className="w-[80px]">关联状态</TableHead>
              <TableHead className="w-[150px]">召回状态</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSpus.length === 0 ? (
              <TableRow><TableCell colSpan={12} className="h-24 text-center text-slate-400">暂无关联 SPU，点击"添加 SPU"开始配置</TableCell></TableRow>
            ) : (
              sortedSpus.map((s) => {
                const r = computeRecall(draft, s);
                return (
                  <TableRow key={s.spuId}>
                    <TableCell className="text-slate-500">{s.spuId}</TableCell>
                    <TableCell className="font-medium text-slate-800">{s.spuName}</TableCell>
                    <TableCell><span className={cn("rounded px-1.5 py-0.5 text-xs", sourceBadge(s.source))}>{s.source}</span></TableCell>
                    <TableCell className="text-slate-600 text-xs">{s.category}</TableCell>
                    <TableCell className="text-xs">{s.productStatus}</TableCell>
                    <TableCell className="text-xs">{s.spuLibStatus}</TableCell>
                    <TableCell className="text-xs">{s.siteSellable}</TableCell>
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
      <ExpressionDialog open={exprOpen} onOpenChange={setExprOpen} editing={editingExpr} onSave={saveExpr} />
    </div>
  );
}

// ============================================================
//                       表达式弹窗
// ============================================================
function ExpressionDialog({
  open, onOpenChange, editing, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: SceneExpression | null;
  onSave: (payload: SceneExpression, isNew: boolean) => void;
}) {
  const blank: SceneExpression = {
    id: uid("E"),
    content: "",
    standard: "",
    lang: "zh-CN",
    matchType: "精准匹配",
    status: "草稿",
    remark: "",
    updater: "Alex",
    updatedAt: "",
  };
  const [draft, setDraft] = useState<SceneExpression>(editing ?? blank);
  // sync when opening
  useMemo(() => { if (open) setDraft(editing ? { ...editing } : { ...blank, id: uid("E") }); }, [open, editing]);

  const std = normalizeTerm(draft.content);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑搜索词表达" : "新增搜索词表达"}</DialogTitle>
          <DialogDescription>同一场景下，同一语言的标准化词不能重复。</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">搜索词内容 <span className="text-rose-500">*</span></Label>
            <Input value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} placeholder="例如：AI tools / 写论文 / strumenti AI" className="mt-1 h-8" />
          </div>
          <div>
            <Label className="text-xs">标准化词（自动生成）</Label>
            <Input value={std} readOnly className="mt-1 h-8 bg-slate-50 cursor-not-allowed" />
          </div>
          <div>
            <Label className="text-xs">词条语言 <span className="text-rose-500">*</span></Label>
            <Select value={draft.lang} onValueChange={(v) => setDraft({ ...draft, lang: v as SceneLang })}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{LANGS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">匹配方式</Label>
            <Input value={draft.matchType} readOnly className="mt-1 h-8 bg-slate-50 cursor-not-allowed" />
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
            <Label className="text-xs">备注</Label>
            <Input value={draft.remark ?? ""} onChange={(e) => setDraft({ ...draft, remark: e.target.value })} className="mt-1 h-8" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => onSave(draft, !editing)}>保存</Button>
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
  const [lang, setLang] = useState<string>("zh-CN");
  const [userState, setUserState] = useState("全部");

  if (!scene) return null;

  const input = keyword || (scene.expressions[0]?.content ?? "");
  const std = normalizeTerm(input);
  // 命中规则：标准化词匹配，且语言为"全语言通用"或等于当前 lang
  const hitExpr = scene.expressions.find(
    (e) => e.standard === std && (e.lang === "全语言通用" || e.lang === lang) && e.status === "已启用",
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

  // 最终展示数量：GamsGo 5 + C2C 5，不足时另一来源补位，合计最多 10
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
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={scene.expressions[0]?.content ?? ""} className="mt-1 h-8" />
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
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{LANGS.filter((l) => l !== "全语言通用").map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
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
            <div><span className="text-slate-500">命中搜索词表达：</span>{hitExpr ? `${hitExpr.content} / ${hitExpr.lang}` : "—"}</div>
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