import { invoke } from '@tauri-apps/api/core'
import { LogicalSize } from '@tauri-apps/api/dpi'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppConfig } from '../../domain/settings'
import {
  fallbackToolbarItems,
  visibleToolbarItems,
  type ToolbarMenuItem
} from '../../services/toolbar-service'
import { getAppConfig } from '../../services/settings-service'
import type { ActionRequest, SelectionPayload } from '../../types'

function toolbarWidth(items: ToolbarMenuItem[]): number {
  if (typeof document === 'undefined') return 350
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return 350
  context.font = '13px Inter, "Segoe UI", system-ui, sans-serif'
  const itemWidth = items.reduce((total, item) => {
    const labelWidth = Math.ceil(context.measureText(item.label).width)
    return total + Math.max(42, labelWidth + 20) + 2
  }, 0)
  const groupDivider = items.some((item, index) => index > 0 && items[index - 1]?.primary && !item.primary) ? 5 : 0
  const closeTail = 31 + (items.length > 0 ? 5 : 0)
  return Math.min(960, Math.max(43, 12 + itemWidth + groupDivider + closeTail))
}

export function Toolbar() {
  const [selection, setSelection] = useState<SelectionPayload | null>(null)
  const [items, setItems] = useState<ToolbarMenuItem[]>(() => fallbackToolbarItems())

  useEffect(() => {
    void getCurrentWindow().setSize(new LogicalSize(toolbarWidth(items), 43)).catch((error) => {
      console.error('Failed to resize toolbar', error)
    })
  }, [items])

  useEffect(() => {
    let disposed = false
    const cleanup: Array<() => void> = []

    void getAppConfig()
      .then((config) => {
        if (!disposed) setItems(visibleToolbarItems(config))
      })
      .catch(() => undefined)

    void Promise.all([
      listen<SelectionPayload>('selection://changed', (event) => {
        if (!disposed) setSelection(event.payload)
      }),
      listen<AppConfig>('settings://changed', (event) => {
        if (!disposed) setItems(visibleToolbarItems(event.payload))
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

  const runAction = async (item: Extract<ToolbarMenuItem, { kind: 'action' }>) => {
    if (!selection) return
    const request: ActionRequest = {
      action: item.actionId,
      actionName: item.label,
      outputMode: item.outputMode,
      selection
    }
    try {
      await invoke('open_action', { request })
      await getCurrentWindow().hide()
    } catch (error) {
      console.error('Failed to open selection action', error)
    }
  }

  const copySelection = async () => {
    if (!selection?.text) return
    try {
      await invoke('write_to_clipboard', { text: selection.text })
      await getCurrentWindow().hide()
    } catch (error) {
      console.error('Failed to copy selection', error)
    }
  }

  return (
    <div className="toolbar" onContextMenu={(event) => event.preventDefault()}>
      {items.map((item, index) => {
        const previous = index > 0 ? items[index - 1] : undefined
        const groupBreak = Boolean(previous?.primary && !item.primary)
        return (
          <span className="toolbar-action-wrap" key={item.id}>
            {groupBreak && <span className="divider" />}
            <button
              className={item.primary ? 'primary' : undefined}
              type="button"
              aria-label={item.label}
              title={item.kind === 'copy' ? '复制' : undefined}
              onClick={() => item.kind === 'copy' ? void copySelection() : void runAction(item)}>
              {item.label}
            </button>
          </span>
        )
      })}
      {items.length > 0 && <span className="divider" />}
      <button className="icon-button" type="button" aria-label="关闭" title="关闭" onClick={hide}>
        <X size={16} strokeWidth={1.8} />
      </button>
    </div>
  )
}
