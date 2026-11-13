(() => {
  const valleyHtml = /* VALLEY_HTML */ null;
  let dialog;
  window.RavanApprovedValley = {
    open(port) {
      if (dialog?.open) return;
      const snapshot = port.snapshot();
      if (!snapshot) return;
      const pause = current => port.dispatch({
        type:'pause', version:port.version, revision:current.revision, tick:current.tick
      });
      const pausedByPreview = Boolean(snapshot.journey && !snapshot.paused && pause(snapshot).ok);
      const panel = document.createElement('dialog');
      panel.className = 'rv-approved-valley';
      panel.setAttribute('aria-label', '3D dolina');
      const top = document.createElement('header');
      const back = document.createElement('button');
      back.type = 'button';
      back.textContent = '‹ Nazad na mapu kampanje';
      back.addEventListener('click', () => panel.close());
      const label = document.createElement('span');
      label.textContent = '3D pregled doline';
      top.append(back, label);
      const frame = document.createElement('iframe');
      frame.title = 'Prva dolina u 3D prikazu';
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.srcdoc = valleyHtml;
      panel.append(top, frame);
      panel.addEventListener('close', () => {
        panel.remove();
        dialog = null;
        const current = port.snapshot();
        if (pausedByPreview && current?.journey && current.paused && !current.encounter) pause(current);
        document.querySelector('.rv-open-approved-valley')?.focus();
      }, {once:true});
      document.body.append(panel);
      dialog = panel;
      panel.showModal();
      back.focus();
    }
  };
})();
