:root {
  --navy: #1a2440;
  --blue: #2563eb;
  --gold: #b8923d;
  --green: #16a34a;
  --amber: #d97706;
  --red: #dc2626;
  --bg: #f5f6f8;
  --card: #ffffff;
  --border: #e5e7eb;
  --text: #1f2937;
  --muted: #6b7280;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }

.container { max-width: 1200px; margin: 0 auto; padding: 24px; }

/* Login */
.auth-wrap { min-height: 100vh; display: grid; place-items: center; background: var(--navy); padding: 24px; }
.auth-card { width: 100%; max-width: 380px; background: var(--card); border-radius: 14px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,.25); }
.auth-logo { font-weight: 800; font-size: 22px; color: var(--navy); margin-bottom: 4px; }
.auth-logo span { color: var(--gold); }
.auth-sub { color: var(--muted); font-size: 13px; margin-bottom: 24px; }
.field { margin-bottom: 14px; }
.field label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--navy); }
.field input { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; }
.field input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.btn { width: 100%; padding: 11px; background: var(--blue); color: #fff; border: 0; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; }
.btn:hover { background: #1d4ed8; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.auth-note { font-size: 12px; color: var(--muted); margin-top: 16px; text-align: center; }
.auth-error { background: #fef2f2; color: var(--red); font-size: 13px; padding: 8px 12px; border-radius: 8px; margin-bottom: 14px; }

/* Layout / topbar / sidebar */
.topbar { background: var(--navy); color: #fff; padding: 0 24px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
.topbar .brand { font-weight: 800; }
.topbar .brand span { color: var(--gold); }
.topbar .right { display: flex; align-items: center; gap: 16px; font-size: 14px; }
.logout { background: rgba(255,255,255,.12); color: #fff; border: 0; padding: 7px 14px; border-radius: 7px; cursor: pointer; font-size: 13px; }
.logout:hover { background: rgba(255,255,255,.22); }

.page-title { font-size: 22px; font-weight: 800; color: var(--navy); margin-bottom: 4px; }
.page-sub { color: var(--muted); font-size: 14px; margin-bottom: 20px; }

/* Metric cards */
.metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
.metric { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
.metric .label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.metric .value { font-size: 28px; font-weight: 800; color: var(--navy); margin-top: 6px; }

/* Table / cards */
.card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; color: var(--muted); padding: 12px 16px; border-bottom: 1px solid var(--border); }
td { padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 14px; }
tr:last-child td { border-bottom: 0; }
tr:hover td { background: #fafafa; }

/* Badges */
.badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge-verified { background: #dcfce7; color: #15803d; }
.badge-caution { background: #fef3c7; color: #b45309; }
.badge-risk { background: #fee2e2; color: #b91c1c; }
.badge-neutral { background: #eef2ff; color: #3730a3; }

/* DISC bars */
.disc { display: flex; flex-direction: column; gap: 8px; max-width: 320px; }
.disc-row { display: grid; grid-template-columns: 24px 1fr 44px; align-items: center; gap: 10px; font-size: 13px; }
.disc-track { height: 10px; background: #eef0f4; border-radius: 999px; overflow: hidden; }
.disc-fill { height: 100%; border-radius: 999px; }

.empty { padding: 48px; text-align: center; color: var(--muted); }
.back { color: var(--blue); font-size: 14px; font-weight: 600; margin-bottom: 16px; display: inline-block; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 720px) { .grid2 { grid-template-columns: 1fr; } }
.section-title { font-size: 15px; font-weight: 700; color: var(--navy); margin: 0 0 12px; }
.kv { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border); font-size: 14px; }
.kv .k { color: var(--muted); }
