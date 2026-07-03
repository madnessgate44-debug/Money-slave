import {
  Opportunity,
  NextAction,
  WaitingState,
  PipelineRecord,
  AuditEvent,
  OpStatus
} from '../types.js';

/**
 * Finds the current pending user action for an opportunity if it exists.
 */
export function getCurrentPendingAction(opportunity: Opportunity, nextActions: NextAction[]): NextAction | null {
  if (!opportunity.curr_action_id) return null;
  const action = nextActions.find(a => a.id === opportunity.curr_action_id);
  return (action && action.act_status === 'pending_user') ? action : null;
}

/**
 * Finds the current waiting state for an opportunity if it exists.
 */
export function getCurrentWaitingState(opportunity: Opportunity, waitingStates: WaitingState[]): WaitingState | null {
  if (!opportunity.curr_wait_id) return null;
  return waitingStates.find(w => w.id === opportunity.curr_wait_id) || null;
}

/**
 * Checks all domain invariants for a given opportunity against Rules A-E.
 */
export function assertOpportunityStateValid(
  opportunity: Opportunity,
  nextActions: NextAction[],
  waitingStates: WaitingState[],
  pipelineRecords: PipelineRecord[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const hasPendingAction = !!getCurrentPendingAction(opportunity, nextActions);
  const hasWaitingState = !!getCurrentWaitingState(opportunity, waitingStates);

  if (opportunity.stage === 'active') {
    // Rule A — active opportunity validity
    const isPaused = opportunity.op_status === 'active_paused';
    let validActiveCondition = false;
    if (hasPendingAction && !hasWaitingState && !isPaused) validActiveCondition = true;
    if (!hasPendingAction && hasWaitingState && !isPaused) validActiveCondition = true;
    if (!hasPendingAction && !hasWaitingState && isPaused) validActiveCondition = true;

    if (!validActiveCondition) {
      errors.push(
        `Active opportunity '${opportunity.title}' must have exactly one of: pending action, active waiting state, or be paused. (PendingAction: ${hasPendingAction}, WaitingState: ${hasWaitingState}, Paused: ${isPaused})`
      );
    }

    // Rule B — no simultaneous pending action + waiting state
    if (hasPendingAction && opportunity.curr_wait_id !== null) {
      errors.push(`Opportunity '${opportunity.title}' cannot simultaneously have both a pending action and a current wait ID set.`);
    }

    // Rule E — active opportunities must have pipeline linkage
    if (!opportunity.pipe_rec_id) {
      errors.push(`Active opportunity '${opportunity.title}' is missing pipe_rec_id.`);
    } else {
      const pipe = pipelineRecords.find(p => p.id === opportunity.pipe_rec_id);
      if (!pipe) {
        errors.push(`Active opportunity links to non-existent pipeline record ${opportunity.pipe_rec_id}.`);
      }
    }
    if (opportunity.rev_disp !== 'approved') {
      errors.push(`Active opportunity must have rev_disp set to 'approved' (got '${opportunity.rev_disp}').`);
    }
  }

  // Rule C — closed opportunities are terminal
  if (opportunity.stage === 'closed') {
    if (opportunity.curr_action_id !== null) {
      errors.push(`Closed opportunity '${opportunity.title}' must not have curr_action_id.`);
    }
    if (opportunity.curr_wait_id !== null) {
      errors.push(`Closed opportunity '${opportunity.title}' must not have curr_wait_id.`);
    }
  }

  // Rule D — review opportunities may not have pipeline execution pointers
  if (opportunity.stage === 'review') {
    if (opportunity.pipe_rec_id !== null) {
      errors.push(`Review opportunity '${opportunity.title}' must not have pipe_rec_id.`);
    }
    if (opportunity.curr_action_id !== null) {
      errors.push(`Review opportunity '${opportunity.title}' must not have curr_action_id.`);
    }
    if (opportunity.curr_wait_id !== null) {
      errors.push(`Review opportunity '${opportunity.title}' must not have curr_wait_id.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Decouples/clears current action link
 */
export function clearCurrentAction(opportunity: Opportunity): void {
  opportunity.curr_action_id = null;
}

/**
 * Removes the current waiting state and its pointer
 */
export function clearCurrentWaiting(opportunity: Opportunity, waitingStates: WaitingState[]): void {
  if (opportunity.curr_wait_id) {
    const idx = waitingStates.findIndex(w => w.id === opportunity.curr_wait_id);
    if (idx !== -1) {
      waitingStates.splice(idx, 1);
    }
    opportunity.curr_wait_id = null;
  }
}

/**
 * Assigns a new pending action and clears waiting
 */
export function setCurrentAction(opportunity: Opportunity, actionId: string): void {
  opportunity.curr_action_id = actionId;
  opportunity.curr_wait_id = null;
}

/**
 * Assigns a waiting state and clears current pending action
 */
export function setCurrentWaiting(opportunity: Opportunity, waitingId: string): void {
  opportunity.curr_wait_id = waitingId;
  opportunity.curr_action_id = null;
}

/**
 * Cleans up execution pointers and sets appropriate outcome status on close.
 */
export function closeOpportunityExecutionState(
  opportunity: Opportunity,
  outcome: 'won' | 'lost' | 'abandoned',
  actions: NextAction[],
  waitingStates: WaitingState[]
): void {
  opportunity.stage = 'closed';
  opportunity.outcome = outcome;
  opportunity.op_status = outcome === 'won' ? 'closed_won' : outcome === 'lost' ? 'closed_lost' : 'closed_abandoned';
  
  // Clear core pointers
  opportunity.curr_action_id = null;
  opportunity.curr_wait_id = null;
  
  // Remove waiting states for this opportunity
  for (let i = waitingStates.length - 1; i >= 0; i--) {
    if (waitingStates[i].opp_id === opportunity.id) {
      waitingStates.splice(i, 1);
    }
  }

  // Dismiss any pending actions for this opportunity
  actions.forEach(a => {
    if (a.opp_id === opportunity.id && a.act_status === 'pending_user') {
      a.act_status = 'dismissed';
      a.rationale += ` [Dismissed on Opportunity Close at ${new Date().toISOString()}]`;
    }
  });
}

/**
 * Cleans up execution pointers and sets appropriate active_paused status.
 */
export function pauseOpportunityExecutionState(
  opportunity: Opportunity,
  actions: NextAction[],
  waitingStates: WaitingState[]
): void {
  opportunity.op_status = 'active_paused';
  opportunity.stage = 'active';

  // Clear current waiting state
  if (opportunity.curr_wait_id) {
    const idx = waitingStates.findIndex(w => w.id === opportunity.curr_wait_id);
    if (idx !== -1) {
      waitingStates.splice(idx, 1);
    }
    opportunity.curr_wait_id = null;
  }

  // Clean up all waiting states for this opportunity
  for (let i = waitingStates.length - 1; i >= 0; i--) {
    if (waitingStates[i].opp_id === opportunity.id) {
      waitingStates.splice(i, 1);
    }
  }

  // Dismiss current action
  if (opportunity.curr_action_id) {
    const act = actions.find(a => a.id === opportunity.curr_action_id);
    if (act && act.act_status === 'pending_user') {
      act.act_status = 'dismissed';
      act.rationale += ` [Dismissed due to campaign pause at ${new Date().toISOString()}]`;
    }
    opportunity.curr_action_id = null;
  }

  // Dismiss any other pending actions
  actions.forEach(a => {
    if (a.opp_id === opportunity.id && a.act_status === 'pending_user') {
      a.act_status = 'dismissed';
      a.rationale += ` [Dismissed on pause]`;
    }
  });
}

/**
 * Promotes a review stage opportunity to active.
 */
export function promoteReviewOpportunityToActive(
  opportunity: Opportunity,
  pipeRecId: string,
  actionId: string
): void {
  opportunity.stage = 'active';
  opportunity.rev_disp = 'approved';
  opportunity.op_status = 'active_pending_action';
  opportunity.pipe_rec_id = pipeRecId;
  opportunity.curr_action_id = actionId;
  opportunity.curr_wait_id = null;
}

/**
 * Performs self-healing DB-level consistency checks and repairs simple pointer mismatches.
 */
export function reconcileDatabaseState(
  opportunities: Opportunity[],
  nextActions: NextAction[],
  waitingStates: WaitingState[],
  pipelineRecords: PipelineRecord[],
  createUUID: () => string,
  createAuditEvent: (oppId: string | null, name: string, desc: string) => void
): { repairedCount: number; logs: string[] } {
  let repairedCount = 0;
  const logs: string[] = [];
  const now = new Date().toISOString();

  for (const opp of opportunities) {
    let changed = false;

    // Standardize optional/missing properties
    if (opp.curr_wait_id === undefined) {
      opp.curr_wait_id = null;
      changed = true;
    }

    // 1. Review stage check (Rule D)
    if (opp.stage === 'review') {
      if (opp.pipe_rec_id !== null) {
        opp.pipe_rec_id = null;
        changed = true;
        logs.push(`Opp ${opp.id}: cleared pipe_rec_id in review stage.`);
      }
      if (opp.curr_action_id !== null) {
        opp.curr_action_id = null;
        changed = true;
        logs.push(`Opp ${opp.id}: cleared curr_action_id in review stage.`);
      }
      if (opp.curr_wait_id !== null) {
        opp.curr_wait_id = null;
        changed = true;
        logs.push(`Opp ${opp.id}: cleared curr_wait_id in review stage.`);
      }
    }

    // 2. Closed stage check (Rule C)
    if (opp.stage === 'closed') {
      if (opp.curr_action_id !== null) {
        opp.curr_action_id = null;
        changed = true;
        logs.push(`Opp ${opp.id}: cleared curr_action_id in closed stage.`);
      }
      if (opp.curr_wait_id !== null) {
        opp.curr_wait_id = null;
        changed = true;
        logs.push(`Opp ${opp.id}: cleared curr_wait_id in closed stage.`);
      }
    }

    // 3. Active stage checks
    if (opp.stage === 'active') {
      // Check action pointer existence
      if (opp.curr_action_id !== null) {
        const actionExists = nextActions.some(a => a.id === opp.curr_action_id);
        if (!actionExists) {
          opp.curr_action_id = null;
          changed = true;
          logs.push(`Opp ${opp.id}: cleared curr_action_id pointing to missing action.`);
        }
      }

      // Check wait pointer existence
      if (opp.curr_wait_id !== null) {
        const waitExists = waitingStates.some(w => w.id === opp.curr_wait_id);
        if (!waitExists) {
          opp.curr_wait_id = null;
          changed = true;
          logs.push(`Opp ${opp.id}: cleared curr_wait_id pointing to missing waiting state.`);
        }
      }

      // Check active opportunity missing pipeline record linkage (Rule E)
      if (!opp.pipe_rec_id) {
        let pipe = pipelineRecords.find(p => p.opp_id === opp.id);
        if (!pipe) {
          const pipeId = createUUID();
          pipe = {
            id: pipeId,
            opp_id: opp.id,
            is_active: opp.op_status !== 'active_paused',
            activated_at: now,
            last_prog_at: now,
            health: opp.op_status === 'active_stalled' ? 'stalled' : 'on_track'
          };
          pipelineRecords.push(pipe);
          logs.push(`Opp ${opp.id}: created missing pipeline record.`);
        }
        opp.pipe_rec_id = pipe.id;
        opp.rev_disp = 'approved';
        changed = true;
        logs.push(`Opp ${opp.id}: repaired missing pipeline record link.`);
      }

      // Check Rule B (both pointers set pointing to active/pending states simultaneously)
      const hasPendingAction = opp.curr_action_id ? nextActions.some(a => a.id === opp.curr_action_id && a.act_status === 'pending_user') : false;
      const hasWaiting = opp.curr_wait_id ? waitingStates.some(w => w.id === opp.curr_wait_id) : false;

      if (hasPendingAction && hasWaiting) {
        opp.curr_action_id = null;
        opp.op_status = 'active_waiting';
        changed = true;
        logs.push(`Opp ${opp.id}: repaired simultaneous pending action and wait state violation by preferring waiting.`);
      }

      // Check status vs pointers consistency
      if (opp.curr_action_id && !opp.curr_wait_id) {
        const action = nextActions.find(a => a.id === opp.curr_action_id);
        if (action && action.act_status === 'pending_user') {
          if (opp.op_status !== 'active_pending_action' && opp.op_status !== 'active_stalled' && opp.op_status !== 'active_paused') {
            opp.op_status = 'active_pending_action';
            changed = true;
            logs.push(`Opp ${opp.id}: synchronized op_status to active_pending_action.`);
          }
        }
      }

      // If active, but op_status is active_paused, make sure pointers are null (Rule A)
      if (opp.op_status === 'active_paused') {
        if (opp.curr_action_id !== null || opp.curr_wait_id !== null) {
          opp.curr_action_id = null;
          opp.curr_wait_id = null;
          changed = true;
          logs.push(`Opp ${opp.id}: cleared pointers for paused opportunity.`);
        }
      }

      // If active and has no pointers and is not paused, generate a manual fallback
      const finalPendingAction = opp.curr_action_id ? nextActions.some(a => a.id === opp.curr_action_id && a.act_status === 'pending_user') : false;
      const finalWaiting = opp.curr_wait_id ? waitingStates.some(w => w.id === opp.curr_wait_id) : false;
      const finalPaused = opp.op_status === 'active_paused';

      if (!finalPendingAction && !finalWaiting && !finalPaused) {
        const actionId = createUUID();
        const nextAction: NextAction = {
          id: actionId,
          opp_id: opp.id,
          act_type: 'manual',
          act_status: 'pending_user',
          due_at: now,
          rationale: 'Self-healing repair: Active opportunity was detected without any current actionable path forward or wait state.',
          draft_id: null,
          superseded_by: null
        };
        nextActions.push(nextAction);
        opp.curr_action_id = actionId;
        opp.op_status = 'active_pending_action';
        changed = true;
        logs.push(`Opp ${opp.id}: self-healed by generating a fresh pending action.`);
      }
    }

    if (changed) {
      repairedCount++;
      opp.updated_at = now;
      createAuditEvent(opp.id, 'System Reconciliation', `Reconciler repaired inconsistency: ${logs[logs.length - 1] || 'Default correction'}`);
    }
  }

  return { repairedCount, logs };
}
