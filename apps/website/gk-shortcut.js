(function() {
  var gPressed = false, timer = null;
  document.addEventListener('keydown', function(e) {
    var tag = document.activeElement.tagName;
    var editable = document.activeElement.isContentEditable;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable) return;
    if (e.key === 'g' || e.key === 'G') {
      gPressed = true;
      clearTimeout(timer);
      timer = setTimeout(function() { gPressed = false; }, 1000);
    } else if ((e.key === 'k' || e.key === 'K') && gPressed) {
      clearTimeout(timer);
      gPressed = false;
      window.location.href = '/account/integrations';
    }
  });
})();
