// Alef Future — watch.html: renders one video clip from the CMS, driven by
// the ?id= query param. No hardcoded clip content lives in this page.

document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  var loaded = document.getElementById('watch-loaded');
  var empty = document.getElementById('watch-empty');

  function showEmpty() {
    loaded.style.display = 'none';
    empty.style.display = 'block';
  }

  if (!id || !window.AlefData) {
    showEmpty();
    return;
  }

  AlefData.getCollectionItem('clips', id).then(function (clip) {
    document.title = clip.title + ' — ألف المستقبل';
    var descMeta = document.getElementById('watch-page-description');
    if (descMeta && clip.description) descMeta.setAttribute('content', clip.description);

    document.getElementById('watch-title').textContent = clip.title;
    document.getElementById('watch-desc').textContent = clip.description || '';

    var player = document.getElementById('watch-player');
    if (clip.videoUrl) {
      player.innerHTML = '<iframe src="' + alefEscapeHTML(clip.videoUrl) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0;border-radius:inherit"></iframe>';
    }

    loaded.style.display = '';

    return AlefData.listCollection('clips').then(function (all) {
      var others = all.filter(function (c) { return String(c.id) !== String(id); }).slice(0, 3);
      var side = document.getElementById('watch-similar');
      if (others.length === 0) {
        side.innerHTML = '<p style="font:400 13px Tajawal;color:var(--text-muted)">لا توجد مقاطع أخرى بعد</p>';
        return;
      }
      side.innerHTML = others.map(function (c) {
        return '<a class="similar-item" href="watch.html?id=' + encodeURIComponent(c.id) + '" style="text-decoration:none;color:inherit">' +
          '<div class="similar-thumb"></div>' +
          '<div><div class="t">' + alefEscapeHTML(c.title) + '</div><div class="d">' + alefEscapeHTML(c.durationLabel || '') + '</div></div>' +
          '</a>';
      }).join('');
    });
  }).catch(function () {
    showEmpty();
  });
});
