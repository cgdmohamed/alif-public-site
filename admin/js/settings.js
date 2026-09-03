document.addEventListener('alef-admin-ready', function () {
  var form = document.getElementById('settings-form');
  var saveMsg = document.getElementById('settings-save-msg');
  var fields = ['contactEmail', 'contactPhone', 'contactAddress'];

  AlefData.getContent().then(function (content) {
    fields.forEach(function (key) {
      var el = document.getElementById(key);
      if (el) el.value = content[key] || '';
    });
  }).catch(function (err) {
    window.alert(err.message || 'تعذر تحميل الإعدادات');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var partial = {};
    fields.forEach(function (key) {
      partial[key] = document.getElementById(key).value;
    });
    var submitBtn = form.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    AlefData.setContent(partial).then(function () {
      submitBtn.disabled = false;
      saveMsg.classList.add('show');
      setTimeout(function () { saveMsg.classList.remove('show'); }, 2500);
    }).catch(function (err) {
      submitBtn.disabled = false;
      window.alert(err.message || 'تعذر حفظ التغييرات');
    });
  });
});
