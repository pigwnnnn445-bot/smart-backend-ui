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
  Copy,
  Eye,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { toast } from "sonner";

type TermType = string;
type MatchType = "精准匹配" | "前缀匹配";
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
  i18n?: Record<string, string>;
}

const SPU_LIST = ["Netflix", "Spotify", "Tidal", "ChatGPT"];

const SPU_TYPE_MAP: Record<string, ProductType> = {
  Netflix: "b2c",
  Spotify: "b2c",
  Tidal: "b2c",
  ChatGPT: "c2c",
};

type ProductType = "b2c" | "c2c";

// 复制词库配置 - 不同商品类型下可选的源SPU列表
const COPY_SOURCE_SPUS: Record<ProductType, string[]> = {
  b2c: [
    "Netflix B2C",
    "Spotify B2C",
    "Tidal B2C",
    "Disney+ B2C",
    "YouTube Premium B2C",
    "HBO Max B2C",
    "Apple Music B2C",
    "Amazon Prime B2C",
  ],
  c2c: [
    "Steam C2C",
    "Game Top-up C2C",
    "Gift Card C2C",
    "Account Trade C2C",
    "PSN Card C2C",
    "Xbox Card C2C",
  ],
};

interface SpuInfo {
  id: string;
  name: string;
  category: string;
  productStatus: "在售" | "下架";
  inSearch: boolean;
  productType?: ProductType;
}

const SPU_INFOS: SpuInfo[] = [
  { id: "SPU10001", name: "Netflix", category: "影视会员", productStatus: "在售", inSearch: true, productType: "b2c" },
  { id: "SPU10002", name: "Spotify", category: "音乐会员", productStatus: "在售", inSearch: true, productType: "b2c" },
  { id: "SPU10003", name: "Tidal", category: "音乐会员", productStatus: "在售", inSearch: false, productType: "b2c" },
  { id: "SPU10004", name: "ChatGPT", category: "AI工具", productStatus: "在售", inSearch: true, productType: "c2c" },
];

interface OpLog {
  id: string;
  spu: string;
  action: string;
  target: string;
  operator: string;
  at: string;
  field?: string;
  detail?: string;
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
const MATCH_TYPES: MatchType[] = ["精准匹配", "前缀匹配"];
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
  termType: [],
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
  const [activeSpu, setActiveSpu] = useState("Netflix");
  const [activeProductType, setActiveProductType] = useState<ProductType>("b2c");
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
        field: entry.field,
        detail: entry.detail,
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
  const [duplicateError, setDuplicateError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    content?: string;
    standard?: string;
    termType?: string;
    remark?: string;
  }>({});
  const [crossSpuWarning, setCrossSpuWarning] = useState("");
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<RuleRow | null>(null);
  const [batchConfirm, setBatchConfirm] = useState<Extract<Status, "已启用" | "已停用"> | null>(null);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  // 批量选择
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useEffect(() => {
    setSelectedIds([]);
  }, [activeSpu]);

  // 复制其他词库配置
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyProductType, setCopyProductType] = useState<"" | ProductType>("");
  const [copySourceSpu, setCopySourceSpu] = useState("");
  const [copySpuSearch, setCopySpuSearch] = useState("");
  const [copySpuOpen, setCopySpuOpen] = useState(false);
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false);
  const [copyError, setCopyError] = useState<{ type?: string; spu?: string }>({});
  const [previewEntriesOpen, setPreviewEntriesOpen] = useState(false);

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
    setDuplicateError("");
    setFieldErrors({});
    setCrossSpuWarning("");
    setEditOpen(true);
  }

  function openEdit(row: RuleRow) {
    setMode("edit");
    setDraft({ ...row });
    setDuplicateError("");
    setFieldErrors({});
    setCrossSpuWarning("");
    setEditOpen(true);
  }

  function saveDraft(action: "draft" | "publish") {
    const errs: typeof fieldErrors = {};
    if (!draft.content.trim()) errs.content = "请输入词条内容";
    else if (draft.content.length > 100) errs.content = "词条内容不能超过100字符";
    else if (!normalizeTerm(draft.content)) errs.content = "词条内容无效，请输入有效搜索词";
    if (!draft.standard.trim()) errs.standard = "请输入标准化词";
    if (draft.termType.length === 0) errs.termType = "请选择词条类型";
    if (draft.remark && draft.remark.length > 300) errs.remark = "备注内容不能超过300字符";
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
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
    // 弱校验：不同 SPU 下相同标准化词，仅提示，可正常保存
    const crossSpu = Object.entries(rowsBySpu).find(
      ([spu, list]) =>
        spu !== activeSpu &&
        list.some((r) => r.standard && r.standard === draft.standard),
    );
    if (crossSpu) {
      setCrossSpuWarning("该标准化词已被其他SPU使用，用户搜索时可能同时召回多个商品");
    } else {
      setCrossSpuWarning("");
    }
    if (action === "publish") {
      // 校验通过后，先弹出二次确认弹窗
      setPublishConfirmOpen(true);
      return;
    }
    commitSave(action);
  }

  function commitSave(action: "draft" | "publish") {
    const now = new Date()
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);
    let nextStatus: Status;
    if (action === "draft") {
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
    if (action === "publish") {
      const lib = computeLibStatus(activeSpu);
      if (lib === "已启用") {
        toast.success("保存并发布成功，词条已参与前台搜索匹配。");
      } else if (lib === "已停用") {
        toast.success("保存并发布成功。当前SPU词库处于停用状态，词条暂不参与前台搜索，重新启用词库后生效。");
      } else {
        // 未配置 / 草稿（含本次新增使原"未配置"变"草稿"）
        toast.success("保存并发布成功。当前SPU词库未启用，词条暂不参与前台搜索，启用词库后生效。");
      }
    }
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

  function bulkSetStatus(next: Extract<Status, "已启用" | "已停用">) {
    if (selectedIds.length === 0) return;
    const now = nowStr();
    setRows((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id) ? { ...p, status: next, updatedAt: now } : p,
      ),
    );
    pushLog({
      spu: activeSpu,
      action: next === "已启用" ? "批量启用词条" : "批量停用词条",
      target: `${selectedIds.length} 条词条`,
    });
    toast.success(
      `已${next === "已启用" ? "启用" : "停用"} ${selectedIds.length} 条词条`,
    );
    setSelectedIds([]);
  }

  function openCopy() {
    setCopyProductType("");
    setCopySourceSpu("");
    setCopySpuSearch("");
    setCopyError({});
    setCopyOpen(true);
  }

  function submitCopy() {
    const errs: { type?: string; spu?: string } = {};
    if (!copyProductType) errs.type = "请选择商品类型";
    if (!copySourceSpu) errs.spu = "请选择源SPU";
    setCopyError(errs);
    if (Object.keys(errs).length > 0) return;
    setCopyConfirmOpen(true);
  }

  function commitCopy(action: "enable" | "draft") {
    // 模拟从源SPU克隆若干词条到当前SPU
    const now = nowStr();
    const status: Status = action === "enable" ? "已启用" : "草稿";
    const samples: RuleRow[] = [
      {
        ...blank,
        id: crypto.randomUUID(),
        content: `${copySourceSpu}-品牌词`,
        standard: normalizeTerm(`${copySourceSpu}brand`),
        termType: ["品牌词"],
        matchType: "精准匹配",
        direct: "是",
        status,
        scope: "全部IP生效",
        regions: [],
        updater: "Alex",
        updatedAt: now,
        remark: `从「${copySourceSpu}」复制`,
      },
      {
        ...blank,
        id: crypto.randomUUID(),
        content: `${copySourceSpu}-别名词`,
        standard: normalizeTerm(`${copySourceSpu}alias`),
        termType: ["别名词"],
        matchType: "前缀匹配",
        direct: "否",
        status,
        scope: "全部IP生效",
        regions: [],
        updater: "Alex",
        updatedAt: now,
        remark: `从「${copySourceSpu}」复制`,
      },
      {
        ...blank,
        id: crypto.randomUUID(),
        content: `${copySourceSpu}-场景词`,
        standard: normalizeTerm(`${copySourceSpu}scene`),
        termType: ["场景词"],
        matchType: "前缀匹配",
        direct: "否",
        status,
        scope: "全部IP生效",
        regions: [],
        updater: "Alex",
        updatedAt: now,
        remark: `从「${copySourceSpu}」复制`,
      },
    ];
    setRows((prev) => [...samples, ...prev]);
    pushLog({
      spu: activeSpu,
      action: `复制词库配置（${action === "enable" ? "立即启用" : "保存到草稿"}）`,
      target: `${copyProductType?.toUpperCase()} / ${copySourceSpu}`,
    });
    toast.success(
      action === "enable"
        ? `已从「${copySourceSpu}」复制并启用 ${samples.length} 条词条`
        : `已从「${copySourceSpu}」复制为草稿 ${samples.length} 条词条`,
    );
    setCopyConfirmOpen(false);
    setCopyOpen(false);
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
    return SPU_INFOS.filter((s) => s.productType === activeProductType).map((s) => {
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
  }, [rowsBySpu, libState, activeProductType]);

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

        <main className="flex-1 overflow-auto p-6 bg-slate-50/60">
          <div className="rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 overflow-hidden">
            <div className="flex">
              {/* Left col: Menu */}
              <div className="w-44 shrink-0 border-r border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white px-3 py-5">
                <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Search Config
                </div>
                <nav className="space-y-1 text-sm text-slate-600">
                  {[
                    { label: "SPU词库管理", active: view === "overview", onClick: () => setView("overview") },
                    { label: "SPU词条管理", active: view === "manage", onClick: () => setView("manage") },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2 transition-colors",
                        item.active
                          ? "bg-blue-50 text-blue-700 font-medium shadow-sm ring-1 ring-blue-100"
                          : "hover:bg-slate-100/80 hover:text-slate-900",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                  <Link
                    to="/scene"
                    className="block rounded-lg px-3 py-2 hover:bg-slate-100/80 hover:text-slate-900"
                  >
                    场景搜索配置
                  </Link>
                  <Link
                    to="/product-sort"
                    className="block rounded-lg px-3 py-2 hover:bg-slate-100/80 hover:text-slate-900"
                  >
                    商品排序管理
                  </Link>
                  <Link
                    to="/hot-ranking"
                    className="block rounded-lg px-3 py-2 hover:bg-slate-100/80 hover:text-slate-900"
                  >
                    热搜榜配置
                  </Link>
                </nav>
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
                    {SPU_LIST.filter((s) => SPU_TYPE_MAP[s] === activeProductType).filter((s) => !hideDisabled || enabledSpu[s]).map((s) => (
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
              <div className="min-w-0 flex-1 py-4 pr-4 pl-2">
                {view === "overview" ? (
                  <>
                  <div className="mb-6 border-b border-slate-200">
                    <div className="flex gap-6">
                      {([
                        { v: "b2c", label: "B2C SPU" },
                        { v: "c2c", label: "C2C SPU" },
                      ] as const).map((t) => {
                        const active = activeProductType === t.v;
                        return (
                          <button
                            key={t.v}
                            type="button"
                            onClick={() => {
                              const type = t.v as ProductType;
                              setActiveProductType(type);
                              const typeSpus = SPU_LIST.filter((s) => SPU_TYPE_MAP[s] === type);
                              if (!typeSpus.includes(activeSpu)) {
                                setActiveSpu(typeSpus[0] ?? "");
                              }
                            }}
                            className={cn(
                              "relative -mb-px px-1 pb-3 pt-1 text-sm font-medium transition-colors",
                              active
                                ? "text-blue-600"
                                : "text-slate-500 hover:text-slate-800",
                            )}
                          >
                            {t.label}
                            {active && (
                              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mb-5">
                    <h2 className="text-base font-semibold tracking-tight text-slate-900">SPU 词库管理</h2>
                    <p className="mt-1 text-xs text-slate-500">查看与维护所有 SPU 的词库总体配置状态，可在此启用/停用词库或进入词条编辑。</p>
                  </div>
                  <OverviewTable
                    rows={overviewRows}
                    onEdit={(spu) => {
                      setActiveSpu(spu);
                      setView("manage");
                    }}
                    onToggleLib={(s) => setLibConfirm(s)}
                    onViewLog={(spu) => setLogSpu(spu)}
                  />
                  </>
                ) : (
                <>
                  <div className="mb-6 border-b border-slate-200">
                    <div className="flex gap-6">
                      {([
                        { v: "b2c", label: "B2C SPU" },
                        { v: "c2c", label: "C2C SPU" },
                      ] as const).map((t) => {
                        const active = activeProductType === t.v;
                        return (
                          <button
                            key={t.v}
                            type="button"
                            onClick={() => {
                              const type = t.v as ProductType;
                              setActiveProductType(type);
                              const typeSpus = SPU_LIST.filter((s) => SPU_TYPE_MAP[s] === type);
                              if (!typeSpus.includes(activeSpu)) {
                                setActiveSpu(typeSpus[0] ?? "");
                              }
                            }}
                            className={cn(
                              "relative -mb-px px-1 pb-3 pt-1 text-sm font-medium transition-colors",
                              active
                                ? "text-blue-600"
                                : "text-slate-500 hover:text-slate-800",
                            )}
                          >
                            {t.label}
                            {active && (
                              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                <div className="mb-5">
                  <h2 className="text-base font-semibold tracking-tight text-slate-900">SPU 词条管理</h2>
                  <p className="mt-1 text-xs text-slate-500">按 SPU 维护具体词条内容、匹配方式与启用状态，支持批量操作与复制其他词库配置。</p>
                </div>
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
                      options={TERM_TYPES}
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
                  <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                      <span className="text-xs text-slate-500">
                        已选 {selectedIds.length} 项
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={selectedIds.length === 0}
                      onClick={() => setBatchConfirm("已启用")}
                    >
                      <Power className="h-3.5 w-3.5" /> 批量启用
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={selectedIds.length === 0}
                      onClick={() => setBatchConfirm("已停用")}
                    >
                      <Power className="h-3.5 w-3.5" /> 批量停用
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={openCopy}
                    >
                      <Copy className="h-3.5 w-3.5" /> 复制其他词库配置
                    </Button>
                    <Button
                      size="sm"
                      onClick={openCreate}
                      className="h-8 bg-blue-500 hover:bg-blue-600"
                    >
                      <Plus className="h-3.5 w-3.5" /> 新增词条
                    </Button>
                  </div>
                </div>

                <div className="mt-3 overflow-x-auto rounded border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-8">
                          <Checkbox
                            checked={
                              filtered.length > 0 &&
                              filtered.every((r) => selectedIds.includes(r.id))
                            }
                            onCheckedChange={(v) => {
                              if (v) {
                                setSelectedIds(filtered.map((r) => r.id));
                              } else {
                                setSelectedIds([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>词条内容</TableHead>
                        <TableHead>标准化词</TableHead>
                        <TableHead>词条类型</TableHead>
                        <TableHead>匹配方式</TableHead>
                        <TableHead>是否明确指向当前SPU</TableHead>
                        <TableHead>词条状态</TableHead>
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
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.includes(r.id)}
                                onCheckedChange={(v) => {
                                  setSelectedIds((prev) =>
                                    v
                                      ? [...prev, r.id]
                                      : prev.filter((id) => id !== r.id),
                                  );
                                }}
                              />
                            </TableCell>
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
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-semibold">{mode === "create" ? "新增词条" : "编辑词条"}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm">
                  <span className="text-red-500 mr-1">*</span>词条内容
                </label>
                <Input
                  value={draft.content}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft({ ...draft, content: v, standard: normalizeTerm(v) });
                    if (duplicateError) setDuplicateError("");
                    if (fieldErrors.content || fieldErrors.standard)
                      setFieldErrors({ ...fieldErrors, content: undefined, standard: undefined });
                    if (crossSpuWarning) setCrossSpuWarning("");
                  }}
                  placeholder="请输入词条内容"
                />
                {fieldErrors.content && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.content}</p>
                )}
                {duplicateError && (
                  <p className="text-xs text-rose-500 mt-1">{duplicateError}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm">
                  <span className="text-red-500 mr-1">*</span>标准化词
                </label>
                <div className="h-10 px-3 flex items-center rounded-md border bg-muted/40 text-foreground">
                  {draft.standard}
                </div>
                {fieldErrors.standard && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.standard}</p>
                )}
                {crossSpuWarning && (
                  <p className="text-xs text-amber-600 mt-1">{crossSpuWarning}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm">
                  <span className="text-red-500 mr-1">*</span>词条类型
                </label>
                <MultiSelect
                  options={TERM_TYPES}
                  value={draft.termType}
                  onChange={(v) => {
                    setDraft({ ...draft, termType: v as TermType[] });
                    if (fieldErrors.termType)
                      setFieldErrors({ ...fieldErrors, termType: undefined });
                  }}
                />
                {fieldErrors.termType && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.termType}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm">
                  <span className="text-red-500 mr-1">*</span>匹配方式
                </label>
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
              </div>
              <div>
                <label className="mb-1.5 block text-sm">
                  <span className="text-red-500 mr-1">*</span>是否明确指向当前SPU
                </label>
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
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm">备注</label>
              <Textarea
                rows={4}
                value={draft.remark}
                onChange={(e) => {
                  setDraft({ ...draft, remark: e.target.value });
                  if (fieldErrors.remark)
                    setFieldErrors({ ...fieldErrors, remark: undefined });
                }}
                placeholder="请输入备注"
              />
              {fieldErrors.remark && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.remark}</p>
              )}
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/20">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            {(mode === "create" || draft.status !== "已启用") && (
              <Button
                variant="outline"
                onClick={() => saveDraft("draft")}
              >
                保存草稿
              </Button>
            )}
            <Button onClick={() => saveDraft("publish")}>
              保存并发布
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 保存并发布二次确认弹窗 */}
      <PublishConfirmDialog
        open={publishConfirmOpen}
        libStatus={computeLibStatus(activeSpu)}
        loading={publishing}
        onCancel={() => setPublishConfirmOpen(false)}
        onConfirm={() => {
          setPublishing(true);
          // 模拟提交，实际项目接入后端
          setTimeout(() => {
            commitSave("publish");
            setPublishing(false);
            setPublishConfirmOpen(false);
          }, 0);
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

      {/* 批量启用/停用 二次确认 */}
      <Dialog
        open={!!batchConfirm}
        onOpenChange={(o) => !o && setBatchConfirm(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {batchConfirm === "已启用" ? "确认批量启用" : "确认批量停用"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {batchConfirm === "已启用"
              ? `启用后，选中的 ${selectedIds.length} 条词条将参与前台搜索召回。是否确认启用？`
              : `停用后，选中的 ${selectedIds.length} 条词条将不再参与前台搜索召回。是否确认停用？`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchConfirm(null)}>
              取消
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => {
                if (batchConfirm) bulkSetStatus(batchConfirm);
                setBatchConfirm(null);
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

      {/* 复制其他词库配置 */}
      <Dialog
        open={copyOpen}
        onOpenChange={(o) => {
          setCopyOpen(o);
          if (!o) setCopySpuOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>复制其他词库配置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="商品类型" required>
              <Select
                value={copyProductType || undefined}
                onValueChange={(v) => {
                  setCopyProductType(v as ProductType);
                  setCopySourceSpu("");
                  setCopySpuSearch("");
                  if (copyError.type) setCopyError((e) => ({ ...e, type: undefined }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择商品类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="b2c">B2C</SelectItem>
                  <SelectItem value="c2c">C2C</SelectItem>
                </SelectContent>
              </Select>
              {copyError.type && (
                <p className="text-xs text-rose-500 mt-1">{copyError.type}</p>
              )}
            </Field>
            <Field label="SPU名称" required>
              <Popover open={copySpuOpen} onOpenChange={setCopySpuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={!copyProductType}
                    className={cn(
                      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
                      !copyProductType && "opacity-50 cursor-not-allowed",
                      copyProductType && "cursor-pointer",
                    )}
                  >
                    <span className={cn(!copySourceSpu && "text-slate-400")}>
                      {copySourceSpu || (copyProductType ? "请选择SPU" : "请先选择商品类型")}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                >
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        autoFocus
                        placeholder="搜索SPU"
                        value={copySpuSearch}
                        onChange={(e) => setCopySpuSearch(e.target.value)}
                        className="h-8 pl-7"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {copyProductType &&
                      (() => {
                        const list = COPY_SOURCE_SPUS[copyProductType].filter((s) =>
                          s.toLowerCase().includes(copySpuSearch.toLowerCase()),
                        );
                        if (list.length === 0) {
                          return (
                            <p className="px-3 py-4 text-center text-xs text-slate-400">
                              无匹配结果
                            </p>
                          );
                        }
                        return list.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setCopySourceSpu(s);
                              setCopySpuOpen(false);
                              if (copyError.spu)
                                setCopyError((e) => ({ ...e, spu: undefined }));
                            }}
                            className={cn(
                              "block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100",
                              copySourceSpu === s && "bg-blue-50 text-blue-600",
                            )}
                          >
                            {s}
                          </button>
                        ));
                      })()}
                  </div>
                </PopoverContent>
              </Popover>
              {copyError.spu && (
                <p className="text-xs text-rose-500 mt-1">{copyError.spu}</p>
              )}
              {copySourceSpu && (
                <button
                  type="button"
                  onClick={() => setPreviewEntriesOpen(true)}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Eye className="h-3.5 w-3.5" />
                  查看词条信息
                </button>
              )}
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyOpen(false)}>
              取消
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600" onClick={submitCopy}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 复制后 启用方式确认 */}
      <Dialog
        open={copyConfirmOpen}
        onOpenChange={setCopyConfirmOpen}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>启用方式确认</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            已成功从「{copySourceSpu}」复制词库配置。请选择处理方式：
            <br />
            <span className="text-xs text-slate-500">
              · 立即启用：复制的词条立即参与前台搜索召回
              <br />· 保存到草稿：复制的词条状态为草稿，不参与召回
            </span>
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => commitCopy("draft")}>
              保存到草稿
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => commitCopy("enable")}
            >
              立即启用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看词条信息 */}
      <Dialog open={previewEntriesOpen} onOpenChange={setPreviewEntriesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>词条信息 - {copySourceSpu}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>词条内容</TableHead>
                  <TableHead>词条类型</TableHead>
                  <TableHead>匹配方式</TableHead>
                  <TableHead>直达</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { content: `${copySourceSpu}-品牌词`, type: "品牌词", match: "精准匹配", direct: "是", status: "已启用" },
                  { content: `${copySourceSpu}-别名词`, type: "别名词", match: "前缀匹配", direct: "否", status: "已启用" },
                  { content: `${copySourceSpu}-场景词`, type: "场景词", match: "前缀匹配", direct: "否", status: "已启用" },
                ].map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.content}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell>{r.match}</TableCell>
                    <TableCell>{r.direct}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewEntriesOpen(false)}>
              关闭
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
                  <TableHead>操作人</TableHead>
                  <TableHead>操作类型</TableHead>
                  <TableHead>变更对象</TableHead>
                  <TableHead>变更前</TableHead>
                  <TableHead>变更后</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.filter((l) => l.spu === logSpu).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-slate-400">
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
                        <TableCell>{l.operator}</TableCell>
                        <TableCell>{l.action}</TableCell>
                        <TableCell>{l.target}</TableCell>
                        <TableCell className="text-slate-600">{l.field || "—"}</TableCell>
                        <TableCell className="text-slate-600">{l.detail || "—"}</TableCell>
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
  const [filters, setFilters] = useState({
    spuId: "",
    spuName: "",
    category: "",
    libStatus: [] as LibStatus[],
  });

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filters.spuId && !r.id.toLowerCase().includes(filters.spuId.toLowerCase())) return false;
      if (filters.spuName && !r.name.toLowerCase().includes(filters.spuName.toLowerCase())) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.libStatus.length && !filters.libStatus.includes(r.libStatus)) return false;
      return true;
    });
  }, [rows, filters]);

  return (
    <>
      <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-right text-slate-600">SPU ID</Label>
          <Input
            placeholder="请输入SPU ID"
            className="h-9 bg-white"
            value={filters.spuId}
            onChange={(e) => setFilters((f) => ({ ...f, spuId: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-right text-slate-600">SPU名称</Label>
          <Input
            placeholder="请输入SPU名称"
            className="h-9 bg-white"
            value={filters.spuName}
            onChange={(e) => setFilters((f) => ({ ...f, spuName: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-right text-slate-600">SPU分类</Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(v) => setFilters((f) => ({ ...f, category: v === "all" ? "" : v }))}
          >
            <SelectTrigger className="h-9 bg-white">
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {Array.from(new Set(SPU_INFOS.map((s) => s.category))).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-right text-slate-600">词库状态</Label>
          <MultiSelect
            options={["未配置", "草稿", "已启用", "已停用"]}
            value={filters.libStatus}
            onChange={(v) => setFilters((f) => ({ ...f, libStatus: v as LibStatus[] }))}
            placeholder="请选择"
          />
        </div>
      </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9"
            onClick={() => setFilters({ spuId: "", spuName: "", category: "", libStatus: [] })}
          >
            <RotateCcw className="h-3.5 w-3.5" /> 重置
          </Button>
          <Button size="sm" className="h-9 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm">
            <Filter className="h-3.5 w-3.5" /> 筛选
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200/80">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">SPU ID</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">SPU 名称</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">SPU 分类</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">参与搜索</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">词条数量</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">已启用</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">词库状态</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">最近更新人</TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500">最近更新时间</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-slate-400">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors">
                  <TableCell className="whitespace-nowrap py-3 font-mono text-xs text-slate-500">{r.id}</TableCell>
                  <TableCell className="py-3 font-medium text-slate-900">{r.name}</TableCell>
                  <TableCell>{r.category}</TableCell>
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
              ))
            )}
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

function PublishConfirmDialog({
  open,
  libStatus,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  libStatus: LibStatus;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  let body: React.ReactNode = null;
  if (libStatus === "已启用") {
    body = (
      <>
        <p>
          发布后，该词条状态将变为「<span className="font-medium text-slate-900">已启用</span>」。由于当前 SPU 词库已启用，词条发布后将
          <span className="font-medium text-emerald-600">立即参与前台搜索匹配</span>。
        </p>
        <p className="text-slate-500">请确认词条内容、标准化词、匹配方式和生效范围配置无误。</p>
      </>
    );
  } else if (libStatus === "未配置") {
    body = (
      <>
        <p>
          发布后，该词条状态将变为「<span className="font-medium text-slate-900">已启用</span>」。由于当前 SPU 词库尚未启用，词条
          <span className="font-medium text-amber-600">暂不会参与前台搜索</span>。
        </p>
        <p className="text-slate-500">
          保存成功后，当前 SPU 词库状态将由「未配置」变为「草稿」。后续需要启用 SPU 词库后，该词条才会正式参与搜索。
        </p>
      </>
    );
  } else if (libStatus === "草稿") {
    body = (
      <>
        <p>
          发布后，该词条状态将变为「<span className="font-medium text-slate-900">已启用</span>」。由于当前 SPU 词库仍为「草稿」，词条
          <span className="font-medium text-amber-600">暂不会参与前台搜索</span>。
        </p>
        <p className="text-slate-500">后续需要启用 SPU 词库后，该词条才会正式参与搜索。</p>
      </>
    );
  } else {
    // 已停用
    body = (
      <>
        <p>
          发布后，该词条状态将变为「<span className="font-medium text-slate-900">已启用</span>」。但当前 SPU 词库处于「停用」状态，该词条
          <span className="font-medium text-amber-600">暂不会参与前台搜索</span>。
        </p>
        <p className="text-slate-500">
          词条发布不会自动启用 SPU 词库。只有后续重新启用 SPU 词库后，该词条才会正式参与搜索。
        </p>
      </>
    );
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>确认发布词条？</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm text-slate-700 py-1">{body}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            取消
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {loading ? "发布中..." : "确认发布"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const I18N_LANGS: { code: string; label: string; required?: boolean }[] = [
  { code: "zh", label: "简体中文[zh]", required: true },
  { code: "en", label: "英语[en]", required: true },
  { code: "es", label: "西班牙语[es]" },
  { code: "ko", label: "韩语[ko]" },
  { code: "it", label: "意大利语[it]" },
  { code: "fr", label: "法语[fr]" },
  { code: "de", label: "德语[de]" },
  { code: "pl", label: "波兰语[pl]" },
];

function I18nSheet({
  open,
  onOpenChange,
  zhValue,
  value,
  onSave,
  readOnly = false,
  title = "配置内容",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  zhValue: string;
  value: Record<string, string>;
  onSave: (v: Record<string, string>) => void;
  readOnly?: boolean;
  title?: string;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(value);

  useEffect(() => {
    if (open) {
      setDraft({ ...value, zh: value.zh || zhValue || "" });
    }
  }, [open, value, zhValue]);

  const update = (code: string, v: string) =>
    setDraft((p) => ({ ...p, [code]: v }));

  const handleSave = () => {
    if (!(draft.zh || "").trim()) {
      toast.error("请输入简体中文文案");
      return;
    }
    if (!(draft.en || "").trim()) {
      toast.error("请输入英语文案");
      return;
    }
    onSave(draft);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!w-2/5 !max-w-none p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-slate-200">
          <SheetTitle className="text-base">{title}</SheetTitle>
        </SheetHeader>

        {!readOnly && <div className="px-6 pt-4 pb-2 flex items-center justify-between">
          <span className="text-sm text-slate-600">文案</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const base = (draft.zh || zhValue || "").trim();
                if (!base) return;
                const next = { ...draft };
                I18N_LANGS.forEach((l) => {
                  if (!next[l.code]) next[l.code] = base;
                });
                setDraft(next);
              }}
            >
              填充
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const base = (draft.zh || zhValue || "").trim();
                if (!base) return;
                const next: Record<string, string> = { ...draft, zh: base };
                I18N_LANGS.forEach((l) => {
                  if (l.code !== "zh") next[l.code] = base;
                });
                setDraft(next);
              }}
            >
              全部翻译
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const base = (draft.zh || zhValue || "").trim();
                if (!base) return;
                const next = { ...draft };
                I18N_LANGS.forEach((l) => {
                  if (l.code !== "zh" && !next[l.code]) next[l.code] = base;
                });
                setDraft(next);
              }}
            >
              非人工部分翻译
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const base = (draft.en || "").trim();
                if (!base) return;
                const next: Record<string, string> = { ...draft, en: base };
                I18N_LANGS.forEach((l) => {
                  if (l.code !== "en") next[l.code] = base;
                });
                setDraft(next);
              }}
            >
              英文一键复制
            </Button>
          </div>
        </div>}

        <div className="flex-1 overflow-auto px-6 pb-4">
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <div className="grid grid-cols-[160px_1fr] bg-slate-50 px-4 py-2 text-sm text-slate-600">
              <span>语言</span>
              <span>文案</span>
            </div>
            {I18N_LANGS.map((l) => (
              <div
                key={l.code}
                className="grid grid-cols-[160px_1fr] items-center px-4 py-3 border-t border-slate-100"
              >
                <span className="text-sm text-slate-700">
                  {l.label}
                  {!readOnly && l.required && <span className="text-rose-500 ml-1">*</span>}
                </span>
                <Input
                  value={draft[l.code] || ""}
                  onChange={(e) => update(l.code, e.target.value)}
                  placeholder={`请输入${l.label}文案`}
                  readOnly={readOnly}
                  className={readOnly ? "bg-slate-50" : ""}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-3 bg-white">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {readOnly ? "关闭" : "取消"}
          </Button>
          {!readOnly && <Button
            size="sm"
            className="bg-blue-500 hover:bg-blue-600"
            onClick={handleSave}
          >
            保存
          </Button>}
        </div>
      </SheetContent>
    </Sheet>
  );
}