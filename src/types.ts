export type OpportunityStage = 'discovery' | 'review' | 'active' | 'closed';

export type OpStatus =
  | 'discovering'
  | 'ready_for_review'
  | 'review_pending'
  | 'review_deferred'
  | 'research_requested'
  | 'active_pending_action'
  | 'active_waiting'
  | 'active_stalled'
  | 'active_paused'
  | 'closed_won'
  | 'closed_lost'
  | 'closed_abandoned';

export type RevDisposition = 'pending' | 'approved' | 'rejected' | 'deferred' | 'res_req';

export type OpportunityOutcome = 'in_progress' | 'won' | 'lost' | 'abandoned';

export interface Opportunity {
  id: string; // UUID
  title: string;
  target_entity: {
    domain: string;
    company: string;
    prospect_name?: string;
    prospect_role?: string;
    prospect_email?: string;
    estimated_value?: number;
    tech_stack?: string[];
    use_case?: string;
    test_run?: boolean;
    test_run_label?: string;
  };
  primary_id: string; // e.g. domain or email key
  stage: OpportunityStage;
  op_status: OpStatus;
  rev_disp: RevDisposition;
  outcome: OpportunityOutcome;
  confidence: number; // 0.0 to 1.0
  priority: number;
  curr_action_id: string | null;
  curr_wait_id: string | null;
  created_at: string;
  updated_at: string;
  last_activity: string;
  rev_item_id: string | null;
  pipe_rec_id: string | null;
  stalled_at: string | null;
  last_outbound: string | null;
}

export interface ReviewItem {
  id: string;
  opp_id: string;
  disposition: RevDisposition;
  surfaced_at: string;
  decision_at: string | null;
  snooze_date: string | null;
  res_query: string | null;
  evidence_summary: string;
}

export type PipelineHealth = 'on_track' | 'stalled' | 'blocked';

export interface PipelineRecord {
  id: string;
  opp_id: string;
  is_active: boolean;
  activated_at: string;
  last_prog_at: string;
  health: PipelineHealth;
}

export type ActionType = 'outbound' | 'manual' | 'res_deep' | 'pivot';
export type ActionStatus = 'pending_user' | 'executed' | 'dismissed';

export interface NextAction {
  id: string;
  opp_id: string;
  act_type: ActionType;
  act_status: ActionStatus;
  due_at: string;
  rationale: string;
  draft_id: string | null;
  superseded_by: string | null;
}

export interface Draft {
  id: string;
  action_id: string;
  body: string;
  version: number;
  is_edited: boolean;
  original_body?: string; // To calculate user-vs-AI drift
}

export type DepType = 'prospect' | 'timer' | 'researcher';

export interface WaitingState {
  id: string;
  opp_id: string;
  dep_type: DepType;
  clear_trigger: string;
  expiry_at: string;
}

export interface AuditEvent {
  id: string;
  opp_id: string | null;
  event_name: string; // 23 canonical events
  actor: 'user' | 'system';
  description: string;
  timestamp: string;
  payload?: any;
}

export interface OpportunityResearchRun {
  id: string;
  opp_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
  output_summary: string | null;
}

export interface OutboundEvent {
  id: string;
  opp_id: string;
  action_id: string;
  draft_id: string;
  sent_at: string;
  recipient: string;
  subject: string;
  body: string;
}

// 23 Canonical Events
export const WORKFLOW_EVENTS = {
  DISCOVERED: 'Discovered',
  RESEARCH_STARTED: 'Research Started',
  RESEARCH_FINISHED: 'Research Finished',
  SURFACED_FOR_REVIEW: 'Surfaced for Review',
  USER_APPROVES_OPPORTUNITY: 'User Approves Opportunity',
  USER_REJECTS_OPPORTUNITY: 'User Rejects Opportunity',
  USER_DEFERS_OPPORTUNITY: 'User Defers Opportunity',
  USER_REQUESTS_MORE_RESEARCH: 'User Requests More Research',
  ENTERS_PIPELINE: 'Enters Pipeline',
  FIRST_ACTION_MADE: 'First Action Made',
  DRAFT_CREATED: 'Draft Created',
  USER_EDITS_DRAFT: 'User Edits Draft',
  USER_APPROVES_OUTBOUND: 'User Approves Outbound',
  REJECT_DRAFT_KEEP_ACTIVE: 'Reject Draft / Keep Active',
  WAITING_STATE_ENTERED: 'Waiting State Entered',
  WAITING_STATE_CLEARED: 'Waiting State Cleared',
  FOLLOW_UP_DUE: 'Follow-up Due',
  OPPORTUNITY_STALLED: 'Opportunity Stalled',
  OPPORTUNITY_REVIVED: 'Opportunity Revived',
  MARKED_WON: 'Marked Won',
  MARKED_LOST: 'Marked Lost',
  OPPORTUNITY_PAUSED: 'Opportunity Paused',
  OPPORTUNITY_ABANDONED: 'Opportunity Abandoned',
};

export interface FunctionalTestStepResult {
  step_key: string;
  step_label: string;
  status: 'passed' | 'failed' | 'skipped';
  started_at: string;
  completed_at: string;
  notes: string;
  evidence: any;
}

export interface FunctionalTestRun {
  id: string;
  test_name: string;
  status: 'running' | 'passed' | 'failed' | 'partial';
  started_at: string;
  completed_at: string;
  sector_input: string;
  selected_opp_id: string | null;
  selected_review_item_id: string | null;
  first_action_id: string | null;
  first_draft_id: string | null;
  waiting_state_id: string | null;
  second_action_id: string | null;
  second_draft_id: string | null;
  step_results: FunctionalTestStepResult[];
  summary: string;
  report_text: string;
  public_report_path: string;
  downloadable_filename: string;
}

export interface DiscoveryConfig {
  id: string;
  target_segment: 'enterprise' | 'mid_market' | 'scale_up' | 'startup';
  target_vertical: 'b2b_saas' | 'fintech' | 'healthtech' | 'ai_infra' | 'agencies_services';
  intent_signal: 'tech_stack_drift' | 'executive_churn' | 'funding_surge' | 'competitor_surge' | 'hiring_spike';
  playbook_mode: 'cold_conquest' | 'expansion_cross' | 'portfolio_partnership' | 'renewal_rescue';
  confidence_cutoff: 'strict' | 'balanced' | 'aggressive';
  processing_priority: 'alpha' | 'beta' | 'gamma';
  updated_at: string;
}

export interface DiscoveryConfigPayload {
  target_segment: 'enterprise' | 'mid_market' | 'scale_up' | 'startup';
  target_vertical: 'b2b_saas' | 'fintech' | 'healthtech' | 'ai_infra' | 'agencies_services';
  intent_signal: 'tech_stack_drift' | 'executive_churn' | 'funding_surge' | 'competitor_surge' | 'hiring_spike';
  playbook_mode: 'cold_conquest' | 'expansion_cross' | 'portfolio_partnership' | 'renewal_rescue';
  confidence_cutoff: 'strict' | 'balanced' | 'aggressive';
  processing_priority: 'alpha' | 'beta' | 'gamma';
}

export interface AuditReportLog {
  id: string;
  timestamp: string;
  build_summary: {
    status: 'PASS' | 'FAIL';
    changes_implemented: string[];
    affected_files: string[];
  };
  system_state_validation: {
    total_active_opportunities: number;
    orphaned_pointers_detected: number; // count of records breaking Core Operating Law
    watchdog_integrity: 'HEALTHY' | 'STALLED_NODES_FOUND';
  };
  chatgpt_review_pack: string; // The complete, pre-formatted multi-line text block for master project continuity tracking
}


