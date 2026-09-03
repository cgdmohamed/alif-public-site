// Alef Future — shared site behavior

document.addEventListener('DOMContentLoaded', function () {

  // Apply any admin-edited content (hero text, stats, contact info) saved
  // via the admin panel's content editor.
  if (window.AlefData) {
    AlefData.applyContentOverrides();
  }

  // Mobile nav toggle
  var navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
      var expanded = document.body.classList.contains('nav-open');
      navToggle.setAttribute('aria-expanded', String(expanded));
    });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
      });
    });
  }

  // Mini contact form on home page — saved as a lead the admin panel can see
  var miniForm = document.querySelector('.mini-form-el');
  if (miniForm) {
    miniForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!window.AlefData) return;
      var btn = miniForm.querySelector('button');
      var original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'جارٍ الإرسال...';
      AlefData.addLead({
        schoolName: miniForm.schoolName.value.trim(),
        phone: miniForm.phone.value.trim()
      }).then(function () {
        btn.textContent = 'تم الإرسال، شكرًا لكم!';
        miniForm.reset();
        setTimeout(function () { btn.textContent = original; btn.disabled = false; }, 3000);
      }).catch(function (err) {
        btn.textContent = original;
        btn.disabled = false;
        window.alert(err.message || 'تعذر إرسال الطلب، حاول مرة أخرى');
      });
    });
  }

  // ---------- Registration multi-step form ----------
  var form = document.getElementById('register-form');
  if (form) {
    var steps = Array.from(form.querySelectorAll('.form-step'));
    var progressSteps = Array.from(document.querySelectorAll('.progress-step'));
    var progressLines = Array.from(document.querySelectorAll('.progress-line'));
    var current = 0;

    function renderProgress() {
      progressSteps.forEach(function (el, i) {
        el.classList.toggle('active', i === current);
        el.classList.toggle('done', i < current);
      });
      progressLines.forEach(function (el, i) {
        el.classList.toggle('done', i < current);
      });
    }

    function showStep(index) {
      steps.forEach(function (el, i) { el.classList.toggle('active', i === index); });
      current = index;
      renderProgress();
      // Fill review summary on the review step
      if (steps[index] && steps[index].dataset.step === 'review') {
        fillReview();
      }
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function fillReview() {
      var map = {
        'student_name': 'review-student-name',
        'student_stage': 'review-student-stage',
        'parent_name': 'review-parent-name',
        'parent_email': 'review-parent-email',
        'parent_phone': 'review-parent-phone',
        'school_name': 'review-school-name'
      };
      Object.keys(map).forEach(function (fieldName) {
        var input = form.querySelector('[name="' + fieldName + '"]');
        var target = document.getElementById(map[fieldName]);
        if (input && target) {
          var val = input.value.trim();
          if (input.tagName === 'SELECT' && input.selectedOptions.length) {
            val = input.selectedOptions[0].textContent.trim();
          }
          target.textContent = val || '—';
        }
      });
    }

    function validateStep(index) {
      var required = steps[index].querySelectorAll('[required]');
      for (var i = 0; i < required.length; i++) {
        if (!required[i].checkValidity()) {
          required[i].reportValidity();
          return false;
        }
      }
      return true;
    }

    form.querySelectorAll('[data-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!validateStep(current)) return;
        if (current < steps.length - 1) showStep(current + 1);
      });
    });
    form.querySelectorAll('[data-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (current > 0) showStep(current - 1);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateStep(current)) return;
      if (!window.AlefData) return;

      var submitBtn = form.querySelector('button[type=submit]');
      var originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'جارٍ الإرسال...';

      var fd = new FormData(form);
      AlefData.addRegistration({
        studentName: fd.get('student_name'),
        studentDob: fd.get('student_dob'),
        studentStage: fd.get('student_stage'),
        parentName: fd.get('parent_name'),
        parentEmail: fd.get('parent_email'),
        parentPhone: fd.get('parent_phone'),
        parentRelation: fd.get('parent_relation'),
        schoolName: fd.get('school_name'),
        priorAssessment: fd.get('prior_assessment')
      }).then(function () {
        document.getElementById('register-wizard').style.display = 'none';
        document.getElementById('register-success').style.display = 'block';
        document.getElementById('register-success').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }).catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        window.alert(err.message || 'تعذر إرسال الطلب، حاول مرة أخرى');
      });
    });

    showStep(0);
  }

  // ---------- Watch page share links ----------
  var shareX = document.querySelector('[data-share="x"]');
  var shareWhatsapp = document.querySelector('[data-share="whatsapp"]');
  var copyLinkBtn = document.querySelector('[data-share="copy"]');
  var pageUrl = window.location.href;
  var pageTitle = document.title;

  if (shareX) {
    shareX.addEventListener('click', function () {
      var url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(pageTitle) + '&url=' + encodeURIComponent(pageUrl);
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }
  if (shareWhatsapp) {
    shareWhatsapp.addEventListener('click', function () {
      var url = 'https://wa.me/?text=' + encodeURIComponent(pageTitle + ' ' + pageUrl);
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(pageUrl).then(function () {
        var original = copyLinkBtn.textContent;
        copyLinkBtn.textContent = 'تم نسخ الرابط!';
        setTimeout(function () { copyLinkBtn.textContent = original; }, 2000);
      });
    });
  }
});
