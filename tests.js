(function () {
  const ids = window.APP_DATA.libraries.map(lib => lib.id);
  const templates = window.APP_DATA.templates;
  const byId = new Map(window.APP_DATA.libraries.map(lib => [lib.id, lib]));
  const output = document.getElementById('test-output');
  let checks = 0;
  const assert = (condition, message) => {
    checks++;
    if (!condition) throw new Error(message);
  };

  try {
    // 遍历 63 种非空选法，每种生成 100 次。
    for (let mask = 1; mask < (1 << ids.length); mask++) {
      const selected = ids.filter((_, i) => mask & (1 << i));
      for (let repeat = 0; repeat < 100; repeat++) {
        const result = window.VisualSentence.generateSentence(selected);
        const template = templates.find(t => t.id === result.templateId);
        const positions = template.parts.filter(part => part.pos);
        const sources = new Set(result.tokens.map(t => t.libraryId));
        assert(result.tokens.length >= selected.length, '生成词数不足');
        assert(result.tokens.length === positions.length, '词槽位数量错误');
        assert(selected.every(id => sources.has(id)), '某个已选图形库未出现');
        assert(result.tokens.every(t => selected.includes(t.libraryId)), '出现未选择的图形库');
        result.tokens.forEach((token, i) => {
          const original = byId.get(token.libraryId).words[positions[i].pos];
          assert(token.pos === positions[i].pos, '词性错位');
          assert(token.text === original.text && token.gif === original.gif, '词语和 GIF 不匹配');
        });
      }
    }
    assert(window.VisualSentence.generateSentence([ids[0]]).tokens.length >= 2, '单选失败');
    let threw = false;
    try { window.VisualSentence.generateSentence([]); } catch (_) { threw = true; }
    assert(threw, '空选应被拒绝');
    output.textContent = `✅ 全部通过！\n已测试 63 种图形库组合 × 100 次生成。\n共 ${checks.toLocaleString()} 条断言。`;
    output.style.color = '#21613d';
  } catch (error) {
    output.textContent = `❌ 测试失败：${error.message}\n已完成 ${checks} 条断言。`;
    output.style.color = '#a22424';
  }
})();
