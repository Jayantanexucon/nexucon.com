const metrics = [
  ["40%", "COST OPTIMIZATION", "Average delivery overhead reduction"],
  ["72hr", "TIME TO ACCELERATE", "From brief to a working system"],
  ["14+", "PLATFORM EXPERTISE", "Enterprise stacks we work across"],
  ["$500M+", "FINANCIAL IMPACT", "Value influenced through delivery"],
];

const capabilities = [
  ["▣", "SAP Modernization", "Evolve landscapes, integrations, and operations without interrupting the business.", "SAP S/4HANA · BTP · Integration"],
  ["◉", "AI & Data Analytics", "Turn fragmented information into intelligent decisions your teams can act on.", "Data platforms · AI · Automation"],
  ["◌", "Cloud Infrastructure & CloudCraft", "Build resilient, observable foundations for products that need to move quickly.", "Cloud native · DevOps · FinOps"],
  ["λ", "Enterprise Modernization", "Retire yesterday's constraints and make the core ready for tomorrow's velocity.", "Architecture · APIs · Platforms"],
];

const solutions = [
  ["01", "Application Dev & Maintenance", "Extend critical products with a dependable engineering partner."],
  ["02", "24/7 Tier-3 Production Support", "Keep the systems behind the business calm, available, and improving."],
  ["03", "Cloud Migration & Analytics", "Move workloads and make the new operating model measurable."],
  ["04", "Upgrade & Architecture Refactor", "Remove complexity before it becomes the next incident."],
  ["05", "Strategic IT Advisory", "A clear technical point of view for consequential decisions."],
  ["06", "24/7 Staff Augmentation Pods", "Experienced teams that plug into your delivery rhythm."],
];

function Logo() {
  return <span className="brand-mark"><span>NEXU</span>CON</span>;
}

function Arrow() {
  return <span aria-hidden="true" className="arrow">↗</span>;
}

export default function Home() {
  return (
    <main className="nexucon-site">
      <nav className="site-nav" aria-label="Primary navigation">
        <a href="#top" className="logo-link"><Logo /><small>ENGINEERING THE<br />INTELLIGENT ENTERPRISE</small></a>
        <div className="nav-links">
          <a href="#work">Overview</a><a href="#capabilities">Services</a><a href="#approach">AI &amp; Automation</a><a href="#industries">Industries</a>
        </div>
        <div className="nav-actions"><a href="#contact">Advisory <span>↗</span><br />Contact</a><a href="#contact" className="nav-cta">Connect with<br />an Architect <Arrow /></a></div>
      </nav>

      <section id="top" className="hero section-shell">
        <div className="eyebrow"><i /> SYSTEMS THAT SCALE WITH AMBITION <b>01 / 05</b></div>
        <h1>Architecting Autonomous<br />Enterprise Systems <em>&amp; SAP, AI &amp;<br />Autonomous Cloud.</em></h1>
        <p className="hero-copy">Nexucon scales and engineers SAP, AI &amp; advanced automation to reinvent real-world data,<br className="desktop-only" /> analytics, and decision-making for global businesses.</p>
        <div className="hero-actions"><a className="button button-primary" href="#contact">Initiate Advisory <Arrow /></a><a className="button button-ghost" href="#work">Explore System Practices <Arrow /></a></div>
        <div className="hero-visual" aria-label="Abstract enterprise system dashboard">
          <div className="visual-topline"><span>● LIVE SYSTEM / 08:42:10 UTC</span><span>NETWORK SIGNAL: OPTIMAL</span></div>
          <div className="visual-core"><div className="core-orbit orbit-one" /><div className="core-orbit orbit-two" /><div className="core-node">NX<br /><small>CORE</small></div><div className="core-label label-a">DATA FLOW<br /><b>99.98%</b></div><div className="core-label label-b">AI ENGINE<br /><b>ACTIVE</b></div></div>
          <div className="visual-footer"><span>◈ REAL-TIME OPERATIONS</span><span>ARTIFICIAL INTELLIGENCE / CLOUD ORCHESTRATION</span></div>
        </div>
        <div className="signal-panel">
          <div className="signal-header"><strong><i /> CORE OPERATIONS</strong><span>LIVE SYSTEM: 24 NODES <b>↗ 08.4%</b></span></div>
          <div className="signal-grid">{["AI / DATA LAKE", "CLOUD FABRIC", "SAP CORE", "AUTOMATION"].map((name, index) => <div key={name}><span>{name}</span><b>{["6.8M", "MULTI-CLOUD", "AGENTIC V3", "2,400"][index]}</b><i style={{ "--bar": `${[74, 90, 58, 83][index]}%` } as React.CSSProperties} /></div>)}</div>
          <div className="signal-wave"><span>PROFILE TELEMETRY: <b>STEADY STATE / 99.98% UPTIME</b></span><svg viewBox="0 0 260 30" role="img" aria-label="Telemetry wave"><path d="M0 15 C15 4 28 25 43 15 S71 5 86 15 S114 25 129 15 S157 4 172 15 S200 25 215 15 S243 5 260 15" /></svg><span>CORE: 200+ &nbsp; // &nbsp; NEXT-AUTO</span></div>
        </div>
      </section>

      <section className="metrics section-shell">{metrics.map(([value, label, detail]) => <article key={label}><strong>{value}</strong><span>{label}</span><p>{detail}</p></article>)}</section>

      <section id="capabilities" className="section-shell content-section"><div className="section-heading"><div><div className="eyebrow"><i /> CAPABILITY SYSTEMS</div><h2>Deterministic Systems.<br /><em>Uncompromising Scale.</em></h2></div><p>High-velocity architecture engineered for intelligent, resilient organizations.</p></div><div className="capability-grid">{capabilities.map(([icon, title, text, tags]) => <article className="capability-card" key={title}><span className="card-icon">{icon}</span><span className="card-label">{tags}</span><h3>{title}</h3><p>{text}</p><a href="#contact">MAP SYSTEM <Arrow /></a></article>)}</div></section>

      <section id="approach" className="contrast-band"><div className="section-shell"><div className="section-heading"><div><div className="eyebrow"><i /> THE NEXUCON APPROACH</div><h2>Legacy Systems <span>vs.</span> Nexucon<br /><em>Neural Velocity</em></h2></div><p>How we transform complexity into a connected system that compounds capability.</p></div><div className="compare-grid"><article className="compare-card old"><span>TRADITIONAL IT DYNAMICS</span><h3>Slow-Cycle Consulting</h3>{["3–6 Month Onboarding Lead Time", "Manual Ticket-Based Resolution", "Fragmented Architecture & Silos"].map((item) => <p key={item}>× <b>{item}</b><br /><small>Process friction compounds at every handoff.</small></p>)}</article><article className="compare-card new"><span>THE NEXUCON PROTOCOL</span><h3>Autonomous Machine-First Execution</h3>{["22–Hour Rapid Pod Deployment", "AI-Powered Predictive Observability", "Continuous Optimization Loops"].map((item) => <p key={item}>✦ <b>{item}</b><br /><small>Systems learn, respond, and improve continuously.</small></p>)}</article></div></div></section>

      <section id="work" className="section-shell content-section"><div className="section-heading"><div><div className="eyebrow"><i /> ENTERPRISE DELIVERY SYSTEM</div><h2>Specialized Practice <em>Solutions</em></h2></div><p>Engineered modular systems for high-stakes digital transformation and core operations.</p></div><div id="industries" className="solutions-grid">{solutions.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p><a href="#contact">VIEW SYSTEM <Arrow /></a></article>)}</div></section>

      <section className="quote-band section-shell"><div className="quote-portrait"><div className="portrait-grid" /><span>NX</span><small>NUCLEI / CHEMICAL<br />PLATFORM REFERENCE</small></div><div className="quote-copy"><b>99</b><blockquote>“Nexucon reduced our Azure cloud transformation with zero unplanned downtime across 14 global territories. Their automated orchestration cut our multi-million dollar cloud infrastructure expenditure by 38% in the first quarter alone while drastically improving our end-user experience.”</blockquote><div className="quote-meta"><span>ENTERPRISE SCORE<br /><b>4.8 / 5.0</b></span><span>DELIVERY VELOCITY<br /><b>72hr PODS</b></span><span>DATA SYSTEMS<br /><b>99.98% UPTIME</b></span></div></div></section>

      <section id="contact" className="contact-section section-shell"><div><div className="eyebrow"><i /> OPERATE TOGETHER</div><h2>Consult a Principal<br /><em>Enterprise Architect</em></h2><p>Schedule a 30-minute working session. We will map your bottleneck, your decision horizon, and the fastest path to a system that compounds.</p><div className="contact-details"><a href="mailto:architect@nexucon.com">▣ &nbsp; architect@nexucon.com</a><a href="tel:+442081234567">▣ &nbsp; +44 20 8123 4567</a><a href="#contact">▣ &nbsp; 20 Fenchurch Street, London EC3M</a></div></div><form><div className="form-top"><span>◉ ARCHITECTURE BRIEF / v1.4</span><small>RESPONSE: &lt; 48H</small></div><label>Name<input name="name" placeholder="Your name" /></label><label>Work email<input name="email" type="email" placeholder="you@company.com" /></label><label>Primary system<select name="system" defaultValue=""><option value="" disabled>Select a focus area</option><option>SAP modernization</option><option>AI &amp; data systems</option><option>Cloud infrastructure</option></select></label><label>What are you solving?<textarea name="message" rows={3} placeholder="Tell us where the system is under pressure..." /></label><button type="button" className="button button-primary">Dispatch Architecture Consultation <Arrow /></button></form></section>

      <footer className="site-footer section-shell"><div><a href="#top" className="logo-link"><Logo /></a><p>High-performance enterprise systems for a world that moves at machine speed.</p><small>© 2026 Nexucon. All systems operational.</small></div><div><b>PRACTICE DOMAINS</b><a href="#capabilities">SAP &amp; ERP</a><a href="#capabilities">AI &amp; Data</a><a href="#capabilities">Cloud Systems</a></div><div><b>ENTERPRISE COMPLIANCE</b><a href="#contact">ISO 27001 · SOC 2</a><a href="#contact">GDPR · Zero Trust</a><a href="#contact">Security protocols</a></div><div><b>GLOBAL HEADQUARTERS</b><span>London · New York · Singapore</span><span>24/7 Operations Network</span></div></footer>
    </main>
  );
}
