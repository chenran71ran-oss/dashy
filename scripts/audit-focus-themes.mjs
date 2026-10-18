import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as sass from 'sass';
import {parse} from '@vue/compiler-sfc';
import {themeLabels} from '../src/utils/ThemeCatalog.js';
import {focusThemeStyles,focusSurface} from '../src/utils/FocusTheme.js';
import {contrastRatio,cssColor,readThemeColor,themeSurface} from '../src/utils/ThemeContrast.js';
import {themeAuditDom} from './lib/theme-audit-dom.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const compile=source=>sass.compileString(source,{loadPaths:[root,path.join(root,'src/styles')],importers:[{findFileUrl:url=>url.startsWith('@/')?pathToFileURL(path.join(root,'src',url.slice(2))):null}],silenceDeprecations:['import','global-builtin','color-functions']}).css;

export async function auditFocusThemes() {
  const components=['src/components/LinkItems/Item.vue','src/components/MinimalView/MinimalHeading.vue'];
  const componentCss=components.map(file=>parse(fs.readFileSync(path.join(root,file),'utf8')).descriptor.styles.map(s=>compile(s.content)).join('\n')).join('\n');
  const css=componentCss+compile("@import 'src/styles/media-queries.scss';@import 'src/styles/color-palette.scss';@import 'src/styles/dimensions.scss';@import 'src/styles/color-themes.scss';@import 'src/styles/portal-layout.scss';@import 'src/styles/focus-cards.scss';");
  const page=themeAuditDom(css);
  const previous={document:globalThis.document,getComputedStyle:globalThis.getComputedStyle};
  globalThis.document=page.document;globalThis.getComputedStyle=page.getComputedStyle;
  const results=[];
  try {
    page.document.body.innerHTML='<main class="minimal-home focus-home"><section class="focus-category"><div class="focus-card wrap-size-large"><a class="item size-large"><div class="tile-title"><span class="text">A long website title</span><p class="description">An English description with several lines and a long word.</p></div></a></div></section></main>';
    for(const [theme,label] of Object.entries(themeLabels)) {
      if(theme==='default')page.document.documentElement.removeAttribute('data-theme');else page.document.documentElement.dataset.theme=theme;
      const styles=focusThemeStyles();
      const base=themeSurface('--background'),group=focusSurface('--minimal-view-group-background',base),card=focusSurface('--item-background',group),hover=focusSurface('--item-background-hover',group);
      const rgb=value=>value.match(/[\d.]+/g).map(Number);
      const checks={
        title:contrastRatio(rgb(styles['--focus-card-text']),card),
        description:contrastRatio(rgb(styles['--focus-description-text']),card),
        hover:contrastRatio(rgb(styles['--focus-card-hover-text']),hover),
        hoverDescription:contrastRatio(rgb(styles['--focus-description-hover-text']),hover),
        tooltip:contrastRatio(rgb(styles['--focus-tooltip-text']),rgb(styles['--focus-tooltip-background'])),
        tab:contrastRatio(rgb(styles['--focus-tab-text']),rgb(styles['--focus-tab-background'])),
        selectedTab:contrastRatio(rgb(styles['--focus-tab-selected-text']),rgb(styles['--focus-tab-selected-background'])),
        focus:contrastRatio(rgb(styles['--focus-ring']),group),
      };
      const raw={title:contrastRatio(readThemeColor('--item-text-color'),card),hover:contrastRatio(readThemeColor('--item-text-color-hover'),hover),tooltip:contrastRatio(readThemeColor('--description-tooltip-color'),focusSurface('--description-tooltip-background',base))};
      const section=page.document.querySelector('section');for(const [key,value] of Object.entries(styles))section.style.setProperty(key,value);
      const wrapper=page.document.querySelector('.focus-card'),link=wrapper.querySelector('a'),description=wrapper.querySelector('p');
      const geometry={};
      for(const size of ['small','medium','large']) {
        wrapper.className=`focus-card wrap-size-${size}`;link.className=`item size-${size}`;
        const heights=[];
        for(const text of ['Short.','A much longer English description '.repeat(8),'','LongUnbrokenWord'.repeat(30),'很长的中文说明'.repeat(20)]){description.textContent=text;heights.push(page.getComputedStyle(wrapper).height);}
        geometry[size]={height:heights[0],stable:heights.every(x=>x===heights[0]),overflow:page.getComputedStyle(description).overflow};
      }
      const failed=Object.entries(checks).filter(([key,value])=>!Number.isFinite(value)||value<(key==='focus'?2.95:4.45)).map(([key])=>key);
      if(Object.values(geometry).some(x=>!x.stable||!x.height||x.height==='auto'||x.overflow!=='hidden'))failed.push('geometry');
      results.push({theme,label,checks,raw,geometry,card:cssColor(card),hover:cssColor(hover),failed});
    }
  } finally {globalThis.document=previous.document;globalThis.getComputedStyle=previous.getComputedStyle;await page.happyDOM.close();}
  return results;
}

export function focusAuditMarkdown(rows) {
  const repaired=rows.filter(row=>Object.values(row.raw).some(value=>value<4.5));
  const lines=rows.map(row=>`| ${row.label} · \`${row.theme}\` | ${Math.min(row.checks.title,row.checks.description).toFixed(2)} | ${Math.min(row.checks.hover,row.checks.hoverDescription).toFixed(2)} | ${row.checks.tooltip.toFixed(2)} | ${Math.min(row.checks.tab,row.checks.selectedTab).toFixed(2)} | ${row.checks.focus.toFixed(2)} | ${row.failed.length?row.failed.join(', '):'通过'} |`);
  return '# 专注卡片与内置主题审查\n\n审查日期：2026-10-18（Asia/Shanghai）。范围：全部 '+rows.length+' 个内置主题，包含无 data-theme 的 default。\n\n## 检查方法与结论\n\n使用真实 Sass 主题和组件样式，计算透明卡片叠加分类底色后的对比度；复用运行时修正函数检查正常/悬停文字、说明、浮层、普通/选中分类和焦点。正文目标 4.5:1，焦点目标 3:1，表中保留两位小数。\n\n三个尺寸分别使用短文、长英文、空说明、连续长词与中文检查 CSS 高度是否稳定。此检查验证计算样式及布局约束，DOM 模拟没有真实排版引擎，不能作为像素对齐、字体实际换行或手机浏览器已验收的证明。用户自定义背景图片、任意 CSS 和外部主题不属于这 54 个内置主题的穷举范围。\n\n初始主题变量中，有 '+repaired.length+' 个主题的卡片/悬停/说明浮层至少一个文字配色低于 4.5:1；运行时在专注视图就地选择可读文字，不替换原主题底色。相关主题：'+repaired.map(row=>'`'+row.theme+'`').join('、')+'。\n\n| 主题 | 卡片/说明最低 | 悬停最低 | 完整说明 | 分类最低 | 焦点 | 自动结果 |\n| --- | ---: | ---: | ---: | ---: | ---: | --- |\n'+lines.join('\n')+'\n\n## 交互与几何修复\n\n- 专注卡片按小/中/大尺寸使用固定内容框；标题单行省略，中/大尺寸说明保留两行，缺少说明也不会改变卡片高度。\n- 悬停或键盘聚焦通过独立浮层显示完整说明，保持网格不移动；修复旧主题隐藏说明浮层的问题。\n- 说明按钮位于链接之外；手机点击后使用原生 dialog 查看全文，关闭/取消返回按钮，点击说明不打开网站。\n- 分类入口补充键盘 Enter/Space 操作及选中状态。\n\n## 浏览器验收状态\n\n当前连接的桌面浏览器无法访问工作环境的 localhost 预览（连接被拒绝），尚未完成真实浏览器逐主题截图和 iPhone Safari 验收。没有修改线上主题或生产 KV 来模拟分支效果。\n\n## 复现\n\n```bash\nnode scripts/audit-focus-themes.mjs docs/home-lab/focus-theme-audit.md\nnpm run dev -- --host 127.0.0.1 --port 8098\n```\n\n在运行开发服务的设备访问 `/dev/focus-audit.html`，使用合成数据检查 54 个主题、三个尺寸、长说明与说明按钮。该入口是开发用 HTML，生产构建没有把它列为入口。修复分支：`fix/focus-card-theme-audit-20261018`，合并与上线需另行确认。\n';
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  const rows=await auditFocusThemes();
  if(process.argv[2])fs.writeFileSync(path.resolve(process.argv[2]),focusAuditMarkdown(rows));
  console.log(JSON.stringify({themes:rows.length,failed:rows.filter(row=>row.failed.length),rawContrastProblems:rows.filter(row=>Object.values(row.raw).some(value=>value<4.5)).length},null,2));
  if(rows.some(row=>row.failed.length))process.exitCode=1;
}
