// Task fields as documented in HIVEMINDER-API.md
// id is a record locator: short alphanumeric string like "4ab"

export interface TaskOwner {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  summary: string;
  description: string;
  complete: boolean;
  completed_at: string | null;
  due: string | null;           // YYYY-MM-DD
  starts: string | null;        // hide-until date
  priority: number;             // 1-5 (1=lowest, 5=highest in Hiveminder)
  tags: string;                 // comma-separated
  owner: TaskOwner | null;
  requestor: TaskOwner | null;
  group_id: number | null;
  depends_on_count: number;
  depends_on_ids: string;
  depends_on_summaries: string;
  depended_on_by_count: number;
  repeat_period: string | null; // once/days/weeks/months/years
  repeat_every: number | null;
  time_estimate: string | null;
  time_worked: string | null;
  time_left: string | null;
  attachment_count: number;
  last_modified: string;        // ISO8601
  created: string;              // ISO8601
}

export interface HMList {
  id: number;
  name: string;
  deleted: boolean;
  locked: boolean;
  archived: boolean;
  position: number;
}

export interface AuthUser {
  id: string;
  username: string;
  fullname: string;
}

// What we store locally after login
export interface AuthState {
  token: string;
  user: AuthUser;
}

// RTM priority mapping (Hiveminder 1-5 vs RTM labels)
// Hiveminder 5 = High, 4 = Medium, 3 = Low, 1-2 = No priority
export function priorityLabel(priority: number): string {
  if (priority >= 5) return 'High';
  if (priority === 4) return 'Medium';
  if (priority === 3) return 'Low';
  return '';
}

export function priorityColor(priority: number): string {
  if (priority >= 5) return '#dc2626';   // red
  if (priority === 4) return '#d97706';  // amber
  if (priority === 3) return '#2563eb';  // blue
  return '';
}
