// Alef Future — generic admin editor for CMS collections (testimonials,
// team members, events, gallery items, video clips). One reusable function
// drives all five instead of near-duplicate per-collection scripts.

function alefInitCollectionEditor(opts) {
  // opts: { name, containerId, fields: [{key, label, type}], renderPreview(item) }
  var container = document.getElementById(opts.containerId);
  if (!container) return;
  var listEl = container.querySelector('[data-list]');
  var formEl = container.querySelector('[data-add-form]');

  function renderList(items) {
    if (!items || items.length === 0) {
      listEl.innerHTML = '<div class="empty-state">لا توجد عناصر بعد — أضف أول عنصر أدناه</div>';
      return;
    }
    listEl.innerHTML = items.map(function (item) {
      return '<div class="collection-row">' +
        '<div class="collection-row-body">' + opts.renderPreview(item) + '</div>' +
        '<button type="button" class="icon-btn" data-remove="' + item.id + '" aria-label="حذف">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>' +
        '</button>' +
        '</div>';
    }).join('');
  }

  function load() {
    return AlefData.listCollection(opts.name).then(renderList).catch(function () {
      listEl.innerHTML = '<div class="empty-state">تعذر تحميل البيانات</div>';
    });
  }

  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {};
    opts.fields.forEach(function (f) {
      data[f.key] = formEl.elements[f.key].value.trim();
    });
    if (!data[opts.fields[0].key]) return;

    var submitBtn = formEl.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    AlefData.createCollectionItem(opts.name, data).then(function () {
      formEl.reset();
      submitBtn.disabled = false;
      return load();
    }).catch(function (err) {
      submitBtn.disabled = false;
      window.alert(err.message || 'تعذر الإضافة');
    });
  });

  listEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove]');
    if (!btn) return;
    if (!window.confirm('حذف هذا العنصر نهائيًا؟')) return;
    AlefData.deleteCollectionItem(opts.name, btn.getAttribute('data-remove')).then(load).catch(function (err) {
      window.alert(err.message || 'تعذر الحذف');
    });
  });

  load();
}

document.addEventListener('alef-admin-ready', function () {
  alefInitCollectionEditor({
    name: 'testimonials',
    containerId: 'testimonials-editor',
    fields: [
      { key: 'quote', label: 'الاقتباس' },
      { key: 'authorName', label: 'اسم ولي الأمر' },
      { key: 'authorRole', label: 'الصفة (مثال: ولي أمر — الصف الرابع)' }
    ],
    renderPreview: function (t) {
      return '<strong>' + alefEscapeHTML(t.authorName) + '</strong>«' + alefEscapeHTML(t.quote) + '» — ' + alefEscapeHTML(t.authorRole || '');
    }
  });

  alefInitCollectionEditor({
    name: 'team',
    containerId: 'team-editor',
    fields: [
      { key: 'name', label: 'الاسم' },
      { key: 'role', label: 'المسمى الوظيفي' },
      { key: 'photoUrl', label: 'رابط الصورة (اختياري)' }
    ],
    renderPreview: function (m) {
      return '<strong>' + alefEscapeHTML(m.name) + '</strong>' + alefEscapeHTML(m.role || '');
    }
  });

  alefInitCollectionEditor({
    name: 'events',
    containerId: 'events-editor',
    fields: [
      { key: 'title', label: 'عنوان الفعالية' },
      { key: 'eventDate', label: 'التاريخ', type: 'date' },
      { key: 'description', label: 'الوصف' }
    ],
    renderPreview: function (ev) {
      return '<strong>' + alefEscapeHTML(ev.title) + '</strong>' + alefEscapeHTML(alefFormatDate(ev.eventDate)) + ' — ' + alefEscapeHTML(ev.description || '');
    }
  });

  alefInitCollectionEditor({
    name: 'gallery',
    containerId: 'gallery-editor',
    fields: [
      { key: 'title', label: 'عنوان العمل' },
      { key: 'imageUrl', label: 'رابط الصورة (اختياري)' }
    ],
    renderPreview: function (g) {
      return '<strong>' + alefEscapeHTML(g.title) + '</strong>' + (g.imageUrl ? alefEscapeHTML(g.imageUrl) : 'بدون صورة');
    }
  });

  alefInitCollectionEditor({
    name: 'clips',
    containerId: 'clips-editor',
    fields: [
      { key: 'title', label: 'عنوان المقطع' },
      { key: 'videoUrl', label: 'رابط الفيديو (embed)' },
      { key: 'durationLabel', label: 'المدة (مثال: 2:14 دقيقة)' },
      { key: 'description', label: 'الوصف' }
    ],
    renderPreview: function (c) {
      return '<strong>' + alefEscapeHTML(c.title) + '</strong>' + (c.videoUrl ? alefEscapeHTML(c.videoUrl) : 'بدون رابط فيديو بعد') + (c.durationLabel ? ' — ' + alefEscapeHTML(c.durationLabel) : '');
    }
  });
});
