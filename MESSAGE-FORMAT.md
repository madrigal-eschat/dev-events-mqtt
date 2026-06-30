# Message Format

All messages are JSON published over MQTT, conforming to the
[CloudEvents 1.0](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md) specification using
[Structured Content Mode](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/bindings/mqtt-protocol-binding.md#32-structured-content-mode)
from the MQTT Protocol Binding for CloudEvents Version 1.0.2.

## Topic Structure

No strict topic structure is placed on the messages: every producer and consumer
MUST support configuration of the topic to publish or subscribe to. Consumers
MUST support subscribing to a wildcard topic (ending in `/#`), and SHOULD
support subscribing to a list of topics, to allow the user to route messages as
they please.

## Envelope

```json
{
  "specversion": "1.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "devevents.file.saved",
  "source": "editor/jeff/jetbrains/intellij-idea",
  "sourcetype": "editor",
  "subject": "~/projects/my-project",
  "time": "2026-06-29T11:00:00.000Z",
  "data": {}
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `specversion` | string | yes | CloudEvents version. Always `"1.0"`. |
| `id` | string | yes | Unique event ID (e.g. UUID). MUST be unique per `source`. |
| `type` | string | yes | Event type. See [Events](#events). |
| `source` | string (URI) | yes | Origin of the event. See [Source](#source). |
| `sourcetype` | string | yes | Source category (no slashes). See [Source](#source). |
| `subject` | string | no | Context identifier within the source. See [Subject](#subject). |
| `time` | ISO 8601 string | yes | Publisher-side time the event fired. |
| `data` | object | yes | Event-specific payload. See [Events](#events). |

`sourcetype` is a CloudEvents extension attribute.

## Source

`sourcetype` is a string containing no slashes. It determines the format of `source`.

### `editor`

```
editor/{host}/{family}/{specific}
```

- `host` — first label of the machine hostname only (`jeff.local` → `jeff`). MUST be user-configurable to allow redaction.
- `family` — coarse IDE identifier (e.g. `jetbrains`, `vscode`, `visual-studio`). Optional; may be omitted along with `specific`.
- `specific` — fine-grained IDE identifier (e.g. `intellij-idea`, `pycharm`, `ruby-mine`, `visual-basic-6.0`). Optional; may be omitted.

Examples:

```
editor/jeff/jetbrains/ruby-mine
editor/jeff/vscode/vscode
editor/jeff/visual-studio/visual-basic-6.0
editor/jeff/jetbrains
editor/jeff
```

### `service`

```
service/{type}/{host}
```

- `type` — service identifier (e.g. `gitlab`, `github`, `codemagic`).
- `host` — hostname of the service instance. MUST be omitted when self-hosted CI infrastructure is entirely unavailable.

Examples:

```
service/gitlab/gitlab.com
service/gitlab/jeff.biz
service/codemagic
```

## Subject

Identifies the project or context within the source.

- For `sourcetype: "editor"`: path to the project root or current working directory. Expressed relative to the user's home directory (e.g. `~/projects/my-project`), or as an absolute path if outside the home directory. Alternatively, an origin URL (e.g. `https://gitlab.com/user/my-project`) MAY be used in place of the path.
- For `sourcetype: "service"`: full HTTP URL of the project within that system (e.g. `https://gitlab.com/user/my-project`).

`subject` SHOULD be user-configurable to allow redaction.

## Events

`type` values use reverse-DNS-style dot notation, prefixed with `devevents.`.

Producers and consumers alike are NOT OBLIGATED to implement all events.
Producers MAY produce ANY SUBSET of the events listed and consumers MAY consume
ANY SUBSET of the events listed below.

Many fields are optional, in which case the field MUST be OMITTED ENTIRELY. No
fields are nullable: the value is either provided as the type listed, or the
key is not sent at all.

The optional fields are for the preservation of a user's privacy, should they
wish it. Producers MUST offer the user a configuration option to avoid
publishing any of the optional fields.

Code quality assessments (inspections, linting, static analysis) can be expressed as task events, not a dedicated event type.

### `devevents.task.started`

| Field | Required |
|---|---|
| `name` | no |

```json
"data": { "name": "Build Project" }
```

### `devevents.task.succeeded`

| Field | Required |
|---|---|
| `duration_ms` | yes |
| `name` | no |

```json
"data": { "duration_ms": 1234, "name": "Build Project" }
```

### `devevents.task.failed`

| Field | Required |
|---|---|
| `duration_ms` | yes |
| `name` | no |
| `exit_code` | no |

```json
"data": { "duration_ms": 1234, "name": "Build Project", "exit_code": 1 }
```

### `devevents.test.started`

```json
"data": {}
```

### `devevents.test.succeeded` / `devevents.test.failed`

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

### `devevents.file.saved`

| Field | Required |
|---|---|
| `file_path` | no |

```json
"data": { "file_path": "src/main.kt" }
```

### `devevents.breakpoint.hit`

| Field | Required |
|---|---|
| `file_path` | no |
| `line` | no |

```json
"data": { "file_path": "src/main.kt", "line": 42 }
```

### `devevents.vcs.committed`

```json
"data": {}
```

### `devevents.vcs.pushed`

```json
"data": {}
```

### `devevents.vcs.branch.changed`

| Field | Required |
|---|---|
| `branch` | no |

```json
"data": { "branch": "main" }
```

### `devevents.file.opened`

| Field | Required |
|---|---|
| `file_path` | no |

```json
"data": { "file_path": "src/main.kt" }
```

### `devevents.file.closed`

| Field | Required |
|---|---|
| `file_path` | no |

```json
"data": { "file_path": "src/main.kt" }
```

### `devevents.editor.focus.gained`

```json
"data": {}
```

### `devevents.editor.focus.lost`

```json
"data": {}
```

### `devevents.keypresses`

Emitted once per second when keypress count is greater than zero, and once more when count transitions to zero.

```json
"data": { "count": 37 }
```
