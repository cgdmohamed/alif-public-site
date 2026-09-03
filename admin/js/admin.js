// Alef Future — Admin panel shared shell behavior
// Include AFTER ../../js/site-data.js on every admin page except login.html

document.addEventListener('DOMContentLoaded', function () {
  AlefData.requireAuth().then(function (session) {
    if (!session) return; // requireAuth() is already redirecting to login.html

    document.querySelectorAll('[data-admin-email]').forEach(function (el) {
      el.textContent = session.email;
    });
    document.querySelectorAll('[data-admin-initial]').forEach(function (el) {
      el.textContent = session.email.charAt(0).toUpperCase();
    });

    document.dispatchEvent(new CustomEvent('alef-admin-ready', { detail: session }));
  });

  document.querySelectorAll('[data-logout]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      AlefData.logout().then(function () {
        window.location.href = 'login.html';
      });
    });
  });

  // Mobile sidebar toggle
  var menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      document.body.classList.toggle('admin-nav-open');
    });
  }
});

// Small format helpers shared by list pages
function alefFormatDate(iso) {
  try {
    var d = new Date(iso);
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return iso;
  }
}

function alefEscapeHTML(str) {
  var div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}
