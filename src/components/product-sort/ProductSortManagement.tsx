import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { RefreshCw, Settings, Search, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
};

const DEFAULT_RECALL: RecallSource[] = [
  { name: "SPU词条召回", code: "SPU_TERM", enabled: true, weight: 100, stage: "一期启用", desc: "用户输入命中后台配置的 SPU 词条" },
  { name: "商品名前缀匹配兜底", code: "SPU_NAME_PREFIX", enabled: true, weight: 70, stage: "一期启用", desc: "未命中词条时，使用商品名前缀匹配兜底召回" },
  { name: "场景词召回", code: "SCENE_TERM", enabled: false, weight: 60, stage: "二期预留", desc: "用户输入场景词后召回一组关联 SPU" },
  { name: "商品属性词召回", code: "ATTRIBUTE_TERM", enabled: false, weight: 50, stage: "二期预留", desc: "用户输入 4K、Family、礼品码等属性词" },
];

type TermType = {
  name: string;
  code: string;
  weight: number;
  match: string;
  desc: string;
};

const DEFAULT_TERM_TYPES: TermType[] = [
  { name: "商品词", code: "PRODUCT_TERM", weight: 100, match: "精准匹配 / 前缀匹配", desc: "商品正式名称或核心商品名" },
  { name: "品牌词", code: "BRAND_TERM", weight: 90, match: "精准匹配 / 前缀匹配", desc: "品牌、服务名、公司名" },
  { name: "别名词", code: "ALIAS_TERM", weight: 85, match: "精准匹配", desc: "用户常见叫法或变体写法" },
  { name: "错词", code: "TYPO_TERM", weight: 75, match: "精准匹配", desc: "用户常见拼写错误" },
  { name: "短词", code: "SHORT_TERM", weight: 60, match: "精准匹配", desc: "用户常用简称或缩写" },
];

type MatchType = { name: string; code: string; weight: number; desc: string };

const DEFAULT_MATCH: MatchType[] = [
  { name: "精准匹配", code: "EXACT", weight: 100, desc: "用户输入标准化词与后台标准化词完全一致" },
  { name: "前缀匹配", code: "PREFIX", weight: 70, desc: "用户输入标准化词是后台标准化词的前缀" },
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

type Quota = {
  panelMax: number;
  gamsgoDefault: number;
  c2cDefault: number;
  allowBackfill: boolean;
  rerankByScore: boolean;
};

const DEFAULT_QUOTA: Quota = {
  panelMax: 10,
  gamsgoDefault: 5,
  c2cDefault: 5,
  allowBackfill: true,
  rerankByScore: true,
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

// ============ Component ============

export function ProductSortManagement() {
  const [recall, setRecall] = useState<RecallSource[]>(clone(DEFAULT_RECALL));
  const [termTypes, setTermTypes] = useState<TermType[]>(clone(DEFAULT_TERM_TYPES));
  const [matchTypes, setMatchTypes] = useState<MatchType[]>(clone(DEFAULT_MATCH));
  const [extra, setExtra] = useState<ExtraFactors>(clone(DEFAULT_EXTRA));
  const [quota, setQuota] = useState<Quota>(clone(DEFAULT_QUOTA));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});

  const [saveOpen, setSaveOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tab, setTab] = useState<
    "intro" | "recall" | "term" | "match" | "extra" | "quota"
  >("intro");
  const [dirty, setDirty] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<RecallSource | null>(null);

  // 排序开关：控制各排序因子是否参与最终排序计算
  type SortFactorKey = "termType" | "termSource" | "matchType" | "exactSpu" | "hotness";

  type SortFactor = {
    key: SortFactorKey;
    name: string;
    desc: string;
    enabled: boolean;
    updatedBy: string;
    updatedAt: string;
  };

  const DEFAULT_SORT_FACTORS: SortFactor[] = [
    { key: "termType", name: "词条类型", enabled: true, desc: "商品词 / 品牌词 / 别名词 / 错词 / 短词 等不同类型的权重参与排序", updatedBy: "—", updatedAt: "—" },
    { key: "termSource", name: "词条来源", enabled: true, desc: "SPU词条 / 商品名前缀兜底 / 场景词 / 属性词 等召回来源权重参与排序", updatedBy: "—", updatedAt: "—" },
    { key: "matchType", name: "匹配方式", enabled: true, desc: "精准匹配 / 前缀匹配 的权重参与排序", updatedBy: "—", updatedAt: "—" },
    { key: "exactSpu", name: "明确指向当前SPU", enabled: true, desc: "用户输入命中商品自身词条时的额外加权参与排序", updatedBy: "—", updatedAt: "—" },
    { key: "hotness", name: "商品热度分", enabled: true, desc: "近 7 天搜索点击、收藏、订单等综合热度分参与排序", updatedBy: "—", updatedAt: "—" },
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
        errs[`recall_${i}`] = "已启用的召回来源权重不能小于 1";
      }
    });
    if (recall.every((r) => !r.enabled)) {
      errs["recall_enabled"] = "至少需要启用 1 个召回来源";
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

    // quota
    if (!isInt(quota.panelMax) || quota.panelMax < 1 || quota.panelMax > 20) {
      errs["quota_panelMax"] = "搜索面板最多商品数只能输入 1-20 的整数";
    }
    if (!isInt(quota.gamsgoDefault) || quota.gamsgoDefault < 0 || quota.gamsgoDefault > 20) {
      errs["quota_gamsgo"] = "GamsGo默认展示数只能输入 0-20 的整数";
    }
    if (!isInt(quota.c2cDefault) || quota.c2cDefault < 0 || quota.c2cDefault > 20) {
      errs["quota_c2c"] = "C2C默认展示数只能输入 0-20 的整数";
    }
    if (
      isInt(quota.panelMax) &&
      isInt(quota.gamsgoDefault) &&
      isInt(quota.c2cDefault) &&
      quota.gamsgoDefault + quota.c2cDefault > quota.panelMax
    ) {
      errs["quota_sum"] = "GamsGo 和 C2C 默认展示数之和不能大于搜索面板最多商品数";
    }
    if (quota.gamsgoDefault === 0 && quota.c2cDefault === 0) {
      errs["quota_zero"] = "至少需要配置一种商品来源的展示数量";
    }

    return { errs, warns };
  }

  function handleSaveClick() {
    const { errs, warns } = validate();
    setErrors(errs);
    setWarnings(warns);
    if (Object.keys(errs).length > 0) {
      toast.error("配置校验未通过，请检查标红字段");
      return;
    }
    setSaveOpen(true);
  }

  function confirmSave() {
    setLogs((p) => [
      {
        time: nowStr(),
        operator: "admin",
        module: "全部模块",
        type: "保存配置",
        before: "—",
        after: "已更新",
        remark: "保存搜索排序规则",
      },
      ...p,
    ]);
    setSaveOpen(false);
    setDirty(false);
    toast.success("保存成功，搜索排序规则已更新。");
  }

  function confirmReset() {
    setRecall(clone(DEFAULT_RECALL));
    setTermTypes(clone(DEFAULT_TERM_TYPES));
    setMatchTypes(clone(DEFAULT_MATCH));
    setExtra(clone(DEFAULT_EXTRA));
    setQuota(clone(DEFAULT_QUOTA));
    setErrors({});
    setWarnings({});
    setLogs((p) => [
      {
        time: nowStr(),
        operator: "admin",
        module: "全部模块",
        type: "恢复默认",
        before: "自定义配置",
        after: "系统默认配置",
        remark: "需点击保存配置后正式生效",
      },
      ...p,
    ]);
    setResetOpen(false);
    setDirty(false);
    toast.message("已恢复默认值，需点击「保存配置」后正式生效。");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex h-12 items-center border-b border-slate-200 bg-white px-4">
        <h1 className="text-lg font-semibold text-slate-800">搜索召回与排序规则配置</h1>
      </header>
      <main className="p-4">
        <div className="rounded-md bg-white shadow-sm">
          <div className="flex">
            {/* Side menu */}
            <div className="w-44 shrink-0 border-r border-slate-200 p-4">
              <div className="space-y-2 text-slate-700">
                <Link to="/" className="block py-1.5 cursor-pointer hover:text-blue-600">SPU词库管理</Link>
                <Link to="/" className="block py-1.5 cursor-pointer hover:text-blue-600">SPU词条管理</Link>
                <Link to="/scene" className="block py-1.5 cursor-pointer hover:text-blue-600">场景搜索配置</Link>
                <div className="py-1.5 cursor-pointer text-blue-600 font-medium">搜索召回与排序规则</div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Tabs row */}
              <div className="flex items-center border-b border-slate-200 px-6">
                {[
                  { k: "intro", label: "排序开关" },
                  { k: "recall", label: "召回来源权重" },
                  { k: "term", label: "词条类型权重" },
                  { k: "match", label: "匹配方式权重" },
                  { k: "extra", label: "附加排序因子" },
                  { k: "quota", label: "展示配额" },
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
              <div className="flex items-center justify-between px-6 pt-5">
                <div className="flex items-center gap-2">
                  {dirty && (
                    <>
                      <Button
                        onClick={handleSaveClick}
                        className="h-9 bg-blue-500 hover:bg-blue-600 text-white shadow-none"
                      >
                        保存配置
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setResetOpen(true)}
                        className="h-9 border-slate-300 text-slate-700"
                      >
                        恢复默认值
                      </Button>
                    </>
                  )}
                </div>
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
                  <RefreshCw className="h-4 w-4 cursor-pointer hover:text-blue-600" />
                  <Settings className="h-4 w-4 cursor-pointer hover:text-blue-600" />
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
                            <Switch
                              checked={f.enabled}
                              onCheckedChange={(v) => {
                                const next = [...sortFactors];
                                next[i] = { ...f, enabled: !!v, updatedBy: "admin", updatedAt: nowStr() };
                                setSortFactors(next);
                                setDirty(true);
                              }}
                            />
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
                    <FlatTable headers={["召回来源", "是否启用", "权重分", "说明", "操作"]}>
                      {recall.map((r, i) => (
                        <FlatRow key={r.code}>
                          <FlatCell>{r.name}</FlatCell>
                          <FlatCell>
                            <Switch
                              checked={r.enabled}
                              onCheckedChange={(v) => {
                                const next = [...recall];
                                next[i] = { ...r, enabled: !!v };
                                setRecall(next);
                                setDirty(true);
                              }}
                            />
                          </FlatCell>
                          <FlatCell>
                            <NumberField
                              value={r.weight}
                              error={errors[`recall_${i}`]}
                              onChange={(v) => {
                                const next = [...recall];
                                next[i] = { ...r, weight: v };
                                setRecall(next);
                                setDirty(true);
                              }}
                            />
                          </FlatCell>
                          <FlatCell className="text-slate-500">{r.desc}</FlatCell>
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
                    <FlatTable headers={["词条类型", "类型编码", "权重分", "推荐匹配方式", "说明"]}>
                      {termTypes.map((t, i) => (
                        <FlatRow key={t.code}>
                          <FlatCell>{t.name}</FlatCell>
                          <FlatCell className="text-slate-500">{t.code}</FlatCell>
                          <FlatCell>
                            <NumberField
                              value={t.weight}
                              error={errors[`term_${i}`]}
                              onChange={(v) => {
                                const next = [...termTypes];
                                next[i] = { ...t, weight: v };
                                setTermTypes(next);
                              }}
                            />
                          </FlatCell>
                          <FlatCell className="text-slate-500">{t.match}</FlatCell>
                          <FlatCell className="text-slate-500">{t.desc}</FlatCell>
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
                    <FlatTable headers={["匹配方式", "匹配编码", "权重分", "说明"]}>
                      {matchTypes.map((m, i) => (
                        <FlatRow key={m.code}>
                          <FlatCell>{m.name}</FlatCell>
                          <FlatCell className="text-slate-500">{m.code}</FlatCell>
                          <FlatCell>
                            <NumberField
                              value={m.weight}
                              error={errors[`match_${i}`]}
                              onChange={(v) => {
                                const next = [...matchTypes];
                                next[i] = { ...m, weight: v };
                                setMatchTypes(next);
                              }}
                            />
                          </FlatCell>
                          <FlatCell className="text-slate-500">{m.desc}</FlatCell>
                        </FlatRow>
                      ))}
                    </FlatTable>
                  </div>
                )}

                {tab === "extra" && (
                  <div>
                    <FlatTable headers={["配置项", "数值 / 开关", "说明"]}>
                      <FlatRow>
                        <FlatCell>明确指向当前SPU加权</FlatCell>
                        <FlatCell>
                          <NumberField
                            value={extra.exactSpuBoost}
                            error={errors["extra_exactSpuBoost"]}
                            onChange={(v) => setExtra({ ...extra, exactSpuBoost: v })}
                          />
                        </FlatCell>
                        <FlatCell className="text-slate-500">词条「是否明确指向当前SPU = 是」时增加的分数</FlatCell>
                      </FlatRow>
                      <FlatRow>
                        <FlatCell>商品热度分单位</FlatCell>
                        <FlatCell>
                          <NumberField
                            value={extra.hotnessUnit}
                            error={errors["extra_hotnessUnit"]}
                            onChange={(v) => setExtra({ ...extra, hotnessUnit: v })}
                          />
                        </FlatCell>
                        <FlatCell className="text-slate-500">商品热度等级每提升 1 级增加的分数</FlatCell>
                      </FlatRow>
                      <FlatRow>
                        <FlatCell>商品热度分上限</FlatCell>
                        <FlatCell>
                          <NumberField
                            value={extra.hotnessCap}
                            error={errors["extra_hotnessCap"]}
                            onChange={(v) => setExtra({ ...extra, hotnessCap: v })}
                          />
                        </FlatCell>
                        <FlatCell className="text-slate-500">商品热度最多可增加的分数</FlatCell>
                      </FlatRow>
                      <FlatRow>
                        <FlatCell>GamsGo自营加权</FlatCell>
                        <FlatCell>
                          <NumberField
                            value={extra.gamsgoBoost}
                            error={errors["extra_gamsgoBoost"]}
                            onChange={(v) => setExtra({ ...extra, gamsgoBoost: v })}
                          />
                        </FlatCell>
                        <FlatCell className="text-slate-500">明确商品意图下，自营商品当前区域可购买时增加的分数</FlatCell>
                      </FlatRow>
                      <FlatRow>
                        <FlatCell>是否启用多命中奖励</FlatCell>
                        <FlatCell>
                          <Switch
                            checked={extra.multiHitEnabled}
                            onCheckedChange={(v) => setExtra({ ...extra, multiHitEnabled: !!v })}
                          />
                        </FlatCell>
                        <FlatCell className="text-slate-500">同一 SPU 被多个来源命中时是否增加少量奖励</FlatCell>
                      </FlatRow>
                      <FlatRow>
                        <FlatCell>单个额外命中奖励分</FlatCell>
                        <FlatCell>
                          <NumberField
                            value={extra.multiHitPer}
                            error={errors["extra_multiHitPer"]}
                            onChange={(v) => setExtra({ ...extra, multiHitPer: v })}
                          />
                        </FlatCell>
                        <FlatCell className="text-slate-500">每个额外命中来源增加的分数</FlatCell>
                      </FlatRow>
                      <FlatRow>
                        <FlatCell>多命中奖励上限次数</FlatCell>
                        <FlatCell>
                          <NumberField
                            value={extra.multiHitMax}
                            error={errors["extra_multiHitMax"]}
                            onChange={(v) => setExtra({ ...extra, multiHitMax: v })}
                          />
                        </FlatCell>
                        <FlatCell className="text-slate-500">最多计算几个额外命中来源（0-10）</FlatCell>
                      </FlatRow>
                    </FlatTable>
                    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50/60 p-3 text-xs leading-6 text-slate-600">
                      商品热度分 = min(商品热度等级 × 商品热度分单位, 商品热度分上限)。<br />
                      GamsGo自营加权仅在「明确商品意图 + 当前区域可售 + 有库存」时生效；不可购买时商品将作为顶部预约卡展示，不参与本页面排序。<br />
                      多命中最终分 = 最高召回分 + min(额外命中来源数, 多命中奖励上限次数) × 单个额外命中奖励分。
                    </div>
                  </div>
                )}

                {tab === "quota" && (
                  <div>
                    {errors["quota_sum"] && (
                      <p className="mb-2 text-xs text-red-500">{errors["quota_sum"]}</p>
                    )}
                    {errors["quota_zero"] && (
                      <p className="mb-2 text-xs text-red-500">{errors["quota_zero"]}</p>
                    )}
                    <FlatTable headers={["配置项", "数值 / 开关", "说明"]}>
                      <FlatRow>
                        <FlatCell>搜索面板最多商品数</FlatCell>
                        <FlatCell>
                          <NumberField
                            value={quota.panelMax}
                            error={errors["quota_panelMax"]}
                            onChange={(v) => setQuota({ ...quota, panelMax: v })}
                          />
                        </FlatCell>
                        <FlatCell className="text-slate-500">1-20，正常商品结果最多返回数量</FlatCell>
                      </FlatRow>
                      <FlatRow>
                        <FlatCell>GamsGo默认展示数</FlatCell>
                        <FlatCell>
                          <NumberField
                            value={quota.gamsgoDefault}
                            error={errors["quota_gamsgo"]}
                            onChange={(v) => setQuota({ ...quota, gamsgoDefault: v })}
                          />
                        </FlatCell>
                        <FlatCell className="text-slate-500">0-20，GamsGo 自营默认最多展示数量</FlatCell>
                      </FlatRow>
                      <FlatRow>
                        <FlatCell>C2C默认展示数</FlatCell>
                        <FlatCell>
                          <NumberField
                            value={quota.c2cDefault}
                            error={errors["quota_c2c"]}
                            onChange={(v) => setQuota({ ...quota, c2cDefault: v })}
                          />
                        </FlatCell>
                        <FlatCell className="text-slate-500">0-20，C2C 默认最多展示数量</FlatCell>
                      </FlatRow>
                      <FlatRow>
                        <FlatCell>一方不足是否允许补位</FlatCell>
                        <FlatCell>
                          <Switch
                            checked={quota.allowBackfill}
                            onCheckedChange={(v) => setQuota({ ...quota, allowBackfill: !!v })}
                          />
                        </FlatCell>
                        <FlatCell className="text-slate-500">某一来源不足时，由另一来源补满</FlatCell>
                      </FlatRow>
                      <FlatRow>
                        <FlatCell>是否按最终分重新排序</FlatCell>
                        <FlatCell>
                          <Switch
                            checked={quota.rerankByScore}
                            onCheckedChange={(v) => setQuota({ ...quota, rerankByScore: !!v })}
                          />
                        </FlatCell>
                        <FlatCell className="text-slate-500">分桶后是否再按分数整体重排</FlatCell>
                      </FlatRow>
                    </FlatTable>
                    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50/60 p-3 text-xs leading-6 text-slate-600">
                      示例：GamsGo 可展示 3 个、C2C 可展示 8 个，允许补位时最终展示 3 + 7 = 10 个。顶部预约卡不参与该数量计算。
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Save confirm dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认保存搜索排序规则？</DialogTitle>
            <DialogDescription>
              保存后，新的排序规则将影响前台搜索正常商品结果的展示顺序。顶部预约卡、库存判断、区域可售判断不受本页面排序分影响。请确认配置无误。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>取消</Button>
            <Button onClick={confirmSave}>确认保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset confirm dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认恢复默认排序规则？</DialogTitle>
            <DialogDescription>
              恢复后，当前页面所有排序权重和展示配额将恢复为系统默认值。该操作不会删除 SPU 词条和商品配置。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>取消</Button>
            <Button onClick={confirmReset}>确认恢复</Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑召回来源</DialogTitle>
            <DialogDescription>修改该召回来源的启用状态、权重和说明，保存后可在顶部「保存配置」中正式提交。</DialogDescription>
          </DialogHeader>
          {editDraft && (
            <div className="space-y-3 text-sm">
              <div>
                <div className="mb-1 text-xs text-slate-600">召回来源</div>
                <Input
                  value={editDraft.name}
                  onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-600">是否启用</div>
                <Switch
                  checked={editDraft.enabled}
                  onCheckedChange={(v) => setEditDraft({ ...editDraft, enabled: !!v })}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-600">权重分（0-999）</div>
                <Input
                  type="number"
                  className="h-8 w-32"
                  value={Number.isNaN(editDraft.weight) ? "" : editDraft.weight}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setEditDraft({ ...editDraft, weight: Number.isNaN(n) ? 0 : n });
                  }}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-600">说明</div>
                <Input
                  value={editDraft.desc}
                  onChange={(e) => setEditDraft({ ...editDraft, desc: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
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
              onClick={() => {
                if (editIdx === null || !editDraft) return;
                const next = [...recall];
                next[editIdx] = { ...editDraft };
                setRecall(next);
                setDirty(true);
                setEditIdx(null);
                setEditDraft(null);
                toast.success("已更新该召回来源，请点击「保存配置」正式生效。");
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>搜索测试</DialogTitle>
            <DialogDescription>输入搜索词与访问区域，预览排序结果</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="mb-1 text-xs text-slate-600">搜索词</div>
                <Input placeholder="如 Netflix" />
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-600">访问区域</div>
                <Input placeholder="如 US" />
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-600">用户状态</div>
                <Input placeholder="如 已登录" />
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              测试结果将展示：标准化词、命中来源、候选 SPU、展示类型、排序分明细、GamsGo / C2C 分桶结果、最终展示结果。
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>关闭</Button>
            <Button onClick={() => toast.message("搜索测试结果占位，待后端接口接入后展示。")}>执行测试</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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