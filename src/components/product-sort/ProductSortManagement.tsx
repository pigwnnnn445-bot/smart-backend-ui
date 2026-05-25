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
  { name: "SPU名称 / 品牌名前缀兜底", code: "SPU_NAME_PREFIX", enabled: true, weight: 70, stage: "一期启用", desc: "未命中词条时，使用 SPU 名称或品牌名前缀兜底" },
  { name: "场景词召回", code: "SCENE_TERM", enabled: false, weight: 60, stage: "二期预留", desc: "用户输入场景词后召回一组关联 SPU" },
  { name: "商品属性词召回", code: "ATTRIBUTE_TERM", enabled: false, weight: 50, stage: "二期预留", desc: "用户输入 4K、Family、礼品码等属性词" },
  { name: "热搜兜底", code: "HOT_FALLBACK", enabled: false, weight: 30, stage: "暂不启用", desc: "无明确结果时的兜底推荐" },
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
            <div className="flex-1 min-w-0 p-6">
              {/* Breadcrumb + actions */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  首页 / 搜索管理 / <span className="text-slate-700">搜索召回与排序规则</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setTestOpen(true)}>搜索测试</Button>
                  <Button variant="outline" size="sm" onClick={() => setLogOpen(true)}>查看操作日志</Button>
                  <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>恢复默认值</Button>
                  <Button size="sm" onClick={handleSaveClick}>保存配置</Button>
                </div>
              </div>

              {/* Section: Rule description */}
              <Section title="规则说明">
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs leading-6 text-slate-700">
                  当前页面用于配置搜索正常可购买商品的排序权重。搜索服务会先根据 SPU词条、SPU名称前缀兜底等召回候选 SPU，再根据当前用户 IP 区域判断商品是否可购买。只有当前区域可售且有库存 / 有可购买供给的商品，才进入本页面配置的排序规则。
                  <br />
                  GamsGo 自营商品如果当前区域不可购买但允许预约，将作为顶部提示卡展示，不参与本页面排序，也不占用正常结果数量。
                </div>
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-6 text-slate-700">
                  正常结果排序分 =<br />
                  &nbsp;&nbsp;召回来源权重<br />
                  + 词条类型权重<br />
                  + 匹配方式权重<br />
                  + 是否明确指向当前SPU加权<br />
                  + 商品热度分<br />
                  + GamsGo自营加权<br />
                  + 多命中奖励
                </div>
                <p className="mt-2 text-xs text-slate-500">排序分越高，商品在正常搜索结果中越靠前。</p>
              </Section>

              {/* Section: Recall sources */}
              <Section title="召回来源权重配置">
                {errors["recall_enabled"] && (
                  <p className="mb-2 text-xs text-red-500">{errors["recall_enabled"]}</p>
                )}
                <TableShell headers={["召回来源", "来源编码", "是否启用", "权重分", "当前阶段", "说明"]}>
                  {recall.map((r, i) => (
                    <tr key={r.code} className="border-t border-slate-100">
                      <Td>{r.name}</Td>
                      <Td className="text-slate-500">{r.code}</Td>
                      <Td>
                        <Switch
                          checked={r.enabled}
                          onCheckedChange={(v) => {
                            const next = [...recall];
                            next[i] = { ...r, enabled: !!v };
                            setRecall(next);
                          }}
                        />
                      </Td>
                      <Td>
                        <NumberField
                          value={r.weight}
                          error={errors[`recall_${i}`]}
                          onChange={(v) => {
                            const next = [...recall];
                            next[i] = { ...r, weight: v };
                            setRecall(next);
                          }}
                        />
                      </Td>
                      <Td>
                        <StageBadge stage={r.stage} />
                      </Td>
                      <Td className="text-slate-500">{r.desc}</Td>
                    </tr>
                  ))}
                </TableShell>
              </Section>

              {/* Section: Term type weights */}
              <Section title="SPU词条类型权重配置" subtitle="只作用于 SPU 词条召回">
                {warnings["term_short"] && (
                  <p className="mb-2 text-xs text-amber-600">{warnings["term_short"]}</p>
                )}
                <TableShell headers={["词条类型", "类型编码", "权重分", "推荐匹配方式", "说明"]}>
                  {termTypes.map((t, i) => (
                    <tr key={t.code} className="border-t border-slate-100">
                      <Td>{t.name}</Td>
                      <Td className="text-slate-500">{t.code}</Td>
                      <Td>
                        <NumberField
                          value={t.weight}
                          error={errors[`term_${i}`]}
                          onChange={(v) => {
                            const next = [...termTypes];
                            next[i] = { ...t, weight: v };
                            setTermTypes(next);
                          }}
                        />
                      </Td>
                      <Td className="text-slate-500">{t.match}</Td>
                      <Td className="text-slate-500">{t.desc}</Td>
                    </tr>
                  ))}
                </TableShell>
              </Section>

              {/* Section: Match weights */}
              <Section title="匹配方式权重配置">
                {errors["match_order"] && (
                  <p className="mb-2 text-xs text-red-500">{errors["match_order"]}</p>
                )}
                <TableShell headers={["匹配方式", "匹配编码", "权重分", "说明"]}>
                  {matchTypes.map((m, i) => (
                    <tr key={m.code} className="border-t border-slate-100">
                      <Td>{m.name}</Td>
                      <Td className="text-slate-500">{m.code}</Td>
                      <Td>
                        <NumberField
                          value={m.weight}
                          error={errors[`match_${i}`]}
                          onChange={(v) => {
                            const next = [...matchTypes];
                            next[i] = { ...m, weight: v };
                            setMatchTypes(next);
                          }}
                        />
                      </Td>
                      <Td className="text-slate-500">{m.desc}</Td>
                    </tr>
                  ))}
                </TableShell>
              </Section>

              {/* Section: Extra factors */}
              <Section title="附加排序因子配置">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="明确指向当前SPU加权"
                    hint="词条「是否明确指向当前SPU = 是」时增加的分数"
                    error={errors["extra_exactSpuBoost"]}
                  >
                    <NumberField
                      value={extra.exactSpuBoost}
                      onChange={(v) => setExtra({ ...extra, exactSpuBoost: v })}
                    />
                  </Field>
                  <Field
                    label="商品热度分单位"
                    hint="商品热度等级每提升 1 级增加的分数"
                    error={errors["extra_hotnessUnit"]}
                  >
                    <NumberField
                      value={extra.hotnessUnit}
                      onChange={(v) => setExtra({ ...extra, hotnessUnit: v })}
                    />
                  </Field>
                  <Field
                    label="商品热度分上限"
                    hint="商品热度最多可增加的分数"
                    error={errors["extra_hotnessCap"]}
                  >
                    <NumberField
                      value={extra.hotnessCap}
                      onChange={(v) => setExtra({ ...extra, hotnessCap: v })}
                    />
                  </Field>
                  <Field
                    label="GamsGo自营加权"
                    hint="明确商品意图下，自营商品当前区域可购买时增加的分数"
                    error={errors["extra_gamsgoBoost"]}
                  >
                    <NumberField
                      value={extra.gamsgoBoost}
                      onChange={(v) => setExtra({ ...extra, gamsgoBoost: v })}
                    />
                  </Field>
                  <Field
                    label="是否启用多命中奖励"
                    hint="同一 SPU 被多个来源命中时是否增加少量奖励"
                  >
                    <Switch
                      checked={extra.multiHitEnabled}
                      onCheckedChange={(v) => setExtra({ ...extra, multiHitEnabled: !!v })}
                    />
                  </Field>
                  <Field
                    label="单个额外命中奖励分"
                    hint="每个额外命中来源增加的分数"
                    error={errors["extra_multiHitPer"]}
                  >
                    <NumberField
                      value={extra.multiHitPer}
                      onChange={(v) => setExtra({ ...extra, multiHitPer: v })}
                    />
                  </Field>
                  <Field
                    label="多命中奖励上限次数"
                    hint="最多计算几个额外命中来源（0-10）"
                    error={errors["extra_multiHitMax"]}
                  >
                    <NumberField
                      value={extra.multiHitMax}
                      onChange={(v) => setExtra({ ...extra, multiHitMax: v })}
                    />
                  </Field>
                </div>
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                  商品热度分 = min(商品热度等级 × 商品热度分单位, 商品热度分上限)。<br />
                  GamsGo自营加权仅在「明确商品意图 + 当前区域可售 + 有库存」时生效；不可购买时商品将作为顶部预约卡展示，不参与本页面排序。<br />
                  多命中最终分 = 最高召回分 + min(额外命中来源数, 多命中奖励上限次数) × 单个额外命中奖励分。
                </div>
              </Section>

              {/* Section: Quota */}
              <Section title="GamsGo / C2C 展示配额配置" subtitle="只作用于正常可购买结果，顶部预约卡不占名额">
                {errors["quota_sum"] && (
                  <p className="mb-2 text-xs text-red-500">{errors["quota_sum"]}</p>
                )}
                {errors["quota_zero"] && (
                  <p className="mb-2 text-xs text-red-500">{errors["quota_zero"]}</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="搜索面板最多商品数" hint="1-20" error={errors["quota_panelMax"]}>
                    <NumberField
                      value={quota.panelMax}
                      onChange={(v) => setQuota({ ...quota, panelMax: v })}
                    />
                  </Field>
                  <Field label="GamsGo默认展示数" hint="0-20" error={errors["quota_gamsgo"]}>
                    <NumberField
                      value={quota.gamsgoDefault}
                      onChange={(v) => setQuota({ ...quota, gamsgoDefault: v })}
                    />
                  </Field>
                  <Field label="C2C默认展示数" hint="0-20" error={errors["quota_c2c"]}>
                    <NumberField
                      value={quota.c2cDefault}
                      onChange={(v) => setQuota({ ...quota, c2cDefault: v })}
                    />
                  </Field>
                  <Field label="一方不足是否允许补位" hint="某一来源不足时，由另一来源补满">
                    <Switch
                      checked={quota.allowBackfill}
                      onCheckedChange={(v) => setQuota({ ...quota, allowBackfill: !!v })}
                    />
                  </Field>
                  <Field label="是否按最终分重新排序" hint="分桶后是否再按分数整体重排">
                    <Switch
                      checked={quota.rerankByScore}
                      onCheckedChange={(v) => setQuota({ ...quota, rerankByScore: !!v })}
                    />
                  </Field>
                </div>
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                  示例：GamsGo 可展示 3 个、C2C 可展示 8 个，允许补位时最终展示 3 + 7 = 10 个。顶部预约卡不参与该数量计算。
                </div>
              </Section>

              {/* Bottom actions */}
              <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
                <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>恢复默认值</Button>
                <Button size="sm" onClick={handleSaveClick}>保存配置</Button>
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

function TableShell({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {headers.map((h) => (
              <th key={h} className="p-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-2 align-middle text-slate-700 ${className ?? ""}`}>{children}</td>;
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

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="mb-1 text-xs font-medium text-slate-700">{label}</div>
      {hint && <div className="mb-2 text-[11px] text-slate-500">{hint}</div>}
      {children}
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
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