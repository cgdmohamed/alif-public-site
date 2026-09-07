// Alef Future — API client
// Talks to the Express backend in /server. Same origin, so no CORS setup
// needed as long as the site is served BY that server (see server/src/index.js)
// rather than opened as a bare static file.

(function (global) {
  'use strict';

  var API_BASE = '/api';

  function request(method, path, body) {
    var opts = {
      method: method,
      headers: {},
      credentials: 'same-origin'
    };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(API_BASE + path, opts).then(function (res) {
      if (res.status === 204) return null;
      return res.json().then(function (data) {
        if (!res.ok) {
          var err = new Error(data.error || 'حدث خطأ غير متوقع');
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  // ---------- Registrations ----------
  function getRegistrations() { return request('GET', '/registrations'); }
  function addRegistration(data) { return request('POST', '/registrations', data); }
  function updateRegistrationStatus(id, status) { return request('PATCH', '/registrations/' + id, { status: status }); }
  function deleteRegistration(id) { return request('DELETE', '/registrations/' + id); }

  // ---------- Leads ----------
  function getLeads() { return request('GET', '/leads'); }
  function addLead(data) { return request('POST', '/leads', data); }
  function updateLeadStatus(id, status) { return request('PATCH', '/leads/' + id, { status: status }); }
  function deleteLead(id) { return request('DELETE', '/leads/' + id); }

  // ---------- Content ----------
  function getContent() { return request('GET', '/content'); }
  function setContent(partial) { return request('PUT', '/content', partial); }

  // Applies content (fetched from the server) to elements carrying a
  // matching [data-cms] key (text), [data-cms-href] (link target), and
  // hides [data-cms-hide-empty] elements whose key has no value yet — so a
  // stat, link, or section with nothing entered in the CMS simply doesn't
  // render instead of showing placeholder/fake numbers. Safe no-op if the
  // fetch fails (e.g. viewing the file directly without the server running).
  function applyContentOverrides() {
    return getContent().then(function (content) {
      document.querySelectorAll('[data-cms]').forEach(function (el) {
        var key = el.getAttribute('data-cms');
        if (content[key]) el.textContent = content[key];
      });
      document.querySelectorAll('[data-cms-href]').forEach(function (el) {
        var key = el.getAttribute('data-cms-href');
        if (content[key]) el.setAttribute('href', content[key]);
      });
      document.querySelectorAll('[data-cms-hide-empty]').forEach(function (el) {
        var key = el.getAttribute('data-cms-hide-empty');
        if (!content[key]) el.style.display = 'none';
      });
      // A section is only worth showing if at least one of its
      // data-cms-hide-empty descendants ended up visible.
      document.querySelectorAll('[data-cms-autohide-section]').forEach(function (section) {
        var items = section.querySelectorAll('[data-cms-hide-empty]');
        var anyVisible = Array.prototype.some.call(items, function (el) { return el.style.display !== 'none'; });
        if (items.length && !anyVisible) section.style.display = 'none';
      });
      return content;
    }).catch(function (err) {
      console.warn('[site-data] could not load site content:', err.message);
    });
  }

  // ---------- Generic CMS collections (testimonials, team, events, gallery, clips) ----------
  function listCollection(name) { return request('GET', '/' + name); }
  function getCollectionItem(name, id) { return request('GET', '/' + name + '/' + id); }
  function createCollectionItem(name, data) { return request('POST', '/' + name, data); }
  function updateCollectionItem(name, id, data) { return request('PATCH', '/' + name + '/' + id, data); }
  function deleteCollectionItem(name, id) { return request('DELETE', '/' + name + '/' + id); }

  // ---------- Admin session ----------
  function login(email, password) {
    return request('POST', '/auth/login', { email: email, password: password });
  }
  function logout() {
    return request('POST', '/auth/logout');
  }
  function currentSession() {
    return request('GET', '/auth/me').catch(function () { return null; });
  }
  function requireAuth() {
    return currentSession().then(function (session) {
      if (!session) {
        window.location.href = 'login.html';
        return null;
      }
      return session;
    });
  }

  global.AlefData = {
    getRegistrations: getRegistrations,
    addRegistration: addRegistration,
    updateRegistrationStatus: updateRegistrationStatus,
    deleteRegistration: deleteRegistration,
    getLeads: getLeads,
    addLead: addLead,
    updateLeadStatus: updateLeadStatus,
    deleteLead: deleteLead,
    getContent: getContent,
    setContent: setContent,
    applyContentOverrides: applyContentOverrides,
    listCollection: listCollection,
    getCollectionItem: getCollectionItem,
    createCollectionItem: createCollectionItem,
    updateCollectionItem: updateCollectionItem,
    deleteCollectionItem: deleteCollectionItem,
    login: login,
    logout: logout,
    currentSession: currentSession,
    requireAuth: requireAuth
  };
})(window);
