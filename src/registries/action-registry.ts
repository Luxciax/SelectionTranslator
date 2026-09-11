import type { AppConfig } from '../domain/settings'
import type { OutputMode } from '../types'

export interface ToolbarAction {
  id: string
  label: string
  primary: boolean
  order: number
  outputMode: OutputMode
}

const FALLBACK_ACTIONS: ToolbarAction[] = [
  { id: 'translate', label: '翻译', primary: true, order: 0, outputMode: 'plain-text' },
  { id: 'explain', label: '解释', primary: false, order: 1, outputMode: 'markdown' },
  { id: 'summarize', label: '总结', primary: false, order: 2, outputMode: 'markdown' },
  { id: 'polish', label: '润色', primary: false, order: 3, outputMode: 'plain-text' }
]

export function toolbarActions(config: AppConfig | null): ToolbarAction[] {
  if (!config) return FALLBACK_ACTIONS

  return config.actions
    .filter((action) => action.enabled && action.showInToolbar)
    .sort((left, right) => left.order - right.order)
    .map((action) => ({
      id: action.id,
      label: action.name,
      primary: action.id === 'translate',
      order: action.order,
      outputMode: action.outputMode
    }))
}

export function fallbackToolbarActions(): ToolbarAction[] {
  return FALLBACK_ACTIONS.map((action) => ({ ...action }))
}
