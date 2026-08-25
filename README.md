# Aifred DSH Capability Bridge

Provider-neutral DSH tools for connecting an Agent to an Aifred/Fubo instance through its audited loopback bridge.

## What it provides

- `fubo_capability`: read-only access to allowlisted Aifred capabilities.
- `fubo_capability_resolve`: discover whether the selected Agent has a native capability implementation or whether Aifred's managed service is available.
- `fubo_action_prepare`: submits an action proposal for Aifred approval; it does not execute side effects.

The plugin never reads the Aifred database directly, never sends messages directly, and never bypasses approval or the unified Action Receipt flow. Aifred remains the source of truth for household data, task state, permissions, and channels.

## Install

```text
dsh plugin --profile headless add github:qiaoji1990-alt/aifred-dsh-fubo-bridge
```

## Configuration

Set these values in the DSH runtime environment:

```text
FUBO_DSH_BRIDGE_URL=http://127.0.0.1:3888
AIFRED_BRIDGE_TOKEN=<local bridge token>
```

The token is sent only to the configured local bridge as `X-Fubo-DSH-Token`. Do not commit it to a repository or put it in a public issue.

## Capability boundary

The bridge accepts only server-side allowlisted read tools and approval proposals. It does not provide direct database access, arbitrary HTTP forwarding, device control without Aifred authorization, or silent fallback to another Agent.

## Self-check

After installation, verify that the DSH profile loads the plugin and exposes:

```text
fubo_capability
fubo_action_prepare
```

Use `fubo_capability` only with the allowlisted tool names reported by the Aifred integration documentation. Use `fubo_action_prepare` for side-effecting requests and wait for Aifred's approval result.

For capability negotiation, call `fubo_capability_resolve` with `{ "agentId": "dsh", "capability": "browser" }`. Browser control is product-owned and always resolves to `mode: "aifred-managed-browser"`; DSH remains the selected brain while Aifred owns the session, credentials, cursor, risk policy and audit trail. Use `fubo_core_tool` with `browser_open`, `browser_snapshot`, `browser_action`, or `browser_close`.

The same read-only bridge exposes `fubo_camera_status`, `fubo_voice_status`, `fubo_commerce_status`, and `fubo_wechat_status`. These report product-owned capability state without returning cookies, tokens, passwords, or approval credentials. Device control, sending messages, login, ordering, and data writes remain Fubo approval/action-receipt operations.

## Aifred integration

This is the DSH-specific adapter. Aifred's provider-independent bridge contract remains open for other Agent adapters such as Hermes, Codex, and Claude Code.
