/* ===== MODIT shared chrome: topbar, footer, AI assistant widget ===== */

const MODIT_NAV = [
  { href: "index.html", label: "Home" },
  { href: "categories.html", label: "Categories" },
  { href: "suppliers.html", label: "Suppliers" },
  { href: "quotation.html", label: "Quotation / BOQ" },
  { href: "ai-assistant.html", label: "Agentic AI" },
  { href: "dashboard.html", label: "Dashboard" },
];

function renderChrome(activeHref) {
  const header = document.getElementById("modit-header");
  if (header) {
    header.innerHTML = `
      <div class="topbar">
        <div class="wrap row">
          <a href="index.html" class="brand"><span class="mark"></span>MODIT
            <small>Delhi NCR · Building Materials</small>
          </a>
          <nav class="navlinks">
            ${MODIT_NAV.map(
              (n) =>
                `<a href="${n.href}" class="${n.href === activeHref ? "active" : ""}">${n.label}</a>`
            ).join("")}
          </nav>
          <div class="nav-actions">
            <span class="loc-pill"><span class="dot"></span>Delhi NCR</span>
            <a href="login.html" class="btn btn-outline btn-sm">Sign in</a>
            <a href="register-supplier.html" class="btn btn-amber btn-sm">List your business</a>
          </div>
        </div>
      </div>`;
  }

  const footer = document.getElementById("modit-footer");
  if (footer) {
    footer.innerHTML = `
      <footer>
        <div class="wrap">
          <div class="foot-grid">
            <div>
              <a href="index.html" class="brand" style="margin-bottom:14px;"><span class="mark"></span>MODIT</a>
              <p style="max-width:260px;">The agentic procurement layer for Delhi NCR's construction supply chain — discover, compare, order and track building materials in one place.</p>
            </div>
            <div>
              <h5>Materials</h5>
              <ul>
                <li><a href="categories.html">Cement &amp; concrete</a></li>
                <li><a href="categories.html">Steel &amp; TMT</a></li>
                <li><a href="categories.html">Sand &amp; aggregate</a></li>
                <li><a href="categories.html">Tiles &amp; sanitary</a></li>
                <li><a href="categories.html">Paint &amp; finishing</a></li>
              </ul>
            </div>
            <div>
              <h5>Platform</h5>
              <ul>
                <li><a href="suppliers.html">Suppliers near you</a></li>
                <li><a href="quotation.html">Bulk quotation / BOQ</a></li>
                <li><a href="dashboard.html">Supplier dashboard</a></li>
                <li><a href="register-supplier.html">Become a supplier</a></li>
                <li><a href="ai-assistant.html">Agentic AI assistant</a></li>
              </ul>
            </div>
            <div>
              <h5>Company</h5>
              <ul>
                <li><a href="#">About MODIT</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Help centre</a></li>
              </ul>
            </div>
            <div>
              <h5>Service area</h5>
              <ul>
                <li>Delhi</li>
                <li>Gurugram</li>
                <li>Noida &amp; Greater Noida</li>
                <li>Faridabad · Ghaziabad</li>
              </ul>
            </div>
          </div>
          <div class="foot-bottom">
            <span>© 2026 MODIT. Prototype concept — not a live commercial product.</span>
            <span>GSTIN-ready billing · BNPL workflow concept · Built for Delhi NCR</span>
          </div>
        </div>
      </footer>`;
  }

  injectAIWidget();
}

/* ---------------- Agentic AI floating assistant (demo) ---------------- */
function injectAIWidget() {
  if (document.getElementById("modit-ai-fab")) return;

  const fab = document.createElement("button");
  fab.id = "modit-ai-fab";
  fab.className = "ai-fab";
  fab.title = "MODIT Agentic AI";
  fab.innerHTML = "✦";
  document.body.appendChild(fab);

  const panel = document.createElement("div");
  panel.id = "modit-ai-panel";
  panel.className = "ai-panel";
  panel.innerHTML = `
    <div class="ai-panel-head">
      <div><b>MODIT Agent</b><div class="sub">● Live · search · negotiate · order · track</div></div>
      <button id="modit-ai-close">✕</button>
    </div>
    <div class="ai-body" id="modit-ai-body">
      <div class="msg bot">Namaste 👋 I'm the MODIT procurement agent. Tell me your project and I'll find, compare and quote materials from verified Delhi NCR suppliers — and I can place the order once you approve.</div>
    </div>
    <div class="ai-suggest">
      <button data-q="Recommend material for a 2BHK flat in Noida">Recommend for 2BHK</button>
      <button data-q="Compare cement prices near Gurugram">Compare cement prices</button>
      <button data-q="Read my BOQ file and generate a list">Read my BOQ</button>
      <button data-q="Negotiate steel price with vendor">Negotiate price</button>
    </div>
    <div class="ai-input">
      <input id="modit-ai-input" type="text" placeholder="Ask the agent or paste a requirement..." />
      <button id="modit-ai-send">➤</button>
    </div>`;
  document.body.appendChild(panel);

  fab.addEventListener("click", () => panel.classList.toggle("open"));
  document.getElementById("modit-ai-close").addEventListener("click", () =>
    panel.classList.remove("open")
  );

  const body = document.getElementById("modit-ai-body");
  const input = document.getElementById("modit-ai-input");

  function addMsg(text, who) {
    const m = document.createElement("div");
    m.className = "msg " + who;
    m.textContent = text;
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
  }

  async function ask(text) {
    addMsg(text, "user");
    addMsg("Working on it…", "bot");
    try {
      const res = await fetch("http://localhost:4000/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();
      body.lastChild.remove();
      addMsg(data.reply, "bot");
    } catch (e) {
      body.lastChild.remove();
      addMsg(mockAgentReply(text), "bot");
    }
  }

  document.getElementById("modit-ai-send").addEventListener("click", () => {
    if (!input.value.trim()) return;
    ask(input.value.trim());
    input.value = "";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      ask(input.value.trim());
      input.value = "";
    }
  });
  panel.querySelectorAll(".ai-suggest button").forEach((b) =>
    b.addEventListener("click", () => ask(b.dataset.q))
  );
}

/* Offline fallback so the demo still feels alive without the backend running */
function mockAgentReply(q) {
  const text = q.toLowerCase();
  if (text.includes("recommend"))
    return "For a 2BHK in Noida (~950 sqft), I'd suggest OPC 43-grade cement, Fe500D TMT bars, vitrified tiles (600x600) and CPVC plumbing. Want me to pull live prices from 3 nearby suppliers?";
  if (text.includes("compare") || text.includes("price"))
    return "Comparing UltraTech, Shree Cement & JK Lakshmi near Gurugram: ₹372, ₹365, ₹380 per bag respectively (incl. delivery). Shree Cement offers fastest 24h dispatch. Shall I request a formal quotation?";
  if (text.includes("boq") || text.includes("upload"))
    return "Upload your BOQ/Excel/PDF on the Quotation page and I'll extract line items, match them to live SKUs and generate a consolidated multi-vendor quote automatically.";
  if (text.includes("negotiate"))
    return "I've sent a counter-offer of ₹61,500/MT to 2 TMT suppliers (market avg ₹63,200/MT) citing your 40MT order volume. I'll notify you when they respond — usually within 2 hours.";
  if (text.includes("track") || text.includes("delivery"))
    return "Your last order (#MD-10234, 200 cement bags) is out for delivery — ETA 38 minutes, currently 4.2 km from your Sector-62 site.";
  return "Got it — I can search materials, compare vendor quotes, negotiate pricing, place orders and track delivery for you. Try: 'Compare TMT bar prices in Noida' or upload a BOQ on the Quotation page.";
}

document.addEventListener("DOMContentLoaded", () => {
  renderChrome(document.body.dataset.active || "");
});
