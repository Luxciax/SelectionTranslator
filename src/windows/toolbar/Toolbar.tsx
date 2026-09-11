import { invoke } from '@tauri-apps/api/core'
import { LogicalSize } from '@tauri-apps/api/dpi'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppConfig } from '../../domain/settings'
import { fallbackToolbarActions, toolbarActions, type ToolbarAction } from '../../registries/action-registry'
import { getAppConfig } from '../../services/settings-service'
import type { ActionRequest, SelectionPayload } from '../../types'

function toolbarWidth(actions: ToolbarAction[]): number {
  if (typeof document === 'undefined') return 350
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return 350
  context.font = '13px Inter, "Segoe UI", system-ui, sans-serif'
  const actionWidth = actions.reduce((total, action) => {
    const labelWidth = Math.ceil(context.measureText(action.label).width)
    return total + Math.max(42, labelWidth + 20) + 2
  }, 0)
  const groupDivider = actions.some((action, index) => index > 0 && actions[index - 1]?.primary && !action.primary) ? 5 : 0
  const tail = actions.length > 0 ? 5 + 31 : 31
  return Math.min(960, Math.max(180, 12 + actionWidth + groupDivider + tail))
}

export function Toolbar() {
  const [selection, setSelection] = useState<SelectionPayload | null>(null)
  const [actions, setActions] = useState<ToolbarAction[]>(() => fallbackToolbarActions())

  useEffect(() => {
    void getCurrentWindow().setSize(new LogicalSize(toolbarWidth(actions), 43)).catch((error) => {
      console.error('Failed to resize toolbar', error)
    })
  }, [actions])

  useEffect(() => {
    let disposed = false
    const cleanup: Array<() => void> = []

    void getAppConfig()
      .then((config) => {
        if (!disposed) setActions(toolbarActions(config))
      })
      .catch(() => undefined)

    void Promise.all([
      listen<SelectionPayload>('selection://changed', (event) => {
        if (!disposed) setSelection(event.payload)
      }),
      listen<AppConfig>('settings://changed', (event) => {
        if (!disposed) setActions(toolbarActions(event.payload))
      })
    ]).then((unlisteners) => {
      if (disposed) unlisteners.forEach((unlisten) => unlisten())
      else cleanup.push(...unlisteners)
    })

    return () => {
      disposed = true
      cleanup.forEach((unlisten) => unlisten())
    }
  }, [])

  const hide = () => void getCurrentWindow().hide()

  const runAction = async (action: ToolbarAction) => {
    if (!selection) return
    const request: ActionRequest = {
      action: action.id,
      actionName: action.label,
      outputMode: action.outputMode,
      selection
    }
    try {
      await invoke('open_action', { request })
      await getCurrentWindow().hide()
    } catch (error) {
      console.error('Failed to open selection action', error)
    }
  }

  return (
    <div className="toolbar" onContextMenu={(event) => event.preventDefault()}>
      {actions.map((action, index) => {
        const previous = index > 0 ? actions[index - 1] : undefined
        const groupBreak = Boolean(previous?.primary && !action.primary)
        return (
          <span className="toolbar-action-wrap" key={action.id}>
            {groupBreak && <span className="divider" />}
            <button
              className={action.primary ? 'primary' : undefined}
              type="button"
              aria-label={action.label}
              onClick={() => void runAction(action)}>
              {action.label}
            </button>
          </span>
        )
      })}
      {actions.length > 0 && <span className="divider" />}
      <button className="icon-button" type="button" aria-label="关闭" title="关闭" onClick={hide}>
        <X size={16} strokeWidth={1.8} />
      </button>
    </div>
  )
}
