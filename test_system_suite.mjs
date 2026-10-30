import crypto from 'crypto';

const API_BASE = 'http://localhost:5000';
const SECRET = 'teamsync_github_webhook_secret_2026';

function signPayload(bodyStr) {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(bodyStr);
  return `sha256=${hmac.digest('hex')}`;
}

async function runTests() {
  console.log('====================================================');
  console.log('  TeamSync Full Architectural Verification Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // --- TEST 1: Health & Connectivity ---
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    assert(res.status === 200 && data.status === 'ok', 'Health Check: Server is active and healthy');
  } catch (err) {
    assert(false, `Health Check failed: ${err.message}`);
  }

  // --- TEST 2: Fetch Tasks & Existing State ---
  let targetTask = null;
  try {
    const res = await fetch(`${API_BASE}/api/tasks`);
    const tasks = await res.json();
    assert(res.status === 200 && Array.isArray(tasks), `Tasks Endpoint: Fetched ${tasks.length} deliverables`);
    if (tasks.length > 0) {
      targetTask = tasks[0];
      assert(targetTask.status !== undefined, `Task Metadata: Field "status" is present (${targetTask.status})`);
      assert(targetTask.priority !== undefined, `Task Metadata: Field "priority" is present (${targetTask.priority})`);
    }
  } catch (err) {
    assert(false, `Tasks check failed: ${err.message}`);
  }

  // --- TEST 3: Webhook Security (Invalid HMAC Signature) ---
  try {
    const payload = JSON.stringify({ action: 'ping' });
    const res = await fetch(`${API_BASE}/api/webhooks/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': 'sha256=invalid_tampered_signature_12345',
        'X-GitHub-Delivery': `test_tamper_${Date.now()}`,
        'X-GitHub-Event': 'ping',
      },
      body: payload,
    });
    assert(res.status === 401, 'Webhook Security: Tampered HMAC signature correctly rejected with 401 Unauthorized');
  } catch (err) {
    assert(false, `HMAC check failed: ${err.message}`);
  }

  // --- TEST 4: Webhook Security (Missing Signature) ---
  try {
    const payload = JSON.stringify({ action: 'ping' });
    const res = await fetch(`${API_BASE}/api/webhooks/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Delivery': `test_nosig_${Date.now()}`,
        'X-GitHub-Event': 'ping',
      },
      body: payload,
    });
    assert(res.status === 401, 'Webhook Security: Missing signature header rejected with 401 Unauthorized');
  } catch (err) {
    assert(false, `Missing signature check failed: ${err.message}`);
  }

  // --- TEST 5: Webhook Ping Event (Authentic Signature) ---
  try {
    const payload = JSON.stringify({ zen: 'Keep it simple.', hook_id: 12345 });
    const signature = signPayload(payload);
    const res = await fetch(`${API_BASE}/api/webhooks/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': signature,
        'X-GitHub-Delivery': `test_ping_${Date.now()}`,
        'X-GitHub-Event': 'ping',
      },
      body: payload,
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Webhook Verification: Authentic Ping payload accepted with 200 OK');
  } catch (err) {
    assert(false, `Ping verification failed: ${err.message}`);
  }

  // --- TEST 6: Webhook PR Merge & Automatic Deliverable Transition ---
  const deliveryId = `test_delivery_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  if (targetTask) {
    try {
      const prPayload = JSON.stringify({
        action: 'closed',
        sender: { login: 'senior-engineer' },
        repository: { full_name: 'teamsync-org/collab-platform' },
        pull_request: {
          number: 142,
          title: `feat: complete implementation closes #${targetTask._id}`,
          body: `Resolves deliverable #${targetTask._id}\nReviewed and verified.`,
          html_url: 'https://github.com/teamsync-org/collab-platform/pull/142',
          merged: true,
          head: { ref: 'feature/pr-transition' },
          merged_by: { login: 'senior-engineer' },
        },
      });
      const prSignature = signPayload(prPayload);

      const res = await fetch(`${API_BASE}/api/webhooks/github`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': prSignature,
          'X-GitHub-Delivery': deliveryId,
          'X-GitHub-Event': 'pull_request',
        },
        body: prPayload,
      });
      const data = await res.json();

      assert(res.status === 200 && data.transitioned === true, `Webhook Automation: PR #142 automatically transitioned task "${targetTask.title}" to Done`);

      // Verify task in DB is now Done and has GitHub PR linked
      const verifyRes = await fetch(`${API_BASE}/api/tasks/${targetTask._id}`);
      const updatedTask = await verifyRes.json();
      assert(updatedTask.status === 'Done', `Task State Verification: Task status is now "${updatedTask.status}"`);
      assert(updatedTask.githubPrNumber === 142, `Task Metadata Verification: Linked to PR #${updatedTask.githubPrNumber}`);
    } catch (err) {
      assert(false, `PR merge transition failed: ${err.message}`);
    }
  }

  // --- TEST 7: Idempotency Guarantee (Replay Attack Prevention) ---
  try {
    const replayPayload = JSON.stringify({
      action: 'closed',
      sender: { login: 'senior-engineer' },
      repository: { full_name: 'teamsync-org/collab-platform' },
      pull_request: {
        number: 142,
        title: `Duplicate delivery test`,
        merged: true,
      },
    });
    const replaySignature = signPayload(replayPayload);

    // Send using the EXACT same deliveryId from TEST 6
    const res = await fetch(`${API_BASE}/api/webhooks/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': replaySignature,
        'X-GitHub-Delivery': deliveryId,
        'X-GitHub-Event': 'pull_request',
      },
      body: replayPayload,
    });
    const data = await res.json();

    assert(
      res.status === 200 && data.idempotent === true && data.duplicate === true,
      'Idempotency Engine: Duplicate delivery GUID detected. Replay skipped; zero redundant mutations executed.'
    );
  } catch (err) {
    assert(false, `Idempotency verification failed: ${err.message}`);
  }

  // --- TEST 8: RBAC Route Guard (Unauthenticated Access Denied) ---
  try {
    const res = await fetch(`${API_BASE}/api/audit-logs`);
    assert(res.status === 401, 'RBAC Middleware: Unauthenticated access to /api/audit-logs blocked with 401');
  } catch (err) {
    assert(false, `Audit log guard check failed: ${err.message}`);
  }

  try {
    const res = await fetch(`${API_BASE}/api/webhooks/deliveries`);
    assert(res.status === 401, 'RBAC Middleware: Unauthenticated access to /api/webhooks/deliveries blocked with 401');
  } catch (err) {
    assert(false, `Webhook deliveries guard check failed: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`  Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
}

runTests();
