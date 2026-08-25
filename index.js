import { defineTool } from '@deepseek-ai/dsh-tools'

const BASE = String(process.env.FUBO_DSH_BRIDGE_URL || 'http://127.0.0.1:3888').replace(/\/$/, '')
const TOKEN = String(process.env.AIFRED_BRIDGE_TOKEN || process.env.FUBO_DSH_BRIDGE_TOKEN || process.env.HERMES_WEBHOOK_SECRET || '').trim()

async function callFubo(path, body, signal) {
  const response = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Fubo-DSH-Token': TOKEN },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })
  const data = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
  if (!response.ok) throw new Error(data.error || `Fubo bridge HTTP ${response.status}`)
  return data.result ?? data
}

function jsonOutput(value) {
  return { schema: { type: 'object', additionalProperties: true }, render: (_args, result) => [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
}

export const name = 'fubo-dsh-bridge'
export const inject = ['tools']

export function apply(ctx) {
  // The generic bridge call is intentionally the only registration that can
  // carry arguments; its server-side allowlist remains authoritative.
  const disposers = [ctx.tools.register(defineTool({
    name: 'fubo_capability',
    description: 'Read a Fubo capability through the local audited bridge. Use only read operations.',
    parameters: {
      tool: { type: 'string', required: true, description: 'fubo_runtime_status|fubo_k2_status|fubo_tasks|fubo_intel_status|fubo_cdp_status|fubo_core_tool' },
      arguments: { type: 'object', additionalProperties: true, description: 'Tool-specific read-only arguments' },
    },
    output: jsonOutput(null),
    timeoutMs: 15000,
    async execute(args, exec) {
      return callFubo('/api/dsh-bridge/execute', { tool: args.tool, arguments: args.arguments || {} }, exec.signal)
    },
  })), ctx.tools.register(defineTool({
    name: 'fubo_action_prepare',
    description: '提出一个需要福伯审批的动作建议；此工具不会执行副作用。',
    parameters: {
      action: { type: 'string', required: true, description: '动作类型' },
      payload: { type: 'object', additionalProperties: true, description: '动作参数' },
    },
    output: jsonOutput(null),
    timeoutMs: 15000,
    async execute(args, exec) {
      return callFubo('/api/dsh-bridge/execute', {
        tool: 'fubo_action_prepare',
        arguments: { action: args.action, payload: args.payload || {} },
      }, exec.signal)
    },
  }))]
  return () => disposers.forEach((dispose) => dispose())
}
