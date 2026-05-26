const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel,
        AlignmentType, BorderStyle, WidthType, ShadingType } = require('docx');
const fs = require('fs');

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function cell(text, width, opts = {}) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: opts.center ? "center" : undefined,
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text, bold: opts.bold, size: opts.size || 21 })]
    })]
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })] });
}

function row(cells) {
  return new TableRow({ children: cells });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Microsoft YaHei", size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Microsoft YaHei" },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Microsoft YaHei" },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Microsoft YaHei" },
        paragraph: { spacing: { before: 120, after: 120 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      h1("搜索测试功能需求文档"),
      p("文档版本：V1.0", { size: 18, color: "666666" }),
      p("适用系统：后台管理系统 → SPU 配置 → SPU 搜索配置", { size: 18, color: "666666" }),
      new Paragraph({ spacing: { before: 240, after: 120 }, children: [] }),

      h2("1. 功能定位"),
      h3("1.1 功能名称"),
      p("搜索测试"),
      h3("1.2 所属模块"),
      p("后台管理系统 → SPU 配置 → SPU 搜索配置 → 商品排序管理 / 搜索配置相关页面"),
      h3("1.3 功能定位"),
      p("搜索测试用于后台运营、产品、配置人员在发布或调整搜索配置后，验证某个搜索词在指定条件下的实际召回、过滤、排序和最终展示结果。"),
      p("该功能不是前台搜索结果页，也不是用户侧搜索预览页面，而是后台搜索配置调试工具。"),
      h3("1.4 核心价值"),
      p("搜索测试的核心价值是让运营知道："),
      p("为什么用户搜索这个词时，会展示这些商品，以及为什么某些商品没有展示。"),
      p("它主要解决以下问题："),
      p("• 配置 SPU 词条后，不知道词条是否生效。"),
      p("• 配置场景搜索词后，不知道绑定 SPU 是否正确展示。"),
      p("• 搜索结果异常时，无法判断是未命中、被库存过滤、区域不可售，还是排序靠后。"),
      p("• GamsGo 官方商品和 C2C 商品在补位规则下的展示效果是否符合预期。"),

      h2("2. 功能入口"),
      p("在「商品排序管理」页面顶部增加「搜索测试」入口按钮，点击后弹出搜索测试弹窗。"),
      p("弹窗标题：搜索测试"),
      p("弹窗宽度：建议 800px 或自适应宽屏，以容纳多列表格展示。"),

      h2("3. 使用场景"),
      p("场景一：配置 SPU 词条后，测试词条是否命中"),
      p("运营人员配置了「Netflix」→ SPU-001 的词条映射后，在搜索测试输入「netflix」，验证是否能命中该 SPU。"),
      p("场景二：配置场景搜索词后，验证绑定 SPU 的展示效果"),
      p("产品人员配置了「买号」场景搜索词，绑定了 5 个 SPU，测试该词在 USA 区域、已登录用户条件下的召回和排序结果。"),
      p("场景三：搜索结果异常排查"),
      p("用户反馈搜索「Steam」没有结果，运营人员在搜索测试中排查：是否未命中词条？是否库存过滤？是否区域不可售？"),
      p("场景四：排序权重调整验证"),
      p("运营人员调整了库存系数权重后，测试搜索词「Xbox」在不同库存状态下的 SPU 排序变化。"),
      p("场景五：补位规则验证"),
      p("验证当命中结果不足时，系统是否正确补位官方商品或 C2C 商品，补位数量是否正确。"),

      h2("4. 功能流程"),
      p("1. 用户在搜索测试弹窗中输入搜索词。"),
      p("2. 选择测试条件（可选，默认使用当前配置）。"),
      p("3. 点击「执行测试」按钮。"),
      p("4. 系统按以下顺序执行："),
      p("   a. 命中检测：检查搜索词是否命中 SPU 词条、场景搜索词、或商品标题。"),
      p("   b. 召回候选：根据命中规则召回所有候选 SPU（包括命中 SPU 和补位 SPU）。"),
      p("   c. 过滤处理：根据库存、区域、上下架状态过滤不可展示的商品。"),
      p("   d. 排序计算：根据排序因子计算每个候选 SPU 的排序分。"),
      p("   e. 补位填充：如果命中结果不足，按补位规则补充官方商品或 C2C 商品。"),
      p("   f. 最终展示：返回 TOP N（默认 10 个）最终展示结果。"),
      p("5. 展示测试结果：命中摘要、候选明细、最终展示结果。"),

      h2("5. 测试条件"),
      p("搜索测试弹窗顶部提供以下测试条件配置："),
      new Paragraph({ spacing: { before: 120, after: 60 }, children: [] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 2340, 2340, 2340],
        rows: [
          row([cell("条件字段", 2340, { bold: true, fill: "E8E4DD" }), cell("类型", 2340, { bold: true, fill: "E8E4DD" }), cell("默认值", 2340, { bold: true, fill: "E8E4DD" }), cell("说明", 2340, { bold: true, fill: "E8E4DD" })]),
          row([cell("搜索词", 2340), cell("文本输入", 2340), cell("空", 2340), cell("必填，支持中英文", 2340)]),
          row([cell("站点", 2340), cell("下拉选择", 2340), cell("当前站点", 2340), cell("USA / UK / EU 等", 2340)]),
          row([cell("区域", 2340), cell("下拉选择", 2340), cell("全部区域", 2340), cell("影响区域可售过滤", 2340)]),
          row([cell("用户状态", 2340), cell("单选", 2340), cell("已登录", 2340), cell("已登录 / 未登录", 2340)]),
          row([cell("展示数量", 2340), cell("数字输入", 2340), cell("10", 2340), cell("最终展示数量 TOP N", 2340)]),
        ]
      }),
      new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),

      h2("6. 展示内容"),
      h3("6.1 命中摘要区"),
      p("展示以下信息（精简，不超过 3-4 行）："),
      new Paragraph({ spacing: { before: 60, after: 60 }, children: [] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 7020],
        rows: [
          row([cell("字段", 2340, { bold: true, fill: "E8E4DD" }), cell("说明", 7020, { bold: true, fill: "E8E4DD" })]),
          row([cell("标准化搜索词", 2340), cell("小写 + 去空格后的搜索词", 7020)]),
          row([cell("命中类型", 2340), cell("词条命中 / 场景命中 / 标题命中 / 未命中", 7020)]),
          row([cell("命中 SPU 数", 2340), cell("直接命中的 SPU 数量", 7020)]),
          row([cell("候选总数", 2340), cell("命中 + 补位后的候选总数", 7020)]),
          row([cell("过滤后数量", 2340), cell("经过库存/区域/状态过滤后的数量", 7020)]),
          row([cell("最终展示数", 2340), cell("实际展示的商品数量", 7020)]),
        ]
      }),
      new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),

      h3("6.2 候选 SPU 明细区（表格）"),
      p("展示所有候选 SPU 的详细信息，包括命中和补位的 SPU。"),
      new Paragraph({ spacing: { before: 60, after: 60 }, children: [] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1400, 1400, 1400, 1400, 1400, 1400, 1960],
        rows: [
          row([cell("SPU ID", 1400, { bold: true, fill: "E8E4DD" }), cell("SPU 名称", 1400, { bold: true, fill: "E8E4DD" }), cell("命中类型", 1400, { bold: true, fill: "E8E4DD" }),
               cell("排序分", 1400, { bold: true, fill: "E8E4DD" }), cell("库存状态", 1400, { bold: true, fill: "E8E4DD" }), cell("区域可售", 1400, { bold: true, fill: "E8E4DD" }), cell("是否展示", 1960, { bold: true, fill: "E8E4DD" })]),
          row([cell("SPU-001", 1400), cell("Netflix 月卡", 1400), cell("词条命中", 1400), cell("95.2", 1400), cell("有库存", 1400), cell("USA 可售", 1400), cell("✓ 展示", 1960)]),
          row([cell("SPU-002", 1400), cell("Netflix 季卡", 1400), cell("词条命中", 1400), cell("88.5", 1400), cell("有库存", 1400), cell("USA 可售", 1400), cell("✓ 展示", 1960)]),
          row([cell("SPU-003", 1400), cell("Hulu 月卡", 1400), cell("补位-官方", 1400), cell("70.0", 1400), cell("有库存", 1400), cell("USA 可售", 1400), cell("✓ 展示", 1960)]),
          row([cell("SPU-004", 1400), cell("某 C2C 商品", 1400), cell("补位-C2C", 1400), cell("65.0", 1400), cell("有库存", 1400), cell("USA 可售", 1400), cell("✓ 展示", 1960)]),
        ]
      }),
      new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),

      h3("6.3 最终展示结果区"),
      p("按排序分从高到低展示最终展示的商品列表，标注每个商品的展示来源（命中 / 补位）。"),

      h3("6.4 过滤原因提示"),
      p("对于被过滤掉的候选 SPU，在明细区标注过滤原因："),
      p("• 区域不可售：该 SPU 在当前区域不可售。"),
      p("• 无库存：该 SPU 库存不足或已售罄。"),
      p("• 已下架：该 SPU 已下架或状态异常。"),
      p("• 排序靠后：该 SPU 排序分较低，未进入 TOP N。"),

      h2("7. 命中逻辑"),
      p("搜索测试的命中逻辑应与线上搜索保持一致，优先级如下："),
      p("1. SPU 词条精确匹配（优先级最高）"),
      p("2. SPU 词条前缀匹配"),
      p("3. 场景搜索词匹配"),
      p("4. 商品标题关键词匹配"),
      p("5. 商品标题模糊匹配（优先级最低）"),
      p("命中后，系统返回命中的 SPU ID 列表。"),

      h2("8. 排序规则"),
      p("搜索测试的排序计算应与线上排序保持一致，包含以下因子："),
      p("• 基础分：SPU 的基础权重分"),
      p("• 库存因子：有库存加分，库存紧张减分"),
      p("• 区域因子：当前区域可售加分"),
      p("• 用户因子：已登录用户匹配度加分"),
      p("• 官方商品因子：GamsGo 官方商品额外加权"),
      p("• C2C 商品因子：C2C 商品按信誉加权"),
      p("排序分 = 基础分 + 库存因子 + 区域因子 + 用户因子 + 官方/C2C 因子"),

      h2("9. 过滤规则"),
      p("搜索测试应模拟以下过滤规则："),
      p("• 区域过滤：SPU 必须支持当前选择区域"),
      p("• 库存过滤：SPU 必须有可用库存"),
      p("• 状态过滤：SPU 必须处于上架状态"),
      p("• 用户过滤：部分 SPU 可能仅限登录用户可见"),

      h2("10. 补位规则"),
      p("当命中结果经过过滤后，最终可展示数量不足时，系统按以下规则补位："),
      p("1. 官方商品补位：优先补充 GamsGo 官方商品，按排序分从高到低。"),
      p("2. C2C 商品补位：官方商品补位后仍不足，补充 C2C 商品。"),
      p("3. 补位数量：补位至达到展示数量上限（默认 10 个）。"),
      p("4. 补位标注：补位商品在展示结果中明确标注为「补位-官方」或「补位-C2C」。"),

      h2("11. 异常处理"),
      p("搜索测试应处理以下异常情况："),
      p("• 无结果：搜索词未命中任何 SPU，且无可用补位商品。"),
      p("• 部分过滤：命中候选 SPU 但全部被过滤，仅展示补位商品。"),
      p("• 排序异常：排序分计算结果与预期不符，需排查排序因子配置。"),
      p("• 超时：测试执行超过 3 秒，提示「测试超时，请稍后重试」。"),

      h2("12. 性能要求"),
      p("• 测试响应时间：≤ 3 秒"),
      p("• 并发限制：同一用户 1 秒内最多执行 5 次测试"),
      p("• 数据实时性：使用当前生效的配置（非草稿）"),

      h2("13. 数据安全"),
      p("• 搜索结果仅对后台运营人员可见"),
      p("• 不涉及用户真实搜索数据"),
      p("• 测试记录可查询，但不做长期存储（保留 7 天）"),

      h2("14. 操作日志"),
      p("每次搜索测试应记录操作日志："),
      p("• 操作人员 ID"),
      p("• 测试时间"),
      p("• 搜索词"),
      p("• 测试条件（站点、区域、用户状态）"),
      p("• 命中结果数量"),
      p("• 过滤原因统计"),
      p("• 最终展示结果"),

      h2("15. 角色权限"),
      new Paragraph({ spacing: { before: 60, after: 60 }, children: [] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 3510, 3510],
        rows: [
          row([cell("角色", 2340, { bold: true, fill: "E8E4DD" }), cell("权限", 3510, { bold: true, fill: "E8E4DD" }), cell("说明", 3510, { bold: true, fill: "E8E4DD" })]),
          row([cell("运营人员", 2340), cell("执行搜索测试、查看结果", 3510), cell("日常使用", 3510)]),
          row([cell("产品经理", 2340), cell("执行搜索测试、查看结果", 3510), cell("验证需求", 3510)]),
          row([cell("配置管理员", 2340), cell("执行搜索测试、查看结果", 3510), cell("配置验证", 3510)]),
          row([cell("普通管理员", 2340), cell("仅查看结果", 3510), cell("查看权限", 3510)]),
        ]
      }),
      new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),

      h2("16. 版本控制"),
      p("• 搜索测试始终使用当前生效的配置版本"),
      p("• 不支持测试草稿配置（草稿需先发布才能测试）"),
      p("• 配置回滚后，搜索测试自动使用回滚后的配置"),

      h2("17. 相关依赖"),
      p("搜索测试功能依赖以下模块："),
      p("• SPU 词条管理：词条命中规则"),
      p("• 场景搜索词管理：场景命中规则"),
      p("• 商品排序管理：排序因子配置"),
      p("• 补位规则配置：补位逻辑"),
      p("• 商品基础数据：SPU 信息、库存、区域、状态"),

      h2("18. 验收标准"),
      p("1. 搜索测试弹窗可正常打开和关闭"),
      p("2. 输入搜索词后，3 秒内返回测试结果"),
      p("3. 命中结果与线上搜索保持一致"),
      p("4. 过滤原因标注准确"),
      p("5. 补位商品正确标注来源"),
      p("6. 排序结果与排序因子配置一致"),
      p("7. 无结果时给出明确提示"),
      p("8. 操作日志记录完整"),

      h2("19. 推荐弹窗文案"),
      h3("19.1 弹窗说明文案"),
      p("输入搜索词与访问条件，预览该搜索词在当前配置下的命中、过滤、排序和最终展示结果。"),
      h3("19.2 执行按钮"),
      p("执行测试"),
      h3("19.3 无结果提示"),
      p("当前搜索词未命中任何搜索配置或商品信息，且无可用补位商品。"),
      h3("19.4 命中但未展示提示"),
      p("当前搜索词已命中候选商品，但部分商品因库存、区域、状态或排序原因未进入最终展示。"),
      h3("19.5 补位提示"),
      p("命中结果不足，系统已根据补位规则补充官方商品或 C2C 商品。"),

      h2("20. 最终结论"),
      p("搜索测试功能有必要保留。"),
      p("它的产品价值不是「模拟用户搜索页面」，而是："),
      p("帮助后台运营和产品在配置发布前后，快速验证搜索词命中路径、候选商品、过滤原因、排序结果和最终展示效果。"),
      new Paragraph({ spacing: { before: 120, after: 60 }, children: [] }),
      p("第一版重点不应做复杂公式展示，而应解决三个核心问题："),
      new Paragraph({ spacing: { before: 60, after: 60 }, children: [] }),
      p("1. 搜这个词命中了什么？"),
      p("2. 为什么这些商品展示 / 没展示？"),
      p("3. 最终用户会看到哪些商品？"),
      new Paragraph({ spacing: { before: 120, after: 60 }, children: [] }),
      p("只要这三个问题能回答清楚，这个功能就是有价值的。", { bold: true }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/documents/搜索测试功能需求文档.docx", buffer);
  console.log("文档生成成功：/mnt/documents/搜索测试功能需求文档.docx");
});
