import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  BrainCircuit,
  Copy,
  ExternalLink,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
  X
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AppConfig } from '../../domain/settings'
import {
  moveToolbarItem,
  resetToolbarMenu,
  setToolbarContextAware,
  setToolbarItemVisible,
  toolbarMenuItems,
  type ToolbarUtilityId
} from '../../services/toolbar-service'

interface MenuSettingsProps {
  config: AppConfig
  onConfigChange: (config: AppConfig) => void
}

const utilityIcons = {
  copy: Copy,
  search: Search,
  dictionary: BookOpen,
  speak: Volume2,
  'open-link': ExternalLink
} satisfies Record<ToolbarUtilityId, typeof Copy>

export function MenuSettings({ config, onConfigChange }: MenuSettingsProps) {
  const items = useMemo(() => toolbarMenuItems(config), [config])
  const visibleItems = items.filter((item) => item.visible && item.available)
  const [savingItem, setSavingItem] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const smartEnabled = config.ui.toolbarContextAware !== false

  const toggleSmart = async () => {
    setSavingItem('__smart__')
    setError(null)
    try {
      onConfigChange(await setToolbarContextAware(config, !smartEnabled))
    } catch (toggleError) {
      setError(String(toggleError))
    } finally {
      setSavingItem(null)
    }
  }

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
          <span>{smartEnabled ? '这里显示完整配置；实际菜单会按选中文本智能裁剪' : '当前按固定按钮配置显示'}</span>
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

      <button
        type="button"
        className="menu-smart-row"
        disabled={savingItem !== null || resetting}
        onClick={() => void toggleSmart()}>
        <span className="menu-item-icon"><BrainCircuit size={15} strokeWidth={1.8} /></span>
        <span className="menu-item-copy">
          <strong>上下文智能显示</strong>
          <small>链接、代码、单词、长文本和普通句子自动显示更合适的按钮</small>
        </span>
        <span className={`compact-switch${smartEnabled ? ' on' : ''}`} aria-hidden="true"><i /></span>
      </button>

      <div className="menu-settings-head">
        <div>
          <strong>按钮与顺序</strong>
          <span>关闭按钮固定保留；系统按钮不消耗 AI Token。</span>
        </div>
        <button type="button" disabled={resetting || savingItem !== null} onClick={() => void resetMenu()}>
          <RotateCcw size={13} strokeWidth={1.8} />
          <span>恢复默认</span>
        </button>
      </div>

      <div className="menu-item-list">
        {items.map((item, index) => {
          const busy = savingItem === item.id
          const ItemIcon = item.kind === 'utility' ? utilityIcons[item.utility] : Sparkles
          const secondary = item.kind === 'utility'
            ? `系统按钮 · ${item.contextHint}`
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
        URL 会出现“打开”；代码优先“解释代码”；单词/短语显示词典和朗读；长文本突出总结。要添加新的 AI 按钮，仍在“动作与路由”里新建自定义动作。
      </div>
      {error && <div className="settings-error">{error}</div>}
    </div>
  )
}
