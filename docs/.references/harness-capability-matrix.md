# Harness Capability Matrix

## Purpose

Use this matrix to translate environment signals into safe defaults. The capability probe should help, but the current session still needs explicit confirmation before the skill assumes MCP access or agent-spawning support.

## Matrix

| Harness | Likely signals | Likely config paths | Delegation default | MCP note |
| --- | --- | --- | --- | --- |
| Codex | `CODEX_*` env vars, `CODEX_THREAD_ID`, `CODEX_HOME` | `~/.codex/config.toml`, `~/.codex/config.json` | Parallel agents first, then subagents, then single-agent fallback. Coordinator write scope `none` when delegation works. | Confirm live MCP access in-session even if config lists servers |
| Claude Code | `CLAUDE_CODE_*` env vars, Claude project metadata | `~/.claude/.claude.json` | Parallel agents first, then subagents, then single-agent fallback. Coordinator write scope `none` when delegation works. | Confirm live MCP access in-session and check project-level overrides |
| OpenCode | `OPENCODE_*` env vars, OpenCode config files if present | `~/.config/opencode/*`, `~/.opencode*`, repo-local OpenCode config | Subagents first if explicit agent tools exist, otherwise single-agent fallback. Coordinator write scope `none` when delegation works. | Confirm live MCP access in-session; config shapes may vary |
| Unknown | No clear harness markers | repo-local config only | Single-agent fallback only after delegation support cannot be confirmed | Treat MCP access as unknown until proven in-session |

## Detection Notes

- Environment variables are stronger evidence of the active harness than dormant config files.
- Config files show likely local setup, not guaranteed current-session capabilities.
- When Codex and Claude markers both appear, prefer the active-session evidence over passive config presence.

## Planning Default

Regardless of harness, default to planning mode first unless the user explicitly approves direct execution.

## Execution Default

When execution is approved, use this delegation ladder:

1. parallel agents
2. subagents
3. single-agent fallback

When execution is approved and the harness supports parallel agents:

- split work by subsystem or doc family
- keep scopes disjoint
- keep coordinator write scope at `none`
- require each agent to re-index in its own session if MCP tools are in use

When the harness supports only subagents:

- still delegate before broad single-agent execution
- keep the coordinator focused on workstream management, routing, and status reporting
- keep coordinator write scope at `none`
- require each delegated worker to confirm MCP access in its own session

When the harness does not clearly support delegated workers:

- execute sequentially
- keep the same output contract
- keep the same validation step
