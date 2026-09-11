export type SelectionMethod = 'uia' | 'accessibility' | 'clipboard'
export type ActionKind = string
export type ProviderAdapter = 'openai-compatible' | 'openai-responses' | 'anthropic' | 'gemini'
export type OutputMode = 'markdown' | 'plain-text'

export interface SelectionPayload {
  text: string
  programName: string
  method: SelectionMethod
  mouseX: number
  mouseY: number
}

export interface ActionRequest {
  action: ActionKind
  actionName?: string
  outputMode?: OutputMode
  selection: SelectionPayload
}

export interface ProviderConfig {
  adapter: ProviderAdapter
  apiBase: string
  apiKey: string
  model: string
  headers: Record<string, string>
}

export interface AiSettings extends ProviderConfig {
  providerId?: string
  credentialId?: string
  targetLanguage: string
  alternateLanguage: string
}

export interface AiActionRunRequest {
  requestId: string
  action: ActionKind
  text: string
  targetLanguage: string
  alternateLanguage: string
  provider: ProviderConfig
}

export interface RoutedAiActionRunRequest {
  requestId: string
  action: ActionKind
  text: string
}

export interface AiStartedEvent {
  requestId: string
  providerId: string
  providerName: string
  adapter: ProviderAdapter
  model: string
  attempt: number
}

export interface AiChunkEvent {
  requestId: string
  chunk: string
}

export interface AiDoneEvent {
  requestId: string
}

export type AiErrorKind =
  | 'auth'
  | 'rate-limit'
  | 'timeout'
  | 'network'
  | 'provider'
  | 'malformed-stream'
  | 'empty-response'
  | 'interrupted'
  | 'config'
  | 'all-providers-failed'

export interface ModelCapabilities {
  systemPrompt: boolean
  temperature: boolean
  topP: boolean
  maxOutputTokens: boolean
  reasoning: boolean
}

export interface AiErrorEvent {
  requestId: string
  kind: AiErrorKind
  message: string
  status?: number
  retryable: boolean
  partial: boolean
}
