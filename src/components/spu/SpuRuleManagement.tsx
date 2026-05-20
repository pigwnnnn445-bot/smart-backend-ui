import { useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";

type TermType = "商品词" | "品牌词" | "别名词" | "错词" | "短词" | "场景词" | "品类词";
type MatchType = "精准匹配" | "前缀匹配" | "模糊匹配";
type DirectFlag = "是" | "否";
type Status = "已启用" | "已停用";

interface RuleRow {
  id: string;
  content: string;
  standard: string;
  termType: TermType;
  matchType: MatchType;
  direct: DirectFlag;
  status: Status;
  updater: string;
  updatedAt: string;
  remark: string;
}

const SPU_LIST = ["Netflix", "Spotify", "Tidal", "ChatGPT"];

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
const STATUSES: Status[] = ["已启用", "已停用"];

const NAV = [
  "智能回复",
  "用户管理",
  "订单管理",
  "工单管理",
  "供应管理",
  "供应商管理",
  "车辆管理",
  "代充值记录管理",
  "车票管理",
  "营销管理",
  "Affiliate管理",
  "线索管理",
  "SPU配置",
];

const SPU_SUBNAV = ["SPU基础配置", "SPU管理", "SPU搜索配置", "SPU内容配置"];

const initialRows: RuleRow[] = [
  {
    id: "1",
    content: "Open AI",
    standard: "openai",
    termType: "品牌词",
    matchType: "精准匹配",
    direct: "是",
    status: "已启用",
    updater: "Alex",
    updatedAt: "2026-05-20 16:00:24",
    remark: "官方品牌词",
  },
];

function termBadge(t: TermType) {
  const map: Record<TermType, string> = {
    商品词: "bg-sky-100 text-sky-700",
    品牌词: "bg-amber-100 text-amber-700",
    别名词: "bg-violet-100 text-violet-700",
    错词: "bg-rose-100 text-rose-700",
    短词: "bg-emerald-100 text-emerald-700",
    场景词: "bg-fuchsia-100 text-fuchsia-700",
    品类词: "bg-indigo-100 text-indigo-700",
  };
  return map[t];
}

const blank: RuleRow = {
  id: "",
  content: "",
  standard: "",
  termType: "品牌词",
  matchType: "精准匹配",
  direct: "是",
  status: "已启用",
  updater: "Alex",
  updatedAt: "",
  remark: "",
};

export function SpuRuleManagement() {
  const [activeSpu, setActiveSpu] = useState("ChatGPT");
  const [enabledSpu, setEnabledSpu] = useState<Record<string, boolean>>(
    Object.fromEntries(SPU_LIST.map((s) => [s, true])),
  );
  const [hideDisabled, setHideDisabled] = useState(true);
  const [reverseOrder, setReverseOrder] = useState(true);

  const [filters, setFilters] = useState({
    content: "",
    standard: "",
    matchType: "",
    status: "",
  });

  const [rows, setRows] = useState<RuleRow[]>(initialRows);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<RuleRow>(blank);
  const [mode, setMode] = useState<"create" | "edit">("create");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filters.content && !r.content.toLowerCase().includes(filters.content.toLowerCase()))
        return false;
      if (
        filters.standard &&
        !r.standard.toLowerCase().includes(filters.standard.toLowerCase())
      )
        return false;
      if (filters.matchType && r.matchType !== filters.matchType) return false;
      if (filters.status && r.status !== filters.status) return false;
      return true;
    });
  }, [rows, filters]);

  function openCreate() {
    setMode("create");
    setDraft({ ...blank, id: crypto.randomUUID() });
    setEditOpen(true);
  }

  function openEdit(row: RuleRow) {
    setMode("edit");
    setDraft({ ...row });
    setEditOpen(true);
  }

  function saveDraft() {
    const now = new Date()
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);
    const payload = { ...draft, updatedAt: now };
    setRows((prev) => {
      const exists = prev.some((p) => p.id === payload.id);
      return exists ? prev.map((p) => (p.id === payload.id ? payload : p)) : [payload, ...prev];
    });
    setEditOpen(false);
  }

  function toggleStatus(row: RuleRow) {
    setRows((prev) =>
      prev.map((p) =>
        p.id === row.id ? { ...p, status: p.status === "已启用" ? "已停用" : "已启用" } : p,
      ),
    );
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
                          sub === "SPU规则管理" &&
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
            <span className="text-slate-700">SPU规则管理</span>
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
                  <div className="py-1.5 cursor-pointer">SPU词库管理</div>
                  <div className="py-1.5 cursor-pointer text-blue-600 font-medium">
                    SPU词库管理
                  </div>
                </div>
              </div>

              {/* SPU list */}
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

              {/* Right: filters + table */}
              <div className="min-w-0 flex-1 p-4">
                {/* Filters */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Label className="w-16 shrink-0 text-right text-slate-600">
                      词条内容
                    </Label>
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
                    <Label className="w-16 shrink-0 text-right text-slate-600">
                      标准化词
                    </Label>
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
                    <Label className="w-16 shrink-0 text-right text-slate-600">
                      匹配方式
                    </Label>
                    <Select
                      value={filters.matchType}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, matchType: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        {MATCH_TYPES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-16 shrink-0 text-right text-slate-600">
                      词条状态
                    </Label>
                    <Select
                      value={filters.status}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, status: v === "all" ? "" : v }))
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
                      setFilters({ content: "", standard: "", matchType: "", status: "" })
                    }
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> 重置
                  </Button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-slate-700">
                    SPU：<span className="font-medium">{activeSpu}</span>
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
                        <TableHead>最近更新人</TableHead>
                        <TableHead>最近更新时间</TableHead>
                        <TableHead>备注</TableHead>
                        <TableHead className="text-right">操作</TableHead>
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
                          <TableRow key={r.id}>
                            <TableCell>{r.content}</TableCell>
                            <TableCell>{r.standard}</TableCell>
                            <TableCell>
                              <Badge className={cn("border-0", termBadge(r.termType))}>
                                {r.termType}
                              </Badge>
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
                                  onClick={() => toggleStatus(r)}
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
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder="请输入词条内容"
              />
            </Field>
            <Field label="标准化词" required>
              <Input
                value={draft.standard}
                onChange={(e) => setDraft({ ...draft, standard: e.target.value })}
                placeholder="请输入标准化词"
              />
            </Field>
            <Field label="词条类型" required>
              <Select
                value={draft.termType}
                onValueChange={(v) => setDraft({ ...draft, termType: v as TermType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Field label="词条状态" required>
              <Select
                value={draft.status}
                onValueChange={(v) => setDraft({ ...draft, status: v as Status })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              onClick={saveDraft}
              className="bg-blue-500 hover:bg-blue-600"
              disabled={!draft.content || !draft.standard}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
    <div className="space-y-1.5">
      <Label className="text-slate-600">
        {required && <span className="text-rose-500">* </span>}
        {label}
      </Label>
      {children}
    </div>
  );
}