document.addEventListener('alef-admin-ready', function () {
  var statusLabels = { new: 'جديد', contacted: 'تم التواصل', closed: 'مغلق' };

  var searchInput = document.getElementById('lead-search');
  var filterSelect = document.getElementById('lead-filter');
  var tbody = document.getElementById('lead-table-body');
  var emptyState = document.getElementById('lead-empty');
  var cache = [];

  function renderRows() {
    var query = searchInput.value.trim().toLowerCase();
    var statusFilter = filterSelect.value;

    var filtered = cache.filter(function (l) {
      var matchesQuery = !query || (l.schoolName || '').toLowerCase().indexOf(query) !== -1;
      var matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(function (l) {
      return '<tr>' +
        '<td class="primary-cell">' + alefEscapeHTML(l.schoolName) + '</td>' +
        '<td>' + alefEscapeHTML(l.phone) + '</td>' +
        '<td class="muted-cell">' + alefFormatDate(l.createdAt) + '</td>' +
        '<td>' +
          '<select class="status-select" data-status-for="' + l.id + '">' +
            '<option value="new"' + (l.status === 'new' ? ' selected' : '') + '>جديد</option>' +
            '<option value="contacted"' + (l.status === 'contacted' ? ' selected' : '') + '>تم التواصل</option>' +
            '<option value="closed"' + (l.status === 'closed' ? ' selected' : '') + '>مغلق</option>' +
          '</select>' +
        '</td>' +
        '<td><div class="row-actions">' +
          '<button class="icon-btn" data-delete="' + l.id + '" aria-label="حذف">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>' +
          '</button>' +
        '</div></td>' +
        '</tr>';
    }).join('');
  }

  function load() {
    return AlefData.getLeads().then(function (data) {
      cache = data;
      renderRows();
    });
  }

  tbody.addEventListener('change', function (e) {
    var sel = e.target.closest('[data-status-for]');
    if (!sel) return;
    var id = sel.getAttribute('data-status-for');
    sel.disabled = true;
    AlefData.updateLeadStatus(id, sel.value).then(function () {
      return load();
    }).catch(function (err) {
      sel.disabled = false;
      window.alert(err.message || 'تعذر تحديث الحالة');
    });
  });

  tbody.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-delete]');
    if (!btn) return;
    if (!window.confirm('حذف هذا الطلب نهائيًا؟')) return;
    AlefData.deleteLead(btn.getAttribute('data-delete')).then(function () {
      return load();
    }).catch(function (err) {
      window.alert(err.message || 'تعذر حذف الطلب');
    });
  });

  searchInput.addEventListener('input', renderRows);
  filterSelect.addEventListener('change', renderRows);

  load().catch(function (err) {
    console.error(err);
    emptyState.textContent = 'تعذر تحميل البيانات';
    emptyState.style.display = 'block';
  });
});
