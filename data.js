/* 只需要编辑此文件中的词语、图片路径和语法模板。 */
window.APP_DATA = {
  libraries: [
    {
      id: 'library-05', name: '图形库 01', cover: 'assets/covers/library-05.svg',
      icon: 'assets/covers/icon-zrf.png',
      words: {
        adjective: { text: '有影响力', gif: 'assets/gifs/library-zrf/adjective.gif', after: '的' },
        noun:      { text: '日出', gif: 'assets/gifs/library-zrf/noun.gif' },
        verb:      { text: '提醒', gif: 'assets/gifs/library-zrf/verb.gif' },
        adverb:    { text: '徒劳', gif: 'assets/gifs/library-zrf/adverb.gif', after: '地' }
      }
    },
    {
      id: 'library-01', name: '图形库 02', cover: 'assets/covers/library-01.svg',
      icon: 'assets/covers/icon-qsy.png',
      words: {
        adjective: { text: '简单', gif: 'assets/gifs/library-qsy/adjective.gif', after: '的' },
        noun:      { text: '石头', gif: 'assets/gifs/library-qsy/noun.gif' },
        verb:      { text: '冲刷', gif: 'assets/gifs/library-qsy/verb.gif' },
        adverb:    { text: '突然', gif: 'assets/gifs/library-qsy/adverb.gif', after: '地' }
      }
    },
    {
      id: 'library-02', name: '图形库 03', cover: 'assets/covers/library-02.png',
      icon: 'assets/covers/icon-wra.png',
      words: {
        adjective: { text: '随缘', gif: 'assets/gifs/library-wra/adjective.gif', after: '的' },
        noun:      { text: '起床困难户', gif: 'assets/gifs/library-wra/noun.gif' },
        verb:      { text: '纠结', gif: 'assets/gifs/library-wra/verb.gif' },
        adverb:    { text: '幻想', gif: 'assets/gifs/library-wra/adverb.gif', after: '地' }
      }
    },
    {
      id: 'library-04', name: '图形库 04', cover: 'assets/covers/library-04.png',
      icon: 'assets/covers/icon-ywl.png',
      words: {
        adjective: { text: '感性', gif: 'assets/gifs/library-ywl/adjective.gif', after: '的' },
        noun:      { text: '猫', gif: 'assets/gifs/library-ywl/noun.gif' },
        verb:      { text: '回忆', gif: 'assets/gifs/library-ywl/verb.gif' },
        adverb:    { text: '紧张', gif: 'assets/gifs/library-ywl/adverb.gif', after: '地' }
      }
    },
    {
      id: 'library-03', name: '图形库 05', cover: 'assets/covers/library-03.svg',
      icon: 'assets/covers/icon-ylq.png',
      words: {
        adjective: { text: '柔软', gif: 'assets/gifs/library-ylq/adjective.gif', after: '的' },
        noun:      { text: '母鸡', gif: 'assets/gifs/library-ylq/noun.gif' },
        verb:      { text: '揍', gif: 'assets/gifs/library-ylq/verb.gif' },
        adverb:    { text: '随机', gif: 'assets/gifs/library-ylq/adverb.gif', after: '地' }
      }
    },
    {
      id: 'library-06', name: '图形库 06', cover: 'assets/covers/library-06.svg',
      icon: 'assets/covers/icon-zyxy.png',
      words: {
        adjective: { text: '萌', gif: 'assets/gifs/library-zyxy/adjective.gif', after: '的' },
        noun:      { text: '小皇帝', gif: 'assets/gifs/library-zyxy/noun.gif' },
        verb:      { text: '思考', gif: 'assets/gifs/library-zyxy/verb.gif' },
        adverb:    { text: '纠结', gif: 'assets/gifs/library-zyxy/adverb.gif', after: '地' }
      }
    }
  ],

  /* pos 表示一个抽词槽位；literal 表示不绑定 GIF 的连接字。 */
  templates: [
    { id: 'short-1', weight: 1, ending: '', parts: [
      { pos: 'adjective' }, { pos: 'noun' }
    ] },
    { id: 'short-2', weight: 1, ending: '。', parts: [
      { pos: 'noun' }, { pos: 'verb' }
    ] },
    { id: 'medium-1', weight: 1, ending: '。', parts: [
      { pos: 'noun' }, { pos: 'adverb' }, { pos: 'verb' }
    ] },
    { id: 'medium-2', weight: 1, ending: '。', parts: [
      { pos: 'adjective' }, { pos: 'noun' }, { pos: 'verb' }
    ] },
    { id: 'long-1', weight: 1, ending: '。', parts: [
      { pos: 'adjective' }, { pos: 'noun' }, { pos: 'adverb' }, { pos: 'verb' }
    ] },
    { id: 'long-2', weight: 1, ending: '。', parts: [
      { pos: 'adjective' }, { pos: 'noun' }, { pos: 'adverb' },
      { pos: 'verb' }, { literal: '并' }, { pos: 'verb' }
    ] },
    { id: 'long-3', weight: 1, ending: '。', parts: [
      { pos: 'adjective' }, { pos: 'noun' }, { pos: 'adverb' },
      { pos: 'verb' }, { literal: '，又' }, { pos: 'adverb' }, { pos: 'verb' }
    ] }
  ]
};
