document.addEventListener('alef-admin-ready', function () {
  var form = document.getElementById('content-form');
  var saveMsg = document.getElementById('content-save-msg');
  var fields = ['heroBadge', 'heroTitle', 'heroSubtitle', 'stat1Num', 'stat1Label', 'stat2Num', 'stat2Label', 'stat3Num', 'stat3Label'];

  // Mirrors server/src/seed.js DEFAULT_CONTENT — used only by the
  // "restore defaults" button, not as a fallback if the API call fails.
  var ORIGINAL_DEFAULTS = {
    heroBadge: 'شراكة معتمدة مع المدارس',
    heroTitle: 'شريك مدرستكم في اكتشاف ورعاية الطلبة الموهوبين',
    heroSubtitle: 'منصّة متكاملة تمكّن مدرستكم من تطبيق مقاييس الموهبة، وربط الطلبة بمدربين متخصصين ولقاءات مباشرة، مع تقارير أداء تصل لأولياء الأمور أولًا بأول.',
    stat1Num: '4,280+', stat1Label: 'طالب موهوب',
    stat2Num: '86', stat2Label: 'مدرسة شريكة',
    stat3Num: '312', stat3Label: 'مدرب متخصص'
  };

  function fillForm(content) {
    fields.forEach(function (key) {
      var el = document.getElementById(key);
      if (el) el.value = content[key] || '';
    });
  }

  AlefData.getContent().then(fillForm).catch(function (err) {
    window.alert(err.message || 'تعذر تحميل المحتوى');
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

  document.getElementById('content-reset').addEventListener('click', function () {
    if (!window.confirm('استعادة كل الحقول إلى القيم الافتراضية؟')) return;
    fillForm(ORIGINAL_DEFAULTS);
    AlefData.setContent(ORIGINAL_DEFAULTS).catch(function (err) {
      window.alert(err.message || 'تعذر حفظ التغييرات');
    });
  });
});
