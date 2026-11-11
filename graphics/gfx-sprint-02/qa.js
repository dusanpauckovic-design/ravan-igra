window.runRavanQA = async function(stage, check) {
  const ui=window.ravanSprint, $=ui.$;
  await ui.viewer.ready;
  const rect=$('arena').getBoundingClientRect(), actions=$('actions').getBoundingClientRect();
  check('tabla i akcije staju u viewport',rect.bottom<=innerHeight && actions.bottom<=innerHeight && document.documentElement.scrollWidth<=innerWidth);
  check('cilj susreta vidljiv',$('objective').textContent.includes('Tihog lovca'));
  document.querySelector('[data-unit=a_iva]').click();
  check('Iva selektovana, Radan ostaje aktivan',$('selection').textContent.includes('Iva') && $('turn').textContent.includes('Radan'));
  check('detalji zatvoreni na pocetku',!document.querySelector('details').open);
  $('view').click();
  const p=ui.viewer.project(ui.scene.units[0]), cell=ui.viewer.hitTest(p.x,p.y);
  check('2D preklop zadrzava hex',cell.x===3 && cell.y===3);
  $('view').click(); ui.reset();
};
