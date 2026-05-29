import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  RefreshCw,
  Menu,
  ChevronDown,
  Maximize2,
  Bell,
  User,
  Pin,
  PinOff,
  Plus,
  Trash2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// ============ Types ============

type IpCode = "US" | "JP" | "KR" | "TW" | "HK" | "SG" | "MY" | "TH" | "ID" | "VN";

type Ip = { code: IpCode; name: string };

const IPS: Ip[] = [
  { code: "US", name: "美国站 (US)" },
  { code: "JP", name: "日本站 (JP)" },
  { code: "KR", name: "韩国站 (KR)" },
  { code: "TW", name: "中国台湾 (TW)" },
  { code: "HK", name: "中国香港 (HK)" },
  { code: "SG", name: "新加坡 (SG)" },
  { code: "MY", name: "马来西亚 (MY)" },
  { code: "TH", name: "泰国 (TH)" },
  { code: "ID", name: "印度尼西亚 (ID)" },
  { code: "VN", name: "越南 (VN)" },
];

type SpuCategory = "AI工具" | "影音娱乐" | "音乐" | "设计创作" | "办公效率" | "社交";

const CATEGORIES: SpuCategory[] = ["AI工具", "影音娱乐", "音乐", "设计创作", "办公效率", "社交"];

type SpuSource = "b2c商品" | "c2c商品";

type Spu = { id: string; name: string; brand: string; category: SpuCategory; source: SpuSource; hotScore: number };

const ALL_SPUS: Spu[] = [
  { id: "SPU001", name: "ChatGPT", brand: "OpenAI", category: "AI工具", source: "b2c商品", hotScore: 9821 },
  { id: "SPU002", name: "Netflix", brand: "Netflix", category: "影音娱乐", source: "b2c商品", hotScore: 9123 },
  { id: "SPU003", name: "Spotify", brand: "Spotify", category: "音乐", source: "b2c商品", hotScore: 8754 },
  { id: "SPU004", name: "YouTube Premium", brand: "Google", category: "影音娱乐", source: "b2c商品", hotScore: 8210 },
  { id: "SPU005", name: "Disney+", brand: "Disney", category: "影音娱乐", source: "b2c商品", hotScore: 7890 },
  { id: "SPU006", name: "Midjourney", brand: "Midjourney", category: "AI工具", source: "c2c商品", hotScore: 7321 },
  { id: "SPU007", name: "Canva Pro", brand: "Canva", category: "设计创作", source: "b2c商品", hotScore: 6543 },
  { id: "SPU008", name: "Notion AI", brand: "Notion", category: "办公效率", source: "c2c商品", hotScore: 6210 },
  { id: "SPU009", name: "Adobe Creative Cloud", brand: "Adobe", category: "设计创作", source: "b2c商品", hotScore: 5980 },
  { id: "SPU010", name: "Microsoft 365", brand: "Microsoft", category: "办公效率", source: "b2c商品", hotScore: 5670 },
  { id: "SPU011", name: "HBO Max", brand: "HBO", category: "影音娱乐", source: "b2c商品", hotScore: 5320 },
  { id: "SPU012", name: "Claude Pro", brand: "Anthropic", category: "AI工具", source: "c2c商品", hotScore: 5104 },
  { id: "SPU013", name: "Perplexity Pro", brand: "Perplexity", category: "AI工具", source: "c2c商品", hotScore: 4890 },
  { id: "SPU014", name: "Apple Music", brand: "Apple", category: "音乐", source: "b2c商品", hotScore: 4670 },
  { id: "SPU015", name: "Tinder Gold", brand: "Tinder", category: "社交", source: "b2c商品", hotScore: 4321 },
];

type PinnedItem = {
  spuId: string;
  position: number; // 1..10
  operator: string;
  updatedAt: string;
};

const DEFAULT_PINNED: Record<IpCode, PinnedItem[]> = {
  US: [
    { spuId: "SPU001", position: 1, operator: "Linda", updatedAt: "2026-05-20 10:21:00" },
    { spuId: "SPU005", position: 3, operator: "Alex", updatedAt: "2026-05-19 15:42:11" },
  ],
  JP: [
    { spuId: "SPU002", position: 1, operator: "Mark", updatedAt: "2026-05-18 09:11:00" },
  ],
  KR: [],
  TW: [],
  HK: [],
  SG: [
    { spuId: "SPU003", position: 2, operator: "Linda", updatedAt: "2026-05-15 11:03:00" },
  ],
  MY: [],
  TH: [],
  ID: [],
  VN: [],
};

// Each IP's natural hot-sort order (mock). Excludes those that would be pinned at runtime.
const NATURAL_ORDER: Record<IpCode, string[]> = {
  US: ["SPU001", "SPU004", "SPU002", "SPU006", "SPU003", "SPU012", "SPU007", "SPU010", "SPU013", "SPU008", "SPU005"],
  JP: ["SPU002", "SPU003", "SPU005", "SPU014", "SPU004", "SPU006", "SPU007", "SPU011", "SPU001", "SPU008"],
  KR: ["SPU002", "SPU003", "SPU004", "SPU005", "SPU001", "SPU006"], // 6 items
  TW: ["SPU001", "SPU002", "SPU005"], // 3 items, below threshold
  HK: ["SPU001", "SPU002", "SPU003", "SPU004"], // 4 items, below threshold
  SG: ["SPU001", "SPU002", "SPU004", "SPU005", "SPU006", "SPU007", "SPU010", "SPU011", "SPU012", "SPU013", "SPU014"],
  MY: ["SPU001", "SPU002", "SPU003", "SPU004", "SPU005", "SPU006", "SPU007"],
  TH: ["SPU002", "SPU003", "SPU004", "SPU005", "SPU006", "SPU007"],
  ID: ["SPU001", "SPU002"], // 2 items, below threshold
  VN: ["SPU001", "SPU002", "SPU003", "SPU004", "SPU005"],
};

const MAX_SLOTS = 10;
const MIN_DISPLAY = 5;

function spuById(id: string) {
  return ALL_SPUS.find((s) => s.id === id);
}

// ============ Component ============

export function HotRankingManagement() {
  const [currentIp, setCurrentIp] = useState<IpCode>("US");
  const [pinnedMap, setPinnedMap] = useState<Record<IpCode, PinnedItem[]>>(DEFAULT_PINNED);

  const [addOpen, setAddOpen] = useState(false);
  const [addSpuId, setAddSpuId] = useState("");
  const [addPosition, setAddPosition] = useState<number>(1);
  const [addCategory, setAddCategory] = useState<SpuCategory | "全部">("全部");

  const [removeId, setRemoveId] = useState<string | null>(null);

  const pinnedList = pinnedMap[currentIp];

  // Compose final ranking: pinned positions are locked; natural sort fills the rest in order, skipping pinned spuIds.
  const finalRanking = useMemo(() => {
    const slots: (PinnedItem & { source: "pinned" } | { spuId: string; position: number; source: "natural" } | null)[] =
      Array(MAX_SLOTS).fill(null);
    const pinnedIds = new Set(pinnedList.map((p) => p.spuId));

    pinnedList.forEach((p) => {
      if (p.position >= 1 && p.position <= MAX_SLOTS) {
        slots[p.position - 1] = { ...p, source: "pinned" as const };
      }
    });

    const natural = NATURAL_ORDER[currentIp].filter((id) => !pinnedIds.has(id));
    let ni = 0;
    for (let i = 0; i < MAX_SLOTS; i++) {
      if (slots[i] == null && ni < natural.length) {
        slots[i] = { spuId: natural[ni++], position: i + 1, source: "natural" as const };
      }
    }
    return slots;
  }, [pinnedList, currentIp]);

  const totalCount = finalRanking.filter((s) => s != null).length;
  const willDisplay = totalCount >= MIN_DISPLAY;

  const usedPositions = new Set(pinnedList.map((p) => p.position));
  const availablePositions = Array.from({ length: MAX_SLOTS }, (_, i) => i + 1).filter(
    (p) => !usedPositions.has(p),
  );
  const pinnedIdSet = new Set(pinnedList.map((p) => p.spuId));
  const candidateSpus = ALL_SPUS.filter(
    (s) => !pinnedIdSet.has(s.id) && (addCategory === "全部" || s.category === addCategory),
  );

  function handleAdd() {
    if (!addSpuId) {
      toast.error("请选择 SPU");
      return;
    }
    if (!availablePositions.includes(addPosition)) {
      toast.error("该位置已被占用");
      return;
    }
    setPinnedMap((m) => ({
      ...m,
      [currentIp]: [
        ...m[currentIp],
        {
          spuId: addSpuId,
          position: addPosition,
          operator: "当前用户",
          updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        },
      ].sort((a, b) => a.position - b.position),
    }));
    toast.success("已配置榜单位置");
    setAddOpen(false);
    setAddSpuId("");
  }

  function handleRemove(spuId: string) {
    setPinnedMap((m) => ({
      ...m,
      [currentIp]: m[currentIp].filter((p) => p.spuId !== spuId),
    }));
    setRemoveId(null);
    toast.success("已移除该位置配置，SPU 将重新参与热搜排序");
  }

  function movePinned(spuId: string, delta: number) {
    setPinnedMap((m) => {
      const list = m[currentIp];
      const target = list.find((p) => p.spuId === spuId);
      if (!target) return m;
      const newPos = target.position + delta;
      if (newPos < 1 || newPos > MAX_SLOTS) return m;
      if (list.some((p) => p.position === newPos)) {
        toast.error("目标位置已被占用");
        return m;
      }
      return {
        ...m,
        [currentIp]: list
          .map((p) => (p.spuId === spuId ? { ...p, position: newPos } : p))
          .sort((a, b) => a.position - b.position),
      };
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
            <span className="text-slate-700">热搜榜配置</span>
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
                  <Link to="/product-sort" className="block py-1.5 cursor-pointer hover:text-blue-600">商品排序管理</Link>
                  <div className="py-1.5 cursor-pointer text-blue-600 font-medium">热搜榜配置</div>
                </div>
              </div>

              <div className="flex-1 min-w-0 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-lg font-semibold text-slate-800">热搜榜配置</h1>
                    <p className="mt-1 text-xs text-slate-500">
                      预览各 IP 站点的热搜榜单，并将指定 SPU 固定到具体位置。配置上的 SPU 不再参与热搜榜排序及规则获取。
                      榜单最多展示 {MAX_SLOTS} 个商品，少于 {MIN_DISPLAY} 个时前台不展示。
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <span className="text-slate-600">IP 站点：</span>
                  <Select value={currentIp} onValueChange={(v) => setCurrentIp(v as IpCode)}>
                    <SelectTrigger className="h-8 w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {IPS.map((ip) => (
                        <SelectItem key={ip.code} value={ip.code}>{ip.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="ml-2">
                    当前榜单：{totalCount} / {MAX_SLOTS}
                  </Badge>
                  {willDisplay ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">前台展示中</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      数量不足 {MIN_DISPLAY}，前台不展示
                    </Badge>
                  )}
                  <div className="ml-auto">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (availablePositions.length === 0) {
                          toast.error("当前 IP 榜单 10 个位置已全部固定");
                          return;
                        }
                        setAddPosition(availablePositions[0]);
                        setAddOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      新增榜单位置配置
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Ranking preview */}
                  <div className="rounded-md border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-700">榜单预览（{IPS.find((i) => i.code === currentIp)?.name}）</span>
                      <span className="text-xs text-slate-500">位置 1-{MAX_SLOTS}</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="w-14 px-3 py-2 text-left">位置</th>
                          <th className="px-3 py-2 text-left">SPU</th>
                          <th className="w-24 px-3 py-2 text-left">所属分类</th>
                          <th className="w-24 px-3 py-2 text-left">商品来源</th>
                          <th className="w-24 px-3 py-2 text-left">来源</th>
                          <th className="w-20 px-3 py-2 text-right">热度分</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finalRanking.map((slot, idx) => {
                          const pos = idx + 1;
                          if (!slot) {
                            return (
                              <tr key={pos} className="border-t border-slate-100">
                                <td className="px-3 py-2 text-slate-400">#{pos}</td>
                                <td className="px-3 py-2 text-slate-400">—</td>
                                <td className="px-3 py-2 text-slate-400">—</td>
                                <td className="px-3 py-2 text-slate-400">—</td>
                                <td className="px-3 py-2 text-slate-400">空缺</td>
                                <td className="px-3 py-2 text-right text-slate-400">—</td>
                              </tr>
                            );
                          }
                          const spu = spuById(slot.spuId);
                          const isPinned = slot.source === "pinned";
                          return (
                            <tr key={pos} className="border-t border-slate-100">
                              <td className="px-3 py-2">
                                <span className={pos <= 3 ? "font-semibold text-rose-600" : "text-slate-700"}>#{pos}</span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-medium text-slate-800">{spu?.name ?? slot.spuId}</div>
                                <div className="text-xs text-slate-500">{spu?.brand} · {slot.spuId}</div>
                              </td>
                              <td className="px-3 py-2">
                                {spu?.category ? <Badge variant="outline">{spu.category}</Badge> : "—"}
                              </td>
                              <td className="px-3 py-2">
                                {spu?.source ? <Badge variant="outline">{spu.source}</Badge> : "—"}
                              </td>
                              <td className="px-3 py-2">
                                {isPinned ? (
                                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                    <Pin className="mr-1 h-3 w-3" />
                                    固定
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">自动</Badge>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-600">
                                {isPinned ? "—" : spu?.hotScore.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pinned configs */}
                  <div className="rounded-md border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-700">已配置榜单位置</span>
                      <span className="text-xs text-slate-500">{pinnedList.length} 条</span>
                    </div>
                    {pinnedList.length === 0 ? (
                      <div className="px-3 py-10 text-center text-slate-400">
                        <PinOff className="mx-auto mb-2 h-6 w-6" />
                        当前 IP 暂无固定位置配置，全部按热搜规则自动排序
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="w-14 px-3 py-2 text-left">位置</th>
                          <th className="px-3 py-2 text-left">SPU</th>
                          <th className="w-24 px-3 py-2 text-left">所属分类</th>
                          <th className="w-24 px-3 py-2 text-left">商品来源</th>
                          <th className="px-3 py-2 text-left">操作人</th>
                          <th className="px-3 py-2 text-left">更新时间</th>
                          <th className="w-32 px-3 py-2 text-right">操作</th>
                        </tr>
                        </thead>
                        <tbody>
                          {pinnedList.map((p) => {
                            const spu = spuById(p.spuId);
                            return (
                              <tr key={p.spuId} className="border-t border-slate-100">
                                <td className="px-3 py-2 font-semibold text-blue-600">#{p.position}</td>
                                <td className="px-3 py-2">
                                  <div className="font-medium text-slate-800">{spu?.name ?? p.spuId}</div>
                                  <div className="text-xs text-slate-500">{p.spuId}</div>
                                </td>
                                <td className="px-3 py-2">
                                  {spu?.category ? <Badge variant="outline">{spu.category}</Badge> : "—"}
                                </td>
                                <td className="px-3 py-2 text-slate-600">{p.operator}</td>
                                <td className="px-3 py-2 text-slate-500">{p.updatedAt}</td>
                                <td className="px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => movePinned(p.spuId, -1)} title="上移">
                                      <ArrowUp className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => movePinned(p.spuId, 1)} title="下移">
                                      <ArrowDown className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600 hover:text-rose-700" onClick={() => setRemoveId(p.spuId)} title="移除">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增榜单位置配置</DialogTitle>
            <DialogDescription>
              将指定 SPU 固定到当前 IP 的具体榜单位置。配置上的 SPU 将不再参与该 IP 热搜榜排序与规则获取。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-slate-600">IP 站点</div>
              <Input value={IPS.find((i) => i.code === currentIp)?.name ?? ""} readOnly className="h-8" />
            </div>
            <div>
              <div className="mb-1 text-slate-600">榜单位置</div>
              <Select value={String(addPosition)} onValueChange={(v) => setAddPosition(Number(v))}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availablePositions.map((p) => (
                    <SelectItem key={p} value={String(p)}>#{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-slate-600">所属分类</div>
              <Select value={addCategory} onValueChange={(v) => { setAddCategory(v as SpuCategory | "全部"); setAddSpuId(""); }}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部分类</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-slate-600">SPU</div>
              <Select value={addSpuId} onValueChange={setAddSpuId}>
                <SelectTrigger className="h-8"><SelectValue placeholder="请选择 SPU" /></SelectTrigger>
                <SelectContent>
                  {candidateSpus.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}（{s.category} · {s.id}）</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
            <Button onClick={handleAdd}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirm */}
      <Dialog open={!!removeId} onOpenChange={(o) => !o && setRemoveId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>移除榜单位置配置</DialogTitle>
            <DialogDescription>
              移除后该 SPU 将重新参与当前 IP 的热搜榜排序与规则获取，是否继续？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveId(null)}>取消</Button>
            <Button variant="destructive" onClick={() => removeId && handleRemove(removeId)}>确认移除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}