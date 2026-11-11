"""Open an offline build in Qt WebEngine, test it and capture the actual view."""
import json
import os
import sys
from pathlib import Path
import qt
import slicer

html = Path(os.environ['RAVAN_QA_HTML'])
out = Path(os.environ['RAVAN_QA_OUTPUT'])
stage = int(os.environ['RAVAN_QA_STAGE'])
size = os.environ['RAVAN_QA_VIEW']
width, height = map(int, size.split('x'))
widget = slicer.qSlicerWebWidget()
widget.resize(width, height)
widget.show()
widget.webView().url = qt.QUrl.fromLocalFile(str(html))
qa = Path(__file__).with_name('phase_qa.js' if stage >= 21 else 'qa.js').read_text()
script = """(() => {
  if (!window.ravanSprint || window.__started) return;
  window.__started = true;
  window.requestAnimationFrame = fn => setTimeout(() => fn(performance.now()), 16);
  window.cancelAnimationFrame = clearTimeout;
  const results = [];
  const check = (name, value) => results.push({name, ok: !!value});
  window.addEventListener('error', e => check(e.message, false));
  window.addEventListener('unhandledrejection', e => check(String(e.reason), false));
  """ + qa + """
  (window.runPhaseQA || window.runRavanQA)(""" + str(stage-20 if stage>=21 else stage) + """, check)
    .catch(e => check(String(e.stack || e), false))
    .finally(() => window.__result = JSON.stringify(results));
})();"""
def capture(results):
    name = out / (html.stem + '_' + size + '.png')
    pixmap=widget.grab()
    image=pixmap.toImage()
    samples={image.pixelColor(x,y).name() for x,y in ((16,18),(150,120),(400,260),(600,420))}
    if stage>=21 and len(samples)==1:
        if getattr(capture,'attempt',0)<3:
            capture.attempt=getattr(capture,'attempt',0)+1
            widget.hide();widget.show()
            qt.QTimer.singleShot(420,lambda: capture(results))
            return
        print('RAVAN SCREENSHOT BLANK',flush=True)
    if not pixmap.save(str(name)):
        raise RuntimeError('Screenshot save failed')
    report = {'viewport': [width,height], 'results': results, 'screenshot': str(name)}
    (out / (html.stem + '_QA_' + size + '.json')).write_text(json.dumps(report, indent=2))
    print('RAVAN QA ' + json.dumps(report), flush=True)
    if stage in (11,12):
        control = 'terrain-compare' if stage == 11 else 'figure-compare'
        widget.evalJS("document.getElementById('" + control + "').click()")
        qt.QTimer.singleShot(310, capture_before)
    else:
        slicer.app.quit()

def capture_before():
    name = out / (html.stem + '_Pre_' + size + '.png')
    if not widget.grab().save(str(name)):
        raise RuntimeError('Comparison screenshot save failed')
    slicer.app.quit()

def on_result(js, value):
    if js != 'window.__result':
        return
    if not value or value in ('null', 'undefined'):
        qt.QTimer.singleShot(250, lambda: widget.evalJS('window.__result'))
    else:
        results = json.loads(value)
        if 16<=stage<=18:
            sys.path.insert(0, str(Path(__file__).parent))
            sys.dont_write_bytecode = True
            from native_qa import run
            qt.QTimer.singleShot(250, lambda: run(widget, results, lambda: capture(results), stage=stage))
        else:
            qt.QTimer.singleShot(250, lambda: capture(results))

widget.connect('evalResult(QString,QString)', on_result)
for delay in (750, 1700, 3000):
    qt.QTimer.singleShot(delay, lambda: widget.evalJS(script))
qt.QTimer.singleShot(3300, lambda: widget.evalJS('window.__result'))
