document.addEventListener('alef-admin-ready', function () {
  var statusLabels = { new: 'جديد', contacted: 'تم التواصل', enrolled: 'مقبول' };

  var searchInput = document.getElementById('reg-search');
  var filterSelect = document.getElementById('reg-filter');
  var tbody = document.getElementById('reg-table-body');
  var emptyState = document.getElementById('reg-empty');

  var modal = document.getElementById('reg-modal');
  var modalBody = document.getElementById('reg-modal-body');
  var deleteBtn = document.getElementById('reg-delete-btn');
  var activeId = null;
  var cache = [];

  function renderRows() {
    var query = searchInput.value.trim().toLowerCase();
    var statusFilter = filterSelect.value;

    var filtered = cache.filter(function (r) {
      var matchesQuery = !query ||
        (r.studentName || '').toLowerCase().indexOf(query) !== -1 ||
        (r.parentName || '').toLowerCase().indexOf(query) !== -1;
      var matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(function (r) {
      return '<tr>' +
        '<td class="primary-cell">' + alefEscapeHTML(r.studentName) + '</td>' +
        '<td>' + alefEscapeHTML(r.studentStage || '—') + '</td>' +
        '<td>' + alefEscapeHTML(r.parentName) + '</td>' +
        '<td>' + alefEscapeHTML(r.schoolName || '—') + '</td>' +
        '<td class="muted-cell">' + alefFormatDate(r.createdAt) + '</td>' +
        '<td><span class="badge badge-' + r.status + '">' + statusLabels[r.status] + '</span></td>' +
        '<td><div class="row-actions">' +
          '<button class="icon-btn" data-view="' + r.id + '" aria-label="عرض">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>' +
          '</button>' +
        '</div></td>' +
        '</tr>';
    }).join('');
  }

  function load() {
    return AlefData.getRegistrations().then(function (data) {
      cache = data;
      renderRows();
    });
  }

  function openModal(id) {
    var r = cache.find(function (x) { return String(x.id) === String(id); });
    if (!r) return;
    activeId = id;

    var priorLabel = r.priorAssessment === 'yes' ? 'نعم' : (r.priorAssessment === 'no' ? 'لا' : '—');

    modalBody.innerHTML =
      '<div class="detail-row"><span class="k">اسم الطالب</span><span class="v">' + alefEscapeHTML(r.studentName) + '</span></div>' +
      '<div class="detail-row"><span class="k">تاريخ الميلاد</span><span class="v">' + alefEscapeHTML(r.studentDob || '—') + '</span></div>' +
      '<div class="detail-row"><span class="k">المرحلة الدراسية</span><span class="v">' + alefEscapeHTML(r.studentStage || '—') + '</span></div>' +
      '<div class="detail-row"><span class="k">اسم ولي الأمر</span><span class="v">' + alefEscapeHTML(r.parentName) + '</span></div>' +
      '<div class="detail-row"><span class="k">البريد الإلكتروني</span><span class="v">' + alefEscapeHTML(r.parentEmail) + '</span></div>' +
      '<div class="detail-row"><span class="k">رقم الجوال</span><span class="v">' + alefEscapeHTML(r.parentPhone) + '</span></div>' +
      '<div class="detail-row"><span class="k">صلة القرابة</span><span class="v">' + alefEscapeHTML(r.parentRelation || '—') + '</span></div>' +
      '<div class="detail-row"><span class="k">المدرسة</span><span class="v">' + alefEscapeHTML(r.schoolName || '—') + '</span></div>' +
      '<div class="detail-row"><span class="k">سبق تسجيل مقياس موهبة</span><span class="v">' + priorLabel + '</span></div>' +
      '<div class="detail-row"><span class="k">تاريخ الإرسال</span><span class="v">' + alefFormatDate(r.createdAt) + '</span></div>' +
      '<div class="detail-row"><span class="k">الحالة</span><span class="v">' +
        '<select class="status-select" id="reg-status-select">' +
          '<option value="new"' + (r.status === 'new' ? ' selected' : '') + '>جديد</option>' +
          '<option value="contacted"' + (r.status === 'contacted' ? ' selected' : '') + '>تم التواصل</option>' +
          '<option value="enrolled"' + (r.status === 'enrolled' ? ' selected' : '') + '>مقبول</option>' +
        '</select>' +
      '</span></div>';

    document.getElementById('reg-status-select').addEventListener('change', function (e) {
      var select = e.target;
      var newStatus = select.value;
      select.disabled = true;
      AlefData.updateRegistrationStatus(activeId, newStatus).then(function () {
        select.disabled = false;
        return load();
      }).catch(function (err) {
        select.disabled = false;
        window.alert(err.message || 'تعذر تحديث الحالة');
      });
    });

    modal.classList.add('open');
  }

  function closeModal() {
    modal.classList.remove('open');
    activeId = null;
  }

  tbody.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-view]');
    if (btn) openModal(btn.getAttribute('data-view'));
  });

  document.getElementById('reg-modal-close').addEventListener('click', closeModal);
  document.getElementById('reg-modal-done').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  deleteBtn.addEventListener('click', function () {
    if (!activeId) return;
    if (!window.confirm('حذف هذا الطلب نهائيًا؟')) return;
    AlefData.deleteRegistration(activeId).then(function () {
      closeModal();
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
