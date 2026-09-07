// Alef Future — shared site behavior

function alefEscapeHTML(str) {
  var div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function alefFormatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return iso;
  }
}

// Renders a CMS collection into #<gridId>, or hides the section holding it
// (found via [data-cms-collection-section] or the nearest <section>) when
// there's nothing to show yet — never falls back to placeholder content.
function alefRenderCollection(gridId, items, renderItemHTML) {
  var grid = document.getElementById(gridId);
  if (!grid) return;
  var section = grid.closest('[data-cms-collection-section]') || grid.closest('section');
  if (!items || items.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }
  grid.innerHTML = items.map(renderItemHTML).join('');
}

document.addEventListener('DOMContentLoaded', function () {

  // Apply any admin-edited content (hero text, stats, contact info) saved
  // via the admin panel's content editor.
  if (window.AlefData) {
    AlefData.applyContentOverrides();

    if (document.getElementById('testimonials-grid')) {
      AlefData.listCollection('testimonials').then(function (items) {
        alefRenderCollection('testimonials-grid', items, function (t) {
          return '<figure class="testimonial"><q>' + alefEscapeHTML(t.quote) + '</q>' +
            '<figcaption class="person"><span class="avatar" style="background:#4338F2"></span>' +
            '<div><div class="name">' + alefEscapeHTML(t.authorName) + '</div><div class="role">' + alefEscapeHTML(t.authorRole || '') + '</div></div>' +
            '</figcaption></figure>';
        });
      }).catch(function () {});
    }

    if (document.getElementById('gallery-grid')) {
      AlefData.listCollection('gallery').then(function (items) {
        alefRenderCollection('gallery-grid', items, function (g) {
          var bg = g.imageUrl
            ? ' style="background-image:linear-gradient(0deg, rgba(5,4,94,0.6), rgba(5,4,94,0.05)), url(\'' + alefEscapeHTML(g.imageUrl) + '\');background-size:cover;background-position:center"'
            : '';
          return '<div class="gallery-item"' + bg + '>' + alefEscapeHTML(g.title) + '</div>';
        });
      }).catch(function () {});
    }

    if (document.getElementById('events-grid')) {
      AlefData.listCollection('events').then(function (items) {
        alefRenderCollection('events-grid', items, function (ev) {
          return '<div class="event-card">' +
            '<span class="date">' + alefEscapeHTML(alefFormatDate(ev.eventDate)) + '</span>' +
            '<span class="title">' + alefEscapeHTML(ev.title) + '</span>' +
            '<span class="desc">' + alefEscapeHTML(ev.description || '') + '</span>' +
            '</div>';
        });
      }).catch(function () {});
    }

    if (document.getElementById('clips-grid')) {
      AlefData.listCollection('clips').then(function (items) {
        alefRenderCollection('clips-grid', items, function (c) {
          return '<a class="clip-item" href="watch.html?id=' + encodeURIComponent(c.id) + '">' +
            '<span class="play-btn"><svg viewBox="0 0 24 24" fill="#4338F2"><path d="M8 5v14l11-7z"/></svg></span>' +
            '</a>';
        });
      }).catch(function () {});
    }

    if (document.getElementById('team-grid')) {
      AlefData.listCollection('team').then(function (items) {
        alefRenderCollection('team-grid', items, function (m) {
          var avatar = m.photoUrl
            ? '<span class="avatar-lg" style="background-image:url(\'' + alefEscapeHTML(m.photoUrl) + '\');background-size:cover;background-position:center"></span>'
            : '<span class="avatar-lg"></span>';
          return '<div class="specialist-card">' + avatar +
            '<span class="name">' + alefEscapeHTML(m.name) + '</span>' +
            '<span class="role">' + alefEscapeHTML(m.role || '') + '</span>' +
            '</div>';
        });
      }).catch(function () {});
    }
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
  // Title is read at click time (not cached here) because watch.html loads
  // its clip's real title asynchronously after DOMContentLoaded.
  var shareX = document.querySelector('[data-share="x"]');
  var shareWhatsapp = document.querySelector('[data-share="whatsapp"]');
  var copyLinkBtn = document.querySelector('[data-share="copy"]');

  if (shareX) {
    shareX.addEventListener('click', function () {
      var url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(document.title) + '&url=' + encodeURIComponent(window.location.href);
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }
  if (shareWhatsapp) {
    shareWhatsapp.addEventListener('click', function () {
      var url = 'https://wa.me/?text=' + encodeURIComponent(document.title + ' ' + window.location.href);
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(window.location.href).then(function () {
        var original = copyLinkBtn.textContent;
        copyLinkBtn.textContent = 'تم نسخ الرابط!';
        setTimeout(function () { copyLinkBtn.textContent = original; }, 2000);
      });
    });
  }
});
