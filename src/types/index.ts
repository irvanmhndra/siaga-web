export interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
  error_code?: string
}

export interface User {
  id: string
  organization_id: string
  name: string
  email: string
  phone?: string
  timezone: string
  notify_email: boolean
  notify_sms: boolean
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  members?: User[]
  created_at: string
}

export interface ScheduleLayer {
  id: string
  name: string
  rotation_type: string
  rotation_length_days: number
  handoff_time: string
  start_at: string
  user_ids: string[]
  position: number
}

export interface ScheduleOverride {
  id: string
  user_id: string
  start_at: string
  end_at: string
}

export interface Schedule {
  id: string
  name: string
  timezone: string
  layers?: ScheduleLayer[]
  overrides?: ScheduleOverride[]
  created_at: string
}

export type TargetType = 'user' | 'schedule'

export interface EscalationTarget {
  id?: string
  target_type: TargetType
  target_id: string
  position?: number
}

export interface EscalationRule {
  id?: string
  position?: number
  delay_minutes: number
  targets: EscalationTarget[]
}

export interface EscalationPolicy {
  id: string
  name: string
  repeat_count: number
  rules?: EscalationRule[]
  created_at: string
}

export type ServiceStatus = 'active' | 'maintenance' | 'disabled'

export interface Service {
  id: string
  name: string
  description?: string
  escalation_policy_id?: string
  integration_key: string
  status: ServiceStatus
  auto_resolve_minutes?: number
  ack_timeout_minutes?: number
  slack_webhook_url?: string
  created_at: string
}

export type IncidentStatus = 'triggered' | 'acknowledged' | 'resolved'

export interface IncidentLogEntry {
  id: string
  type: string
  message: string
  user_id?: string
  created_at: string
}

export interface Incident {
  id: string
  service_id: string
  title: string
  status: IncidentStatus
  urgency: 'high' | 'low'
  dedup_key: string
  details?: unknown
  assigned_user_id?: string
  escalation_level: number
  escalation_repeats: number
  next_escalation_at?: string
  triggered_at: string
  acknowledged_at?: string
  resolved_at?: string
  log?: IncidentLogEntry[]
}

export interface Notification {
  id: string
  incident_id?: string
  channel: string
  status: string
  message: string
  read_at?: string
  created_at: string
}

export interface NotificationList {
  items: Notification[]
  unread: number
}
