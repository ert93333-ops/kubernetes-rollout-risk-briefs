const PRODUCT = "Kubernetes Rollout Risk Briefs";
const STORAGE_PREFIX = "kubernetesrolloutriskbriefs";
const ISSUE_URL = "https://github.com/ert93333-ops/kubernetes-rollout-risk-briefs/issues/new?template=demo_request.md&labels=early-access%2Cpurchase-intent%2Cdemo-request&title=Early%20access%20request%3A%20Kubernetes%20Rollout%20Risk%20Briefs";

const fields = {
  notes: document.querySelector("#rollout-notes"),
  scope: document.querySelector("#scope-notes"),
  strategy: document.querySelector("#strategy-notes"),
  probes: document.querySelector("#probe-notes"),
  changes: document.querySelector("#change-notes"),
  rollback: document.querySelector("#rollback-notes"),
  validation: document.querySelector("#validation-notes"),
  owner: document.querySelector("#owner-notes"),
  privacy: document.querySelector("#privacy-notes"),
};

const output = document.querySelector("#brief-output");
const outputStatus = document.querySelector("#output-status");
const workflowError = document.querySelector("#workflow-error");
const copyButton = document.querySelector("#copy-brief");
const copyStatus = document.querySelector("#copy-status");
const intentForm = document.querySelector("#intent-form");
const intentStatus = document.querySelector("#intent-status");
const remoteIntent = document.querySelector("#remote-intent");
const remoteIntentLink = document.querySelector("#remote-intent-link");
const remoteCopyButton = document.querySelector("#copy-remote-intent");
const remoteCopyStatus = document.querySelector("#remote-copy-status");

let lastBriefText = "";
let selectedPlan = "Starter";
let lastRemoteBody = "";

function track(event, detail = {}) {
  const payload = {
    event,
    detail,
    page: window.location.pathname,
    utm: Object.fromEntries(new URLSearchParams(window.location.search)),
    at: new Date().toISOString(),
  };
  const key = `${STORAGE_PREFIX}_analytics_events`;
  const events = JSON.parse(localStorage.getItem(key) || "[]");
  events.push(payload);
  localStorage.setItem(key, JSON.stringify(events.slice(-200)));
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function fieldText() {
  return Object.fromEntries(Object.entries(fields).map(([key, element]) => [key, element.value.trim()]));
}

function combinedText(values) {
  return Object.values(values).join("\n").toLowerCase();
}

function missingChecks(values) {
  const all = combinedText(values);
  const scopeText = `${values.notes} ${values.scope}`.toLowerCase();
  const strategyText = `${values.notes} ${values.strategy}`.toLowerCase();
  const probeText = `${values.notes} ${values.probes}`.toLowerCase();
  const changeText = `${values.notes} ${values.changes}`.toLowerCase();
  const rollbackText = `${values.notes} ${values.rollback}`.toLowerCase();
  const validationText = `${values.validation} ${values.owner}`.toLowerCase();

  const checks = [
    {
      label: "missing namespace, workload, deployment/statefulset/daemonset, image, tag, replica, or service scope:",
      ok: hasAny(scopeText, [/\bnamespace\b/, /\bdeployment\b/, /\bstatefulset\b/, /\bdaemonset\b/, /\bworkload\b/, /\bimage\b/, /\btag\b/, /\breplica(s)?\b/, /\bservice\b/, /\bcontainer\b/, /\bpod(s)?\b/]),
    },
    {
      label: "missing rollout strategy, max surge, max unavailable, availability, or PDB/disruption context:",
      ok: hasAny(strategyText, [/\brollingupdate\b/, /\brolling update\b/, /\bstrategy\b/, /\bmaxsurge\b/, /\bmax surge\b/, /\bmaxunavailable\b/, /\bmax unavailable\b/, /\bavailable\b/, /\bunavailable\b/, /\bpdb\b/, /\bpoddisruptionbudget\b/, /\bdisruption\b/, /\bminavailable\b/]),
    },
    {
      label: "missing readiness, liveness, or startup probe context:",
      ok: hasAny(probeText, [/\breadiness\b/, /\bliveness\b/, /\bstartup\b/, /\bprobe\b/, /\bhealth check\b/, /\bhttpget\b/, /\bexec\b/, /\btcpSocket\b/]),
    },
    {
      label: "missing config map, secret, env, volume, service, ingress, resource, HPA, or scheduling change note:",
      ok: hasAny(changeText, [/\bconfigmap\b/, /\bconfig map\b/, /\bsecret\b/, /\benv\b/, /\bvolume\b/, /\bingress\b/, /\bservice\b/, /\bresources?\b/, /\bcpu\b/, /\bmemory\b/, /\bhpa\b/, /\bhorizontalpodautoscaler\b/, /\bnodeaffinity\b/, /\baffinity\b/, /\btoleration\b/, /\bselector\b/]),
    },
    {
      label: "missing rollback command, revision, previous image/tag, rollout undo, or rollback owner plan:",
      ok: hasAny(rollbackText, [/\brollback\b/, /\brollout undo\b/, /\bkubectl rollout undo\b/, /\brevision\b/, /\bprevious image\b/, /\bprevious tag\b/, /\brestore\b/, /\brevert\b/, /\blast known good\b/]),
    },
    {
      label: "missing validation, smoke test, health check, monitor, or rollout status path:",
      ok: hasAny(validationText, [/\bvalidate\b/, /\bvalidation\b/, /\bsmoke test\b/, /\bhealth check\b/, /\bmonitor\b/, /\bmetrics\b/, /\blogs\b/, /\brollout status\b/, /\bkubectl rollout status\b/, /\balert\b/, /\bdashboard\b/]),
    },
    {
      label: "missing owner, reviewer, approver, maintenance window, escalation, or next update:",
      ok: hasAny(`${values.notes} ${values.owner}`.toLowerCase(), [/\bowner\b/, /\breviewer\b/, /\bapprover\b/, /\bapproval\b/, /\bmaintenance window\b/, /\bchange window\b/, /\bescalat(e|ion)\b/, /\bnext update\b/, /\bby \d{1,2}:\d{2}\b/, /\butc\b/, /\brelease lead\b/]),
    },
  ];

  const unsafeWording = hasAny(all, [/\bzero downtime guaranteed\b/, /\bguaranteed zero downtime\b/, /\binstant rollback\b/, /\brollback instantly\b/, /\bno risk\b/, /\bnothing can go wrong\b/, /\bobviously safe\b/, /\bjust deploy\b/, /\bcustomer fault\b/, /\byour fault\b/]);
  const privateRisk = hasAny(all, [/\bkubeconfig\b/, /\bclient-certificate-data\b/, /\bclient-key-data\b/, /\bcertificate-authority-data\b/, /\bbearer token\b/, /\bserviceaccount token\b/, /\bcluster endpoint\b/, /\braw log\b/, /\bsecret manifest\b/, /\bsecretkeyref\b/, /\bstringdata\b/, /\bkind:\s*secret\b/, /\bprivate key\b/, /\bpassword\b/, /\binternal url\b/, /\bcustomer namespace\b/, /\bpersonal email\b/]);

  const warnings = checks.filter((check) => !check.ok).map((check) => check.label);
  if (unsafeWording) warnings.push("unsafe zero-downtime, instant-rollback, customer-blame, no-risk, or overconfident wording:");
  if (privateRisk) warnings.push("private kubeconfig, token, certificate, secret manifest, raw log, cluster endpoint, internal URL, customer namespace, or personal data risk:");
  return warnings;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function line(label, value, fallback) {
  return `<li><strong>${label}:</strong> ${escapeHtml(value || fallback)}</li>`;
}

function buildBrief(values) {
  const warnings = missingChecks(values);
  const noticeOutline = [
    "Name namespace, workload kind/name, service, image, tag, replica count, and customer/service scope.",
    "State rollout strategy, availability constraints, max surge/unavailable, and PDB or disruption context.",
    "Call out readiness/liveness/startup probe status and any config, secret, env, resource, ingress, HPA, or scheduling changes.",
    "Write the rollback plan with previous image or revision and the human owner for rollback approval.",
    "List validation: rollout status, health checks, smoke tests, metrics, alerts, owner, reviewer, and next update.",
  ];

  output.innerHTML = `
    <h3>Kubernetes rollout risk brief ready</h3>
    <h4>Parse summary</h4>
    <ul>
      ${line("Rollout scope", values.scope, "Needs namespace, workload, image/tag, replica, and service scope.")}
      ${line("Strategy and disruption", values.strategy, "Needs rollout strategy, max surge/unavailable, availability, or PDB context.")}
      ${line("Probe readiness", values.probes, "Needs readiness, liveness, startup probe, or health check context.")}
      ${line("Change surface", values.changes, "Needs config, secret, env, volume, service, ingress, resource, HPA, or scheduling notes.")}
      ${line("Rollback plan", values.rollback, "Needs revision, previous image/tag, rollout undo, restore, or revert path.")}
    </ul>
    <h4>Missing context and risk warnings</h4>
    ${warnings.length ? `<ul>${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>` : "<p>No major missing context detected in the public-safe fields.</p>"}
    <h4>Reviewer-ready rollout outline</h4>
    <ol>${noticeOutline.map((item) => `<li>${item}</li>`).join("")}</ol>
    <h4>Validation and rollback handoff</h4>
    <p>${escapeHtml(values.validation || "Add rollout status, health checks, smoke tests, metrics, alerts, and monitoring owner.")}</p>
    <p>${escapeHtml(values.rollback || "Add rollback command, revision or previous image, approval owner, and rollback validation path.")}</p>
    <h4>Owner and approval path</h4>
    <p>${escapeHtml(values.owner || "Set a named platform/SRE owner, reviewer, approver, escalation path, and next-update time.")}</p>
  `;

  lastBriefText = output.innerText;
  outputStatus.textContent = warnings.length ? `${warnings.length} issue(s) to review` : "Brief ready";
  copyButton.disabled = false;
  track("brief_generated", { warningCount: warnings.length });
  track("core_action_completed", { warningCount: warnings.length });
}

function generateBrief() {
  workflowError.textContent = "";
  const values = fieldText();
  if (!values.notes) {
    workflowError.textContent = "Paste public-safe Kubernetes rollout notes first.";
    track("brief_generation_failed", { reason: "empty_rollout_notes" });
    return;
  }
  track("core_action_started", { triggerSource: "generate_button" });
  buildBrief(values);
}

async function copyText(text, statusElement, success) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  statusElement.textContent = success;
}

function loadSample() {
  fields.notes.value = "Roll out payment-api image v2.7.4 to production at 10:00 UTC with canary monitoring before full rollout.";
  fields.scope.value = "Namespace payments; Deployment payment-api; Service payment-api; image registry.example/payment-api:v2.7.4; 6 replicas.";
  fields.strategy.value = "RollingUpdate strategy with maxSurge 1 and maxUnavailable 0; PDB minAvailable 5; maintenance window 10:00-10:30 UTC.";
  fields.probes.value = "Readiness probe checks /ready; liveness probe checks /healthz; startup probe unchanged.";
  fields.changes.value = "ConfigMap payment-api-config and env var timeout changed; CPU/memory requests unchanged; no ingress or HPA change.";
  fields.rollback.value = "Rollback plan: kubectl rollout undo deployment/payment-api --to-revision=41 after release lead approval; previous image v2.7.3.";
  fields.validation.value = "Run kubectl rollout status, synthetic checkout smoke test, 5xx/error-rate dashboard, latency alerts, and pod restart monitor.";
  fields.owner.value = "Platform release lead owns rollout; SRE reviewer approves; next update by 10:15 UTC.";
  fields.privacy.value = "Public-safe notes only; private identifiers and sensitive cluster details are excluded.";
  track("sample_loaded", { sample: "payment_api_rollout" });
}

const pathName = window.location.pathname;
track("page_view");
if (pathName === "/" || pathName.endsWith("/") || pathName.endsWith("/index.html")) track("landing_viewed");
if (pathName.endsWith("kubernetes-rollout-checklist.html")) {
  track("template_opened");
  track("seo_page_viewed");
}

if (document.querySelector("#generate-button")) {
  document.querySelector("#generate-button").addEventListener("click", generateBrief);
  document.querySelector("#sample-button").addEventListener("click", loadSample);
  copyButton.addEventListener("click", () => {
    copyText(lastBriefText, copyStatus, "Copied rollout risk brief.");
    track("copy_brief_clicked");
  });

  document.querySelectorAll(".plan-button").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPlan = button.dataset.plan;
      document.querySelector("#plan-interest").value = selectedPlan;
      track("plan_selected", { plan: selectedPlan });
      track("pricing_viewed", { plan: selectedPlan });
      intentForm.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  intentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    track("signup_started", { plan: selectedPlan });
    const intent = {
      email: document.querySelector("#intent-email").value.trim(),
      role: document.querySelector("#intent-role").value.trim(),
      volume: document.querySelector("#rollout-volume").value.trim(),
      process: document.querySelector("#current-process").value.trim(),
      plan: document.querySelector("#plan-interest").value,
      willingness: document.querySelector("#willingness").value.trim(),
      at: new Date().toISOString(),
    };
    const key = `${STORAGE_PREFIX}_purchase_intents`;
    const intents = JSON.parse(localStorage.getItem(key) || "[]");
    intents.push(intent);
    localStorage.setItem(key, JSON.stringify(intents.slice(-50)));
    lastRemoteBody = [
      "Public early access request for Kubernetes Rollout Risk Briefs.",
      "",
      `Role/team: ${intent.role || "[not provided]"}`,
      `Rollout review volume: ${intent.volume || "[not provided]"}`,
      `Current rollout review process: ${intent.process || "[not provided]"}`,
      `Plan interest: ${intent.plan}`,
      `Willingness to pay: ${intent.willingness || "[not provided]"}`,
      "",
      "Do not include kubeconfig, tokens, secret manifests, raw logs, cluster endpoints, customer namespaces, internal URLs, personal data, or email addresses in this public issue.",
    ].join("\n");
    remoteIntentLink.href = `${ISSUE_URL}&body=${encodeURIComponent(lastRemoteBody)}`;
    remoteIntent.hidden = false;
    intentStatus.textContent = "You are on the early access list. Open or copy the public request if you want remote follow-up.";
    track("purchase_intent_submitted", { plan: intent.plan, hasEmail: Boolean(intent.email) });
    track("waitlist_submitted", { plan: intent.plan });
    track("signup_completed", { plan: intent.plan });
    track("remote_intent_ready", { includesEmail: false });
  });

  remoteCopyButton.addEventListener("click", () => {
    copyText(lastRemoteBody, remoteCopyStatus, "Copied request details.");
    track("remote_intent_copied");
  });

  document.querySelectorAll('a[href="#workflow"]').forEach((link) => {
    link.addEventListener("click", () => track("cta_clicked", { triggerSource: "workflow_anchor" }));
  });
}
