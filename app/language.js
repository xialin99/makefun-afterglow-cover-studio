const translations = {
  "Afterglow — Cover Studio": "余晖 · 封面工作室",
  "COVER STUDIO": "封面工作室",
  "OFFLINE STUDIO": "离线编辑",
  "LIVE COVER": "实时预览",
  "Cover preview": "封面预览",
  "Cover preview. Select a panel and position it by dragging.": "封面预览。选择一个画格，然后拖动调整构图。",
  "Drag on the cover to reframe a panel": "拖动封面中的图片以调整构图",
  "Restore demo": "恢复示例",
  "Cover editor": "封面编辑器",
  "Turn your photos into a neon-noir poster.": "用你的照片制作霓虹风格海报。",
  "Panels": "画格",
  "Replace photo": "更换图片",
  "Use in all panels": "用于全部画格",
  "Zoom": "缩放",
  "Reset framing": "重置构图",
  "Caption": "封面文字",
  "Color grade": "色调",
  "Export format": "导出尺寸",
  "Download PNG": "下载 PNG",
  "Photos stay on this device.": "照片只保存在此设备上。",
  "Wide": "横版",
  "Square": "方形",
  "Portrait": "竖版",
  "Sunset": "落日",
  "Neon": "霓虹",
  "Natural": "自然",
  "Skyline": "天际线",
  "Lead": "主角",
  "Street": "街景",
  "DUSK RUN": "暮色疾行",
  "Photo placed in all panels.": "已将照片应用到全部画格。",
  "Demo artwork restored.": "已恢复示例封面。",
  "Could not open that image. Try a JPEG, PNG or WebP.": "无法打开这张图片。请尝试 JPEG、PNG 或 WebP。",
  "Could not create the PNG. Please try again.": "无法生成 PNG，请重试。",
  "PNG downloaded": "已下载 PNG"
};
const languageKey = 'afterglow.language';
let language = 'zh';
try { if (localStorage.getItem(languageKey) === 'en') language = 'en'; } catch {}
const t = text => language === 'zh' ? translations[text] ?? text : text;
function translateInterface() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = t('Afterglow — Cover Studio');
  for (const element of document.querySelectorAll('[data-copy]')) {
    element.textContent = t(element.dataset.copy);
  }
  for (const element of document.querySelectorAll('[data-label]')) {
    element.setAttribute('aria-label', t(element.dataset.label));
  }
  document.getElementById('language').value = language;
}
function setLanguage(value) {
  language = value === 'en' ? 'en' : 'zh';
  try { localStorage.setItem(languageKey, language); } catch {}
  translateInterface();
}
