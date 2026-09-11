import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AppWindow, MousePointer2, Route, ServerCog, Settings2 } from 'lucide-react'
import type { AppConfig } from '../domain/settings'
import type { AiSettings } from '../types'
import { ActionRoutesSettings } from '../windows/result/ActionRoutesSettings'
import { AppRulesSettings } from '../windows/result/AppRulesSettings'
import { GeneralSettings } from '../windows/result/GeneralSettings'
import { ProviderProfilesSettings } from '../windows/result/ProviderProfilesSettings'
import { TriggerSettings } from '../windows/result/TriggerSettings'

export interface SettingsPageProps {
  config: AppConfig
  value: AiSettings
  onConfigChange: (config: AppConfig) => void
  onApply: (settings: AiSettings) => Promise<void>
}

export interface SettingsPageDefinition {
  id: string
  title: string
  description: string
  icon: LucideIcon
  order: number
  component: ComponentType<SettingsPageProps>
}

class SettingsPageRegistry {
  private readonly pages = new Map<string, SettingsPageDefinition>()

  register(definition: SettingsPageDefinition) {
    if (this.pages.has(definition.id)) {
      throw new Error(`Duplicate settings page: ${definition.id}`)
    }
    this.pages.set(definition.id, definition)
  }

  get(id: string): SettingsPageDefinition | undefined {
    return this.pages.get(id)
  }

  list(): SettingsPageDefinition[] {
    return [...this.pages.values()].sort((left, right) => left.order - right.order)
  }
}

function ProvidersPage(props: SettingsPageProps) {
  return <ProviderProfilesSettings {...props} />
}

function ActionsPage({ config, onConfigChange }: SettingsPageProps) {
  return <ActionRoutesSettings config={config} onConfigChange={onConfigChange} />
}

function SelectionPage({ config, onConfigChange }: SettingsPageProps) {
  return <TriggerSettings config={config} onConfigChange={onConfigChange} />
}

function AppsPage({ config, onConfigChange }: SettingsPageProps) {
  return <AppRulesSettings config={config} onConfigChange={onConfigChange} />
}

function GeneralPage(_props: SettingsPageProps) {
  return <GeneralSettings />
}

export const settingsPageRegistry = new SettingsPageRegistry()

settingsPageRegistry.register({
  id: 'providers',
  title: '模型渠道',
  description: 'Provider、协议、模型、生成参数与自定义 Headers',
  icon: ServerCog,
  order: 10,
  component: ProvidersPage
})
settingsPageRegistry.register({
  id: 'actions',
  title: '动作与路由',
  description: 'Prompt、自定义动作、模型路由与 Fallback',
  icon: Route,
  order: 20,
  component: ActionsPage
})
settingsPageRegistry.register({
  id: 'selection',
  title: '划词触发',
  description: '拖选、双击、Shift Click 与触发阈值',
  icon: MousePointer2,
  order: 30,
  component: SelectionPage
})
settingsPageRegistry.register({
  id: 'apps',
  title: '应用规则',
  description: '按程序控制划词行为与剪贴板回退',
  icon: AppWindow,
  order: 40,
  component: AppsPage
})
settingsPageRegistry.register({
  id: 'general',
  title: '常规',
  description: '开机启动、诊断日志与后台行为',
  icon: Settings2,
  order: 50,
  component: GeneralPage
})
