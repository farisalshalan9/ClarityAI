export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ActionItem {
  id: string;
  document_id: string;
  task: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  assignee?: string;
  is_completed: boolean;
  page_number?: number;
  order_idx: number;
  created_at: string;
}

export interface Deadline {
  id: string;
  document_id: string;
  title: string;
  due_date: string;
  description?: string;
  page_number?: number;
  category: string;
  is_completed: boolean;
  created_at: string;
}

export interface RiskRequirement {
  type: 'Requirement' | 'Risk' | 'Red Flag' | 'Financial' | 'Compliance';
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  page_number?: number;
}

export interface DocumentAnalysis {
  id: string;
  document_id: string;
  executive_summary: string;
  key_takeaways: string[];
  stakeholders: string[];
  risks_and_requirements: RiskRequirement[];
  suggested_questions?: string[];
  created_at: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  file_size: number;
  page_count: number;
  archetype: string;
  status: 'ready' | 'uploaded' | 'analyzing' | 'error';
  error_message?: string;
  is_public: boolean;
  share_token: string;
  created_at: string;
  updated_at: string;
  action_items_total?: number;
  action_items_completed?: number;
}

export interface DocumentDetail extends DocumentItem {
  analysis?: DocumentAnalysis;
  action_items: ActionItem[];
  deadlines: Deadline[];
}

export interface ChatMessage {
  id: string;
  document_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Array<{
    page: number;
    quote?: string;
    snippet?: string;
  }>;
  created_at: string;
}

export interface QuickToolResult {
  tool_type: string;
  title: string;
  result: string;
  data?: any;
}
