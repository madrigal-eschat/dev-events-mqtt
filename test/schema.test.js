const test = require("node:test");
const assert = require("node:assert/strict");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const schema = require("../schemas/devevents.schema.json");

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const envelope = (type, data, extra = {}) => ({
  specversion: "1.0",
  id: "550e8400-e29b-41d4-a716-446655440000",
  type,
  source: "editor/jeff/jetbrains/intellij-idea",
  sourcetype: "editor",
  time: "2026-06-29T11:00:00.000Z",
  data,
  ...extra,
});

const agentAll = { agent: "copilot", session: "3f9c1e2a", worktree: "~/projects/my-project" };

const valid = {
  "task.started": ["devevents.task.started", { name: "Build Project" }],
  "task.started empty": ["devevents.task.started", {}],
  "task.succeeded": ["devevents.task.succeeded", { duration_ms: 1234, name: "Build Project" }],
  "task.failed": ["devevents.task.failed", { duration_ms: 1234, name: "Build Project", exit_code: 1 }],
  "test.started": ["devevents.test.started", {}],
  "test.succeeded": ["devevents.test.succeeded", { duration_ms: 1234, passed: 10, failed: 2, skipped: 1 }],
  "test.failed normalised": ["devevents.test.failed", { duration_ms: 1234, passed: 0, failed: 1, skipped: 0 }],
  "file.saved": ["devevents.file.saved", { file_path: "src/main.kt" }],
  "file.opened": ["devevents.file.opened", { file_path: "src/main.kt" }],
  "file.closed": ["devevents.file.closed", {}],
  "breakpoint.hit": ["devevents.breakpoint.hit", { file_path: "src/main.kt", line: 42 }],
  "vcs.committed": ["devevents.vcs.committed", {}],
  "vcs.pushed": ["devevents.vcs.pushed", {}],
  "vcs.branch.changed": ["devevents.vcs.branch.changed", { branch: "main" }],
  "editor.focus.gained": ["devevents.editor.focus.gained", {}],
  "editor.focus.lost": ["devevents.editor.focus.lost", {}],
  keypresses: ["devevents.keypresses", { count: 37 }],
  "agent.started minimal": ["devevents.agent.started", {}],
  "agent.started full": ["devevents.agent.started", agentAll],
  "agent.turn.started minimal": ["devevents.agent.turn.started", {}],
  "agent.turn.started full": ["devevents.agent.turn.started", agentAll],
  "agent.turn.ended minimal": ["devevents.agent.turn.ended", { reason: "finished" }],
  "agent.turn.ended full": ["devevents.agent.turn.ended", { ...agentAll, reason: "waiting" }],
  "agent.turn.ended interrupted": ["devevents.agent.turn.ended", { reason: "interrupted" }],
  "agent.turn.ended failed": ["devevents.agent.turn.ended", { reason: "failed" }],
  "agent.exited minimal": ["devevents.agent.exited", {}],
  "agent.exited full": ["devevents.agent.exited", agentAll],
};

for (const [name, [type, data]] of Object.entries(valid)) {
  test(`valid: ${name}`, () => {
    assert.ok(validate(envelope(type, data)), JSON.stringify(validate.errors));
  });
}

test("valid: optional subject, extension attributes, service source", () => {
  assert.ok(validate(envelope("devevents.keypresses", { count: 1 }, { subject: "~/p", traceid: "abc", retries: 2, flag: true })));
  assert.ok(validate(envelope("devevents.vcs.pushed", {}, { sourcetype: "service", source: "service/gitlab/gitlab.com", subject: "https://gitlab.com/u/p" })));
  assert.ok(validate(envelope("devevents.vcs.pushed", {}, { sourcetype: "service", source: "service/codemagic" })));
  assert.ok(validate(envelope("devevents.vcs.pushed", {}, { source: "editor/jeff" })));
});

const invalid = {
  "null optional agent field": envelope("devevents.agent.started", { agent: null }),
  "null optional session on turn.ended": envelope("devevents.agent.turn.ended", { reason: "finished", session: null }),
  "null optional task name": envelope("devevents.task.started", { name: null }),
  "null subject": envelope("devevents.keypresses", { count: 1 }, { subject: null }),
  "null extension attribute": envelope("devevents.keypresses", { count: 1 }, { traceid: null }),
  "bad reason": envelope("devevents.agent.turn.ended", { reason: "done" }),
  "turn.ended missing reason": envelope("devevents.agent.turn.ended", {}),
  "reason on agent.exited": envelope("devevents.agent.exited", { reason: "finished" }),
  "unknown data field": envelope("devevents.agent.started", { prompt: "hi" }),
  "task.succeeded missing duration_ms": envelope("devevents.task.succeeded", { name: "x" }),
  "keypresses missing count": envelope("devevents.keypresses", {}),
  "unknown type": envelope("devevents.nope", {}),
  "wrong specversion": envelope("devevents.vcs.pushed", {}, { specversion: "0.3" }),
  "missing id": (() => { const e = envelope("devevents.vcs.pushed", {}); delete e.id; return e; })(),
  "missing sourcetype": (() => { const e = envelope("devevents.vcs.pushed", {}); delete e.sourcetype; return e; })(),
  "sourcetype with slash": envelope("devevents.vcs.pushed", {}, { sourcetype: "a/b" }),
  "editor source with wrong prefix": envelope("devevents.vcs.pushed", {}, { source: "service/gitlab/gitlab.com" }),
  "bad time": envelope("devevents.vcs.pushed", {}, { time: "yesterday" }),
  "non-scalar extension attribute": envelope("devevents.vcs.pushed", {}, { traceid: { a: 1 } }),
  "bad extension attribute name": envelope("devevents.vcs.pushed", {}, { Trace_Id: "x" }),
};

for (const [name, doc] of Object.entries(invalid)) {
  test(`invalid: ${name}`, () => {
    assert.equal(validate(doc), false);
  });
}
