document.addEventListener('alef-admin-ready', function () {
  Promise.all([AlefData.getRegistrations(), AlefData.getLeads()]).then(function (results) {
    var registrations = results[0];
    var leads = results[1];

    document.getElementById('stat-total-registrations').textContent = registrations.length;
    document.getElementById('stat-new-registrations').textContent =
      registrations.filter(function (r) { return r.status === 'new'; }).length;
    document.getElementById('stat-total-leads').textContent = leads.length;
    document.getElementById('stat-enrolled').textContent =
      registrations.filter(function (r) { return r.status === 'enrolled'; }).length;

    var statusLabels = { new: 'جديد', contacted: 'تم التواصل', enrolled: 'مقبول', closed: 'مغلق' };

    var regBody = document.getElementById('recent-registrations-body');
    var recentRegs = registrations.slice(0, 5);
    if (recentRegs.length === 0) {
      document.getElementById('recent-registrations-empty').style.display = 'block';
    } else {
      regBody.innerHTML = recentRegs.map(function (r) {
        return '<tr>' +
          '<td class="primary-cell">' + alefEscapeHTML(r.studentName) + '</td>' +
          '<td>' + alefEscapeHTML(r.parentName) + '</td>' +
          '<td class="muted-cell">' + alefFormatDate(r.createdAt) + '</td>' +
          '<td><span class="badge badge-' + r.status + '">' + statusLabels[r.status] + '</span></td>' +
          '</tr>';
      }).join('');
    }

    var leadsBody = document.getElementById('recent-leads-body');
    var recentLeads = leads.slice(0, 5);
    if (recentLeads.length === 0) {
      document.getElementById('recent-leads-empty').style.display = 'block';
    } else {
      leadsBody.innerHTML = recentLeads.map(function (l) {
        return '<tr>' +
          '<td class="primary-cell">' + alefEscapeHTML(l.schoolName) + '</td>' +
          '<td><span class="badge badge-' + l.status + '">' + statusLabels[l.status] + '</span></td>' +
          '</tr>';
      }).join('');
    }
  }).catch(function (err) {
    console.error(err);
  });
});
