const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat, PageBreak } = require('docx');

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const cellBorders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, bold: true, size: 32 })], spacing: { before: 280, after: 160 } });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, bold: true, size: 26 })], spacing: { before: 220, after: 120 } });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: t, bold: true, size: 22 })], spacing: { before: 180, after: 100 } });
const P  = (t) => new Paragraph({ children: [new TextRun({ text: t, size: 22 })], spacing: { after: 80 } });
const B  = (t) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: t, size: 22 })] });

function tbl(headers, rows, widths) {
  const total = widths.reduce((a,b)=>a+b,0);
  const mk = (text, bold, fill) => new TableCell({
    borders: cellBorders, margins: cellMargins,
    width: { size: widths[arguments[3]??0], type: WidthType.DXA },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text: String(text ?? ""), bold: !!bold, size: 20 })] })],
  });
  const headerRow = new TableRow({ children: headers.map((h,i)=> new TableCell({
    borders: cellBorders, margins: cellMargins,
    width: { size: widths[i], type: WidthType.DXA },
    shading: { fill: "E8EEF7", type: ShadingType.CLEAR },
    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })],
  })) });
  const bodyRows = rows.map(r => new TableRow({ children: r.map((c,i)=> new TableCell({
    borders: cellBorders, margins: cellMargins,
    width: { size: widths[i], type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun({ text: String(c ?? ""), size: 20 })] })],
  })) }));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: [headerRow, ...bodyRows] });
}

const children = [];

children.push(new Paragraph({ children: [new TextRun({ text: "商品排序管理功能需求文档", bold: true, size: 44 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
children.push(new Paragraph({ children: [new TextRun({ text: "所属模块：后台管理系统 → SPU 配置 → SPU 搜索配置 → 商品排序管理", size: 20, color: "666666" })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }));
children.push(new Paragraph({ children: [new TextRun({ text: "版本 V1.0  /  最后更新 2026-05-26", size: 20, color: "666666" })], alignment: AlignmentType.CENTER, spacing: { after: 240 } }));

// 1
children.push(H1("1. 功能概述"));
children.push(H2("1.1 功能定位"));
children.push(P("商品排序管理用于统一管理后台搜索召回与排序相关的全部规则。运营、产品和算法人员可在该模块内调整召回来源、词条权重、匹配方式权重、明确指向当前 SPU 的额外加权，以及各排序因子的总开关，并通过搜索测试工具验证规则效果。"));
children.push(H2("1.2 核心价值"));
children.push(B("统一管理搜索召回与排序规则，避免多处分散配置。"));
children.push(B("通过权重与开关，灵活控制不同来源、不同匹配方式对最终排序的影响。"));
children.push(B("通过搜索测试，运营可在保存前后快速验证规则是否生效。"));
children.push(B("所有变更可追溯（操作日志），并支持一键恢复默认值。"));
children.push(H2("1.3 使用对象"));
children.push(B("搜索运营 / 产品运营：日常调整权重、做 A/B 验证。"));
children.push(B("产品经理：调整搜索策略，验证业务效果。"));
children.push(B("研发 / 算法：核对线上规则，定位排序异常。"));

// 2 页面结构
children.push(H1("2. 页面结构"));
children.push(P("页面整体采用左侧栏二级导航 + 顶部 Tab + 内容区的三段式结构。"));
children.push(H2("2.1 左侧二级菜单（SPU 搜索配置）"));
children.push(tbl(["菜单项","说明"],[
  ["SPU 词库管理","管理 SPU 词库（独立功能）"],
  ["SPU 词条管理","管理各 SPU 下的具体词条（独立功能）"],
  ["场景搜索配置","管理场景词及其绑定 SPU"],
  ["商品排序管理（本文档）","管理召回与排序的全部权重与开关"],
],[3000,5500]));
children.push(H2("2.2 顶部 Tab（5 个）"));
children.push(tbl(["Tab","对应模块"],[
  ["排序开关","控制各排序因子总开关"],
  ["词条类型权重","各召回来源（SPU 词条 / 商品名前缀兜底 等）的权重"],
  ["词条来源权重","商品词 / 品牌词 / 别名词 / 错词 / 短词 的权重"],
  ["匹配方式权重","精准匹配 / 前缀匹配 的权重"],
  ["明确指向当前 SPU","用户输入命中商品自身词条时的额外加权"],
],[3000,5500]));
children.push(H2("2.3 全局操作"));
children.push(B("保存配置：触发校验，校验通过后弹窗确认并写入操作日志。"));
children.push(B("恢复默认值：将所有 Tab 配置恢复到系统默认，仅恢复在前端，需点击保存配置后生效。"));
children.push(B("搜索测试：右上角入口，弹窗形式的搜索调试工具。"));
children.push(B("操作日志：右上角入口，弹窗形式查看历史变更记录。"));

// 3 排序开关
children.push(H1("3. 排序开关"));
children.push(P("控制每个排序因子是否参与最终排序分计算。关闭后该因子在排序分中按 0 计算，权重配置保留不删除。"));
children.push(H3("3.1 字段定义"));
children.push(tbl(["字段","类型","说明"],[
  ["召回商品排序因子","枚举","词条类型 / 词条来源 / 匹配方式 / 明确指向当前 SPU"],
  ["是否参与排序","是 / 否","总开关，关闭后对应因子按 0 计算"],
  ["说明","文本","该因子作用解释"],
  ["变更人 / 变更时间","系统自动","最近一次修改的操作人与时间"],
  ["操作","按钮","编辑：弹窗修改开关与说明"],
],[2400,1600,4500]));
children.push(H3("3.2 默认值"));
children.push(tbl(["因子","默认开关"],[
  ["词条类型","是"],["词条来源","是"],["匹配方式","是"],["明确指向当前 SPU","是"],
],[4000,2000]));
children.push(H3("3.3 规则"));
children.push(B("至少建议保留 1 个因子启用，全部关闭时排序将只剩商品基础分。"));
children.push(B("关闭后对应 Tab 的权重仍可编辑，但不会参与排序计算。"));

// 4 词条类型权重
children.push(H1("4. 词条类型权重（召回来源）"));
children.push(P("控制各召回来源是否启用以及对应权重，决定召回链路的优先级。"));
children.push(H3("4.1 字段定义"));
children.push(tbl(["字段","类型","校验","说明"],[
  ["词条类型","只读","—","SPU 词条 / 商品名前缀兜底 / 场景词 / 属性词"],
  ["是否启用","开关","至少启用 1 个","控制本召回来源是否参与召回"],
  ["权重分","整数","0-999，启用时 ≥ 1","参与排序分计算"],
  ["阶段","只读","—","一期启用 / 二期预留 / 暂不启用"],
  ["说明 / 变更人 / 变更时间","系统/文本","—","—"],
],[1900,1200,2000,3400]));
children.push(H3("4.2 默认值"));
children.push(tbl(["来源","默认启用","默认权重","阶段"],[
  ["SPU 词条召回","是","100","一期启用"],
  ["商品名前缀匹配兜底","是","70","一期启用"],
  ["场景词召回","否","60","二期预留"],
  ["商品属性词召回","否","50","二期预留"],
],[2800,1400,1400,1900]));

// 5 词条来源权重
children.push(H1("5. 词条来源权重（词条类型）"));
children.push(P("决定不同人工词条类型在召回排序中的权重差异。"));
children.push(tbl(["词条类型","默认权重","匹配方式","说明"],[
  ["商品词","100","精准 / 前缀","商品正式名称或核心商品名"],
  ["品牌词","90","精准 / 前缀","品牌、服务名、公司名"],
  ["别名词","85","精准","用户常见叫法或变体写法"],
  ["错词","75","精准","用户常见拼写错误"],
  ["短词","60","精准","简称、缩写"],
],[1800,1400,2200,3100]));
children.push(H3("校验规则"));
children.push(B("权重 0-999 的整数。"));
children.push(B("若短词权重高于商品词，弹出二次确认（短输入误召回风险）。"));

// 6 匹配方式权重
children.push(H1("6. 匹配方式权重"));
children.push(tbl(["匹配方式","默认权重","说明"],[
  ["精准匹配","100","用户标准化输入 = 后台标准化词"],
  ["前缀匹配","70","用户标准化输入是后台标准化词的前缀"],
],[2200,1600,4700]));
children.push(H3("校验规则"));
children.push(B("权重 0-999 的整数。"));
children.push(B("精准匹配权重不能低于前缀匹配权重（硬性校验）。"));

// 7 明确指向当前 SPU
children.push(H1("7. 明确指向当前 SPU"));
children.push(P("当用户输入命中商品自身词条时，对该 SPU 额外加权，确保明确指向的商品在结果中靠前。"));
children.push(tbl(["字段","默认值","校验","说明"],[
  ["加权分","20","0-999 整数，不可高于精准匹配权重","参与排序分累计"],
  ["说明","系统默认文案","—","可编辑"],
  ["变更人 / 变更时间","系统自动","—","—"],
],[2000,1600,3000,1900]));

// 8 搜索测试
children.push(H1("8. 搜索测试"));
children.push(P("内嵌的搜索调试工具，用于在保存配置前后验证某个搜索词在指定条件下的命中、过滤、排序与最终展示结果。"));
children.push(H3("8.1 输入区"));
children.push(tbl(["字段","类型","默认","说明"],[
  ["搜索词","文本","空","用户原始输入"],
  ["站点","下拉","gamsgo.com","模拟站点环境"],
  ["区域","下拉","US","模拟用户区域"],
  ["用户状态","下拉","guest","login / guest"],
],[1800,1400,1800,3500]));
children.push(H3("8.2 命中摘要区"));
children.push(B("标准化后的词、主命中来源、命中数量、被过滤数量、是否触发补位。"));
children.push(H3("8.3 候选 SPU 明细"));
children.push(tbl(["列","说明"],[
  ["SPU","商品 ID + 名称 + 来源（官方 / C2C）"],
  ["命中词 / 类型","实际命中的词条与词条类型"],
  ["命中来源","人工词库精准 / 前缀 / 场景词 / 标题前缀 / 标题模糊"],
  ["匹配方式","精准 / 前缀 / 模糊"],
  ["排序分","来源权重 + 商品基础分 + 官方加分"],
  ["过滤原因","SPU 未启用 / SKU 未启用 / 区域不可售 / 无库存 / 用户状态不满足；无则空"],
],[3000,5500]));
children.push(H3("8.4 最终展示区"));
children.push(B("按排序分倒序，最多展示 10 条。"));
children.push(B("展示来源标签：命中结果 / 官方补位 / C2C 补位。"));
children.push(B("展示类型：正常可购买 / 缺货展示 / 补位展示。"));
children.push(H3("8.5 匹配优先级"));
children.push(P("人工词库精准 → 人工词库前缀 → 场景词精准 → 商品标题前缀 → 商品标题模糊。任一层命中即停止后续匹配，命中不足时进入补位流程：官方商品补位 → C2C 商品补位。"));
children.push(H3("8.6 文案"));
children.push(B("说明：输入搜索词与访问条件，预览该搜索词在当前配置下的命中、过滤、排序和最终展示结果。"));
children.push(B("无结果：当前搜索词未命中任何搜索配置或商品信息，且无可用补位商品。"));
children.push(B("命中但未展示：当前搜索词已命中候选商品，但部分商品因库存、区域、状态或排序原因未进入最终展示。"));
children.push(B("补位提示：命中结果不足，系统已根据补位规则补充官方商品或 C2C 商品。"));

// 9 保存/恢复
children.push(H1("9. 保存配置 与 恢复默认值"));
children.push(H3("9.1 保存配置"));
children.push(B("仅在配置发生变更（dirty）时显示按钮。"));
children.push(B("点击后先执行校验，校验不通过时高亮错误字段并 toast 提示。"));
children.push(B("校验通过后弹窗二次确认，确认后写入操作日志并提示「保存成功，搜索排序规则已更新」。"));
children.push(H3("9.2 恢复默认值"));
children.push(B("将所有 Tab 的配置恢复为系统默认。"));
children.push(B("仅在前端恢复，需点击「保存配置」后正式生效。"));
children.push(B("写入操作日志，备注「需点击保存配置后正式生效」。"));

// 10 操作日志
children.push(H1("10. 操作日志"));
children.push(tbl(["列","说明"],[
  ["时间","操作时间"],
  ["操作人","账号"],
  ["模块","词条类型权重 / 匹配方式 / 排序开关 / 全部模块 等"],
  ["类型","保存配置 / 恢复默认 / 编辑 等"],
  ["变更前 / 变更后","关键字段前后值"],
  ["备注","系统或操作人备注"],
],[2000,6500]));
children.push(P("日志按时间倒序，弹窗内提供查看，至少保留最近 200 条。"));

// 11 校验规则汇总
children.push(H1("11. 校验规则汇总"));
children.push(tbl(["规则","等级","说明"],[
  ["权重 0-999 整数","错误","所有权重字段统一约束"],
  ["至少启用 1 个召回来源","错误","召回不能全部关闭"],
  ["启用的召回来源权重 ≥ 1","错误","启用却为 0 会失去意义"],
  ["精准匹配 ≥ 前缀匹配","错误","硬性顺序约束"],
  ["短词权重 > 商品词权重","警告","需二次确认"],
  ["热度上限 ≥ 热度单位","错误","逻辑一致性"],
  ["明确指向当前 SPU 加权 ≤ 精准匹配权重","错误","防止异常权重"],
],[3800,1200,3500]));

// 12 权限
children.push(H1("12. 权限与日志"));
children.push(B("查看：所有具有 SPU 搜索配置访问权限的运营、产品、研发。"));
children.push(B("编辑 / 保存 / 恢复默认值：搜索运营 + 产品经理。"));
children.push(B("所有保存与恢复操作必须写入操作日志，包含时间、操作人、模块、变更前后、备注。"));

// 13 性能
children.push(H1("13. 非功能性需求"));
children.push(B("搜索测试响应时间 ≤ 3 秒。"));
children.push(B("配置保存响应时间 ≤ 1 秒。"));
children.push(B("页面整体首屏加载 ≤ 2 秒。"));
children.push(B("所有数值字段需做前端 + 后端双重校验。"));

// 14 结论
children.push(H1("14. 总结"));
children.push(P("商品排序管理模块通过「排序开关 + 4 类权重 + 明确指向当前 SPU + 搜索测试 + 操作日志」的组合，覆盖了召回与排序的全部可调参数，使运营无需依赖研发即可完成搜索策略的日常维护与效果验证。"));

const doc = new Document({
  styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children }],
});

Packer.toBuffer(doc).then(buf => { fs.writeFileSync("/mnt/documents/商品排序管理需求文档.docx", buf); console.log("OK", buf.length); });
