"""Send native Qt mouse and keyboard events through Chromium's input path."""
import json
import qt

def run(widget, results, done, *, stage=16):
    view=widget.webView()
    target=view.focusProxy()
    expected=''

    def check(name, ok):
        results.append({'name':name,'ok':bool(ok)})

    def click(selector, *, cell=False):
        if cell:
            return """JSON.stringify((()=>{const c=document.getElementById('arena'),r=c.getBoundingClientRect(),p=ravanSprint.viewer.project({x:4,y:3});return [r.left+p.x*r.width/960,r.top+p.y*r.height/570]})())"""
        return """JSON.stringify((()=>{const e=document.querySelector(%s);if(!e)return null;const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})())""" % json.dumps(selector)

    def assertion(js):
        return "("+js+") ? 'yes' : 'no'"

    steps=[
        ('click',click('#party-skills'),120,'Druzina → vestine'),
        ('click',click('#start-encounter'),120,'Vestine → susret'),
        ('assert',assertion("ravanSprint.screens.get()==='battle' && ravanSprint.viewer.getSnapshot().units[3].hp===28"),10,'native priprema otvara susret'),
        ('click',click('#attack'),110,'izbor napada'),
        ('click',click('',cell=True),110,'izbor heksa'),
        ('assert',assertion("document.activeElement.id==='confirm'"),10,'native klik fokusira potvrdu'),
        ('key','',780,'Enter izvrsava potvrdu'),
        ('assert',assertion("ravanSprint.viewer.getSnapshot().units[3].hp===14"),10,'prvi Enter primenjuje jedan pogodak'),
        ('click',click('#attack'),110,'ponovni napad'),
        ('click',click('',cell=True),110,'ponovni izbor mete'),
        ('key','',780,'Enter zavrsava susret'),
        ('assert',assertion("ravanSprint.screens.get()==='outcome'"),10,'native borba otvara rezultat'),
        ('click',click('[data-reward=stone]'),110,'izbor nagrade'),
        ('click',click('#claim-reward'),120,'potvrda nagrade'),
        ('click',click('#next-encounter'),120,'nastavak'),
        ('assert',assertion("ravanSprint.screens.get()==='battle' && document.getElementById('arena-title').textContent==='Patrola doline' && ravanSprint.outcomePort.get().claimed==='stone'"),10,'native izbor vodi u sledeci susret'),
        ('click',click('#battle details summary'),120,'otvori detalje'),
        ('click',click('#reset'),120,'reset aktivnog susreta'),
        ('assert',assertion("document.getElementById('arena-title').textContent==='Patrola doline' && ravanSprint.viewer.getSnapshot().units[3].hp===37 && window.__trusted>=10 && window.__trustedEnter===2"),10,'native klikovi, dva Entera i reset aktivnog susreta'),
    ]
    if stage>=18:
        steps.insert(0,('click',click('#opening-party'),120,'Pocetak → druzina'))
    iterator=iter(steps)

    def next_step():
        nonlocal expected, current
        current=next(iterator,None)
        if current is None:
            widget.disconnect('evalResult(QString,QString)',on_result)
            done()
            return
        kind,js,delay,label=current
        if kind=='key':
            target.setFocus()
            for typ in (qt.QEvent.KeyPress,qt.QEvent.KeyRelease):
                qt.QApplication.sendEvent(target,qt.QKeyEvent(typ,qt.Qt.Key_Return,qt.Qt.NoModifier,'\r'))
            qt.QTimer.singleShot(delay,next_step)
        else:
            expected=js
            widget.evalJS(js)

    def on_result(js,value):
        if js!=expected:return
        kind,_,delay,label=current
        if kind=='assert':
            check(label,value=='yes')
        else:
            try:
                point=json.loads(value)
                if point is None:raise ValueError('Element nije dostupan')
                p=qt.QPointF(*point)
                target.setFocus()
                for typ,buttons in ((qt.QEvent.MouseButtonPress,qt.Qt.LeftButton),(qt.QEvent.MouseButtonRelease,qt.Qt.NoButton)):
                    qt.QApplication.sendEvent(target,qt.QMouseEvent(typ,p,qt.Qt.LeftButton,buttons,qt.Qt.NoModifier))
            except (TypeError,ValueError) as e:
                check(label+': '+str(e),False)
        qt.QTimer.singleShot(delay,next_step)

    current=None
    widget.connect('evalResult(QString,QString)',on_result)
    next_step()
