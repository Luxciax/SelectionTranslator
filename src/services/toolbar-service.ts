import type { AppConfig } from '../domain/settings'
import type { OutputMode } from '../types'
import { fallbackToolbarActions } from '../registries/action-registry'
import { replaceAppConfig } from './settings-service'

export type ToolbarUtilityId = 'copy' | 'search' | 'dictionary' | 'speak' | 'open-link'
export type SelectionContextKind = 'url' | 'code' | 'term' | 'long-text' | 'text'

const ACTION_PREFIX = 'action:'
const UTILITY_PREFIX = 'utility:'

const UTILITY_DEFINITIONS: Array<{
  utility: ToolbarUtilityId
  label: string
  contextHint: string
}> = [
  { utility: 'copy', label: '复制', contextHint: '始终可用' },
  { utility: 'search', label: '搜索', contextHint: '词语、句子和代码' },
  { utility: 'dictionary', label: '词典', contextHint: '单词与短语' },
  { utility: 'speak', label: '朗读', contextHint: '词语与普通文本' },
  { utility: 'open-link', label: '打开', contextHint: '仅链接' }
]

export type ToolbarMenuItem =
  | {
      id: string
      kind: 'action'
      actionId: string
      label: string
      primary: boolean
      visible: boolean
      available: boolean
      outputMode: OutputMode
    }
  | {
      id: string
      kind: 'utility'
      utility: ToolbarUtilityId
      label: string
      contextHint: string
      primary: false
      visible: boolean
      available: true
    }

function actionToolbarItemId(actionId: string): string {
  return `${ACTION_PREFIX}${actionId}`
}

function utilityToolbarItemId(utility: ToolbarUtilityId): string {
  return `${UTILITY_PREFIX}${utility}`
}

function actionIdFromToolbarItem(itemId: string): string | null {
  return itemId.startsWith(ACTION_PREFIX) ? itemId.slice(ACTION_PREFIX.length) : null
}

function utilityIdFromToolbarItem(itemId: string): ToolbarUtilityId | null {
  if (!itemId.startsWith(UTILITY_PREFIX)) return null
  const utility = itemId.slice(UTILITY_PREFIX.length)
  return UTILITY_DEFINITIONS.some((item) => item.utility === utility)
    ? utility as ToolbarUtilityId
    : null
}

function defaultToolbarOrder(config: AppConfig): string[] {
  return [
    ...[...config.actions]
      .sort((left, right) => left.order - right.order)
      .map((action) => actionToolbarItemId(action.id)),
    ...UTILITY_DEFINITIONS.map((item) => utilityToolbarItemId(item.utility))
  ]
}

export function resolvedToolbarOrder(config: AppConfig): string[] {
  const defaults = defaultToolbarOrder(config)
  const known = new Set(defaults)
  const resolved: string[] = []

  for (const itemId of config.ui.toolbarOrder || []) {
    if (known.has(itemId) && !resolved.includes(itemId)) resolved.push(itemId)
  }

  const missing = defaults.filter((itemId) => !resolved.includes(itemId))
  const copyId = utilityToolbarItemId('copy')
  const copyIndex = resolved.indexOf(copyId)
  if (copyIndex === resolved.length - 1 && copyIndex >= 0) {
    resolved.splice(copyIndex, 0, ...missing.filter((itemId) => itemId !== copyId))
  } else {
    resolved.push(...missing)
  }
  if (!resolved.includes(copyId)) resolved.push(copyId)
  return resolved
}

function utilityVisible(config: AppConfig, utility: ToolbarUtilityId): boolean {
  if (utility === 'copy' && config.ui.toolbarCopyEnabled === false) return false
  return !(config.ui.toolbarHiddenUtilities || []).includes(utility)
}

export function toolbarMenuItems(config: AppConfig): ToolbarMenuItem[] {
  const actions = new Map(config.actions.map((action) => [action.id, action]))
  const utilities = new Map(UTILITY_DEFINITIONS.map((item) => [item.utility, item]))

  return resolvedToolbarOrder(config)
    .map((itemId): ToolbarMenuItem | null => {
      const utility = utilityIdFromToolbarItem(itemId)
      if (utility) {
        const definition = utilities.get(utility)
        if (!definition) return null
        return {
          id: itemId,
          kind: 'utility',
          utility,
          label: definition.label,
          contextHint: definition.contextHint,
          primary: false,
          visible: utilityVisible(config, utility),
          available: true
        }
      }

      const actionId = actionIdFromToolbarItem(itemId)
      const action = actionId ? actions.get(actionId) : undefined
      if (!action) return null
      return {
        id: itemId,
        kind: 'action',
        actionId: action.id,
        label: action.name,
        primary: action.id === 'translate',
        visible: action.showInToolbar,
        available: action.enabled,
        outputMode: action.outputMode
      }
    })
    .filter((item): item is ToolbarMenuItem => item !== null)
}

export function selectionUrl(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed || /\s/.test(trimmed)) return null

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : /^www\./i.test(trimmed) || /^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(trimmed)
      ? `https://${trimmed}`
      : ''

  if (!candidate) return null
  try {
    const url = new URL(candidate)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

export function selectionContext(text: string): SelectionContextKind {
  const trimmed = text.trim()
  if (selectionUrl(trimmed)) return 'url'

  const codeSignals = [
    /(?:^|\s)(?:const|let|var|function|class|interface|import|export|return|def|public|private|SELECT|INSERT|UPDATE|DELETE)\b/m,
    /=>|::|<\/?[A-Za-z][^>]*>/,
    /[{};][\s\S]*[{};]/
  ].filter((pattern) => pattern.test(trimmed)).length
  const inlineCodePunctuation = /[=;{}]|=>|<\/?[A-Za-z][^>]*>/.test(trimmed)
  if (
    codeSignals >= 2
    || (codeSignals >= 1 && (/[\r\n]/.test(trimmed) || inlineCodePunctuation))
  ) return 'code'

  if (trimmed.length >= 240 || trimmed.split(/\r?\n/).length >= 5) return 'long-text'

  const compact = trimmed.replace(/\s+/g, ' ')
  const tokens = compact ? compact.split(' ').length : 0
  const hasCjk = /[\u3400-\u9fff]/.test(compact)
  const hasSentencePunctuation = /[。！？.!?；;]/.test(compact)
  const maxTermLength = hasCjk ? 12 : 80
  if (
    compact.length > 0
    && compact.length <= maxTermLength
    && tokens <= 6
    && !hasSentencePunctuation
  ) {
    return 'term'
  }

  return 'text'
}

function smartAllows(item: ToolbarMenuItem, context: SelectionContextKind): boolean {
  if (item.kind === 'utility') {
    switch (item.utility) {
      case 'copy': return true
      case 'open-link': return context === 'url'
      case 'dictionary': return context === 'term'
      case 'speak': return context === 'term' || context === 'text'
      case 'search': return context === 'term' || context === 'text' || context === 'code'
    }
  }

  switch (item.actionId) {
    case 'translate': return context === 'term' || context === 'text' || context === 'long-text'
    case 'explain': return context === 'term' || context === 'text' || context === 'code'
    case 'summarize': return context === 'long-text'
    case 'polish': return context === 'text' || context === 'long-text'
    default: return context !== 'url'
  }
}

function contextualize(item: ToolbarMenuItem, context: SelectionContextKind): ToolbarMenuItem {
  if (item.kind === 'action' && item.actionId === 'explain' && context === 'code') {
    return { ...item, label: '解释代码' }
  }
  return item
}

export function visibleToolbarItems(config: AppConfig, selectionText: string): ToolbarMenuItem[] {
  const context = selectionContext(selectionText)
  const smart = config.ui.toolbarContextAware !== false

  return toolbarMenuItems(config)
    .filter((item) => item.visible && item.available)
    .filter((item) => {
      if (item.kind === 'utility' && item.utility === 'open-link') return context === 'url'
      return !smart || smartAllows(item, context)
    })
    .map((item) => contextualize(item, context))
}

export function fallbackToolbarItems(selectionText = ''): ToolbarMenuItem[] {
  const context = selectionContext(selectionText)
  const actions: ToolbarMenuItem[] = fallbackToolbarActions().map((action) => ({
    id: actionToolbarItemId(action.id),
    kind: 'action',
    actionId: action.id,
    label: action.label,
    primary: action.primary,
    visible: true,
    available: true,
    outputMode: action.outputMode
  }))
  const utilities: ToolbarMenuItem[] = UTILITY_DEFINITIONS.map((item) => ({
    id: utilityToolbarItemId(item.utility),
    kind: 'utility',
    utility: item.utility,
    label: item.label,
    contextHint: item.contextHint,
    primary: false,
    visible: true,
    available: true
  }))

  return [...actions, ...utilities]
    .filter((item) => smartAllows(item, context))
    .map((item) => contextualize(item, context))
}

export async function setToolbarItemVisible(
  config: AppConfig,
  itemId: string,
  visible: boolean
): Promise<AppConfig> {
  const utility = utilityIdFromToolbarItem(itemId)
  if (utility) {
    const hidden = new Set(config.ui.toolbarHiddenUtilities || [])
    if (visible) hidden.delete(utility)
    else hidden.add(utility)

    return replaceAppConfig({
      ...config,
      ui: {
        ...config.ui,
        toolbarCopyEnabled: utility === 'copy' ? visible : config.ui.toolbarCopyEnabled,
        toolbarHiddenUtilities: [...hidden]
      }
    })
  }

  const actionId = actionIdFromToolbarItem(itemId)
  if (!actionId) throw new Error(`Unknown toolbar item: ${itemId}`)
  if (!config.actions.some((action) => action.id === actionId)) {
    throw new Error(`Unknown action: ${actionId}`)
  }

  return replaceAppConfig({
    ...config,
    actions: config.actions.map((action) =>
      action.id === actionId ? { ...action, showInToolbar: visible } : action
    )
  })
}

export async function setToolbarContextAware(
  config: AppConfig,
  enabled: boolean
): Promise<AppConfig> {
  return replaceAppConfig({
    ...config,
    ui: { ...config.ui, toolbarContextAware: enabled }
  })
}

export async function moveToolbarItem(
  config: AppConfig,
  itemId: string,
  direction: -1 | 1
): Promise<AppConfig> {
  const order = resolvedToolbarOrder(config)
  const index = order.indexOf(itemId)
  if (index < 0) throw new Error(`Unknown toolbar item: ${itemId}`)
  const target = index + direction
  if (target < 0 || target >= order.length) return config

  const nextOrder = [...order]
  ;[nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]]

  const actionOrder = new Map(
    nextOrder
      .map(actionIdFromToolbarItem)
      .filter((actionId): actionId is string => Boolean(actionId))
      .map((actionId, orderIndex) => [actionId, orderIndex])
  )

  return replaceAppConfig({
    ...config,
    actions: config.actions.map((action) => ({
      ...action,
      order: actionOrder.get(action.id) ?? action.order
    })),
    ui: { ...config.ui, toolbarOrder: nextOrder }
  })
}

export async function resetToolbarMenu(config: AppConfig): Promise<AppConfig> {
  const actions = [...config.actions]
    .sort((left, right) => left.order - right.order)
    .map((action, order) => ({ ...action, order, showInToolbar: true }))

  return replaceAppConfig({
    ...config,
    actions,
    ui: {
      ...config.ui,
      toolbarOrder: [
        ...actions.map((action) => actionToolbarItemId(action.id)),
        ...UTILITY_DEFINITIONS.map((item) => utilityToolbarItemId(item.utility))
      ],
      toolbarCopyEnabled: true,
      toolbarHiddenUtilities: [],
      toolbarContextAware: true
    }
  })
}
