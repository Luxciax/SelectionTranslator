import { ArrowDown, ArrowUp, Copy, RotateCcw, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AppConfig } from '../../domain/settings'
import {
  moveToolbarItem,
  resetToolbarMenu,
  setToolbarItemVisible,
  toolbarMenuItems
} from '../../services/toolbar-service'

interface MenuSettingsProps {
  config: AppConfig
  onConfigChange: (config: AppConfig) => void
}

export function MenuSettings({ config, onConfigChange }: MenuSettingsProps) {
  const items = useMemo(() => toolbarMenuItems(config), [config])
  const visibleItems = items.filter((item) => item.visible && item.available)
  const [savingItem, setSavingItem] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleItem = async (itemId: string, visible: boolean) => {
    setSavingItem(itemId)
    setError(null)
    try {
      onConfigChange(await setToolbarItemVisible(config, itemId, visible))
    } catch (toggleError) {
      setError(String(toggleError))
    } finally {
      setSavingItem(null)
    }
  }

  const moveItem = async (itemId: string, direction: -1 | 1) => {
    setSavingItem(itemId)
    setError(null)
    try {
      onConfigChange(await moveToolbarItem(config, itemId, direction))
    } catch (moveError) {
      setError(String(moveError))
    } finally {
      setSavingItem(null)
    }
  }

  const resetMenu = async () => {
    setResetting(true)
    setError(null)
    try {
      onConfigChange(await resetToolbarMenu(config))
    } catch (resetError) {
      setError(String(resetError))
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="menu-settings-editor">
      <section className="menu-preview-card">
        <div className="menu-preview-copy">
          <strong>菜单预览</strong>
          <span>显示、隐藏和排序会立即同步到划词工具条</span>
        </div>
        <div className="menu-preview-toolbar">
          {visibleItems.length > 0 ? (
            visibleItems.map((item) => (
              <span className={item.primary ? 'primary' : undefined} key={item.id}>{item.label}</span>
            ))
          ) : (
            <em>未启用按钮</em>
          )}
          <i aria-hidden="true" />
          <X size={14} strokeWidth={1.8} />
        </div>
      </section>

      <div className="menu-settings-head">
        <div>
          <strong>按钮与顺序</strong>
          <span>关闭按钮固定保留；停用的 AI 动作不会显示在实际菜单中。</span>
        </div>
        <button type="button" disabled={resetting || savingItem !== null} onClick={() => void resetMenu()}>
          <RotateCcw size={13} strokeWidth={1.8} />
          <span>恢复默认</span>
        </button>
      </div>

      <div className="menu-item-list">
        {items.map((item, index) => {
          const busy = savingItem === item.id
          const ItemIcon = item.kind === 'copy' ? Copy : Sparkles
          const secondary = item.kind === 'copy'
            ? '系统按钮'
            : item.available
              ? 'AI 动作'
              : 'AI 动作 · 已停用'

          return (
            <div className={`menu-item-row${item.available ? '' : ' unavailable'}`} key={item.id}>
              <span className="menu-item-icon"><ItemIcon size={15} strokeWidth={1.8} /></span>
              <span className="menu-item-copy">
                <strong>{item.label}</strong>
                <small>{secondary}</small>
              </span>

              <button
                type="button"
                className="menu-item-visibility"
                aria-label={item.visible ? `从菜单隐藏${item.label}` : `在菜单显示${item.label}`}
                title={item.available ? (item.visible ? '从菜单隐藏' : '在菜单显示') : '请先在“动作与路由”中启用该动作'}
                disabled={!item.available || busy || resetting}
                onClick={() => void toggleItem(item.id, !item.visible)}>
                <span className={`compact-switch${item.visible ? ' on' : ''}`} aria-hidden="true"><i /></span>
              </button>

              <div className="menu-item-order">
                <button
                  type="button"
                  aria-label={`上移${item.label}`}
                  title="上移"
                  disabled={index === 0 || busy || resetting}
                  onClick={() => void moveItem(item.id, -1)}>
                  <ArrowUp size={13} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  aria-label={`下移${item.label}`}
                  title="下移"
                  disabled={index === items.length - 1 || busy || resetting}
                  onClick={() => void moveItem(item.id, 1)}>
                  <ArrowDown size={13} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="menu-settings-note">
        要添加新的 AI 按钮，请在“动作与路由”里新建自定义动作；创建后会自动出现在这里，可再决定是否显示和放在什么位置。
      </div>
      {error && <div className="settings-error">{error}</div>}
    </div>
  )
}
