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
  X,
  AlertTriangle,
  FlaskConical,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
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
type SceneLang = "全语言通用" | "en" | "zh-CN" | "it" | "ko" | "ja";
type MatchType = "精准匹配";
type SceneStatus = "草稿" | "已启用" | "已停用";
type RecLevel = "主推" | "推荐" | "备选";
type RelStatus = "已启用" | "已停用";
type ProductStatus = "待上架" | "在售" | "售罄" | "已下架";
type SpuLibStatus = "未配置" | "草稿" | "启用" | "停用";
type SiteSellable = "是" | "否" | "部分站点可售";

interface SceneSpu {
  spuId: string;
  spuName: string;
  category: string;
  productStatus: ProductStatus;
  spuLibStatus: SpuLibStatus;
  siteSellable: SiteSellable;
  recLevel: RecLevel;
  order: number;
  relStatus: RelStatus;
}

interface SceneTerm {
  id: string;
  content: string;
  standard: string;
  sceneType: SceneType;
  lang: SceneLang;
  matchType: MatchType;
  status: SceneStatus;
  remark: string;
  spus: SceneSpu[];
  updater: string;
  updatedAt: string;
}

// -------------------- 常量 --------------------
const SCENE_TYPES: SceneType[] = ["场景词", "品类词"];
const LANGS: SceneLang[] = ["全语言通用", "en", "zh-CN", "it", "ko", "ja"];
const REC_LEVELS: RecLevel[] = ["主推", "推荐", "备选"];
const REC_RANK: Record<RecLevel, number> = { 主推: 0, 推荐: 1, 备选: 2 };

// 商品结构化属性词（保存时提示冲突）
const ATTR_WORDS = ["4k", "family", "礼品码", "tv", "mac", "账号密码", "邀请链接"];

// 模拟 SPU 直连词条标准化集（场景词与 SPU 直连冲突提示）
const SPU_DIRECT_STANDARDS = new Set(["openai", "chatgpt", "netflix", "spotify"]);

// -------------------- 标准化 --------------------
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

// -------------------- 候选 SPU 池（添加 SPU 弹窗用） --------------------
const CANDIDATE_SPUS: Omit<SceneSpu, "recLevel" | "order" | "relStatus">[] = [
  { spuId: "SPU10001", spuName: "ChatGPT Plus", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10002", spuName: "Claude", category: "AI工具", productStatus: "在售", spuLibStatus: "停用", siteSellable: "是" },
  { spuId: "SPU10003", spuName: "Perplexity", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10004", spuName: "Gemini", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10005", spuName: "Midjourney", category: "AI绘图", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10006", spuName: "Stable Diffusion", category: "AI绘图", productStatus: "在售", spuLibStatus: "启用", siteSellable: "部分站点可售" },
  { spuId: "SPU10007", spuName: "DALL·E", category: "AI绘图", productStatus: "已下架", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10008", spuName: "Netflix", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10009", spuName: "Disney+", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10010", spuName: "HBO Max", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "否" },
  { spuId: "SPU10011", spuName: "Spotify", category: "音乐会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
  { spuId: "SPU10012", spuName: "Apple Music", category: "音乐会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是" },
];

// -------------------- 初始场景词 --------------------
const initialScenes: SceneTerm[] = [
  {
    id: "SC0001",
    content: "写论文",
    standard: "写论文",
    sceneType: "场景词",
    lang: "zh-CN",
    matchType: "精准匹配",
    status: "已启用",
    remark: "AI 写作类需求场景",
    updater: "Alex",
    updatedAt: "2026-05-20 16:00:24",
    spus: [
      { spuId: "SPU10001", spuName: "ChatGPT Plus", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "主推", order: 1, relStatus: "已启用" },
      { spuId: "SPU10002", spuName: "Claude", category: "AI工具", productStatus: "在售", spuLibStatus: "停用", siteSellable: "是", recLevel: "推荐", order: 2, relStatus: "已启用" },
      { spuId: "SPU10003", spuName: "Perplexity", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "推荐", order: 3, relStatus: "已启用" },
      { spuId: "SPU10004", spuName: "Gemini", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "备选", order: 4, relStatus: "已停用" },
    ],
  },
  {
    id: "SC0002",
    content: "AI绘图",
    standard: "ai绘图",
    sceneType: "场景词",
    lang: "zh-CN",
    matchType: "精准匹配",
    status: "已启用",
    remark: "",
    updater: "Linda",
    updatedAt: "2026-05-18 10:22:10",
    spus: [
      { spuId: "SPU10005", spuName: "Midjourney", category: "AI绘图", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "主推", order: 1, relStatus: "已启用" },
      { spuId: "SPU10006", spuName: "Stable Diffusion", category: "AI绘图", productStatus: "在售", spuLibStatus: "启用", siteSellable: "部分站点可售", recLevel: "推荐", order: 2, relStatus: "已启用" },
      { spuId: "SPU10007", spuName: "DALL·E", category: "AI绘图", productStatus: "已下架", spuLibStatus: "启用", siteSellable: "是", recLevel: "备选", order: 3, relStatus: "已启用" },
    ],
  },
  {
    id: "SC0003",
    content: "看剧",
    standard: "看剧",
    sceneType: "场景词",
    lang: "zh-CN",
    matchType: "精准匹配",
    status: "已启用",
    remark: "",
    updater: "Alex",
    updatedAt: "2026-05-15 09:11:00",
    spus: [
      { spuId: "SPU10008", spuName: "Netflix", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "主推", order: 1, relStatus: "已启用" },
      { spuId: "SPU10009", spuName: "Disney+", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "推荐", order: 2, relStatus: "已启用" },
      { spuId: "SPU10010", spuName: "HBO Max", category: "影视会员", productStatus: "在售", spuLibStatus: "启用", siteSellable: "否", recLevel: "推荐", order: 3, relStatus: "已启用" },
    ],
  },
  {
    id: "SC0004",
    content: "AI tools",
    standard: "aitools",
    sceneType: "品类词",
    lang: "en",
    matchType: "精准匹配",
    status: "已启用",
    remark: "英文站品类入口",
    updater: "Mark",
    updatedAt: "2026-05-10 14:30:00",
    spus: [
      { spuId: "SPU10001", spuName: "ChatGPT Plus", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "主推", order: 1, relStatus: "已启用" },
      { spuId: "SPU10004", spuName: "Gemini", category: "AI工具", productStatus: "在售", spuLibStatus: "启用", siteSellable: "是", recLevel: "推荐", order: 2, relStatus: "已启用" },
    ],
  },
  {
    id: "SC0005",
    content: "学习工具",
    standard: "学习工具",
    sceneType: "场景词",
    lang: "zh-CN",
    matchType: "精准匹配",
    status: "草稿",
    remark: "",
    updater: "Linda",
    updatedAt: "2026-05-08 19:00:00",
    spus: [],
  },
];

// -------------------- 召回状态计算 --------------------
function computeRecall(scene: SceneTerm, s: SceneSpu): { ok: boolean; reason: string } {
  if (scene.status !== "已启用") return { ok: false, reason: "场景词未启用" };
  if (s.relStatus !== "已启用") return { ok: false, reason: "关联停用" };
  if (s.spuLibStatus !== "启用") return { ok: false, reason: "词库未启用" };
  if (s.productStatus !== "在售") return { ok: false, reason: "商品下架" };
  if (s.siteSellable === "否") return { ok: false, reason: "当前站点不可售" };
  return { ok: true, reason: "" };
}

function statusBadge(status: SceneStatus) {
  const map: Record<SceneStatus, string> = {
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

// ============================================================
//                       主组件
// ============================================================
export function SceneTermManagement() {
  const [scenes, setScenes] = useState<SceneTerm[]>(initialScenes);
  const [view, setView] = useState<"list" | "detail">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  // 筛选状态
  const [fContent, setFContent] = useState("");
  const [fType, setFType] = useState<string>("全部");
  const [fLang, setFLang] = useState<string>("全部");
  const [fStatus, setFStatus] = useState<string>("全部");
  const [fSpu, setFSpu] = useState("");
  const [fRecall, setFRecall] = useState<string>("全部");
  const [fUpdater, setFUpdater] = useState("");

  // 搜索测试
  const [testOpen, setTestOpen] = useState(false);
  const [testScene, setTestScene] = useState<SceneTerm | null>(null);

  // 计算行衍生字段
  const decoratedRows = useMemo(() => {
    return scenes
      .map((sc) => {
        const total = sc.spus.length;
        let recallable = 0;
        sc.spus.forEach((s) => {
          if (computeRecall(sc, s).ok) recallable++;
        });
        return { ...sc, total, recallable };
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [scenes]);

  const filteredRows = useMemo(() => {
    return decoratedRows.filter((r) => {
      if (fContent && !(r.content.toLowerCase().includes(fContent.toLowerCase()) || r.standard.toLowerCase().includes(fContent.toLowerCase()))) return false;
      if (fType !== "全部" && r.sceneType !== fType) return false;
      if (fLang !== "全部" && r.lang !== fLang) return false;
      if (fStatus !== "全部" && r.status !== fStatus) return false;
      if (fSpu) {
        const hit = r.spus.some((s) => s.spuId.toLowerCase().includes(fSpu.toLowerCase()) || s.spuName.toLowerCase().includes(fSpu.toLowerCase()));
        if (!hit) return false;
      }
      if (fRecall === "有可召回 SPU" && r.recallable === 0) return false;
      if (fRecall === "无可召回 SPU" && r.recallable > 0) return false;
      if (fUpdater && !r.updater.toLowerCase().includes(fUpdater.toLowerCase())) return false;
      return true;
    });
  }, [decoratedRows, fContent, fType, fLang, fStatus, fSpu, fRecall, fUpdater]);

  function resetFilters() {
    setFContent(""); setFType("全部"); setFLang("全部"); setFStatus("全部");
    setFSpu(""); setFRecall("全部"); setFUpdater("");
  }

  function openCreate() {
    setEditingId(null);
    setView("detail");
  }
  function openEdit(id: string) {
    setEditingId(id);
    setView("detail");
  }
  function backToList() {
    setView("list");
    setEditingId(null);
  }

  function toggleStatus(row: SceneTerm) {
    const next: SceneStatus = row.status === "已启用" ? "已停用" : "已启用";
    setScenes((prev) =>
      prev.map((p) => (p.id === row.id ? { ...p, status: next, updatedAt: nowStr() } : p)),
    );
    toast.success(`已${next === "已启用" ? "启用" : "停用"}：${row.content}`);
  }

  function saveScene(payload: SceneTerm, isCreate: boolean) {
    setScenes((prev) => {
      if (isCreate) return [{ ...payload, updatedAt: nowStr() }, ...prev];
      return prev.map((p) => (p.id === payload.id ? { ...payload, updatedAt: nowStr() } : p));
    });
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-sm text-slate-800">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col bg-white border-r border-slate-200">
        <div className="flex h-12 items-center px-4 border-b border-slate-200 font-semibold text-slate-700">
          后台管理系统
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <div>
            <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50">
              <span className="flex items-center gap-2 text-slate-700">
                <Menu className="h-4 w-4 text-slate-400" />
                搜索管理
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 rotate-180" />
            </div>
            <div className="bg-slate-50 pb-2">
              <Link to="/" className="block pl-12 py-2 cursor-pointer hover:bg-blue-50 text-slate-700">
                SPU词条管理
              </Link>
              <div className="pl-12 py-2 cursor-pointer bg-blue-500 text-white">
                场景词库管理
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-12 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <Menu className="h-4 w-4 text-slate-500" />
          <RefreshCw className="h-4 w-4 text-slate-500" />
          <div className="text-slate-500">
            首页 <span className="px-1">/</span>
            搜索管理 <span className="px-1">/</span>
            <span className="text-slate-700">场景词库管理</span>
            {view === "detail" && (
              <>
                <span className="px-1">/</span>
                <span className="text-slate-700">
                  {editingId ? "编辑场景词" : "新增场景词"}
                </span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-72">
              <Input placeholder="通过名称搜索页面" className="h-8" />
            </div>
            <Maximize2 className="h-4 w-4 text-slate-500" />
            <Bell className="h-4 w-4 text-slate-500" />
            <User className="h-4 w-4 text-slate-500" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          {view === "list" ? (
            <SceneListView
              rows={filteredRows}
              fContent={fContent} setFContent={setFContent}
              fType={fType} setFType={setFType}
              fLang={fLang} setFLang={setFLang}
              fStatus={fStatus} setFStatus={setFStatus}
              fSpu={fSpu} setFSpu={setFSpu}
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
        </main>
      </div>

      <SearchTestSheet
        open={testOpen}
        onOpenChange={setTestOpen}
        scene={testScene}
      />
    </div>
  );
}

// ============================================================
//                       列表视图
// ============================================================
interface ListProps {
  rows: (SceneTerm & { total: number; recallable: number })[];
  fContent: string; setFContent: (v: string) => void;
  fType: string; setFType: (v: string) => void;
  fLang: string; setFLang: (v: string) => void;
  fStatus: string; setFStatus: (v: string) => void;
  fSpu: string; setFSpu: (v: string) => void;
  fRecall: string; setFRecall: (v: string) => void;
  fUpdater: string; setFUpdater: (v: string) => void;
  onReset: () => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onToggle: (row: SceneTerm) => void;
  onTest: (row: SceneTerm) => void;
}

function SceneListView(p: ListProps) {
  return (
    <div className="space-y-4">
      {/* 标题 + 说明 */}
      <div>
        <h1 className="text-lg font-semibold text-slate-800">场景词库管理</h1>
        <p className="mt-1 text-xs text-slate-500">
          维护用户在搜索中表达的需求场景词，并为每个场景词配置可召回的 SPU。场景词命中后，系统会根据关联 SPU、商品状态、SPU 词库状态和站点可售状态，返回符合条件的商品。
        </p>
      </div>

      {/* 筛选区 */}
      <div className="rounded-md border border-slate-200 bg-white p-4 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-slate-500">场景词内容 / 标准化词</Label>
            <Input value={p.fContent} onChange={(e) => p.setFContent(e.target.value)} placeholder="请输入" className="mt-1 h-8" />
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
            <Label className="text-xs text-slate-500">词条语言</Label>
            <Select value={p.fLang} onValueChange={p.setFLang}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                {LANGS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-slate-500">关联 SPU</Label>
            <Input value={p.fSpu} onChange={(e) => p.setFSpu(e.target.value)} placeholder="SPU 名称 / SPU ID" className="mt-1 h-8" />
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
          <div className="flex items-end gap-2">
            <Button size="sm" className="h-8 bg-blue-500 hover:bg-blue-600"><Search className="h-3.5 w-3.5 mr-1" />查询</Button>
            <Button size="sm" variant="outline" className="h-8" onClick={p.onReset}><RotateCcw className="h-3.5 w-3.5 mr-1" />重置</Button>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-8 bg-blue-500 hover:bg-blue-600" onClick={p.onCreate}>
          <Plus className="h-3.5 w-3.5 mr-1" />新增场景词
        </Button>
        <Button size="sm" variant="outline" className="h-8" onClick={() => toast.info("批量导入：mock") }>
          <Upload className="h-3.5 w-3.5 mr-1" />批量导入
        </Button>
        <Button size="sm" variant="outline" className="h-8" onClick={() => toast.info("批量导出：mock") }>
          <Download className="h-3.5 w-3.5 mr-1" />批量导出
        </Button>
      </div>

      {/* 列表 */}
      <div className="rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">场景词 ID</TableHead>
              <TableHead>场景词内容</TableHead>
              <TableHead>标准化词</TableHead>
              <TableHead className="w-[80px]">场景类型</TableHead>
              <TableHead className="w-[100px]">词条语言</TableHead>
              <TableHead className="w-[80px]">匹配方式</TableHead>
              <TableHead className="w-[100px] text-center">关联 SPU</TableHead>
              <TableHead className="w-[100px] text-center">可召回 SPU</TableHead>
              <TableHead className="w-[90px]">场景状态</TableHead>
              <TableHead className="w-[100px]">最近更新人</TableHead>
              <TableHead className="w-[160px]">最近更新时间</TableHead>
              <TableHead className="w-[200px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {p.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-32 text-center text-slate-400">
                  暂无场景词配置
                </TableCell>
              </TableRow>
            ) : (
              p.rows.map((r) => {
                const noRecall = r.total > 0 && r.recallable === 0;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-slate-500">{r.id}</TableCell>
                    <TableCell className="font-medium text-slate-800">{r.content}</TableCell>
                    <TableCell className="text-slate-600">{r.standard}</TableCell>
                    <TableCell>
                      <span className="rounded px-1.5 py-0.5 text-xs bg-fuchsia-100 text-fuchsia-700">{r.sceneType}</span>
                    </TableCell>
                    <TableCell><span className={cn("rounded px-1.5 py-0.5 text-xs", langBadge(r.lang))}>{r.lang}</span></TableCell>
                    <TableCell className="text-slate-600">{r.matchType}</TableCell>
                    <TableCell className="text-center">{r.total}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn("inline-flex items-center gap-1", noRecall && "text-amber-600 font-medium")}>
                        {noRecall && <AlertTriangle className="h-3 w-3" />}
                        {r.recallable}
                      </span>
                    </TableCell>
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
        {/* 分页 */}
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
//                       详情视图（新增 / 编辑）
// ============================================================
interface DetailProps {
  existing: SceneTerm | null;
  allScenes: SceneTerm[];
  onBack: () => void;
  onSave: (payload: SceneTerm, isCreate: boolean) => void;
  onTest: (sc: SceneTerm) => void;
}

function makeBlank(): SceneTerm {
  return {
    id: `SC${String(Date.now()).slice(-6)}`,
    content: "",
    standard: "",
    sceneType: "场景词",
    lang: "zh-CN",
    matchType: "精准匹配",
    status: "草稿",
    remark: "",
    updater: "Alex",
    updatedAt: "",
    spus: [],
  };
}

function SceneDetailView({ existing, allScenes, onBack, onSave, onTest }: DetailProps) {
  const isCreate = !existing;
  const [draft, setDraft] = useState<SceneTerm>(() =>
    existing ? { ...existing, spus: existing.spus.map((s) => ({ ...s })) } : makeBlank(),
  );
  const [addOpen, setAddOpen] = useState(false);

  function update<K extends keyof SceneTerm>(key: K, value: SceneTerm[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleContentChange(v: string) {
    setDraft((d) => ({ ...d, content: v, standard: normalizeTerm(v) }));
  }

  function validate(forStatus: SceneStatus): string | null {
    if (!draft.content.trim()) return "请输入场景词内容";
    const std = normalizeTerm(draft.content);
    if (!std) return "场景词内容无效，请输入有效搜索词";
    // 同语言下标准化词不能重复
    const dup = allScenes.find(
      (s) => s.id !== draft.id && s.lang === draft.lang && s.standard === std,
    );
    if (dup) return "当前语言下已存在相同标准化词，请勿重复配置";
    if (forStatus === "已启用") {
      if (draft.spus.length === 0) return "请至少关联 1 个 SPU";
      if (!draft.spus.some((s) => s.relStatus === "已启用"))
        return "请至少保留 1 个关联状态为已启用的 SPU";
    }
    return null;
  }

  function checkWarnings() {
    const std = normalizeTerm(draft.content);
    if (SPU_DIRECT_STANDARDS.has(std)) {
      toast.warning("当前场景词已被配置为 SPU 直连词条，用户搜索时将优先命中明确商品结果，请确认是否继续配置为场景词。");
    }
    if (ATTR_WORDS.includes(std)) {
      toast.warning("当前词更适合通过商品属性搜索数据自动参与搜索，不建议配置为场景词。");
    }
  }

  function doSave(target: SceneStatus) {
    const err = validate(target);
    if (err) {
      toast.error(err);
      return;
    }
    checkWarnings();
    if (target === "已启用") {
      const recallable = draft.spus.filter(
        (s) => computeRecall({ ...draft, status: "已启用" }, s).ok,
      ).length;
      if (recallable === 0 && draft.spus.length > 0) {
        toast.warning("当前场景词暂无可召回 SPU，启用后前台可能无结果，请确认是否继续启用。");
      }
    }
    const payload: SceneTerm = {
      ...draft,
      standard: normalizeTerm(draft.content),
      status: target,
    };
    onSave(payload, isCreate);
    toast.success(`已保存：${payload.content}（${target}）`);
    onBack();
  }

  function addSpus(picked: typeof CANDIDATE_SPUS) {
    const existingIds = new Set(draft.spus.map((s) => s.spuId));
    const newOnes: SceneSpu[] = picked
      .filter((p) => !existingIds.has(p.spuId))
      .map((p, i) => ({
        ...p,
        recLevel: "推荐" as RecLevel,
        order: draft.spus.length + i + 1,
        relStatus: "已启用" as RelStatus,
      }));
    setDraft((d) => ({ ...d, spus: [...d.spus, ...newOnes] }));
    setAddOpen(false);
  }

  function removeSpu(id: string) {
    setDraft((d) => ({ ...d, spus: d.spus.filter((s) => s.spuId !== id) }));
  }

  function updateSpu(id: string, patch: Partial<SceneSpu>) {
    setDraft((d) => ({
      ...d,
      spus: d.spus.map((s) => (s.spuId === id ? { ...s, ...patch } : s)),
    }));
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

  // 排序：推荐级别 > 场景内排序
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
        <h1 className="text-lg font-semibold text-slate-800">
          {isCreate ? "新增场景词" : "编辑场景词"}
        </h1>
      </div>

      {/* 基础信息 */}
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">基础信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-600">场景词内容 <span className="text-rose-500">*</span></Label>
            <Input
              value={draft.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="例如：写论文 / AI 绘图 / essay writer"
              className="mt-1 h-8"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600">标准化词（自动生成）</Label>
            <Input value={draft.standard} readOnly placeholder="根据场景词内容自动生成" className="mt-1 h-8 bg-slate-50 cursor-not-allowed" />
          </div>
          <div>
            <Label className="text-xs text-slate-600">场景类型 <span className="text-rose-500">*</span></Label>
            <Select value={draft.sceneType} onValueChange={(v) => update("sceneType", v as SceneType)}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{SCENE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-600">词条语言 <span className="text-rose-500">*</span></Label>
            <Select value={draft.lang} onValueChange={(v) => update("lang", v as SceneLang)}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{LANGS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-600">匹配方式</Label>
            <Input value={draft.matchType} readOnly className="mt-1 h-8 bg-slate-50 cursor-not-allowed" />
            <p className="mt-1 text-[11px] text-slate-400">本期默认精准匹配</p>
          </div>
          <div>
            <Label className="text-xs text-slate-600">场景状态</Label>
            <Input value={draft.status} readOnly className="mt-1 h-8 bg-slate-50 cursor-not-allowed" />
            <p className="mt-1 text-[11px] text-slate-400">通过底部"保存并启用 / 保存并停用"修改</p>
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-slate-600">备注</Label>
            <Textarea value={draft.remark} onChange={(e) => update("remark", e.target.value)} placeholder="运营说明" className="mt-1 min-h-[60px]" />
          </div>
        </div>
      </section>

      {/* 关联 SPU 配置 */}
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">关联 SPU 配置</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">场景词命中后，系统将以下列 SPU 为候选商品，最终是否展示由 SPU 词库状态、商品状态、站点可售状态等条件决定。</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />添加 SPU
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">SPU ID</TableHead>
              <TableHead>SPU 名称</TableHead>
              <TableHead className="w-[100px]">SPU 分类</TableHead>
              <TableHead className="w-[90px]">商品状态</TableHead>
              <TableHead className="w-[110px]">SPU 词库状态</TableHead>
              <TableHead className="w-[120px]">当前站点可售</TableHead>
              <TableHead className="w-[120px]">推荐级别</TableHead>
              <TableHead className="w-[100px]">场景内排序</TableHead>
              <TableHead className="w-[90px]">关联状态</TableHead>
              <TableHead className="w-[140px]">召回状态</TableHead>
              <TableHead className="w-[140px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSpus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center text-slate-400">
                  暂无关联 SPU，点击"添加 SPU"开始配置
                </TableCell>
              </TableRow>
            ) : (
              sortedSpus.map((s) => {
                const r = computeRecall(draft, s);
                return (
                  <TableRow key={s.spuId}>
                    <TableCell className="text-slate-500">{s.spuId}</TableCell>
                    <TableCell className="font-medium text-slate-800">{s.spuName}</TableCell>
                    <TableCell className="text-slate-600">{s.category}</TableCell>
                    <TableCell><span className="text-xs">{s.productStatus}</span></TableCell>
                    <TableCell><span className="text-xs">{s.spuLibStatus}</span></TableCell>
                    <TableCell><span className="text-xs">{s.siteSellable}</span></TableCell>
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
                      {r.ok ? (
                        <span className="text-xs text-emerald-600">可召回</span>
                      ) : (
                        <span className="text-xs text-rose-600">不可召回：{r.reason}</span>
                      )}
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
        <p className="mt-3 text-[11px] text-slate-400">
          排序优先级：主推 &gt; 推荐 &gt; 备选，同级别按"场景内排序"升序。
        </p>
      </section>

      {/* 操作区 */}
      <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-slate-100 py-2">
        <Button variant="outline" size="sm" className="h-8" onClick={onBack}>取消</Button>
        <Button variant="outline" size="sm" className="h-8" onClick={() => onTest({ ...draft, standard: normalizeTerm(draft.content) })}>
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

      <AddSpuDialog open={addOpen} onOpenChange={setAddOpen} existingIds={draft.spus.map((s) => s.spuId)} onConfirm={addSpus} />
    </div>
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
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    return CANDIDATE_SPUS.filter((s) => {
      if (existingIds.includes(s.spuId)) return false;
      if (!keyword) return true;
      const k = keyword.toLowerCase();
      return s.spuId.toLowerCase().includes(k) || s.spuName.toLowerCase().includes(k) || s.category.toLowerCase().includes(k);
    });
  }, [keyword, existingIds]);

  function toggle(id: string) {
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setPicked(new Set()); setKeyword(""); } }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>添加 SPU</DialogTitle>
          <DialogDescription>按 SPU 名称 / ID / 分类搜索，勾选后批量添加。</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索 SPU ID / 名称 / 分类" className="h-8" />
          <div className="max-h-[400px] overflow-auto rounded border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[90px]">SPU ID</TableHead>
                  <TableHead>SPU 名称</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>商品状态</TableHead>
                  <TableHead>词库状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s) => (
                  <TableRow key={s.spuId} className="cursor-pointer" onClick={() => toggle(s.spuId)}>
                    <TableCell>
                      <input type="checkbox" checked={picked.has(s.spuId)} onChange={() => toggle(s.spuId)} />
                    </TableCell>
                    <TableCell className="text-slate-500">{s.spuId}</TableCell>
                    <TableCell className="font-medium">{s.spuName}</TableCell>
                    <TableCell>{s.category}</TableCell>
                    <TableCell>{s.productStatus}</TableCell>
                    <TableCell>{s.spuLibStatus}</TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="h-20 text-center text-slate-400">无匹配 SPU</TableCell></TableRow>
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
  scene: SceneTerm | null;
}) {
  const [keyword, setKeyword] = useState("");
  const [site, setSite] = useState("全球站");
  const [lang, setLang] = useState<string>("zh-CN");

  if (!scene) return null;

  const std = normalizeTerm(keyword || scene.content);
  const hit = std === scene.standard;

  const ranked = [...scene.spus]
    .sort((a, b) => {
      const rd = REC_RANK[a.recLevel] - REC_RANK[b.recLevel];
      if (rd !== 0) return rd;
      return a.order - b.order;
    })
    .map((s) => ({ ...s, recall: computeRecall(scene, s) }));

  const recallable = ranked.filter((s) => s.recall.ok).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[640px] sm:max-w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>搜索测试 — {scene.content}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">测试搜索词</Label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={scene.content} className="mt-1 h-8" />
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
                <SelectContent>{LANGS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
            <div><span className="text-slate-500">原始搜索词：</span>{keyword || scene.content}</div>
            <div><span className="text-slate-500">标准化搜索词：</span>{std}</div>
            <div><span className="text-slate-500">命中场景词：</span>{hit ? scene.content : <span className="text-rose-600">未命中</span>}</div>
            <div><span className="text-slate-500">场景类型：</span>{scene.sceneType}</div>
            <div><span className="text-slate-500">场景状态：</span>{scene.status}</div>
            <div><span className="text-slate-500">关联 / 可召回：</span>{scene.spus.length} / {recallable}</div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">最终召回结果</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>SPU</TableHead>
                  <TableHead>推荐级别</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>召回状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((s, i) => (
                  <TableRow key={s.spuId}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{s.spuName}</TableCell>
                    <TableCell><span className={cn("rounded px-1.5 py-0.5 text-xs", recLevelBadge(s.recLevel))}>{s.recLevel}</span></TableCell>
                    <TableCell>{s.order}</TableCell>
                    <TableCell>
                      {s.recall.ok ? <span className="text-emerald-600 text-xs">可召回</span> : <span className="text-rose-600 text-xs">不可召回：{s.recall.reason}</span>}
                    </TableCell>
                  </TableRow>
                ))}
                {ranked.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="h-20 text-center text-slate-400">未关联任何 SPU</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}