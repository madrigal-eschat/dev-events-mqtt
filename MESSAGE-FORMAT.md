# Message Format

All messages are JSON published over MQTT.

## Topic Structure

```
ide-events/{host}
```

If `host` is omitted from the envelope, publishers should use a static identifier or a placeholder.

## Envelope

```json
{
  "version": 1,
  "event": "task_success",
  "timestamp": "2026-06-29T11:00:00.000Z",
  "source": {
    "host": "my-machine",
    "project": "my-project",
    "ide_family": "jetbrains",
    "ide": "intellij-idea"
  },
  "data": {}
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `version` | integer | yes | Schema version. Currently `1`. |
| `event` | string | yes | Event name (snake_case). See [Events](#events). |
| `timestamp` | ISO 8601 string | yes | Publisher-side time the event fired. |
| `source.ide_family` | string | yes | Coarse IDE identifier (e.g. `jetbrains`, `vscode`). |
| `source.ide` | string | yes | Fine-grained IDE identifier (e.g. `intellij-idea`, `pycharm`). |
| `source.host` | string | no | Hostname of the machine running the IDE. |
| `source.project` | string | no | Project name open in the IDE. |
| `data` | object | yes | Event-specific payload. See [Events](#events). |

## Events

Publishers may implement any subset of these events. Consumers should handle missing event types gracefully.



### `task_start`

| Field | Required |
|---|---|
| `name` | no |

```json
"data": { "name": "Build Project" }
```

### `task_success`

| Field | Required |
|---|---|
| `duration_ms` | yes |
| `name` | no |

```json
"data": { "duration_ms": 1234, "name": "Build Project" }
```

### `task_fail`

| Field | Required |
|---|---|
| `duration_ms` | yes |
| `name` | no |
| `exit_code` | no |

```json
"data": { "duration_ms": 1234, "name": "Build Project", "exit_code": 1 }
```

### `test_start`

```json
"data": {}
```

### `test_success` / `test_fail`

| Field | Required | Description |
|---|---|---|
| `duration_ms` | yes | |
| `passed` | yes | Count of passed tests, or `1`/`0` in normalised mode. |
| `failed` | yes | Count of failed tests, or `0`/`1` in normalised mode. |
| `skipped` | yes | Count of skipped tests, or `0` in normalised mode. |

Publishers may emit normalised counts to hide real test numbers. In normalised mode: `passed` is `1` on success and `0` on fail; `failed` is `0` on success and `1` on fail; `skipped` is always `0`.

```json
// real counts
"data": { "duration_ms": 1234, "passed": 10, "failed": 2, "skipped": 1 }

// normalised
"data": { "duration_ms": 1234, "passed": 1, "failed": 0, "skipped": 0 }
```

### `file_save`

| Field | Required |
|---|---|
| `file_path` | no |

```json
"data": { "file_path": "src/main.kt" }
```

### `breakpoint_hit`

| Field | Required |
|---|---|
| `file_path` | no |
| `line` | no |

```json
"data": { "file_path": "src/main.kt", "line": 42 }
```

### `vcs_commit`

```json
"data": {}
```

### `vcs_push`

```json
"data": {}
```

### `vcs_branch_change`

| Field | Required |
|---|---|
| `branch` | no |

```json
"data": { "branch": "main" }
```

### `file_open`

| Field | Required |
|---|---|
| `file_path` | no |

```json
"data": { "file_path": "src/main.kt" }
```

### `file_close`

| Field | Required |
|---|---|
| `file_path` | no |

```json
"data": { "file_path": "src/main.kt" }
```

### `editor_focus_gained`

```json
"data": {}
```

### `editor_focus_lost`

```json
"data": {}
```

### `inspection_complete`

| Field | Required | Description |
|---|---|---|
| `error_count` | yes | Count of errors, or `1`/`0` in normalised mode. |
| `warning_count` | yes | Count of warnings, or `1`/`0` in normalised mode. |

Publishers may emit normalised counts. In normalised mode: `1` if any found at that level, `0` if none.

```json
// real counts
"data": { "error_count": 3, "warning_count": 14 }

// normalised
"data": { "error_count": 1, "warning_count": 1 }
```

### `key_presses`

Emitted once per second when keypress count is greater than zero, and once more when count transitions to zero.

```json
"data": { "count": 37 }
```
