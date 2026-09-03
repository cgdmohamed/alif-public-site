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

  // Applies content (fetched from the server) to any element on the current
  // page carrying a matching [data-cms] key. Safe no-op if the fetch fails
  // (e.g. viewing the file directly without the server running) — the
  // hard-coded defaults already in the HTML just stay as-is.
  function applyContentOverrides() {
    return getContent().then(function (content) {
      document.querySelectorAll('[data-cms]').forEach(function (el) {
        var key = el.getAttribute('data-cms');
        if (Object.prototype.hasOwnProperty.call(content, key)) {
          el.textContent = content[key];
        }
      });
      return content;
    }).catch(function (err) {
      console.warn('[site-data] could not load site content:', err.message);
    });
  }

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
    login: login,
    logout: logout,
    currentSession: currentSession,
    requireAuth: requireAuth
  };
})(window);
