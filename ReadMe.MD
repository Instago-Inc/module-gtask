# module/gtask - V8 module

Keep Google Tasks in sync across your workflows with a small helper that focuses on everyday list and task operations. It is built to be predictable and low-ceremony, so flows can stay readable while still handling common task management needs.

Learn more about Instago at https://instago.ai.

## Technical reference

Exports:
- `configure(opts)`
- `listTasklists({ maxResults, pageToken, showHidden, debug })`
- `getTasklist({ tasklistId, debug })`
- `createTasklist({ title, debug })`
- `deleteTasklist({ tasklistId, debug })`
- `listTasks({ tasklistId, maxResults, pageToken, showCompleted, showDeleted, showHidden, dueMin, dueMax, completedMin, completedMax, updatedMin, debug })`
- `getTask({ tasklistId, taskId, debug })`
- `createTask({ tasklistId, task, title, notes, due, status, parent, position, debug })`
- `updateTask({ tasklistId, taskId, task, title, notes, due, status, parent, position, debug })`
- `patchTask({ tasklistId, taskId, task, title, notes, due, status, parent, position, debug })`
- `completeTask({ tasklistId, taskId, completed, debug })`
- `deleteTask({ tasklistId, taskId, debug })`
- `moveTask({ tasklistId, taskId, parent, previous, destination, debug })`
- `selfTest()`

Usage:
```js
const gtask = require('gtask@latest');
```

Configuration:
- `configure(opts)` forwards OAuth options to `gauth` and accepts `userId` (default `me`).
- `env.json` does not declare required or optional keys for this module.

Examples:

```js
const gtask = require('gtask@latest');

gtask.configure({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  refreshToken: env.GOOGLE_REFRESH_TOKEN
});

const listRes = await gtask.listTasklists({ maxResults: 5 });
if (!listRes.ok) {
  console.error('listTasklists failed:', listRes.error);
  return;
}

const tasklistId = listRes.data.items[0].id;
const taskRes = await gtask.createTask({
  tasklistId,
  title: 'Review project plan',
  notes: 'Check due dates and assignments'
});

console.log('task created:', taskRes.ok, taskRes.data && taskRes.data.id);
```

```js
const gtask = require('gtask@latest');

const res = await gtask.completeTask({
  tasklistId: 'TASKLIST_ID',
  taskId: 'TASK_ID',
  completed: new Date().toISOString()
});

console.log('completed:', res.ok);
```
