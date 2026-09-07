document.addEventListener('alef-admin-ready', function () {
  var form = document.getElementById('content-form');
  var saveMsg = document.getElementById('content-save-msg');
  var fields = [
    'heroBadge', 'heroTitle', 'heroSubtitle',
    'stat1Num', 'stat1Label', 'stat2Num', 'stat2Label', 'stat3Num', 'stat3Label',
    'resultStat1Num', 'resultStat1Label', 'resultStat2Num', 'resultStat2Label',
    'resultStat3Num', 'resultStat3Label', 'resultStat4Num', 'resultStat4Label',
    'introVideoUrl', 'socialX', 'socialInstagram', 'socialYoutube'
  ];

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
});
