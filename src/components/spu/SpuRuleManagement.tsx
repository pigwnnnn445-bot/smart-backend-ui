import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type TermType = string;
type MatchType = "精准匹配" | "前缀匹配" | "模糊匹配";
type DirectFlag = "是" | "否";
type Status = "草稿" | "已启用" | "已停用";
type Scope = "部分IP生效" | "部分IP不生效" | "全部IP生效" | "全部IP不生效";
/**
 * 词库展示状态：
 * - 未配置：SPU 下没有任何词条（自动派生）
 * - 草稿：已有词条但从未发布（libState === "未发布"）
 * - 已启用：发布后参与搜索
 * - 已停用：曾发布过，但被手动停用
 */
type LibStatus = "未配置" | "草稿" | "已启用" | "已停用";
type LibState = "未发布" | "已启用" | "已停用";

interface RuleRow {
  id: string;
  content: string;
  standard: string;
  termType: TermType[];
  matchType: MatchType;
  direct: DirectFlag;
  status: Status;
  scope: Scope;
  regions: string[];
  updater: string;
  updatedAt: string;
  remark: string;
}

const SPU_LIST = ["Netflix", "Spotify", "Tidal", "ChatGPT"];

interface SpuInfo {
  id: string;
  name: string;
  category: string;
  productStatus: "在售" | "下架";
  inSearch: boolean;
}

const SPU_INFOS: SpuInfo[] = [
  { id: "SPU10001", name: "Netflix", category: "影视会员", productStatus: "在售", inSearch: true },
  { id: "SPU10002", name: "Spotify", category: "音乐会员", productStatus: "在售", inSearch: true },
  { id: "SPU10003", name: "Tidal", category: "音乐会员", productStatus: "在售", inSearch: false },
  { id: "SPU10004", name: "ChatGPT", category: "AI工具", productStatus: "在售", inSearch: true },
];

interface OpLog {
  id: string;
  spu: string;
  action: string;
  target: string;
  operator: string;
  at: string;
}

const TERM_TYPES: TermType[] = [
  "商品词",
  "品牌词",
  "别名词",
  "错词",
  "短词",
  "场景词",
  "品类词",
];
const MATCH_TYPES: MatchType[] = ["精准匹配", "前缀匹配", "模糊匹配"];
const DIRECT_FLAGS: DirectFlag[] = ["是", "否"];
const STATUSES: Status[] = ["草稿", "已启用", "已停用"];
const SCOPES: Scope[] = ["部分IP生效", "部分IP不生效", "全部IP生效", "全部IP不生效"];

// 国家/地区数据（按大洲分组）
const REGION_GROUPS: { continent: string; countries: { code: string; name: string }[] }[] = [
  {
    continent: "欧洲",
    countries: [
      { code: "AL", name: "阿尔巴尼亚" }, { code: "AD", name: "安道尔" }, { code: "AT", name: "奥地利" },
      { code: "BY", name: "白俄罗斯" }, { code: "BE", name: "比利时" }, { code: "BA", name: "波斯尼亚和黑塞哥维那" },
      { code: "BG", name: "保加利亚" }, { code: "HR", name: "克罗地亚" }, { code: "CY", name: "塞浦路斯" },
      { code: "CZ", name: "捷克" }, { code: "DK", name: "丹麦" }, { code: "EE", name: "爱沙尼亚" },
      { code: "FO", name: "法罗群岛" }, { code: "FI", name: "芬兰" }, { code: "FR", name: "法国" },
      { code: "DE", name: "德国" }, { code: "GI", name: "直布罗陀" }, { code: "GR", name: "希腊" },
      { code: "HU", name: "匈牙利" }, { code: "IS", name: "冰岛" }, { code: "IE", name: "爱尔兰" },
      { code: "IT", name: "意大利" }, { code: "LV", name: "拉脱维亚" }, { code: "LI", name: "列支敦士登" },
      { code: "LT", name: "立陶宛" }, { code: "LU", name: "卢森堡" }, { code: "MK", name: "北马其顿" },
      { code: "MT", name: "马耳他" }, { code: "MD", name: "摩尔多瓦" }, { code: "MC", name: "摩纳哥" },
      { code: "NL", name: "荷兰" }, { code: "NO", name: "挪威" }, { code: "PL", name: "波兰" },
      { code: "PT", name: "葡萄牙" }, { code: "RO", name: "罗马尼亚" }, { code: "RU", name: "俄罗斯" },
      { code: "SM", name: "圣马力诺" }, { code: "SK", name: "斯洛伐克" }, { code: "SI", name: "斯洛文尼亚" },
      { code: "ES", name: "西班牙" }, { code: "SE", name: "瑞典" }, { code: "CH", name: "瑞士" },
    ],
  },
  {
    continent: "亚洲",
    countries: [
      { code: "CN", name: "中国" }, { code: "JP", name: "日本" }, { code: "KR", name: "韩国" },
      { code: "SG", name: "新加坡" }, { code: "MY", name: "马来西亚" }, { code: "TH", name: "泰国" },
      { code: "ID", name: "印度尼西亚" }, { code: "PH", name: "菲律宾" }, { code: "VN", name: "越南" },
      { code: "IN", name: "印度" },
    ],
  },
  {
    continent: "美洲",
    countries: [
      { code: "US", name: "美国" }, { code: "CA", name: "加拿大" }, { code: "MX", name: "墨西哥" },
      { code: "BR", name: "巴西" }, { code: "AR", name: "阿根廷" }, { code: "CL", name: "智利" },
    ],
  },
];

// 标准化词生成规则：
// 1. 全角转半角  2. 英文字母转小写  3. 去除前后空格
// 4. 去除中间空格（仅英文/数字组合）  5. 去除常见连接符（空格、-、_、.、·）
function normalizeTerm(input: string): string {
  if (!input) return "";
  // 1. 全角转半角
  let s = input.replace(/[\uFF01-\uFF5E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0),
  ).replace(/\u3000/g, " ");
  // 2. 小写
  s = s.toLowerCase();
  // 3. 去前后空格
  s = s.trim();
  if (!s) return "";
  // 4. 去中间空格（英文/数字之间）
  s = s.replace(/([a-z0-9])\s+([a-z0-9])/g, "$1$2");
  // 5. 去常见连接符
  s = s.replace(/[\s\-_.·]/g, "");
  return s;
}

const NAV = ["SPU配置"];

const SPU_SUBNAV = ["SPU基础配置", "SPU管理", "SPU搜索配置", "SPU内容配置"];

const initialRows: RuleRow[] = [
  {
    id: "1",
    content: "Open AI",
    standard: "openai",
    termType: ["品牌词"],
    matchType: "精准匹配",
    direct: "是",
    status: "已启用",
    scope: "全部IP生效",
    regions: [],
    updater: "Alex",
    updatedAt: "2026-05-20 16:00:24",
    remark: "官方品牌词",
  },
];

// 每个 SPU 独立的词条集合，按 SPU 名维护
const initialRowsBySpu: Record<string, RuleRow[]> = {
  ChatGPT: initialRows,
  Netflix: [],
  Spotify: [],
  Tidal: [],
};

// 每个 SPU 的词库内部状态（仅 未发布/已启用/已停用 三种持久态，未配置由词条数派生）
const initialLibState: Record<string, LibState> = {
  ChatGPT: "已启用",
  Netflix: "未发布",
  Spotify: "未发布",
  Tidal: "未发布",
};

function termBadge(t: TermType) {
  const map: Record<string, string> = {
    商品词: "bg-sky-100 text-sky-700",
    品牌词: "bg-amber-100 text-amber-700",
    别名词: "bg-violet-100 text-violet-700",
    错词: "bg-rose-100 text-rose-700",
    短词: "bg-emerald-100 text-emerald-700",
    场景词: "bg-fuchsia-100 text-fuchsia-700",
    品类词: "bg-indigo-100 text-indigo-700",
  };
  return map[t] ?? "bg-slate-100 text-slate-700";
}

const blank: RuleRow = {
  id: "",
  content: "",
  standard: "",
  termType: ["品牌词"],
  matchType: "精准匹配",
  direct: "是",
  status: "已启用",
  scope: "全部IP生效",
  regions: [],
  updater: "Alex",
  updatedAt: "",
  remark: "",
};

export function SpuRuleManagement() {
  const [view, setView] = useState<"overview" | "manage">("overview");
  const [activeSpu, setActiveSpu] = useState("ChatGPT");
  const [enabledSpu, setEnabledSpu] = useState<Record<string, boolean>>(
    Object.fromEntries(SPU_LIST.map((s) => [s, true])),
  );
  // SPU 词库持久状态：未发布 / 已启用 / 已停用（"未配置" 由词条数派生）
  const [libState, setLibState] = useState<Record<string, LibState>>(initialLibState);
  const [libConfirm, setLibConfirm] = useState<SpuInfo | null>(null);
  const [libError, setLibError] = useState<string>("");
  const [logSpu, setLogSpu] = useState<string | null>(null);
  const [logs, setLogs] = useState<OpLog[]>([
    {
      id: "l0",
      spu: "ChatGPT",
      action: "新增词条",
      target: "Open AI",
      operator: "Alex",
      at: "2026-05-20 16:00:24",
    },
  ]);

  function nowStr() {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
  }
  function pushLog(entry: Omit<OpLog, "id" | "at" | "operator"> & { operator?: string }) {
    setLogs((prev) => [
      {
        id: crypto.randomUUID(),
        at: nowStr(),
        operator: entry.operator ?? "Alex",
        spu: entry.spu,
        action: entry.action,
        target: entry.target,
      },
      ...prev,
    ]);
  }

  const [hideDisabled, setHideDisabled] = useState(true);
  const [reverseOrder, setReverseOrder] = useState(true);

  const [filters, setFilters] = useState<{
    content: string;
    standard: string;
    termTypes: TermType[];
    matchTypes: MatchType[];
    directs: DirectFlag[];
    statuses: Status[];
  }>({
    content: "",
    standard: "",
    termTypes: [],
    matchTypes: [],
    directs: [],
    statuses: [],
  });

  const [rowsBySpu, setRowsBySpu] = useState<Record<string, RuleRow[]>>(initialRowsBySpu);
  const rows = rowsBySpu[activeSpu] ?? [];
  const setRows = (updater: RuleRow[] | ((prev: RuleRow[]) => RuleRow[])) => {
    setRowsBySpu((prev) => {
      const cur = prev[activeSpu] ?? [];
      const next = typeof updater === "function" ? (updater as (p: RuleRow[]) => RuleRow[])(cur) : updater;
      return { ...prev, [activeSpu]: next };
    });
  };
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<RuleRow>(blank);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [scopeError, setScopeError] = useState("");
  const [duplicateError, setDuplicateError] = useState("");
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<RuleRow | null>(null);
  const [customTermTypes, setCustomTermTypes] = useState<string[]>([]);
  const [customTermInput, setCustomTermInput] = useState("");
  const [isCustomTerm, setIsCustomTerm] = useState(false);
  const [customTermError, setCustomTermError] = useState("");

  const allTermTypes = useMemo(
    () => [...TERM_TYPES, ...customTermTypes],
    [customTermTypes],
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filters.content && !r.content.toLowerCase().includes(filters.content.toLowerCase()))
        return false;
      if (
        filters.standard &&
        !r.standard.toLowerCase().includes(filters.standard.toLowerCase())
      )
        return false;
      if (
        filters.termTypes.length &&
        !r.termType.some((t) => filters.termTypes.includes(t))
      )
        return false;
      if (filters.matchTypes.length && !filters.matchTypes.includes(r.matchType)) return false;
      if (filters.directs.length && !filters.directs.includes(r.direct)) return false;
      if (filters.statuses.length && !filters.statuses.includes(r.status)) return false;
      return true;
    });
  }, [rows, filters]);

  function openCreate() {
    setMode("create");
    setDraft({ ...blank, id: crypto.randomUUID() });
    setIsCustomTerm(false);
    setCustomTermInput("");
    setCustomTermError("");
    setDuplicateError("");
    setScopeError("");
    setEditOpen(true);
  }

  function openEdit(row: RuleRow) {
    setMode("edit");
    setDraft({ ...row });
    setIsCustomTerm(false);
    setCustomTermInput("");
    setCustomTermError("");
    setDuplicateError("");
    setScopeError("");
    setEditOpen(true);
  }

  function saveDraft(action: "draft" | "publish") {
    if (draft.termType.length === 0) return;
    const dup = rows.find(
      (r) => r.id !== draft.id && r.standard && r.standard === draft.standard,
    );
    if (dup) {
      setDuplicateError(
        `当前SPU下已存在相同标准化词的词条「${dup.content}」，请直接编辑该词条`,
      );
      return;
    }
    setDuplicateError("");
    if (
      (draft.scope === "部分IP生效" || draft.scope === "部分IP不生效") &&
      draft.regions.length === 0
    ) {
      setScopeError(
        draft.scope === "部分IP生效"
          ? "请选择「生效」的国家/地区"
          : "请选择「不生效」的国家/地区",
      );
      return;
    }
    setScopeError("");
    const now = new Date()
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);
    let nextStatus: Status;
    if (action === "draft") {
      // 新增时进入草稿；编辑已发布词条仅存草稿，前台仍用原线上版本，保持原状态展示
      nextStatus = mode === "create" ? "草稿" : draft.status;
    } else {
      nextStatus = "已启用";
    }
    const payload = { ...draft, status: nextStatus, updatedAt: now };
    setRows((prev) => {
      const exists = prev.some((p) => p.id === payload.id);
      return exists ? prev.map((p) => (p.id === payload.id ? payload : p)) : [payload, ...prev];
    });
    pushLog({
      spu: activeSpu,
      action:
        mode === "create"
          ? action === "publish"
            ? "新增并发布词条"
            : "新增词条草稿"
          : action === "publish"
            ? "编辑并发布词条"
            : "编辑词条草稿",
      target: payload.content,
    });
    setEditOpen(false);
  }

  function toggleStatus(row: RuleRow) {
    const next: Status = row.status === "已启用" ? "已停用" : "已启用";
    setRows((prev) =>
      prev.map((p) =>
        p.id === row.id ? { ...p, status: next, updatedAt: nowStr() } : p,
      ),
    );
    pushLog({
      spu: activeSpu,
      action: next === "已启用" ? "启用词条" : "停用词条",
      target: row.content,
    });
  }

  // 词库展示状态派生：未配置 / 草稿 / 已启用 / 已停用
  function computeLibStatus(spu: string): LibStatus {
    const rs = rowsBySpu[spu] ?? [];
    if (rs.length === 0) return "未配置";
    const state = libState[spu] ?? "未发布";
    if (state === "未发布") return "草稿";
    return state; // 已启用 / 已停用
  }

  // 总览表数据
  const overviewRows = useMemo(() => {
    return SPU_INFOS.map((s) => {
      const spuRows = rowsBySpu[s.name] ?? [];
      const termCount = spuRows.length;
      const enabledCount = spuRows.filter((r) => r.status === "已启用").length;
      const sorted = [...spuRows].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      const last = sorted[0];
      return {
        ...s,
        termCount,
        enabledCount,
        libStatus: computeLibStatus(s.name),
        updater: last?.updater ?? "—",
        updatedAt: last?.updatedAt ?? "—",
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsBySpu, libState]);

  function confirmToggleLib() {
    if (!libConfirm) return;
    const cur = computeLibStatus(libConfirm.name);
    // 启用词库：需要至少 1 条已启用词条
    if (cur !== "已启用") {
      const rs = rowsBySpu[libConfirm.name] ?? [];
      const enabledCount = rs.filter((r) => r.status === "已启用").length;
      if (enabledCount === 0) {
        setLibError("请至少启用 1 条词条后再启用词库");
        return;
      }
      setLibState((p) => ({ ...p, [libConfirm.name]: "已启用" }));
      pushLog({ spu: libConfirm.name, action: "启用词库", target: libConfirm.name });
    } else {
      setLibState((p) => ({ ...p, [libConfirm.name]: "已停用" }));
      pushLog({ spu: libConfirm.name, action: "停用词库", target: libConfirm.name });
    }
    setLibConfirm(null);
    setLibError("");
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-sm text-slate-800">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col bg-white border-r border-slate-200">
        <div className="flex h-12 items-center px-4 border-b border-slate-200 font-semibold text-slate-700">
          后台管理系统
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((item) => {
            const isSpu = item === "SPU配置";
            return (
              <div key={item}>
                <div
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50",
                    isSpu && "bg-slate-50",
                  )}
                >
                  <span className="flex items-center gap-2 text-slate-700">
                    <Menu className="h-4 w-4 text-slate-400" />
                    {item}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-slate-400 transition",
                      isSpu && "rotate-180",
                    )}
                  />
                </div>
                {isSpu && (
                  <div className="bg-slate-50 pb-2">
                    {SPU_SUBNAV.map((sub) => (
                      <div
                        key={sub}
                        className={cn(
                          "pl-12 py-2 cursor-pointer hover:bg-blue-50",
                          sub === "SPU搜索配置" &&
                            "bg-blue-500 text-white hover:bg-blue-500",
                        )}
                      >
                        {sub}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-12 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <Menu className="h-4 w-4 text-slate-500" />
          <RefreshCw className="h-4 w-4 text-slate-500" />
          <div className="text-slate-500">
            SPU配置 <span className="px-1">/</span>
            <span className="text-slate-700">SPU搜索配置</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-72">
              <Input placeholder="通过名称搜索页面" className="h-8" />
            </div>
            <Maximize2 className="h-4 w-4 text-slate-500" />
            <Switch defaultChecked />
            <Bell className="h-4 w-4 text-slate-500" />
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-600">
              <User className="h-4 w-4" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4">
          <div className="rounded-md bg-white shadow-sm">
            <div className="flex">
              {/* Left col: SPU词库管理 */}
              <div className="w-44 shrink-0 border-r border-slate-200 p-4">
                <div className="space-y-2 text-slate-700">
                  <div
                    onClick={() => setView("overview")}
                    className={cn(
                      "py-1.5 cursor-pointer",
                      view === "overview" && "text-blue-600 font-medium",
                    )}
                  >
                    SPU词库总览
                  </div>
                  <div
                    onClick={() => setView("manage")}
                    className={cn(
                      "py-1.5 cursor-pointer",
                      view === "manage" && "text-blue-600 font-medium",
                    )}
                  >
                    SPU词库管理
                  </div>
                </div>
              </div>

              {view === "manage" && (
              <div className="w-52 shrink-0 border-r border-slate-200 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">隐藏未启用</span>
                    <Switch
                      checked={hideDisabled}
                      onCheckedChange={setHideDisabled}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">创建倒序/正序</span>
                    <Switch
                      checked={reverseOrder}
                      onCheckedChange={setReverseOrder}
                    />
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="搜索" className="h-8 pl-7" />
                  </div>
                  <div className="space-y-1">
                    {SPU_LIST.filter((s) => !hideDisabled || enabledSpu[s]).map((s) => (
                      <div
                        key={s}
                        onClick={() => setActiveSpu(s)}
                        className={cn(
                          "flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer hover:bg-slate-50",
                          activeSpu === s && "bg-blue-50",
                        )}
                      >
                        <Checkbox
                          checked={enabledSpu[s]}
                          onCheckedChange={(v) =>
                            setEnabledSpu((p) => ({ ...p, [s]: !!v }))
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-slate-700">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              )}

              {/* Right: filters + table */}
              <div className="min-w-0 flex-1 p-4">
                {view === "overview" ? (
                  <OverviewTable
                    rows={overviewRows}
                    onEdit={(spu) => {
                      setActiveSpu(spu);
                      setView("manage");
                    }}
                    onToggleLib={(s) => setLibConfirm(s)}
                    onViewLog={(spu) => setLogSpu(spu)}
                  />
                ) : (
                <>
                {/* Filters */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Label className="w-24 shrink-0 text-right text-slate-600">词条内容</Label>
                    <Input
                      placeholder="请输入词条内容"
                      className="h-8"
                      value={filters.content}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, content: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-24 shrink-0 text-right text-slate-600">标准化词</Label>
                    <Input
                      placeholder="请输入标准化词"
                      className="h-8"
                      value={filters.standard}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, standard: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-24 shrink-0 text-right text-slate-600">词条类型</Label>
                    <MultiSelect
                      options={allTermTypes}
                      value={filters.termTypes}
                      onChange={(v) =>
                        setFilters((f) => ({ ...f, termTypes: v as TermType[] }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-24 shrink-0 text-right text-slate-600">匹配方式</Label>
                    <MultiSelect
                      options={MATCH_TYPES}
                      value={filters.matchTypes}
                      onChange={(v) =>
                        setFilters((f) => ({ ...f, matchTypes: v as MatchType[] }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-24 shrink-0 text-right text-slate-600">指向当前SPU</Label>
                    <Select
                      value={filters.directs[0] ?? "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({
                          ...f,
                          directs: v === "all" ? [] : [v as DirectFlag],
                        }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        {DIRECT_FLAGS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-24 shrink-0 text-right text-slate-600">词条状态</Label>
                    <Select
                      value={filters.statuses[0] ?? "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({
                          ...f,
                          statuses: v === "all" ? [] : [v as Status],
                        }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <Button size="sm" className="h-8 bg-rose-500 hover:bg-rose-600">
                    <Filter className="h-3.5 w-3.5" /> 筛选
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() =>
                      setFilters({
                        content: "",
                        standard: "",
                        termTypes: [],
                        matchTypes: [],
                        directs: [],
                        statuses: [],
                      })
                    }
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> 重置
                  </Button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span>
                      SPU：<span className="font-medium">{activeSpu}</span>
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 text-xs">词库状态</span>
                    {(() => {
                      const s = computeLibStatus(activeSpu);
                      return (
                        <Badge
                          className={cn(
                            "border-0",
                            s === "已启用"
                              ? "bg-emerald-100 text-emerald-700"
                              : s === "草稿"
                                ? "bg-amber-100 text-amber-700"
                                : s === "未配置"
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-slate-200 text-slate-600",
                          )}
                        >
                          {s}
                        </Badge>
                      );
                    })()}
                  </div>
                  <Button
                    size="sm"
                    onClick={openCreate}
                    className="h-8 bg-blue-500 hover:bg-blue-600"
                  >
                    <Plus className="h-3.5 w-3.5" /> 新增词条
                  </Button>
                </div>

                <div className="mt-3 overflow-x-auto rounded border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>词条内容</TableHead>
                        <TableHead>标准化词</TableHead>
                        <TableHead>词条类型</TableHead>
                        <TableHead>匹配方式</TableHead>
                        <TableHead>是否明确指向当前SPU</TableHead>
                        <TableHead>词条状态</TableHead>
                        <TableHead>生效范围</TableHead>
                        <TableHead>最近更新人</TableHead>
                        <TableHead>最近更新时间</TableHead>
                        <TableHead>备注</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="py-10 text-center text-slate-400">
                            暂无数据
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.content}</TableCell>
                            <TableCell>{r.standard}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {r.termType.map((t) => (
                                  <Badge key={t} className={cn("border-0", termBadge(t))}>
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>{r.matchType}</TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "border-0",
                                  r.direct === "是"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600",
                                )}
                              >
                                {r.direct}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "border-0",
                                  r.status === "已启用"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : r.status === "草稿"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-200 text-slate-600",
                                )}
                              >
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "border-0",
                                  r.scope === "全部IP生效"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : r.scope === "全部IP不生效"
                                      ? "bg-slate-200 text-slate-600"
                                      : r.scope === "部分IP生效"
                                        ? "bg-sky-100 text-sky-700"
                                        : "bg-amber-100 text-amber-700",
                                )}
                              >
                                {r.scope}
                              </Badge>
                            </TableCell>
                            <TableCell>{r.updater}</TableCell>
                            <TableCell className="whitespace-nowrap">{r.updatedAt}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={r.remark}>
                              {r.remark}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-3 text-xs">
                                <button
                                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                  onClick={() => openEdit(r)}
                                >
                                  <Pencil className="h-3 w-3" /> 编辑
                                </button>
                                <button
                                  className="text-rose-500 hover:underline inline-flex items-center gap-1"
                                  onClick={() => setStatusConfirm(r)}
                                >
                                  <Power className="h-3 w-3" />
                                  {r.status === "已启用" ? "停用" : "启用"}
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "新增词条" : "编辑词条"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <Field label="词条内容" required>
              <Input
                value={draft.content}
                onChange={(e) =>
                  {
                    setDraft({
                      ...draft,
                      content: e.target.value,
                      standard: normalizeTerm(e.target.value),
                    });
                    if (duplicateError) setDuplicateError("");
                  }
                }
                placeholder="请输入词条内容"
              />
              {duplicateError && (
                <p className="text-xs text-rose-500 mt-1">{duplicateError}</p>
              )}
            </Field>
            <Field label="标准化词" required>
              <Input
                value={draft.standard}
                readOnly
                disabled
                placeholder="根据词条内容自动生成"
                className="bg-slate-50"
              />
            </Field>
            <Field label="词条类型" required>
              <div className="flex min-w-0 items-center gap-2">
                <div className="min-w-0 flex-1">
                  <MultiSelect
                    options={allTermTypes}
                    value={draft.termType}
                    onChange={(v) => setDraft({ ...draft, termType: v as TermType[] })}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isCustomTerm ? "secondary" : "outline"}
                  className="h-9 shrink-0"
                  onClick={() => {
                    setIsCustomTerm((v) => !v);
                    setCustomTermInput("");
                    setCustomTermError("");
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  自定义
                </Button>
              </div>
              {isCustomTerm && (
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    value={customTermInput}
                    onChange={(e) => {
                      setCustomTermInput(e.target.value);
                      if (customTermError) setCustomTermError("");
                    }}
                    placeholder="请输入自定义类型名称"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 shrink-0 bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => {
                      const name = customTermInput.trim();
                      if (!name) {
                        setCustomTermError("请输入自定义类型名称");
                        return;
                      }
                      if (allTermTypes.includes(name)) {
                        setCustomTermError("该类型名称已存在");
                        return;
                      }
                      setCustomTermTypes((prev) => [...prev, name]);
                      setDraft({ ...draft, termType: [...draft.termType, name] });
                      setIsCustomTerm(false);
                      setCustomTermInput("");
                      setCustomTermError("");
                    }}
                  >
                    确定
                  </Button>
                </div>
              )}
              {isCustomTerm && customTermError && (
                <p className="text-xs text-rose-500 mt-1">{customTermError}</p>
              )}
            </Field>
            <Field label="匹配方式" required>
              <Select
                value={draft.matchType}
                onValueChange={(v) => setDraft({ ...draft, matchType: v as MatchType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATCH_TYPES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="是否明确指向当前SPU" required>
              <Select
                value={draft.direct}
                onValueChange={(v) => setDraft({ ...draft, direct: v as DirectFlag })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="是">是</SelectItem>
                  <SelectItem value="否">否</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="生效范围" required>
              <div className="flex items-center gap-2">
                <Select
                  value={draft.scope}
                  onValueChange={(v) =>
                    setDraft({ ...draft, scope: v as Scope, regions: [] })
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(draft.scope === "部分IP生效" || draft.scope === "部分IP不生效") && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 shrink-0 bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => setRegionSheetOpen(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    编辑{draft.regions.length > 0 ? ` (${draft.regions.length})` : ""}
                  </Button>
                )}
              </div>
              {scopeError && (
                <p className="text-xs text-rose-500 mt-1">{scopeError}</p>
              )}
            </Field>
            <div className="col-span-2">
              <Field label="备注">
                <Textarea
                  rows={3}
                  value={draft.remark}
                  onChange={(e) => setDraft({ ...draft, remark: e.target.value })}
                  placeholder="请输入备注"
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button
              variant="outline"
              onClick={() => saveDraft("draft")}
              disabled={!draft.content || !draft.standard}
            >
              保存草稿
            </Button>
            <Button
              onClick={() => saveDraft("publish")}
              className="bg-blue-500 hover:bg-blue-600"
              disabled={!draft.content || !draft.standard}
            >
              保存并发布
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RegionSheet
        open={regionSheetOpen}
        onOpenChange={setRegionSheetOpen}
        title={`配置 ${draft.content || "词条"} 生效范围`}
        value={draft.regions}
        onSave={(v) => {
          setDraft({ ...draft, regions: v });
          setRegionSheetOpen(false);
          if (v.length > 0) setScopeError("");
        }}
      />

      <Dialog
        open={!!statusConfirm}
        onOpenChange={(o) => !o && setStatusConfirm(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {statusConfirm?.status === "已启用" ? "确认停用" : "确认启用"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {statusConfirm?.status === "已启用"
              ? `停用后，词条「${statusConfirm?.content}」将不再参与前台搜索召回。是否确认停用？`
              : `启用后，词条「${statusConfirm?.content}」将参与前台搜索召回。是否确认启用？`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusConfirm(null)}>
              取消
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => {
                if (statusConfirm) toggleStatus(statusConfirm);
                setStatusConfirm(null);
              }}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 词库停用/启用 二次确认 */}
      <Dialog
        open={!!libConfirm}
        onOpenChange={(o) => {
          if (!o) {
            setLibConfirm(null);
            setLibError("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {libConfirm && computeLibStatus(libConfirm.name) === "已启用"
                ? "确认停用词库"
                : "确认启用词库"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              {libConfirm && computeLibStatus(libConfirm.name) === "已启用"
                ? `停用后，SPU「${libConfirm.name}」词库下的全部词条将不再参与前台搜索召回。是否确认停用？`
                : `启用后，SPU「${libConfirm?.name}」词库下已启用的词条将参与前台搜索召回。是否确认启用？`}
            </p>
            {libError && <p className="text-xs text-rose-500">{libError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLibConfirm(null)}>
              取消
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600" onClick={confirmToggleLib}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看日志 */}
      <Dialog open={!!logSpu} onOpenChange={(o) => !o && setLogSpu(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>操作日志 - {logSpu}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="whitespace-nowrap">操作时间</TableHead>
                  <TableHead>操作类型</TableHead>
                  <TableHead>对象</TableHead>
                  <TableHead>操作人</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.filter((l) => l.spu === logSpu).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-slate-400">
                      暂无操作记录
                    </TableCell>
                  </TableRow>
                ) : (
                  logs
                    .filter((l) => l.spu === logSpu)
                    .sort((a, b) => (a.at < b.at ? 1 : -1))
                    .map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap">{l.at}</TableCell>
                        <TableCell>{l.action}</TableCell>
                        <TableCell>{l.target}</TableCell>
                        <TableCell>{l.operator}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogSpu(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface OverviewRow extends SpuInfo {
  termCount: number;
  enabledCount: number;
  libStatus: LibStatus;
  updater: string;
  updatedAt: string;
}

function OverviewTable({
  rows,
  onEdit,
  onToggleLib,
  onViewLog,
}: {
  rows: OverviewRow[];
  onEdit: (spu: string) => void;
  onToggleLib: (s: SpuInfo) => void;
  onViewLog: (spu: string) => void;
}) {
  return (
    <>
      <div className="mb-3 text-slate-700">SPU词库总览</div>
      <div className="overflow-x-auto rounded border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>SPU ID</TableHead>
              <TableHead>SPU名称</TableHead>
              <TableHead>SPU分类</TableHead>
              <TableHead>商品状态</TableHead>
              <TableHead>是否参与搜索</TableHead>
              <TableHead>词条数量</TableHead>
              <TableHead>已启用词条数</TableHead>
              <TableHead>词库状态</TableHead>
              <TableHead>最近更新人</TableHead>
              <TableHead className="whitespace-nowrap">最近更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{r.id}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "border-0",
                      r.productStatus === "在售"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600",
                    )}
                  >
                    {r.productStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "border-0",
                      r.inSearch
                        ? "bg-sky-100 text-sky-700"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {r.inSearch ? "是" : "否"}
                  </Badge>
                </TableCell>
                <TableCell>{r.termCount}</TableCell>
                <TableCell>{r.enabledCount}</TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "border-0",
                      r.libStatus === "已启用"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.libStatus === "草稿"
                          ? "bg-amber-100 text-amber-700"
                          : r.libStatus === "未配置"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-slate-200 text-slate-600",
                    )}
                  >
                    {r.libStatus}
                  </Badge>
                </TableCell>
                <TableCell>{r.updater}</TableCell>
                <TableCell className="whitespace-nowrap">{r.updatedAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-3 text-xs">
                    <button
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      onClick={() => onEdit(r.name)}
                    >
                      <Pencil className="h-3 w-3" /> 编辑词库
                    </button>
                    {r.libStatus === "未配置" ? (
                      <span
                        className="text-slate-300 inline-flex items-center gap-1 cursor-not-allowed"
                        title="请先编辑词库添加词条"
                      >
                        <Power className="h-3 w-3" /> 启用
                      </span>
                    ) : (
                      <button
                        className={cn(
                          "hover:underline inline-flex items-center gap-1",
                          r.libStatus === "已启用" ? "text-rose-500" : "text-blue-600",
                        )}
                        onClick={() => onToggleLib(r)}
                      >
                        <Power className="h-3 w-3" />
                        {r.libStatus === "已启用" ? "停用" : "启用"}
                      </button>
                    )}
                    <button
                      className="text-slate-600 hover:underline inline-flex items-center gap-1"
                      onClick={() => onViewLog(r.name)}
                    >
                      <FileText className="h-3 w-3" /> 查看日志
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-slate-600">
        {required && <span className="text-rose-500">* </span>}
        {label}
      </Label>
      {children}
    </div>
  );
}

function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "请选择",
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={value.length > 0 ? value.join("、") : undefined}
          className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm hover:bg-slate-50"
        >
          <span className={cn("truncate", value.length === 0 && "text-slate-400")}>
            {value.length === 0 ? placeholder : value.join("、")}
          </span>
          <ChevronDown className="ml-2 h-3.5 w-3.5 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <div className="flex items-center justify-between px-2 py-1.5 text-xs text-slate-500">
          <span>{value.length > 0 ? `已选 ${value.length}` : "多选"}</span>
          {value.length > 0 && (
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => onChange([])}
            >
              清空
            </button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {options.map((opt) => {
            const checked = value.includes(opt);
            return (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(opt)} />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RegionSheet({
  open,
  onOpenChange,
  title,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  value: string[];
  onSave: (v: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(value);
  const [tab, setTab] = useState("select");

  // 打开时同步外部值
  useEffect(() => {
    if (open) setSelected(value);
  }, [open, value]);

  const toggle = (code: string) => {
    setSelected((p) => (p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));
  };

  const allCodes = REGION_GROUPS.flatMap((g) => g.countries.map((c) => c.code));
  const allSelected = allCodes.every((c) => selected.includes(c));

  const toggleAll = () => {
    setSelected(allSelected ? [] : allCodes);
  };

  const toggleContinent = (continent: string) => {
    const codes = REGION_GROUPS.find((g) => g.continent === continent)!.countries.map(
      (c) => c.code,
    );
    const allIn = codes.every((c) => selected.includes(c));
    setSelected((p) =>
      allIn ? p.filter((c) => !codes.includes(c)) : Array.from(new Set([...p, ...codes])),
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-2/5 !max-w-none p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b border-slate-200">
          <SheetTitle className="text-base">{title}</SheetTitle>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-3 border-b border-slate-200">
            <TabsList className="bg-transparent p-0 h-auto gap-6">
              <TabsTrigger
                value="add"
                className="px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:shadow-none bg-transparent"
              >
                添加国家地区
              </TabsTrigger>
              <TabsTrigger
                value="select"
                className="px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:shadow-none bg-transparent"
              >
                选择国家地区
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="add" className="flex-1 overflow-auto px-6 py-4 m-0">
            <p className="text-sm text-slate-500">在此添加自定义国家/地区。</p>
          </TabsContent>

          <TabsContent value="select" className="flex-1 overflow-auto px-6 py-4 m-0 space-y-6">
            {REGION_GROUPS.map((group) => {
              const codes = group.countries.map((c) => c.code);
              const allIn = codes.every((c) => selected.includes(c));
              const someIn = codes.some((c) => selected.includes(c));
              return (
                <div key={group.continent}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-base font-semibold text-slate-800">
                      {group.continent}
                    </span>
                    <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
                      <Checkbox
                        checked={allIn ? true : someIn ? "indeterminate" : false}
                        onCheckedChange={() => toggleContinent(group.continent)}
                      />
                      全选
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-y-3 gap-x-4">
                    {group.countries.map((c) => (
                      <label
                        key={c.code}
                        className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                      >
                        <Checkbox
                          checked={selected.includes(c.code)}
                          onCheckedChange={() => toggle(c.code)}
                        />
                        <span className="truncate">
                          {c.name} [{c.code}]
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 bg-white">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            全选
            <span className="ml-3 text-slate-500">已选国家地区: {selected.length}</span>
          </label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => onSave(selected)}
            >
              保存
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}