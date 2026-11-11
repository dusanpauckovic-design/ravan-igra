window.RavanVisuals = {
  icon(kind, className='') {
    const glyphs={
      bow:'➶', sword:'⚔', eye:'◉', heart:'♥', spark:'✧', heal:'✚', clock:'◷',
      shield:'⬟', map:'✥', pack:'▣', camp:'⌂', rest:'☾', stone:'◆', river:'≈',
      ridge:'▲', pass:'◈', people:'♟', gold:'◉', unknown:'?'
    };
    const icon=document.createElement('span');
    icon.className='ravan-glyph'+(className?' '+className:'');
    icon.textContent=glyphs[kind]||glyphs.stone;
    icon.setAttribute('aria-hidden','true');
    return icon;
  },
  scenery(node, position='center') {
    node.style.setProperty('--scene', 'url("'+ART.battle_vista+'")');
    node.style.setProperty('--scene-position', position);
  },
  itemKind(item) {
    if(item.slot==='weapon')return 'sword';
    if(item.slot==='body')return 'shield';
    if(item.kind==='Potrosno')return 'heal';
    return 'stone';
  }
};
