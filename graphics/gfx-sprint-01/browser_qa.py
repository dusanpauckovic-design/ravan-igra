"""Browser screenshot and checks for standalone graphics builds via Qt WebEngine."""
import json
import os
from pathlib import Path
import qt
import slicer

path = Path(os.environ['RAVAN_QA_HTML'])
output = Path(os.environ['RAVAN_QA_OUTPUT'])
version = int(os.environ['RAVAN_QA_STAGE'])
size = tuple(map(int, os.environ.get('RAVAN_QA_VIEW', '1280x800').split('x')))
widget = slicer.qSlicerWebWidget()
widget.resize(*size)
widget.show()
view = widget.webView()
view.url = qt.QUrl.fromLocalFile(str(path))
results = []
shots = []

def save(name):
    target = output / (path.stem + '_' + name + '.png')
    if not widget.grab().save(str(target)):
        raise RuntimeError(f'Could not capture {target}')
    shots.append(str(target))

def evaluate(js):
    widget.evalJS(js)

def finished(js, value):
    if js == 'window.__gfxQA':
        if not value or value in ("null", "undefined"):
            qt.QTimer.singleShot(300, lambda: evaluate(js))
            return
        results.extend(json.loads(value))
        qt.QTimer.singleShot(280, capture_idle)
    elif js.startswith("JSON.stringify"):
        print("RAVAN PROGRESS", value, flush=True)
    elif value == 'action':
        qt.QTimer.singleShot({4: 880, 5: 1080, 6: 2100}.get(version, 525), lambda: (save('Akcija_1280x800'), finish()))
    elif value == 'cover':
        qt.QTimer.singleShot(100, lambda: (save('Iza_Zaklona_1280x800'), finish()))
    elif value == 'flat':
        qt.QTimer.singleShot(100, lambda: (save('2D_1280x800'), finish()))

def capture_idle():
    save(os.environ.get('RAVAN_QA_VIEW', '1280x800'))
    if version == 1 and size[0] == 1280:
        evaluate("document.getElementById('view').click(); 'flat';")
    elif version == 2 and size[0] == 1280:
        evaluate("window.ravanDemo.toggleCover(); 'cover';")
    elif version >= 3 and size[0] == 1280:
        evaluate("window.ravanDemo.showcase(); 'action';")
    else:
        finish()

def finish():
    report = {'viewport': size, 'results': results, 'screenshots': shots}
    (output / (path.stem + f'_QA_{size[0]}.json')).write_text(json.dumps(report, indent=2))
    print('RAVAN QA', json.dumps(report), flush=True)
    slicer.app.quit()

script = r"""
(() => {
  if (!window.ravanDemo || window.__gfxRunning) return;
  window.__gfxRunning = true;
  // Qt's offscreen widget may suspend compositor frame ticks at larger
  // window sizes. Keep browser JS playback on a real-time timer in this harness.
  window.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 16);
  window.cancelAnimationFrame = handle => clearTimeout(handle);
  const stage = __STAGE__, results = [];
  const check = (name, condition) => results.push({ name, ok: !!condition });
  const $ = id => document.getElementById(id);
  const click = text => [...$('actions').querySelectorAll('button')].find(b => b.textContent === text).click();
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const errors = [];
  window.__gfxProgress = {results,errors};
  window.addEventListener('error', e => errors.push(e.message));
  window.addEventListener('unhandledrejection', e => errors.push(String(e.reason)));
  (async () => {
    const {viewer, scene, reset} = window.ravanDemo;
    await viewer.ready;
    const verifyHex = () => {
      for (let y = 0; y < scene.height; y++) {
        for (let x = 0; x < scene.width; x++) {
          const p = viewer.project({x,y}), cell = viewer.hitTest(p.x,p.y);
          if (!cell || cell.x !== x || cell.y !== y) return false;
        }
      }
      return true;
    };
    check('center hit-test on all angled hexes', verifyHex());
    $('view').click();
    check('center hit-test on all flat hexes', verifyHex());
    $('view').click();
    check('roster displays all four units', $('roster').children.length === 4);
    const rect = $('arena').getBoundingClientRect();
    const controls = $('actions').getBoundingClientRect();
    check('arena and controls fit viewport', rect.bottom <= innerHeight && controls.bottom <= innerHeight && document.documentElement.scrollWidth <= innerWidth);
    if (stage >= 6) check('legend fits viewport', $('sequence-note').getBoundingClientRect().bottom <= innerHeight);
    $('roster').children[1].click();
    check('select Iva', $('roster').children[1].getAttribute('aria-pressed') === 'true');
    const field = viewer.project(scene.units[2]);
    $('arena').dispatchEvent(new MouseEvent('click', {clientX:rect.left + field.x * rect.width/960,clientY:rect.top + field.y * rect.height/570}));
    check('select Merin by projected hex', $('roster').children[2].getAttribute('aria-pressed') === 'true');
    click('Napad');
    for (let i = 0; i < 20 && !$('message').textContent.includes('stav'); i++) await sleep(100);
    check('attack returns to stance', $('message').textContent.includes('stav'));
    if (stage >= 2) await window.ravanDemo.qa(stage, check, sleep);
    reset();
    check('zero browser errors', errors.length === 0);
  })().catch(e => check('unexpected: '+e.stack, false)).finally(() => {window.__gfxQA=JSON.stringify(results)});
})();
"""
widget.connect('evalResult(QString,QString)', finished)
for delay in (850, 1700, 3000):
    qt.QTimer.singleShot(delay, lambda: evaluate(script.replace('__STAGE__', str(version))))
qt.QTimer.singleShot(3500, lambda: evaluate('window.__gfxQA'))

qt.QTimer.singleShot(12000, lambda: evaluate('JSON.stringify(window.__gfxProgress)'))
