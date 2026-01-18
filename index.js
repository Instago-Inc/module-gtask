// Google Tasks helper using OAuth2 refresh token via gauth@latest.
// API returns { ok, data, error } and avoids throwing for runtime resilience.

(function () {
  const httpx = require('http@latest');
  const gauth = require('gauth@latest');
  const auth = require('auth@latest');
  const qs = require('qs@latest');
  const TASKS_BASE = 'https://tasks.googleapis.com/tasks/v1';
  const state = { userId: 'me' };

  function configure(opts) {
    if (!opts || typeof opts !== 'object') return;
    if (opts.userId) state.userId = String(opts.userId);
    gauth.configure(opts);
  }

  async function getToken() {
    const status = gauth.toJSON();
    if (!status || !status.configured) return null;
    return gauth.getAccessToken();
  }

  function apiError(data, status) {
    const err = data && (data.error || data.error_description);
    const msg = (err && (err.message || err)) || (status ? ('HTTP ' + status) : 'request failed');
    return { ok: false, error: msg, status, body: data || null };
  }

  function cleanQuery(query) {
    if (!query || typeof query !== 'object') return null;
    const out = {};
    for (const k in query) {
      if (!Object.prototype.hasOwnProperty.call(query, k)) continue;
      const v = query[k];
      if (v === undefined || v === null || v === '') continue;
      out[k] = v;
    }
    return Object.keys(out).length ? out : null;
  }

  async function apiRequest({ path, method = 'GET', bodyObj, query, debug }) {
    const token = await getToken();
    if (!token) return { ok: false, error: 'no access token (configure gauth)' };
    const qobj = cleanQuery(query);
    const q = qobj ? ('?' + qs.encode(qobj)) : '';
    const url = TASKS_BASE + path + q;
    const headers = Object.assign({ 'Content-Type': 'application/json' }, auth.bearer(token));
    const r = await httpx.json({ url, method, headers, bodyObj, debug: !!debug });
    const data = (r && (r.json || r.raw)) || null;
    const status = r && r.status;
    if (status && status >= 400) return apiError(data, status);
    return { ok: true, data, status };
  }

  function requireTasklistId(tasklistId) {
    if (!tasklistId || typeof tasklistId !== 'string') return { ok: false, error: 'missing tasklistId' };
    return null;
  }

  function requireTaskId(taskId) {
    if (!taskId || typeof taskId !== 'string') return { ok: false, error: 'missing taskId' };
    return null;
  }

  async function listTasklists({ maxResults, pageToken, showHidden, debug } = {}) {
    return apiRequest({
      path: '/users/' + encodeURIComponent(state.userId) + '/lists',
      query: { maxResults, pageToken, showHidden },
      debug
    });
  }

  async function getTasklist({ tasklistId, debug } = {}) {
    const err = requireTasklistId(tasklistId);
    if (err) return err;
    return apiRequest({
      path: '/users/' + encodeURIComponent(state.userId) + '/lists/' + encodeURIComponent(tasklistId),
      debug
    });
  }

  async function createTasklist({ title, debug } = {}) {
    if (!title) return { ok: false, error: 'missing title' };
    return apiRequest({
      path: '/users/' + encodeURIComponent(state.userId) + '/lists',
      method: 'POST',
      bodyObj: { title: String(title) },
      debug
    });
  }

  async function deleteTasklist({ tasklistId, debug } = {}) {
    const err = requireTasklistId(tasklistId);
    if (err) return err;
    return apiRequest({
      path: '/users/' + encodeURIComponent(state.userId) + '/lists/' + encodeURIComponent(tasklistId),
      method: 'DELETE',
      debug
    });
  }

  async function listTasks({ tasklistId, maxResults, pageToken, showCompleted, showDeleted, showHidden, dueMin, dueMax, completedMin, completedMax, updatedMin, debug } = {}) {
    const err = requireTasklistId(tasklistId);
    if (err) return err;
    return apiRequest({
      path: '/lists/' + encodeURIComponent(tasklistId) + '/tasks',
      query: { maxResults, pageToken, showCompleted, showDeleted, showHidden, dueMin, dueMax, completedMin, completedMax, updatedMin },
      debug
    });
  }

  async function getTask({ tasklistId, taskId, debug } = {}) {
    const err = requireTasklistId(tasklistId) || requireTaskId(taskId);
    if (err) return err;
    return apiRequest({
      path: '/lists/' + encodeURIComponent(tasklistId) + '/tasks/' + encodeURIComponent(taskId),
      debug
    });
  }

  function buildTaskBody({ task, title, notes, due, status, parent, position }) {
    if (task && typeof task === 'object') return task;
    const body = {};
    if (title) body.title = String(title);
    if (notes) body.notes = String(notes);
    if (due) body.due = String(due);
    if (status) body.status = String(status);
    if (parent) body.parent = String(parent);
    if (position) body.position = String(position);
    return body;
  }

  async function createTask({ tasklistId, task, title, notes, due, status, parent, position, debug } = {}) {
    const err = requireTasklistId(tasklistId);
    if (err) return err;
    const bodyObj = buildTaskBody({ task, title, notes, due, status, parent, position });
    if (!bodyObj.title) return { ok: false, error: 'missing task title' };
    return apiRequest({
      path: '/lists/' + encodeURIComponent(tasklistId) + '/tasks',
      method: 'POST',
      bodyObj,
      debug
    });
  }

  async function updateTask({ tasklistId, taskId, task, title, notes, due, status, parent, position, debug } = {}) {
    const err = requireTasklistId(tasklistId) || requireTaskId(taskId);
    if (err) return err;
    const bodyObj = buildTaskBody({ task, title, notes, due, status, parent, position });
    return apiRequest({
      path: '/lists/' + encodeURIComponent(tasklistId) + '/tasks/' + encodeURIComponent(taskId),
      method: 'PUT',
      bodyObj,
      debug
    });
  }

  async function patchTask({ tasklistId, taskId, task, title, notes, due, status, parent, position, debug } = {}) {
    const err = requireTasklistId(tasklistId) || requireTaskId(taskId);
    if (err) return err;
    const bodyObj = buildTaskBody({ task, title, notes, due, status, parent, position });
    return apiRequest({
      path: '/lists/' + encodeURIComponent(tasklistId) + '/tasks/' + encodeURIComponent(taskId),
      method: 'PATCH',
      bodyObj,
      debug
    });
  }

  async function completeTask({ tasklistId, taskId, completed, debug } = {}) {
    const err = requireTasklistId(tasklistId) || requireTaskId(taskId);
    if (err) return err;
    const bodyObj = { status: 'completed' };
    if (completed) bodyObj.completed = String(completed);
    return apiRequest({
      path: '/lists/' + encodeURIComponent(tasklistId) + '/tasks/' + encodeURIComponent(taskId),
      method: 'PATCH',
      bodyObj,
      debug
    });
  }

  async function deleteTask({ tasklistId, taskId, debug } = {}) {
    const err = requireTasklistId(tasklistId) || requireTaskId(taskId);
    if (err) return err;
    return apiRequest({
      path: '/lists/' + encodeURIComponent(tasklistId) + '/tasks/' + encodeURIComponent(taskId),
      method: 'DELETE',
      debug
    });
  }

  async function moveTask({ tasklistId, taskId, parent, previous, destination, debug } = {}) {
    const err = requireTasklistId(tasklistId) || requireTaskId(taskId);
    if (err) return err;
    return apiRequest({
      path: '/lists/' + encodeURIComponent(tasklistId) + '/tasks/' + encodeURIComponent(taskId) + '/move',
      method: 'POST',
      query: { parent, previous, destination },
      debug
    });
  }

  async function selfTest() {
    const status = gauth.toJSON();
    if (!status || !status.configured) return 'skipped: missing gauth config';
    const res = await listTasklists({ maxResults: 1 });
    if (!res || res.ok !== true) throw new Error('selfTest failed');
    return 'ok';
  }

  module.exports = {
    configure,
    listTasklists,
    getTasklist,
    createTasklist,
    deleteTasklist,
    listTasks,
    getTask,
    createTask,
    updateTask,
    patchTask,
    completeTask,
    deleteTask,
    moveTask,
    selfTest
  };
})();
