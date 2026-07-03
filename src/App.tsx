import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  TrendingUp,
  Archive,
  Briefcase,
  Clock,
  Send,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  MessageSquare,
  History,
  Sliders,
  Edit3,
  RefreshCw,
  UserCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  Pause,
  Play,
  ArrowRight,
  User,
  Compass,
  Download,
  ShieldCheck,
  Copy
} from 'lucide-react';
import {
  Opportunity,
  ReviewItem,
  PipelineRecord,
  NextAction,
  Draft,
  WaitingState,
  AuditEvent,
  OpportunityResearchRun,
  OutboundEvent,
  FunctionalTestRun,
  FunctionalTestStepResult,
  DiscoveryConfig,
  DiscoveryConfigPayload,
  AuditReportLog
} from './types.js';

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'today' | 'review' | 'pipeline' | 'audit' | 'workflow_test' | 'search_mind' | 'compliance'>('today');

  // Compliance states
  const [complianceReport, setComplianceReport] = useState<AuditReportLog | null>(null);
  const [isLoadingCompliance, setIsLoadingCompliance] = useState<boolean>(false);

  // Discovery Config States
  const [discoveryConfig, setDiscoveryConfig] = useState<DiscoveryConfig | null>(null);
  const [targetSegment, setTargetSegment] = useState<'enterprise' | 'mid_market' | 'scale_up' | 'startup'>('mid_market');
  const [targetVertical, setTargetVertical] = useState<'b2b_saas' | 'fintech' | 'healthtech' | 'ai_infra' | 'agencies_services'>('b2b_saas');
  const [intentSignal, setIntentSignal] = useState<'tech_stack_drift' | 'executive_churn' | 'funding_surge' | 'competitor_surge' | 'hiring_spike'>('funding_surge');
  const [playbookMode, setPlaybookMode] = useState<'cold_conquest' | 'expansion_cross' | 'portfolio_partnership' | 'renewal_rescue'>('cold_conquest');
  const [confidenceCutoff, setConfidenceCutoff] = useState<'strict' | 'balanced' | 'aggressive'>('balanced');
  const [processingPriority, setProcessingPriority] = useState<'alpha' | 'beta' | 'gamma'>('beta');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isConfigLocked, setIsConfigLocked] = useState(true);

  // Test Runner State
  const [testRuns, setTestRuns] = useState<FunctionalTestRun[]>([]);
  const [currentTestRun, setCurrentTestRun] = useState<FunctionalTestRun | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testSector, setTestSector] = useState('B2B SaaS companies selling to engineering teams');
  const [expandedSteps, setExpandedSteps] = useState<{ [key: string]: boolean }>({});

  const fetchTestRuns = async () => {
    try {
      const res = await fetch('/api/testing/workflow');
      if (res.ok) {
        const data = await res.json();
        setTestRuns(data);
        if (data.length > 0 && !currentTestRun) {
          // Default to showing latest run
          setCurrentTestRun(data[data.length - 1]);
        }
      }
    } catch (e) {
      console.error('Error fetching test runs:', e);
    }
  };

  const runWorkflowTest = async () => {
    setIsTesting(true);
    showFeedback('Initializing REAL_WORKFLOW_E2E_V1 Test Run...');
    try {
      const res = await fetch('/api/testing/workflow/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: testSector })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentTestRun(data);
        showFeedback('E2E Test Run Completed Successfully!', 'success');
        fetchTestRuns();
        fetchAllData(); // Refresh operator queues so they see the real live test artifacts
      } else {
        showFeedback('E2E Test Run failed on server.', 'error');
      }
    } catch (e: any) {
      showFeedback(`Test execution failed: ${e.message}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  // App State
  const [todayActions, setTodayActions] = useState<(Opportunity & { action: NextAction | null; draft: Draft | null })[]>([]);
  const [reviewQueue, setReviewQueue] = useState<(Opportunity & { review_item: ReviewItem })[]>([]);
  const [pipeline, setPipeline] = useState<{
    working: (Opportunity & { pipe?: PipelineRecord })[];
    waiting: (Opportunity & { pipe?: PipelineRecord; waiting?: WaitingState })[];
    stalled_paused: (Opportunity & { pipe?: PipelineRecord })[];
  }>({ working: [], waiting: [], stalled_paused: [] });
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [analytics, setAnalytics] = useState({
    discoveryCount: 0,
    reviewCount: 0,
    activeCount: 0,
    closedWon: 0,
    pipelineValue: 0,
    stalledCount: 0
  });

  // Selected workspace opportunity
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<{
    opportunity: Opportunity;
    review_item?: ReviewItem;
    pipeline_record?: PipelineRecord;
    action: NextAction | null;
    draft: Draft | null;
    waiting_state?: WaitingState;
    research_runs: OpportunityResearchRun[];
    outbound_events: OutboundEvent[];
    history: AuditEvent[];
  } | null>(null);

  // Discovery parameters
  const [discoverySector, setDiscoverySector] = useState('B2B Devops and Cloud Platforms');
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Interaction controls
  const [researchQuery, setResearchQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [snoozeDays, setSnoozeDays] = useState('3');
  const [rewriteNotes, setRewriteNotes] = useState('');
  const [preserveUserNotes, setPreserveUserNotes] = useState(true);
  const [alternativeNotes, setAlternativeNotes] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [isGeneratingAlt, setIsGeneratingAlt] = useState(false);
  const [editedDraftBody, setEditedDraftBody] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Status updates
  const [systemMessage, setSystemMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Initial Fetching
  const fetchAllData = async () => {
    try {
      const todayRes = await fetch('/api/today');
      const todayData = await todayRes.json();
      setTodayActions(todayData);

      const reviewRes = await fetch('/api/review');
      const reviewData = await reviewRes.json();
      setReviewQueue(reviewData);

      const pipeRes = await fetch('/api/pipeline');
      const pipeData = await pipeRes.json();
      setPipeline(pipeData);

      const auditRes = await fetch('/api/audit');
      const auditData = await auditRes.json();
      setAuditLog(auditData);

      const analyticsRes = await fetch('/api/analytics');
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);
      
      await fetchDiscoveryConfig();
      await fetchComplianceReport();
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  const fetchComplianceReport = async () => {
    setIsLoadingCompliance(true);
    try {
      const res = await fetch('/api/compliance/audit');
      if (res.ok) {
        const data = await res.json();
        setComplianceReport(data);
      }
    } catch (e) {
      console.error('Error loading compliance report:', e);
    } finally {
      setIsLoadingCompliance(false);
    }
  };

  const fetchDiscoveryConfig = async () => {
    try {
      const res = await fetch('/api/discovery/config');
      if (res.ok) {
        const data = await res.json();
        setDiscoveryConfig(data);
        setTargetSegment(data.target_segment);
        setTargetVertical(data.target_vertical);
        setIntentSignal(data.intent_signal);
        setPlaybookMode(data.playbook_mode);
        setConfidenceCutoff(data.confidence_cutoff);
        setProcessingPriority(data.processing_priority);
        setIsConfigLocked(true);
      }
    } catch (e) {
      console.error('Error loading discovery config:', e);
    }
  };

  const handleSaveDiscoveryConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/discovery/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_segment: targetSegment,
          target_vertical: targetVertical,
          intent_signal: intentSignal,
          playbook_mode: playbookMode,
          confidence_cutoff: confidenceCutoff,
          processing_priority: processingPriority
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDiscoveryConfig(data.config);
        setIsConfigLocked(true);
        showFeedback('Search Mind parameters successfully saved & locked.', 'success');
        // Refresh audit log
        const auditRes = await fetch('/api/audit');
        const auditData = await auditRes.json();
        setAuditLog(auditData);
      } else {
        const err = await res.json();
        showFeedback(err.error || 'Failed to save configuration', 'error');
      }
    } catch (e: any) {
      showFeedback(`Error saving configuration: ${e.message}`, 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchTestRuns();
    // Watchdog check trigger on page load
    fetch('/api/watchdog/run', { method: 'POST' });
  }, []);

  // Fetch individual workspace when ID changes
  useEffect(() => {
    if (selectedOppId) {
      fetchWorkspace(selectedOppId);
    } else {
      setWorkspace(null);
    }
  }, [selectedOppId]);

  const fetchWorkspace = async (id: string) => {
    try {
      const res = await fetch(`/api/opportunity/${id}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
        if (data.draft) {
          setEditedDraftBody(data.draft.body);
        }
      }
    } catch (e) {
      console.error('Error loading workspace:', e);
    }
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setSystemMessage({ text, type });
    setTimeout(() => {
      setSystemMessage(null);
    }, 5000);
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      showFeedback(`Downloading ${filename}...`);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showFeedback(`${filename} downloaded successfully!`, 'success');
    } catch (err: any) {
      showFeedback(`Failed to download ${filename}: ${err.message}`, 'error');
    }
  };

  // Run Discovery Run
  const handleTriggerDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discoverySector.trim()) return;
    setIsDiscovering(true);
    showFeedback('Triggering active discovery sweep with Gemini strategist...');

    try {
      const res = await fetch('/api/discovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: discoverySector })
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(`Successfully discovered and surfaced ${data.count} new opportunities!`, 'success');
        fetchAllData();
      } else {
        showFeedback(data.error || 'Discovery run failed', 'error');
      }
    } catch (err: any) {
      showFeedback(`Discovery error: ${err.message}`, 'error');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Approve Opportunity
  const handleApproveOpportunity = async (oppId: string) => {
    try {
      const res = await fetch(`/api/review/${oppId}/approve`, { method: 'POST' });
      if (res.ok) {
        showFeedback('Opportunity approved and promoted into pipeline!');
        fetchAllData();
        setSelectedOppId(oppId); // Open workspace directly to active strategist mode
        setActiveTab('today');
      } else {
        const err = await res.json();
        showFeedback(err.error || 'Failed to approve', 'error');
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Reject Opportunity
  const handleRejectOpportunity = async (oppId: string) => {
    try {
      const res = await fetch(`/api/review/${oppId}/reject`, { method: 'POST' });
      if (res.ok) {
        showFeedback('Opportunity filed into Rejected Archive.');
        fetchAllData();
        if (selectedOppId === oppId) setSelectedOppId(null);
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Defer (Snooze) Opportunity
  const handleDeferOpportunity = async (oppId: string) => {
    try {
      const res = await fetch(`/api/review/${oppId}/defer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: Number(snoozeDays) })
      });
      if (res.ok) {
        showFeedback(`Opportunity deferred for ${snoozeDays} days.`);
        fetchAllData();
        if (selectedOppId === oppId) setSelectedOppId(null);
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // More Research
  const handleRequestMoreResearch = async (oppId: string) => {
    if (!researchQuery.trim()) return;
    setIsResearching(true);
    showFeedback('Initializing researcher intelligence run...');
    try {
      const res = await fetch(`/api/review/${oppId}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: researchQuery })
      });
      if (res.ok) {
        showFeedback('Deep research run initiated. Results will integrate into review workspace momentarily.');
        setResearchQuery('');
        // Poll for updates on workspace
        setTimeout(() => {
          fetchWorkspace(oppId);
          fetchAllData();
        }, 3000);
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    } finally {
      setIsResearching(false);
    }
  };

  // Save Draft edits
  const handleSaveDraft = async (draftId: string) => {
    setIsSavingDraft(true);
    try {
      const res = await fetch(`/api/draft/${draftId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editedDraftBody })
      });
      if (res.ok) {
        showFeedback('Draft saved successfully!');
        if (selectedOppId) fetchWorkspace(selectedOppId);
        fetchAllData();
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // AI Rewrite Draft (Decision E)
  const handleRewriteDraft = async (draftId: string) => {
    if (!rewriteNotes.trim()) return;
    setIsRewriting(true);
    showFeedback('Dispatched rewrite prompt to Gemini strategist...');
    try {
      const res = await fetch(`/api/draft/${draftId}/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: rewriteNotes, preserveNotes: preserveUserNotes })
      });
      if (res.ok) {
        showFeedback('Draft rewritten successfully based on guidance!');
        const data = await res.json();
        setEditedDraftBody(data.draft.body);
        setRewriteNotes('');
        if (selectedOppId) fetchWorkspace(selectedOppId);
        fetchAllData();
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    } finally {
      setIsRewriting(false);
    }
  };

  // Approve Outbound Outreach (Decision A)
  const handleApproveOutbound = async (actionId: string) => {
    try {
      // Auto-save draft edits first if dirty
      if (workspace?.draft && editedDraftBody !== workspace.draft.body) {
        await fetch(`/api/draft/${workspace.draft.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: editedDraftBody })
        });
      }

      const res = await fetch(`/api/action/${actionId}/approve`, { method: 'POST' });
      if (res.ok) {
        showFeedback('Out outreach dispatched successfully. Opportunity transitioned into active wait.');
        if (selectedOppId) fetchWorkspace(selectedOppId);
        fetchAllData();
      } else {
        const data = await res.json();
        showFeedback(data.error || 'Failed to dispatch outbound.', 'error');
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Request Alternative Campaign (AI Strategist regenerate)
  const handleRequestAlternative = async (actionId: string) => {
    setIsGeneratingAlt(true);
    showFeedback('Requesting strategist pivot from AI engine...');
    try {
      const res = await fetch(`/api/action/${actionId}/alternative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: alternativeNotes })
      });
      if (res.ok) {
        showFeedback('Alternative strategist campaign generated.');
        setAlternativeNotes('');
        if (selectedOppId) fetchWorkspace(selectedOppId);
        fetchAllData();
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    } finally {
      setIsGeneratingAlt(false);
    }
  };

  // Dismiss Action
  const handleDismissAction = async (actionId: string) => {
    try {
      const res = await fetch(`/api/action/${actionId}/dismiss`, { method: 'POST' });
      if (res.ok) {
        showFeedback('Action dismissed. Fresh manual fallback task created.');
        if (selectedOppId) fetchWorkspace(selectedOppId);
        fetchAllData();
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Convert Action to Manual
  const handleConvertToManual = async (actionId: string) => {
    try {
      const res = await fetch(`/api/action/${actionId}/manual`, { method: 'POST' });
      if (res.ok) {
        showFeedback('Campaign task decoupled. Converted to manual user execution.');
        if (selectedOppId) fetchWorkspace(selectedOppId);
        fetchAllData();
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Clear Waiting State Manually (Decision A - Mark Replied / Clear)
  const handleMarkReplied = async (waitId: string) => {
    try {
      const res = await fetch(`/api/waiting/${waitId}/replied`, { method: 'POST' });
      if (res.ok) {
        showFeedback('Prospect marked as Replied! Opportunity has returned to active dashboard.');
        if (selectedOppId) fetchWorkspace(selectedOppId);
        fetchAllData();
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  const handleClearWaiting = async (waitId: string) => {
    try {
      const res = await fetch(`/api/waiting/${waitId}/clear`, { method: 'POST' });
      if (res.ok) {
        showFeedback('Waiting state released manually.');
        if (selectedOppId) fetchWorkspace(selectedOppId);
        fetchAllData();
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Pause Opportunity (Decision B)
  const handlePauseOpportunity = async (oppId: string) => {
    try {
      const res = await fetch(`/api/opportunity/${oppId}/pause`, { method: 'POST' });
      if (res.ok) {
        showFeedback('Opportunity sequence paused. Excluded from Today list.');
        if (selectedOppId) fetchWorkspace(oppId);
        fetchAllData();
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Revive Opportunity
  const handleReviveOpportunity = async (oppId: string) => {
    try {
      const res = await fetch(`/api/opportunity/${oppId}/revive`, { method: 'POST' });
      if (res.ok) {
        showFeedback('Opportunity re-activated! Fresh outreach draft initialized.');
        if (selectedOppId) fetchWorkspace(oppId);
        fetchAllData();
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Close Opportunity (Mark Won / Lost / Abandoned)
  const handleCloseOpportunity = async (oppId: string, outcome: 'won' | 'lost' | 'abandoned') => {
    try {
      const res = await fetch(`/api/opportunity/${oppId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome })
      });
      if (res.ok) {
        showFeedback(`Opportunity closed with outcome: ${outcome.toUpperCase()}`);
        if (selectedOppId) fetchWorkspace(oppId);
        fetchAllData();
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Helper formatting values
  const handleDownloadAuditLog = () => {
    try {
      const header = `==================================================\n` +
                     `      MONEYSLAVE V1 - OPERATIONS AUDIT TRACE      \n` +
                     `      Exported: ${new Date().toLocaleString()}     \n` +
                     `      Total Log Entries: ${auditLog.length}        \n` +
                     `==================================================\n\n`;

      const body = auditLog.map((log, idx) => {
        const num = String(idx + 1).padStart(3, '0');
        const time = new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19);
        return `[#${num}] ${time} | ACTOR: ${log.actor.toUpperCase()} | EVENT: ${log.event_name}\n` +
               `Description: ${log.description}\n` +
               `Opportunity ID: ${log.opp_id || 'N/A'}\n` +
               `Event ID: ${log.id}\n` +
               `--------------------------------------------------`;
      }).join('\n\n');

      const fullText = header + body;
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `moneyslave_audit_log_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showFeedback('Audit log downloaded successfully!', 'success');
    } catch (err: any) {
      showFeedback(`Failed to download audit log: ${err.message}`, 'error');
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ready_for_review': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'active_pending_action': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'active_waiting': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'active_stalled': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'active_paused': return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
      case 'closed_won': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'closed_lost': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'closed_abandoned': return 'bg-zinc-600/10 text-zinc-400 border border-zinc-600/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    }
  };

  return (
    <div id="moneyslave-app" className="min-h-screen bg-[#0C0F12] text-zinc-100 font-sans antialiased selection:bg-sky-500 selection:text-black">
      
      {/* Top Professional Header */}
      <header className="border-b border-zinc-800 bg-[#0C0F12]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/10">
            <TrendingUp className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              MoneySlave <span className="text-xs px-2 py-0.5 bg-zinc-800 text-sky-400 rounded-full font-mono border border-zinc-700">V1</span>
            </h1>
            <p className="text-xs text-zinc-400">Proactive Revenue Opportunity Console</p>
          </div>
        </div>

        {/* Global Key Metrics Bar */}
        <div className="hidden lg:flex items-center space-x-8">
          <div className="text-right">
            <span className="block text-[10px] text-zinc-500 uppercase tracking-widest">Active Pipeline</span>
            <span className="text-md font-mono font-bold text-sky-400">{formatCurrency(analytics.pipelineValue)}</span>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-right">
            <span className="block text-[10px] text-zinc-500 uppercase tracking-widest">In Review Queue</span>
            <span className="text-md font-mono font-bold text-amber-400">{analytics.reviewCount}</span>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-right">
            <span className="block text-[10px] text-zinc-500 uppercase tracking-widest">Stalled/Alerts</span>
            <span className="text-md font-mono font-bold text-rose-400">{analytics.stalledCount}</span>
          </div>
        </div>

        {/* Control and Audit Actions */}
        <div className="flex items-center space-x-3">
          {/* Download Audit Pack Button */}
          <button
            onClick={() => handleDownloadFile('/moneyslave_v1_integrity_audit.txt', 'moneyslave_v1_integrity_audit.txt')}
            className="p-2 text-sky-400 hover:text-white rounded-lg hover:bg-sky-950/40 border border-sky-900/50 bg-[#0F1C24] transition-colors flex items-center gap-2 text-xs font-medium font-mono cursor-pointer"
            title="Download the official MoneySlave V1 Domain Integrity Audit Pack"
          >
            <Download className="w-4 h-4" />
            <span>Download Domain Integrity Audit Pack</span>
          </button>

          {/* Watchdog Force Refresh */}
          <button
            onClick={async () => {
              const res = await fetch('/api/watchdog/run', { method: 'POST' });
              if (res.ok) {
                showFeedback('Watchdog engine run forced. Pipeline constraints synchronized!');
                fetchAllData();
                if (selectedOppId) fetchWorkspace(selectedOppId);
              }
            }}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2 text-xs border border-zinc-800 bg-[#12161A]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Force Watchdog Check</span>
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Control Rail / Discover Block */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Proactive Sector Scan Box */}
          <div className="bg-[#12161B] border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-blue-600" />
            <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              Proactive Agentic Discovery
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Dispatches Gemini scanner to surface high-probability DevOps & cloud scaling contracts.
            </p>

            <div className="mb-4 p-2.5 bg-[#0C0F12] border border-zinc-800 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">AI Search Mind</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-semibold ${
                  isConfigLocked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                }`}>
                  {isConfigLocked ? 'Locked' : 'Unlocked'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('search_mind')}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 font-mono hover:underline"
              >
                <Sliders className="w-3 h-3" />
                <span>Adjust Parameters &rarr;</span>
              </button>
            </div>

            <form onSubmit={handleTriggerDiscovery} className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Target Sector / Tech</label>
                <input
                  type="text"
                  value={discoverySector}
                  onChange={(e) => setDiscoverySector(e.target.value)}
                  placeholder="e.g. Biotech, DevOps Tools, AWS, Kubernetes"
                  className="w-full bg-[#0C0F12] border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-white placeholder-zinc-600"
                />
              </div>

              <button
                type="submit"
                disabled={isDiscovering || !isConfigLocked}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-black font-semibold text-xs py-2 rounded-lg hover:from-sky-400 hover:to-blue-500 transition-colors flex items-center justify-center gap-2 shadow-md shadow-sky-500/10 disabled:opacity-50"
              >
                {isDiscovering ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning Public Signals...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Trigger Discovery Sweep</span>
                  </>
                )}
              </button>
              
              {!isConfigLocked && (
                <p className="text-[10px] text-amber-500 font-mono mt-1 text-center animate-pulse">
                  ⚠ Parameters must be locked to sweep.
                </p>
              )}
            </form>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#12161B] border border-zinc-800/80 rounded-xl p-4 text-center">
              <span className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Won Campaigns</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">{analytics.closedWon}</span>
            </div>
            <div className="bg-[#12161B] border border-zinc-800/80 rounded-xl p-4 text-center">
              <span className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Active Pipeline</span>
              <span className="text-2xl font-bold text-sky-400 font-mono">{analytics.activeCount}</span>
            </div>
          </div>

          {/* System Notification banner if active */}
          {systemMessage && (
            <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 animate-fade-in ${
              systemMessage.type === 'error' 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              {systemMessage.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold font-mono">{systemMessage.type === 'error' ? 'SYSTEM ALERT' : 'ORCHESTRATOR REPORT'}</p>
                <p className="mt-0.5 leading-relaxed">{systemMessage.text}</p>
              </div>
            </div>
          )}

          {/* Live System Logs Feed mini-view */}
          <div className="bg-[#12161B] border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">Operations Audit Trace</h4>
              {auditLog.length > 0 && (
                <button
                  id="btn-download-audit-log"
                  onClick={handleDownloadAuditLog}
                  className="px-2 py-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-sky-400 transition-colors flex items-center gap-1 text-[10px] font-mono border border-zinc-800 bg-[#0C0F12]"
                  title="Download full audit log"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              )}
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {auditLog.slice(0, 5).map(log => (
                <div key={log.id} className="text-[10px] leading-relaxed border-l-2 border-zinc-800 pl-2 py-0.5">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="font-mono text-zinc-400">{log.event_name}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-zinc-400 mt-0.5 font-sans">{log.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Center Operational Console */}
        <div className="lg:col-span-9 space-y-6">

          {/* Tab Navigation Controls */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => { setActiveTab('today'); setSelectedOppId(null); }}
                className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
                  activeTab === 'today' ? 'bg-[#12161B] text-white border border-zinc-800' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Today's Actions</span>
                {todayActions.length > 0 && (
                  <span className="bg-sky-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                    {todayActions.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('review'); setSelectedOppId(null); }}
                className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
                  activeTab === 'review' ? 'bg-[#12161B] text-white border border-zinc-800' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Review Queue</span>
                {reviewQueue.length > 0 && (
                  <span className="bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                    {reviewQueue.length}
                  </span>
                )}
              </button>

              <button
                id="tab-search-mind"
                onClick={() => { setActiveTab('search_mind'); setSelectedOppId(null); }}
                className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
                  activeTab === 'search_mind' ? 'bg-[#12161B] text-white border border-zinc-800' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-sky-400 font-bold" />
                <span>AI Search Mind</span>
                {!isConfigLocked && (
                  <span className="bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono animate-pulse">
                    UNLOCKED
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('pipeline'); setSelectedOppId(null); }}
                className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
                  activeTab === 'pipeline' ? 'bg-[#12161B] text-white border border-zinc-800' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Pipeline Board</span>
              </button>

              <button
                onClick={() => { setActiveTab('audit'); setSelectedOppId(null); }}
                className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
                  activeTab === 'audit' ? 'bg-[#12161B] text-white border border-zinc-800' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Decision Log</span>
              </button>

              <button
                id="tab-compliance"
                onClick={() => { setActiveTab('compliance'); setSelectedOppId(null); fetchComplianceReport(); }}
                className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
                  activeTab === 'compliance' ? 'bg-[#12161B] text-white border border-zinc-800' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${complianceReport?.build_summary.status === 'FAIL' ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
                <span>Compliance Center</span>
                {complianceReport && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono ${complianceReport.build_summary.status === 'FAIL' ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {complianceReport.build_summary.status}
                  </span>
                )}
              </button>

              <button
                id="tab-workflow-test"
                onClick={() => { setActiveTab('workflow_test'); setSelectedOppId(null); }}
                className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
                  activeTab === 'workflow_test' ? 'bg-[#12161B] text-white border border-zinc-800' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span className="text-rose-400 font-bold">Workflow Test</span>
              </button>
            </div>

            <div className="text-xs text-zinc-500 font-mono">
              Workspace Scope: <span className="text-zinc-300 font-bold">Offline-First Durable Mode</span>
            </div>
          </div>

          {/* Main workspace or list block */}
          {selectedOppId && workspace ? (
            
            // ================== OPPORTUNITY WORKSPACE SURFACE ==================
            <div className="bg-[#12161B] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
              
              {/* Workspace Header */}
              <div className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedOppId(null)}
                    className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors font-mono"
                  >
                    ← Exit Workspace
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      {workspace.opportunity.title}
                      <span className={`text-[10px] px-2 py-0.5 font-mono rounded-full font-semibold uppercase ${getStatusBadgeColor(workspace.opportunity.op_status)}`}>
                        {workspace.opportunity.op_status.replace(/_/g, ' ')}
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Domain: <span className="font-mono text-sky-400">{workspace.opportunity.target_entity.domain}</span>
                    </p>
                  </div>
                </div>

                {/* Top Actions in workspace */}
                <div className="flex flex-wrap items-center gap-2">
                  {workspace.opportunity.stage === 'active' && workspace.opportunity.op_status !== 'active_paused' && (
                    <button
                      onClick={() => handlePauseOpportunity(workspace.opportunity.id)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-700"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Campaign</span>
                    </button>
                  )}
                  {workspace.opportunity.stage === 'active' && workspace.opportunity.op_status === 'active_paused' && (
                    <button
                      onClick={() => handleReviveOpportunity(workspace.opportunity.id)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume / Revive</span>
                    </button>
                  )}
                  
                  {workspace.opportunity.stage !== 'closed' && (
                    <div className="flex items-center space-x-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
                      <button
                        onClick={() => handleCloseOpportunity(workspace.opportunity.id, 'won')}
                        className="px-2.5 py-1 hover:bg-emerald-500/20 text-emerald-400 text-xs rounded transition-colors font-semibold"
                      >
                        Won
                      </button>
                      <button
                        onClick={() => handleCloseOpportunity(workspace.opportunity.id, 'lost')}
                        className="px-2.5 py-1 hover:bg-red-500/20 text-red-400 text-xs rounded transition-colors font-semibold"
                      >
                        Lost
                      </button>
                      <button
                        onClick={() => handleCloseOpportunity(workspace.opportunity.id, 'abandoned')}
                        className="px-2.5 py-1 hover:bg-zinc-700 text-zinc-400 text-xs rounded transition-colors font-semibold"
                      >
                        Abandon
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Three-Pane Workspace layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 min-h-[500px]">
                
                {/* L-PANE: Metadata, parameters, static evidence */}
                <div className="lg:col-span-4 p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Company Insights</h4>
                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 space-y-3 text-xs">
                      <div>
                        <span className="text-zinc-500 block">Organization</span>
                        <span className="text-zinc-200 font-bold text-sm">{workspace.opportunity.target_entity.company}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Lead Target / Person</span>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <User className="w-3.5 h-3.5 text-sky-400" />
                          <span className="text-zinc-200 font-semibold">{workspace.opportunity.target_entity.prospect_name || 'Not identified'}</span>
                        </div>
                        <span className="text-zinc-400 block text-[11px] font-mono mt-0.5">{workspace.opportunity.target_entity.prospect_role}</span>
                        <span className="text-sky-500/80 block text-[11px] font-mono">{workspace.opportunity.target_entity.prospect_email}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Estimated Contract Value</span>
                        <span className="text-zinc-200 font-mono font-bold text-sm text-sky-400">
                          {formatCurrency(workspace.opportunity.target_entity.estimated_value)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block mb-1">Identified Tech Stack</span>
                        <div className="flex flex-wrap gap-1">
                          {workspace.opportunity.target_entity.tech_stack?.map((t, idx) => (
                            <span key={idx} className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Revenue Hypothesis</h4>
                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 space-y-3 text-xs leading-relaxed">
                      <p className="text-zinc-300 font-sans italic">
                        "{workspace.opportunity.target_entity.use_case}"
                      </p>
                      <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Confidence Score:</span>
                        <span className="font-mono font-bold text-emerald-400">{(workspace.opportunity.confidence * 100).toFixed(0)}% Match</span>
                      </div>
                    </div>
                  </div>

                  {/* Review Queue Evidence specific to Review state */}
                  {workspace.review_item && (
                    <div>
                      <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Proactive Intel Evidence</h4>
                      <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 text-xs leading-relaxed space-y-2">
                        <p className="text-zinc-400 font-sans">{workspace.review_item.evidence_summary}</p>
                      </div>
                    </div>
                  )}

                  {/* Pending Research Runs status */}
                  {workspace.research_runs.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Deep Intelligence Runs</h4>
                      <div className="space-y-2">
                        {workspace.research_runs.map(run => (
                          <div key={run.id} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-mono text-zinc-400">Intelligence Run</span>
                              <span className={`text-[10px] px-1.5 rounded uppercase font-bold font-mono ${
                                run.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'
                              }`}>
                                {run.status}
                              </span>
                            </div>
                            {run.output_summary && (
                              <p className="text-zinc-400 leading-relaxed text-[11px] mt-1.5 font-sans bg-zinc-900 p-2 rounded border border-zinc-800 max-h-32 overflow-y-auto">
                                {run.output_summary}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* C-PANE: Active workflow console (Draft editor, action options, approve outbounds) */}
                <div className="lg:col-span-5 p-6 space-y-6">
                  
                  {/* REVIEW MODE: Accept, snooze, reject controls */}
                  {workspace.opportunity.stage === 'review' && (
                    <div className="space-y-6">
                      <div className="bg-[#1B1912] border border-amber-500/20 rounded-xl p-5">
                        <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          Opportunity Pending Operator Approval
                        </h4>
                        <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                          This is a newly discovered opportunity. Review the evidence, request deeper AI context, or promote directly into the outbound sequence pipeline.
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <button
                            onClick={() => handleApproveOpportunity(workspace.opportunity.id)}
                            className="bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-md transition-colors"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Approve & Promote</span>
                          </button>
                          <button
                            onClick={() => handleRejectOpportunity(workspace.opportunity.id)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject & Archive</span>
                          </button>
                        </div>

                        {/* Defer Snooze block */}
                        <div className="border-t border-zinc-800/80 pt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-zinc-400">Snooze for</span>
                            <select
                              value={snoozeDays}
                              onChange={(e) => setSnoozeDays(e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-xs font-mono focus:outline-none"
                            >
                              <option value="1">1 Day</option>
                              <option value="3">3 Days</option>
                              <option value="7">7 Days</option>
                              <option value="14">14 Days</option>
                            </select>
                          </div>
                          <button
                            onClick={() => handleDeferOpportunity(workspace.opportunity.id)}
                            className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs hover:text-white rounded transition-colors"
                          >
                            Snooze Defer
                          </button>
                        </div>
                      </div>

                      {/* Researcher query tool */}
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2 font-mono">Request Deeper Research Run</h4>
                        <p className="text-xs text-zinc-500 mb-3">
                          Direct the researcher to crawl targeted technology nodes or organizational updates.
                        </p>
                        <div className="space-y-3">
                          <textarea
                            value={researchQuery}
                            onChange={(e) => setResearchQuery(e.target.value)}
                            placeholder="e.g. Find specific public cloud issues, check recent VP job change details, or find security stack data..."
                            rows={3}
                            className="w-full bg-[#0C0F12] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder-zinc-600 font-mono"
                          />
                          <button
                            onClick={() => handleRequestMoreResearch(workspace.opportunity.id)}
                            disabled={isResearching || !researchQuery.trim()}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-semibold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            {isResearching ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Running AI Researcher...</span>
                              </>
                            ) : (
                              <>
                                <Activity className="w-3.5 h-3.5 text-sky-400" />
                                <span>Dispatch Intel Agent</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE MODE: Action and Draft workflow editor */}
                  {workspace.opportunity.stage === 'active' && (
                    <div className="space-y-6">
                      
                      {/* Active Action banner */}
                      {workspace.action ? (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider px-2 py-0.5 bg-sky-500/10 rounded">
                                Current Campaign Step
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                Type: {workspace.action.act_type.toUpperCase()}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-zinc-200 mt-2 font-mono">Strategist Rationale:</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed mt-1 font-sans italic">
                              "{workspace.action.rationale}"
                            </p>
                          </div>

                          {/* Action Controls */}
                          <div className="flex flex-wrap gap-2 border-t border-zinc-800/80 pt-3">
                            {workspace.action.act_status === 'pending_user' && workspace.draft && (
                              <button
                                onClick={() => handleApproveOutbound(workspace.action!.id)}
                                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-black font-bold text-xs rounded-lg flex items-center gap-1.5 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/10"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Approve Outbound Outreach</span>
                              </button>
                            )}

                            {workspace.action.act_status === 'pending_user' && (
                              <>
                                <button
                                  onClick={() => handleDismissAction(workspace.action!.id)}
                                  className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs rounded-lg transition-colors"
                                >
                                  Dismiss Step
                                </button>
                                <button
                                  onClick={() => handleConvertToManual(workspace.action!.id)}
                                  className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs rounded-lg transition-colors"
                                >
                                  Make Manual
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Non-action states, e.g. Waiting */
                        workspace.waiting_state ? (
                          <div className="bg-[#12161E] border border-blue-500/20 rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-2 text-blue-400">
                              <Clock className="w-5 h-5 animate-pulse" />
                              <h4 className="text-sm font-semibold">Active Waiting Period Established</h4>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              MoneySlave is monitoring the inbox for prospect replies. Watchdog check is registered to trigger follow-up in 72 hours.
                            </p>
                            <div className="bg-zinc-950 p-3 rounded border border-zinc-800 text-[11px] font-mono space-y-1.5 text-zinc-400">
                              <div>Type: <span className="text-zinc-200">{workspace.waiting_state.dep_type.toUpperCase()}</span></div>
                              <div>Condition: <span className="text-zinc-200">{workspace.waiting_state.clear_trigger}</span></div>
                              <div>Expiry check: <span className="text-zinc-200">{new Date(workspace.waiting_state.expiry_at).toLocaleString()}</span></div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              <button
                                onClick={() => handleMarkReplied(workspace.waiting_state!.id)}
                                className="px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-lg hover:bg-emerald-400 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Prospect Replied (Mark)</span>
                              </button>
                              <button
                                onClick={() => handleClearWaiting(workspace.waiting_state!.id)}
                                className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs hover:text-white rounded-lg transition-colors"
                              >
                                Release Wait
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#1C1212] border border-red-500/20 rounded-xl p-5">
                            <h4 className="text-sm font-semibold text-red-400 mb-1 flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" />
                              Action Matrix Breach
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              Opportunity is active but lacks any campaign task. Touch the revive option to establish fresh campaign strategy.
                            </p>
                            <button
                              onClick={() => handleReviveOpportunity(workspace.opportunity.id)}
                              className="mt-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded font-bold transition-colors border border-zinc-700"
                            >
                              Initialize Campaign Sequence
                            </button>
                          </div>
                        )
                      )}

                      {/* Active Draft Customizer / Editor */}
                      {workspace.draft && workspace.action?.act_status === 'pending_user' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-1.5">
                              <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                              Active Outreach Draft Editor
                            </label>
                            <span className="text-[10px] text-zinc-500 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                              v{workspace.draft.version} {workspace.draft.is_edited ? '(Operator Modified)' : '(AI Baseline)'}
                            </span>
                          </div>

                          <textarea
                            value={editedDraftBody}
                            onChange={(e) => setEditedDraftBody(e.target.value)}
                            rows={11}
                            className="w-full bg-[#0C0F12] border border-zinc-800 rounded-xl p-4 text-xs font-mono leading-relaxed text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />

                          <div className="flex justify-between items-center">
                            <button
                              onClick={() => handleSaveDraft(workspace.draft!.id)}
                              disabled={isSavingDraft || editedDraftBody === workspace.draft.body}
                              className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-40"
                            >
                              {isSavingDraft ? 'Saving...' : 'Save Draft Edits'}
                            </button>

                            <span className="text-[11px] text-zinc-500">
                              Character count: {editedDraftBody.length}
                            </span>
                          </div>

                          {/* AI Campaign Adjuster Panel (Decision E) */}
                          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mt-4 space-y-3">
                            <span className="block text-[10px] text-zinc-400 font-mono uppercase tracking-widest">Adjust Campaign Style (AI Strategist)</span>
                            <textarea
                              value={rewriteNotes}
                              onChange={(e) => setRewriteNotes(e.target.value)}
                              placeholder="e.g. Make it much shorter, change tone to casual founder, or highlight specific Kubernetes savings..."
                              rows={2}
                              className="w-full bg-[#0C0F12] border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none font-mono placeholder-zinc-700"
                            />
                            
                            <div className="flex items-center justify-between">
                              <label className="flex items-center space-x-2 text-[11px] text-zinc-400 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={preserveUserNotes}
                                  onChange={(e) => setPreserveUserNotes(e.target.checked)}
                                  className="accent-sky-500"
                                />
                                <span>Preserve my manual edits</span>
                              </label>

                              <button
                                onClick={() => handleRewriteDraft(workspace.draft!.id)}
                                disabled={isRewriting || !rewriteNotes.trim()}
                                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-sky-400 font-bold text-xs rounded border border-sky-500/20 hover:border-sky-500/40 transition-colors disabled:opacity-40"
                              >
                                {isRewriting ? 'Regenerating...' : 'Rewrite Outreach'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Alternate Campaign strategist pivots if user dislikes */}
                      {workspace.action && workspace.action.act_status === 'pending_user' && (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                          <span className="block text-[10px] text-zinc-400 font-mono uppercase tracking-widest mb-2">Request Strategy Pivot</span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={alternativeNotes}
                              onChange={(e) => setAlternativeNotes(e.target.value)}
                              placeholder="e.g. Pivot to pitching automated security logs rather than cloud cost optimization..."
                              className="flex-1 bg-[#0C0F12] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none font-mono text-white placeholder-zinc-700"
                            />
                            <button
                              onClick={() => handleRequestAlternative(workspace.action!.id)}
                              disabled={isGeneratingAlt || !alternativeNotes.trim()}
                              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-800"
                            >
                              {isGeneratingAlt ? 'Pivoting...' : 'Pivot Strategy'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CLOSED WORKSPACE MODE */}
                  {workspace.opportunity.stage === 'closed' && (
                    <div className="bg-[#121B15] border border-emerald-500/20 rounded-xl p-6 text-center space-y-3">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                      <h4 className="text-base font-bold text-white">Campaign Concluded</h4>
                      <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                        This opportunity sequence is officially finalized with outcome: <span className="font-mono font-bold text-emerald-400 uppercase">{workspace.opportunity.outcome}</span>.
                      </p>
                      <button
                        onClick={() => handleReviveOpportunity(workspace.opportunity.id)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-colors border border-zinc-700"
                      >
                        Re-open / Revive Campaign
                      </button>
                    </div>
                  )}
                </div>

                {/* R-PANE: Interactions history & outbounds */}
                <div className="lg:col-span-4 p-6 space-y-6">
                  
                  {/* Sent Pitch logs */}
                  {workspace.outbound_events.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Dispatched Pitches</h4>
                      <div className="space-y-3">
                        {workspace.outbound_events.map(ev => (
                          <div key={ev.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs space-y-2">
                            <div className="flex justify-between text-zinc-500 font-mono text-[10px]">
                              <span>Recipient: {ev.recipient}</span>
                              <span>{new Date(ev.sent_at).toLocaleDateString()}</span>
                            </div>
                            <h5 className="font-bold text-zinc-300">{ev.subject}</h5>
                            <p className="text-zinc-400 font-sans max-h-32 overflow-y-auto leading-relaxed text-[11px] bg-zinc-900 p-2 rounded border border-zinc-800 whitespace-pre-wrap">
                              {ev.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dedicated Opportunity Timeline Audit */}
                  <div>
                    <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Workspace Audit Stream</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                      {workspace.history.map(evt => (
                        <div key={evt.id} className="text-xs border-l-2 border-zinc-800 pl-3 relative py-0.5">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-zinc-700" />
                          <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-0.5">
                            <span className="text-zinc-400 font-bold">{evt.event_name}</span>
                            <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-zinc-400 text-[11px] leading-relaxed">{evt.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>

          ) : (
            
            // ================== MAIN VIEW TABS ==================
            <div className="space-y-6">
              
              {/* TODAY ACTIONS VIEW */}
              {activeTab === 'today' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white">Daily Outbox & Tasks</h2>
                      <p className="text-xs text-zinc-400">High-probability pitches ready for dispatch or manual action checklists.</p>
                    </div>
                  </div>

                  {todayActions.length === 0 ? (
                    <div className="bg-[#12161B] border border-zinc-800 rounded-xl p-8 text-center space-y-3">
                      <CheckCircle className="w-10 h-10 text-zinc-600 mx-auto" />
                      <h3 className="text-sm font-semibold text-zinc-300">Clean Slate — All Actions Addressed</h3>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                        No pending outreach tasks. Go to the review queue to qualify and promote new opportunities, or trigger a discovery run.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {todayActions.map(opp => (
                        <div
                          key={opp.id}
                          onClick={() => setSelectedOppId(opp.id)}
                          className="bg-[#12161B] border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all cursor-pointer flex justify-between items-start gap-4 relative group"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono rounded-full font-bold">
                                {opp.action?.act_type.toUpperCase()}
                              </span>
                              <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                                {opp.title}
                              </h3>
                              <span className="text-xs text-zinc-500 font-mono">
                                ({opp.target_entity.company})
                              </span>
                            </div>
                            
                            {opp.action && (
                              <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
                                <span className="text-zinc-200 font-mono font-bold">Action:</span> {opp.action.rationale}
                              </p>
                            )}

                            <div className="flex items-center space-x-4 text-[11px] text-zinc-500 font-mono pt-2">
                              <span>Estimated: <strong className="text-sky-400 font-semibold">{formatCurrency(opp.target_entity.estimated_value)}</strong></span>
                              <span>•</span>
                              <span>Target: {opp.target_entity.prospect_name}</span>
                              <span>•</span>
                              <span>Match: {(opp.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-xs text-zinc-400 group-hover:text-white transition-colors flex items-center gap-1 font-semibold">
                              Open Workspace
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MINI TOP REVIEW QUEUE PREVIEW */}
                  {reviewQueue.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-zinc-800/60">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-mono">Review Queue Snapshot ({reviewQueue.length})</h4>
                        <button onClick={() => setActiveTab('review')} className="text-xs text-sky-400 hover:text-sky-300 font-semibold">
                          View full queue →
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reviewQueue.slice(0, 2).map(opp => (
                          <div
                            key={opp.id}
                            onClick={() => setSelectedOppId(opp.id)}
                            className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700 transition-all cursor-pointer"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.5 bg-amber-500/10 rounded">
                                PENDING QUALIFICATION
                              </span>
                              <span className="text-xs font-mono font-bold text-zinc-300">{formatCurrency(opp.target_entity.estimated_value)}</span>
                            </div>
                            <h5 className="text-xs font-bold text-zinc-200 mt-2 hover:text-sky-400 transition-colors">{opp.title}</h5>
                            <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                              {opp.review_item.evidence_summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* REVIEW QUEUE VIEW */}
              {activeTab === 'review' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-white">Review & Qualification Queue</h2>
                    <p className="text-xs text-zinc-400">Qualify newly discovered contracts and promote them to active status.</p>
                  </div>

                  {reviewQueue.length === 0 ? (
                    <div className="bg-[#12161B] border border-zinc-800 rounded-xl p-8 text-center space-y-3">
                      <Compass className="w-10 h-10 text-zinc-600 mx-auto animate-pulse" />
                      <h3 className="text-sm font-semibold text-zinc-300 font-mono">Queue Empty</h3>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                        No opportunities are currently awaiting qualification. Type a business sector in the Left sidebar to trigger a fresh proactive discovery sweep!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {reviewQueue.map(opp => (
                        <div
                          key={opp.id}
                          className="bg-[#12161B] border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                                {opp.priority} PRIORITY
                              </span>
                              <h3 className="text-sm font-bold text-white hover:text-sky-400 cursor-pointer" onClick={() => setSelectedOppId(opp.id)}>
                                {opp.title}
                              </h3>
                              <span className="text-xs text-zinc-500 font-mono">({opp.target_entity.company})</span>
                            </div>

                            <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">
                              <strong className="text-zinc-300 font-mono">Evidence summary:</strong> {opp.review_item.evidence_summary}
                            </p>

                            <div className="flex items-center space-x-4 text-[11px] text-zinc-500 font-mono pt-1">
                              <span>Value: <strong className="text-sky-400 font-semibold">{formatCurrency(opp.target_entity.estimated_value)}</strong></span>
                              <span>•</span>
                              <span>Match score: {(opp.confidence * 100).toFixed(0)}%</span>
                              <span>•</span>
                              <span>Snoozed: {opp.review_item.snooze_date ? 'Yes' : 'No'}</span>
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-col items-stretch gap-2 shrink-0 md:w-36">
                            <button
                              onClick={() => handleApproveOpportunity(opp.id)}
                              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setSelectedOppId(opp.id)}
                              className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2 rounded-lg transition-colors text-center font-semibold"
                            >
                              Open Workspace
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}


              {/* PIPELINE BOARD VIEW */}
              {activeTab === 'pipeline' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-white">Outbound Campaign Pipeline</h2>
                    <p className="text-xs text-zinc-400">Overall tracking of campaigns through working, waiting, and stalled phases.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* WORKING COLUMN */}
                    <div className="bg-[#12161B] border border-zinc-800 rounded-xl p-4 flex flex-col min-h-[400px]">
                      <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-400 font-mono">Working</span>
                        <span className="text-[10px] font-mono font-bold bg-sky-500/10 px-2 py-0.5 text-sky-400 rounded-full">
                          {pipeline.working.length}
                        </span>
                      </div>
                      <div className="space-y-3 flex-1 overflow-y-auto">
                        {pipeline.working.length === 0 ? (
                          <div className="text-center py-10 text-xs text-zinc-600 font-sans">No working items.</div>
                        ) : (
                          pipeline.working.map(opp => (
                            <div
                              key={opp.id}
                              onClick={() => setSelectedOppId(opp.id)}
                              className="bg-zinc-950 hover:border-zinc-700 border border-zinc-800 p-4 rounded-xl cursor-pointer transition-all space-y-2 group"
                            >
                              <h4 className="text-xs font-bold text-zinc-200 group-hover:text-sky-400 transition-colors">
                                {opp.title}
                              </h4>
                              <div className="flex justify-between items-center text-[11px] font-mono text-zinc-500">
                                <span>{formatCurrency(opp.target_entity.estimated_value)}</span>
                                <span className="text-sky-500 font-semibold uppercase text-[10px]">Action pending</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* WAITING COLUMN */}
                    <div className="bg-[#12161B] border border-zinc-800 rounded-xl p-4 flex flex-col min-h-[400px]">
                      <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">Waiting (Monitoring)</span>
                        <span className="text-[10px] font-mono font-bold bg-blue-500/10 px-2 py-0.5 text-blue-400 rounded-full">
                          {pipeline.waiting.length}
                        </span>
                      </div>
                      <div className="space-y-3 flex-1 overflow-y-auto">
                        {pipeline.waiting.length === 0 ? (
                          <div className="text-center py-10 text-xs text-zinc-600 font-sans">No active waiting sequences.</div>
                        ) : (
                          pipeline.waiting.map(opp => (
                            <div
                              key={opp.id}
                              onClick={() => setSelectedOppId(opp.id)}
                              className="bg-zinc-950 hover:border-zinc-700 border border-zinc-800 p-4 rounded-xl cursor-pointer transition-all space-y-2 group"
                            >
                              <h4 className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">
                                {opp.title}
                              </h4>
                              <div className="flex justify-between items-center text-[11px] font-mono text-zinc-500">
                                <span>{formatCurrency(opp.target_entity.estimated_value)}</span>
                                <span className="text-blue-400 font-semibold uppercase text-[10px]">timer active</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* STALLED / PAUSED COLUMN */}
                    <div className="bg-[#12161B] border border-zinc-800 rounded-xl p-4 flex flex-col min-h-[400px]">
                      <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">Stalled / Paused</span>
                        <span className="text-[10px] font-mono font-bold bg-rose-500/10 px-2 py-0.5 text-rose-400 rounded-full">
                          {pipeline.stalled_paused.length}
                        </span>
                      </div>
                      <div className="space-y-3 flex-1 overflow-y-auto">
                        {pipeline.stalled_paused.length === 0 ? (
                          <div className="text-center py-10 text-xs text-zinc-600 font-sans">No stalled campaigns.</div>
                        ) : (
                          pipeline.stalled_paused.map(opp => (
                            <div
                              key={opp.id}
                              onClick={() => setSelectedOppId(opp.id)}
                              className="bg-zinc-950 hover:border-zinc-700 border border-zinc-800 p-4 rounded-xl cursor-pointer transition-all space-y-2 group"
                            >
                              <h4 className="text-xs font-bold text-zinc-200 group-hover:text-rose-400 transition-colors">
                                {opp.title}
                              </h4>
                              <div className="flex justify-between items-center text-[11px] font-mono text-zinc-500">
                                <span>{formatCurrency(opp.target_entity.estimated_value)}</span>
                                <span className={`${opp.op_status === 'active_stalled' ? 'text-rose-400' : 'text-zinc-500'} font-semibold uppercase text-[10px]`}>
                                  {opp.op_status.replace('active_', '')}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}


              {/* AUDIT VIEW */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-base font-bold text-white">Orchestrator Decision & Audit Log</h2>
                      <p className="text-xs text-zinc-400">Strict chronological trail of user approvals, rejections, edits, and automated campaign alerts.</p>
                    </div>

                    <button
                      onClick={async () => {
                        const res = await fetch('/api/audit');
                        const data = await res.json();
                        setAuditLog(data);
                        showFeedback('Audit stream refreshed.');
                      }}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:text-white rounded text-xs text-zinc-400 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </button>
                  </div>

                  <div className="bg-[#12161B] border border-zinc-800 rounded-xl p-5 shadow-lg">
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {auditLog.map(evt => (
                        <div key={evt.id} className="text-xs border-l-2 border-zinc-800 pl-4 py-1 flex justify-between gap-6 relative">
                          <div className="absolute -left-[5px] top-2.5 w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700" />
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-zinc-200 font-mono">{evt.event_name}</span>
                              <span className={`text-[9px] font-mono px-1.5 uppercase rounded ${
                                evt.actor === 'user' ? 'bg-amber-500/15 text-amber-400' : 'bg-sky-500/15 text-sky-400'
                              }`}>
                                {evt.actor}
                              </span>
                            </div>
                            <p className="text-zinc-400 leading-relaxed font-sans">{evt.description}</p>
                          </div>

                          <div className="text-right shrink-0 font-mono text-[10px] text-zinc-500">
                            {new Date(evt.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* WORKFLOW TEST HARNESS VIEW */}
              {activeTab === 'workflow_test' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-rose-500" />
                        <span>Functional Workflow Test Harness</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Run a canonical end-to-end integration and operations simulation of MoneySlave's proactive revenue engine.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchTestRuns}
                        disabled={isTesting}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:text-white rounded text-xs text-zinc-400 flex items-center gap-1 transition-colors disabled:opacity-50 font-medium"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>Refresh Runs</span>
                      </button>
                    </div>
                  </div>

                  {/* Controls Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#12161B] border border-zinc-800/80 rounded-xl p-5 md:col-span-1 space-y-4 shadow-xl">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Run Configuration</h3>
                      
                      <div className="space-y-2">
                        <label className="text-[11px] font-medium text-zinc-400 block">Sector Input Focus</label>
                        <input
                          type="text"
                          value={testSector}
                          onChange={(e) => setTestSector(e.target.value)}
                          placeholder="e.g. B2B SaaS engineering solutions"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          Controls the target sector for Step 1 (Discovery Engine). The AI will auto-create a fitting B2B lead.
                        </p>
                      </div>

                      <button
                        onClick={runWorkflowTest}
                        disabled={isTesting || !testSector.trim()}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-900/10"
                      >
                        <Play className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>{isTesting ? 'Running Test Workflow...' : 'Execute E2E Workflow Test'}</span>
                      </button>

                      <div className="border-t border-zinc-800/60 pt-3">
                        <h4 className="text-[11px] font-bold text-zinc-400 mb-2">Previous Test Runs ({testRuns.length})</h4>
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {testRuns.length === 0 ? (
                            <p className="text-[10px] text-zinc-500 italic">No test runs executed yet.</p>
                          ) : (
                            [...testRuns].reverse().map(run => (
                              <button
                                key={run.id}
                                onClick={() => setCurrentTestRun(run)}
                                className={`w-full text-left p-2 rounded text-[11px] transition-colors flex justify-between items-center border ${
                                  currentTestRun?.id === run.id
                                    ? 'bg-rose-950/20 border-rose-800 text-rose-300'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="font-bold font-mono text-[9px] truncate">{run.id.slice(0, 8)}...</div>
                                  <div className="text-[9px] text-zinc-500">{new Date(run.started_at).toLocaleTimeString()}</div>
                                </div>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  run.status === 'passed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                                }`}>
                                  {run.status}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Report and Details panel */}
                    <div className="bg-[#12161B] border border-zinc-800/80 rounded-xl p-5 md:col-span-2 space-y-5 shadow-xl">
                      {isTesting ? (
                        <div className="h-[400px] flex flex-col justify-center items-center text-center space-y-4">
                          <Activity className="w-10 h-10 text-rose-500 animate-spin" />
                          <div>
                            <h3 className="text-sm font-bold text-white">Executing LIVE_WORKFLOW_E2E_V1 Pipeline...</h3>
                            <p className="text-xs text-zinc-500 mt-1 max-w-md">
                              This executes Discovery via Gemini, Promotes the lead via Review Approval, Dispatches Outbound Campaign with AI Writing, marks Prospect as Replied, and performs final state validation.
                            </p>
                          </div>
                        </div>
                      ) : currentTestRun ? (
                        <div className="space-y-5">
                          {/* Run Summary Banner */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 p-4 rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-zinc-500">RUN: {currentTestRun.id}</span>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  currentTestRun.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {currentTestRun.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-300 font-medium mt-1">{currentTestRun.summary}</p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleDownloadFile(currentTestRun.public_report_path, currentTestRun.downloadable_filename || 'moneyslave_v1_workflow_test_report.txt')}
                                className="px-3 py-1.5 bg-rose-600/10 border border-rose-800 text-rose-400 hover:bg-rose-600/20 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Report TXT</span>
                              </button>
                            </div>
                          </div>

                          {/* Steps Breakdown */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Step Execution Logs</h4>
                            <div className="space-y-3">
                              {currentTestRun.step_results.map((step, idx) => (
                                <div key={step.step_key} className="border border-zinc-800 rounded-lg bg-zinc-950/40 overflow-hidden">
                                  <div
                                    onClick={() => setExpandedSteps(prev => ({ ...prev, [step.step_key]: !prev[step.step_key] }))}
                                    className="flex items-center justify-between p-3 bg-zinc-950/80 cursor-pointer hover:bg-zinc-900/60 transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-zinc-500 text-xs font-mono">0{idx + 1}</span>
                                      <span className="text-xs font-bold text-white">{step.step_label}</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                        step.status === 'passed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                                      }`}>
                                        {step.status}
                                      </span>
                                      {expandedSteps[step.step_key] ? (
                                        <ChevronUp className="w-4 h-4 text-zinc-500" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                                      )}
                                    </div>
                                  </div>

                                  {expandedSteps[step.step_key] && (
                                    <div className="p-4 border-t border-zinc-800/60 space-y-3 text-xs leading-relaxed text-zinc-300">
                                      <div>
                                        <div className="font-bold text-zinc-400">Execution Notes:</div>
                                        <div className="mt-1 text-zinc-300 font-sans">{step.notes}</div>
                                      </div>

                                      {step.evidence && (
                                        <div className="space-y-1.5 pt-2">
                                          <div className="font-bold text-zinc-400 font-mono text-[10px]">EVIDENCE RETRIEVAL:</div>
                                          <pre className="bg-zinc-950 p-3 rounded border border-zinc-900 overflow-x-auto text-[10px] font-mono text-sky-400/95 max-h-[160px]">
                                            {JSON.stringify(step.evidence, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Full Report Display */}
                          <div className="space-y-2 pt-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Structured Plaintext Report</h4>
                            <div className="bg-zinc-950 border border-zinc-900 rounded p-4 font-mono text-[11px] text-zinc-400 whitespace-pre-wrap max-h-[300px] overflow-y-auto leading-relaxed border-l-2 border-l-rose-500">
                              {currentTestRun.report_text}
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="h-[400px] flex flex-col justify-center items-center text-center space-y-3">
                          <Activity className="w-10 h-10 text-zinc-700" />
                          <div>
                            <h3 className="text-sm font-bold text-zinc-400">No Test Run Selected</h3>
                            <p className="text-xs text-zinc-600 max-w-sm mt-1">
                              Configure the target sector on the left and trigger a real end-to-end integration test to begin.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'search_mind' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-zinc-800 pb-4 gap-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-sky-400" />
                        <span>AI Search Mind Configuration Cockpit</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Calibrate and fine-tune search parameters, heuristics, and target boundaries.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isConfigLocked ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span className="text-[11px] text-zinc-400 font-mono">STATUS: {isConfigLocked ? 'LOCKED & SYNCED' : 'UNLOCKED / CHANGES PENDING'}</span>
                      </div>
                      
                      {isConfigLocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsConfigLocked(false);
                            showFeedback('Parameters unlocked. Modify settings and re-save to lock.', 'success');
                          }}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all"
                        >
                          Unlock Parameters
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isSavingConfig}
                          onClick={handleSaveDiscoveryConfig}
                          className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-black rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {isSavingConfig ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <span>Save & Lock Parameters</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Config Stats Info */}
                  <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-xl flex items-start gap-3">
                    <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed text-zinc-300">
                      <strong className="text-white">Active Discovery Rule:</strong> When discovery is triggered, the engine looks up these parameters. Newly discovered leads will match the segment <code className="text-sky-300 bg-zinc-950 px-1 py-0.5 rounded font-mono font-bold">{targetSegment}</code>, target vertical <code className="text-sky-300 bg-zinc-950 px-1 py-0.5 rounded font-mono font-bold">{targetVertical}</code>, and signal <code className="text-sky-300 bg-zinc-950 px-1 py-0.5 rounded font-mono font-bold">{intentSignal}</code>, with playbooks adapted to <code className="text-sky-300 bg-zinc-950 px-1 py-0.5 rounded font-mono font-bold">{playbookMode}</code>.
                    </div>
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* 1. Target Segment */}
                    <div className={`p-4 bg-[#12161B] border rounded-xl space-y-3 transition-all ${!isConfigLocked ? 'border-zinc-700' : 'border-zinc-800 opacity-85'}`}>
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-mono uppercase tracking-wider font-semibold">1. TARGET SEGMENT SCALE</label>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">Filters target firm employee size & revenue.</span>
                      </div>
                      <select
                        disabled={isConfigLocked}
                        value={targetSegment}
                        onChange={(e) => {
                          setTargetSegment(e.target.value as any);
                          setIsConfigLocked(false);
                        }}
                        className="w-full bg-[#0C0F12] border border-zinc-800 text-white rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono disabled:opacity-60"
                      >
                        <option value="enterprise">Enterprise (5000+ employees, $250k+ Contract Value)</option>
                        <option value="mid_market">Mid-Market (500-4999 employees, $100k-$250k Value)</option>
                        <option value="scale_up">Scale-Up (100-499 employees, $30k-$100k Value)</option>
                        <option value="startup">Startup (1-99 employees, $10k-$30k Value)</option>
                      </select>
                    </div>

                    {/* 2. Target Vertical */}
                    <div className={`p-4 bg-[#12161B] border rounded-xl space-y-3 transition-all ${!isConfigLocked ? 'border-zinc-700' : 'border-zinc-800 opacity-85'}`}>
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-mono uppercase tracking-wider font-semibold">2. TARGET VERTICAL SECTOR</label>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">Narrows the company sector and tech sphere.</span>
                      </div>
                      <select
                        disabled={isConfigLocked}
                        value={targetVertical}
                        onChange={(e) => {
                          setTargetVertical(e.target.value as any);
                          setIsConfigLocked(false);
                        }}
                        className="w-full bg-[#0C0F12] border border-zinc-800 text-white rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono disabled:opacity-60"
                      >
                        <option value="b2b_saas">B2B SaaS / Software Products</option>
                        <option value="fintech">FinTech / Digital Banking & Finance</option>
                        <option value="healthtech">HealthTech / Biotech & Digital Healthcare</option>
                        <option value="ai_infra">AI Infrastructure & LLM Ops</option>
                        <option value="agencies_services">Agencies & Managed Services</option>
                      </select>
                    </div>

                    {/* 3. Intent Signal */}
                    <div className={`p-4 bg-[#12161B] border rounded-xl space-y-3 transition-all ${!isConfigLocked ? 'border-zinc-700' : 'border-zinc-800 opacity-85'}`}>
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-mono uppercase tracking-wider font-semibold">3. INTENT SIGNAL TRIGGER</label>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">Identifies the trigger event motivating outreach.</span>
                      </div>
                      <select
                        disabled={isConfigLocked}
                        value={intentSignal}
                        onChange={(e) => {
                          setIntentSignal(e.target.value as any);
                          setIsConfigLocked(false);
                        }}
                        className="w-full bg-[#0C0F12] border border-zinc-800 text-white rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono disabled:opacity-60"
                      >
                        <option value="tech_stack_drift">Tech Stack Drift (Replacing frameworks/dependencies)</option>
                        <option value="executive_churn">Executive Churn (New platform leader appointed)</option>
                        <option value="funding_surge">Funding Surge (Fresh series or seed round closed)</option>
                        <option value="competitor_surge">Competitor Surge (Market pressure scaling requirement)</option>
                        <option value="hiring_spike">Hiring Spike (Hiring senior platform engineering roles)</option>
                      </select>
                    </div>

                    {/* 4. Playbook Mode */}
                    <div className={`p-4 bg-[#12161B] border rounded-xl space-y-3 transition-all ${!isConfigLocked ? 'border-zinc-700' : 'border-zinc-800 opacity-85'}`}>
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-mono uppercase tracking-wider font-semibold">4. PLAYBOOK MODE</label>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">Determines standard sequence campaign style.</span>
                      </div>
                      <select
                        disabled={isConfigLocked}
                        value={playbookMode}
                        onChange={(e) => {
                          setPlaybookMode(e.target.value as any);
                          setIsConfigLocked(false);
                        }}
                        className="w-full bg-[#0C0F12] border border-zinc-800 text-white rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono disabled:opacity-60"
                      >
                        <option value="cold_conquest">Cold Conquest (Net-new brand land campaign)</option>
                        <option value="expansion_cross">Expansion Cross-Sell (Add units inside existing logos)</option>
                        <option value="portfolio_partnership">Portfolio Partnership (Channel co-sell alignment)</option>
                        <option value="renewal_rescue">Renewal Rescue (Defensive risk avoidance campaign)</option>
                      </select>
                    </div>

                    {/* 5. Confidence Cutoff */}
                    <div className={`p-4 bg-[#12161B] border rounded-xl space-y-3 transition-all ${!isConfigLocked ? 'border-zinc-700' : 'border-zinc-800 opacity-85'}`}>
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-mono uppercase tracking-wider font-semibold">5. CONFIDENCE CUTOFF</label>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">Balances leads precision versus volume recall.</span>
                      </div>
                      <select
                        disabled={isConfigLocked}
                        value={confidenceCutoff}
                        onChange={(e) => {
                          setConfidenceCutoff(e.target.value as any);
                          setIsConfigLocked(false);
                        }}
                        className="w-full bg-[#0C0F12] border border-zinc-800 text-white rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono disabled:opacity-60"
                      >
                        <option value="strict">Strict (&ge; 90% confidence, ultra-high precision)</option>
                        <option value="balanced">Balanced (&ge; 75% confidence, recommended balance)</option>
                        <option value="aggressive">Aggressive (&ge; 50% confidence, maximum recall sweep)</option>
                      </select>
                    </div>

                    {/* 6. Processing Priority */}
                    <div className={`p-4 bg-[#12161B] border rounded-xl space-y-3 transition-all ${!isConfigLocked ? 'border-zinc-700' : 'border-zinc-800 opacity-85'}`}>
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-mono uppercase tracking-wider font-semibold">6. PROCESSING PRIORITY</label>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">Sets discovery loop processing priority class.</span>
                      </div>
                      <select
                        disabled={isConfigLocked}
                        value={processingPriority}
                        onChange={(e) => {
                          setProcessingPriority(e.target.value as any);
                          setIsConfigLocked(false);
                        }}
                        className="w-full bg-[#0C0F12] border border-zinc-800 text-white rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono disabled:opacity-60"
                      >
                        <option value="alpha">Alpha (Real-time urgent hot path)</option>
                        <option value="beta">Beta (Standard active scheduled sweep)</option>
                        <option value="gamma">Gamma (Background asynchronous low-cost path)</option>
                      </select>
                    </div>
                  </div>

                  {/* Actions Block */}
                  <div className="bg-[#12161B] border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-white uppercase font-mono">Parameters Save & Sync</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed max-w-xl font-sans">
                        To commit changes to the backend engine database, you must save and lock these parameters. Once locked, any subsequent proactive discovery sweeps will immediately run under these custom criteria constraints.
                      </p>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                      {!isConfigLocked && (
                        <button
                          type="button"
                          disabled={isSavingConfig}
                          onClick={fetchDiscoveryConfig}
                          className="flex-1 md:flex-initial px-6 py-2 bg-[#0C0F12] hover:bg-zinc-800 text-white border border-zinc-800 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-2"
                        >
                          Discard & Reset
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isSavingConfig || isConfigLocked}
                        onClick={handleSaveDiscoveryConfig}
                        className="flex-1 md:flex-initial px-6 py-2 bg-sky-500 hover:bg-sky-400 text-black rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSavingConfig ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving & Syncing...</span>
                          </>
                        ) : (
                          <>
                            <span>Save & Lock Search Parameters</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'compliance' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-zinc-800 pb-4 gap-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-sky-400" />
                        <span>Compliance & System Audit Center</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Track, capture, and display system verification results, architectural state, and master continuity review packs.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isLoadingCompliance}
                      onClick={fetchComplianceReport}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCompliance ? 'animate-spin' : ''}`} />
                      <span>Re-Audit System State</span>
                    </button>
                  </div>

                  {isLoadingCompliance ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
                      <p className="text-xs text-zinc-400 font-mono">Running automated compliance sweeps...</p>
                    </div>
                  ) : complianceReport ? (
                    <div className="space-y-6">
                      {/* Status Card & Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        
                        {/* 1. Status Check card */}
                        <div className={`p-5 rounded-xl border flex flex-col justify-between h-full relative overflow-hidden ${
                          complianceReport.build_summary.status === 'PASS' 
                            ? 'bg-emerald-500/5 border-emerald-500/20' 
                            : 'bg-rose-500/5 border-rose-500/20'
                        }`}>
                          <div>
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">System Status</span>
                            <div className="flex items-center gap-2 mt-2">
                              {complianceReport.build_summary.status === 'PASS' ? (
                                <>
                                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                  <span className="text-2xl font-bold text-emerald-400 tracking-tight font-mono">PASS</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" />
                                  <span className="text-2xl font-bold text-rose-400 tracking-tight font-mono">FAIL</span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                              {complianceReport.build_summary.status === 'PASS' 
                                ? 'No orphaned active nodes detected. Core Operating Law is fully satisfied.' 
                                : 'Orphaned nodes detected. Active nodes must possess a next action pointer or waiting/paused state link.'}
                            </p>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between text-[11px] font-mono">
                            <span className="text-zinc-500">Core Law Check</span>
                            <span className={complianceReport.build_summary.status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}>
                              {complianceReport.build_summary.status === 'PASS' ? '✔ COMPLIANT' : '⚠ NON-COMPLIANT'}
                            </span>
                          </div>
                        </div>

                        {/* 2. System State Metrics Card */}
                        <div className="p-5 bg-[#12161B] border border-zinc-800 rounded-xl flex flex-col justify-between h-full">
                          <div>
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Integrity Constraints</span>
                            
                            <div className="space-y-2.5 mt-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-400 font-sans">Active Opportunities:</span>
                                <span className="text-xs text-white font-mono font-bold bg-[#0C0F12] px-2 py-0.5 rounded border border-zinc-800">
                                  {complianceReport.system_state_validation.total_active_opportunities}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-400 font-sans">Orphaned Pointers:</span>
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                                  complianceReport.system_state_validation.orphaned_pointers_detected > 0
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    : 'bg-[#0C0F12] text-emerald-400 border-zinc-800'
                                }`}>
                                  {complianceReport.system_state_validation.orphaned_pointers_detected}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-400 font-sans">Watchdog Status:</span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  complianceReport.system_state_validation.watchdog_integrity === 'HEALTHY'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                  {complianceReport.system_state_validation.watchdog_integrity}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                            <span>Checked at:</span>
                            <span>{new Date(complianceReport.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {/* 3. Build & Mods summary */}
                        <div className="p-5 bg-[#12161B] border border-zinc-800 rounded-xl flex flex-col justify-between h-full">
                          <div>
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Scope Modifications Summary</span>
                            <div className="mt-2.5 space-y-1">
                              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Affected Files</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {complianceReport.build_summary.affected_files.map((file, i) => (
                                  <span key={i} className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                                    {file}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mt-3.5 space-y-1">
                              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Updates Implemented</span>
                              <ul className="list-disc pl-4 text-[11px] text-zinc-400 space-y-1">
                                {complianceReport.build_summary.changes_implemented.slice(0, 4).map((change, i) => (
                                  <li key={i} className="truncate max-w-[260px]">{change}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                            <span>Release build ID:</span>
                            <span className="text-zinc-400">{complianceReport.id.slice(0, 8)}</span>
                          </div>
                        </div>

                      </div>

                      {/* ChatGPT Review Pack Component */}
                      <div className="p-6 bg-[#0C0F12] border border-zinc-850 rounded-xl space-y-4 shadow-inner">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-0.5">
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                              <span>ChatGPT Review Pack</span>
                              <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] px-1.5 py-0.5 rounded font-normal font-mono normal-case">Standard Continuity Protocol</span>
                            </h3>
                            <p className="text-[11px] text-zinc-500">
                              Copy or download this text bundle to feed back into your assistant workspace to persist absolute cross-session memory state.
                            </p>
                          </div>

                          <div className="flex gap-2 w-full sm:w-auto self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(complianceReport.chatgpt_review_pack);
                                showFeedback('ChatGPT Review Pack copied to clipboard!', 'success');
                              }}
                              className="flex-1 sm:flex-initial px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 rounded-lg text-xs font-semibold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Pack</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const blob = new Blob([complianceReport.chatgpt_review_pack], { type: 'text/plain;charset=utf-8' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `moneyslave_v1_review_pack_${complianceReport.id.slice(0, 8)}.txt`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                showFeedback('Review Pack text file downloaded!', 'success');
                              }}
                              className="flex-1 sm:flex-initial px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-black rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Pack</span>
                            </button>
                          </div>
                        </div>

                        {/* Text Pack Container */}
                        <div className="relative">
                          <pre className="p-4 bg-black border border-zinc-900 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-[350px] leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800">
                            {complianceReport.chatgpt_review_pack}
                          </pre>
                        </div>
                      </div>

                      {/* Active Law Details Callout */}
                      <div className="p-4 bg-zinc-900/60 border border-zinc-800/85 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Core Law Rule Explanation</span>
                        </h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Under the <code className="text-zinc-250 bg-black/40 px-1 py-0.5 rounded font-mono">MoneySlave Revenue Engine Protocol</code>, every opportunity operating in the <code className="text-zinc-250 bg-black/40 px-1 py-0.5 rounded font-mono">active</code> stage must at all times be connected to a living operational action item or active wait list timer block. Nodes found suspended in active stage without clear pointer mappings representing active progression (next action) or expected follow-up triggers (wait state) are categorized as <span className="text-rose-400 font-semibold font-mono">Orphaned Nodes</span>. The watchdog automator runs sweeps periodically to alert operators or recover stalled nodes gracefully.
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-zinc-400 text-xs">
                      No compliance report found. Trigger a re-audit to run automated scans.
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
