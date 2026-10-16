import type { AppConfig } from '../domain/settings'
import type { OutputMode } from '../types'
import { fallbackToolbarActions } from '../registries/action-registry'
import { replaceAppConfig } from './settings-service'

export const COPY_TOOLBAR_ITEM_ID = 'utility:copy'
const ACTION_PREFIX = 'action:'

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
      id: typeof COPY_TOOLBAR_ITEM_ID
      kind: 'copy'
      label: string
      primary: false
      visible: boolean
      available: true
    }

function actionToolbarItemId(actionId: string): string {
  return `${ACTION_PREFIX}${actionId}`
}

function actionIdFromToolbarItem(itemId: string): string | null {
  return itemId.startsWith(ACTION_PREFIX) ? itemId.slice(ACTION_PREFIX.length) : null
}

function defaultToolbarOrder(config: AppConfig): string[] {
  return [
    ...[...config.actions]
      .sort((left, right) => left.order - right.order)
      .map((action) => actionToolbarItemId(action.id)),
    COPY_TOOLBAR_ITEM_ID
  ]
}

export function resolvedToolbarOrder(config: AppConfig): string[] {
  const defaults = defaultToolbarOrder(config)
  const known = new Set(defaults)
  const resolved: string[] = []

  for (const itemId of config.ui.toolbarOrder || []) {
    if (known.has(itemId) && !resolved.includes(itemId)) resolved.push(itemId)
  }
  const missingActions = defaults.filter(
    (itemId) => itemId !== COPY_TOOLBAR_ITEM_ID && !resolved.includes(itemId)
  )
  const copyIndex = resolved.indexOf(COPY_TOOLBAR_ITEM_ID)
  if (copyIndex === resolved.length - 1 && copyIndex >= 0) {
    resolved.splice(copyIndex, 0, ...missingActions)
  } else {
    resolved.push(...missingActions)
  }
  if (!resolved.includes(COPY_TOOLBAR_ITEM_ID)) resolved.push(COPY_TOOLBAR_ITEM_ID)
  return resolved
}

export function toolbarMenuItems(config: AppConfig): ToolbarMenuItem[] {
  const actions = new Map(config.actions.map((action) => [action.id, action]))
  return resolvedToolbarOrder(config)
    .map((itemId): ToolbarMenuItem | null => {
      if (itemId === COPY_TOOLBAR_ITEM_ID) {
        return {
          id: COPY_TOOLBAR_ITEM_ID,
          kind: 'copy',
          label: '复制',
          primary: false,
          visible: config.ui.toolbarCopyEnabled !== false,
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

export function visibleToolbarItems(config: AppConfig): ToolbarMenuItem[] {
  return toolbarMenuItems(config).filter((item) => item.visible && item.available)
}

export function fallbackToolbarItems(): ToolbarMenuItem[] {
  return [
    ...fallbackToolbarActions().map((action): ToolbarMenuItem => ({
      id: actionToolbarItemId(action.id),
      kind: 'action',
      actionId: action.id,
      label: action.label,
      primary: action.primary,
      visible: true,
      available: true,
      outputMode: action.outputMode
    })),
    {
      id: COPY_TOOLBAR_ITEM_ID,
      kind: 'copy',
      label: '复制',
      primary: false,
      visible: true,
      available: true
    }
  ]
}

export async function setToolbarItemVisible(
  config: AppConfig,
  itemId: string,
  visible: boolean
): Promise<AppConfig> {
  if (itemId === COPY_TOOLBAR_ITEM_ID) {
    return replaceAppConfig({
      ...config,
      ui: { ...config.ui, toolbarCopyEnabled: visible }
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
  const order = [
    ...actions.map((action) => actionToolbarItemId(action.id)),
    COPY_TOOLBAR_ITEM_ID
  ]

  return replaceAppConfig({
    ...config,
    actions,
    ui: {
      ...config.ui,
      toolbarOrder: order,
      toolbarCopyEnabled: true
    }
  })
}
