import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function initialsOf(name: string | null): string {
  if (!name) return '?';
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return name.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'FAQ', href: '#faq' },
];

const STATS = [
  { value: '99.99%', label: 'Uptime SLA' },
  { value: '<5ms', label: 'Gateway Latency' },
  { value: '1M+', label: 'Requests / min' },
  { value: '3-tier', label: 'Rate Limiting' },
];

const FEATURES = [
  {
    icon: '🔐',
    title: 'Secure by Default',
    desc: 'JWT tokens, BCrypt password hashing, API keys, and Redis-backed token revocation out of the box.',
  },
  {
    icon: '⚡',
    title: 'Intelligent Routing',
    desc: 'Dynamic service discovery via Eureka. Requests always reach the right service even as instances scale.',
  },
  {
    icon: '🛡️',
    title: 'Rate Limiting',
    desc: 'Three tiers — Free (60 req/min), Premium (300 req/min), Admin (1000 req/min). Block brute-force and DDoS automatically.',
  },
  {
    icon: '📊',
    title: 'Live Monitoring',
    desc: 'Real-time metrics streamed via WebSocket: CPU, latency, RPS, error rate — all visible on the dashboard.',
  },
  {
    icon: '🤖',
    title: 'AI Traffic Prediction',
    desc: 'Linear regression engine predicts traffic spikes so you scale servers before users notice slowdowns.',
  },
  {
    icon: '🔔',
    title: 'Instant Alerts',
    desc: 'Kafka-driven alert pipeline notifies your team the moment a service degrades or goes down.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Connect your services',
    desc: 'Point your microservices at the QuantumMesh Config Server. They auto-register with Eureka on startup — no manual IP management.',
  },
  {
    num: '02',
    title: 'Route traffic through the gateway',
    desc: 'All requests enter through port 8080. The gateway stamps a Correlation ID, validates the JWT, enforces rate limits, and forwards.',
  },
  {
    num: '03',
    title: 'Monitor and act',
    desc: 'Open the dashboard. Watch every service health live. Drill into alerts, view AI predictions, and export metrics.',
  },
];

const USE_CASES = [
  { emoji: '🛵', title: 'Food Delivery', desc: 'Handle lunch-rush spikes. Rate-limit menu scraping bots. Alert on payment service slowdowns instantly.' },
  { emoji: '🏥', title: 'Healthcare', desc: '99.99% uptime with circuit breakers. Doctors get a clear fallback message instead of a crash screen.' },
  { emoji: '🛒', title: 'E-Commerce', desc: 'AI predicts Big Billion Day traffic. Gateway distributes load. Bots can\'t snipe inventory through rate limits.' },
  { emoji: '🎓', title: 'Education', desc: 'Thousands of exam submissions at the same second. Queued through Kafka, never lost, never duplicated.' },
];

const FAQS = [
  {
    q: 'Do I need Kubernetes to run QuantumMesh?',
    a: 'No. The full stack runs on Docker Compose on a single machine. Kubernetes support is optional for production scale-out.',
  },
  {
    q: 'What language are the backend services written in?',
    a: 'Java 21 with Spring Boot 3 and Spring Cloud. The AI engine is Python + FastAPI with scikit-learn.',
  },
  {
    q: 'How does the JWT flow work?',
    a: 'Login returns an access token (1 hour) and a refresh token. The gateway validates the token on every request. Redis caches valid tokens so validation is sub-millisecond.',
  },
  {
    q: 'Can I plug in my own services?',
    a: 'Yes. Register any Spring Boot service with Eureka and add a route in GatewayConfig. The full filter chain applies automatically.',
  },
  {
    q: 'What happens if a downstream service crashes?',
    a: 'The circuit breaker trips within seconds. Users get a safe fallback response instead of a timeout or 500 error. The notification service fires an alert.',
  },
];

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { token, username } = useAuth();
  const loggedIn = !!token;
  const ctaTo = loggedIn ? '/dashboard' : '/login';
  const ctaLabel = loggedIn ? 'Open dashboard →' : 'Get started free';

  return (
    <div className="min-h-screen bg-[#070d1a] text-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#070d1a]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="text-[#00e599]">⬡</span>
            <span>QuantumMesh</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  title={`Signed in as ${username}`}
                  className="w-9 h-9 rounded-full bg-[#00e599]/15 text-[#00e599] border border-[#00e599]/30 hover:bg-[#00e599]/25 flex items-center justify-center text-xs font-extrabold transition-colors"
                >
                  {initialsOf(username)}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2">
                  Sign in
                </Link>
                <Link
                  to="/login"
                  className="text-sm font-semibold bg-[#00e599] text-black px-4 py-2 rounded-md hover:bg-[#00d488] transition-colors"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#00e599]/5 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/60 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#00e599] animate-pulse" />
            Production-ready microservices platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            The intelligent{' '}
            <span className="text-[#00e599]">API gateway</span>
            {' '}for modern teams
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Secure, route, monitor, and predict traffic across all your microservices — from a single control plane with a live dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={ctaTo}
              className="bg-[#00e599] text-black font-bold px-8 py-4 rounded-lg text-base hover:bg-[#00d488] transition-colors"
            >
              {ctaLabel}
            </Link>
            <a
              href="#how-it-works"
              className="border border-white/15 text-white/80 font-medium px-8 py-4 rounded-lg text-base hover:bg-white/5 transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Mock dashboard card */}
        <div className="relative max-w-5xl mx-auto mt-16 rounded-xl border border-white/10 bg-[#0b1120] overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#080f1e]">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-[#00e599]/60" />
            <span className="ml-4 text-xs text-white/20 font-mono">localhost:3000 — QuantumMesh Dashboard</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
            {[
              { label: 'Auth Service', status: 'UP', rps: '142 req/s', latency: '23ms', color: '#00e599' },
              { label: 'Gateway', status: 'UP', rps: '489 req/s', latency: '4ms', color: '#00e599' },
              { label: 'Analytics', status: 'UP', rps: '67 req/s', latency: '18ms', color: '#00e599' },
              { label: 'AI Engine', status: 'UP', rps: '12 req/s', latency: '210ms', color: '#00e599' },
            ].map(svc => (
              <div key={svc.label} className="bg-[#0b1120] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40 font-mono">{svc.label}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00e599]/10 text-[#00e599]">{svc.status}</span>
                </div>
                <div className="text-xl font-bold text-white">{svc.rps}</div>
                <div className="text-xs text-white/30 mt-1">avg {svc.latency}</div>
                <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-[#00e599]/60" style={{ width: `${Math.random() * 60 + 30}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-white/[0.02] py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-[#00e599]">{s.value}</div>
              <div className="text-sm text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Everything your team needs
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              QuantumMesh handles the hard infrastructure problems so your engineers can focus on product.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="bg-[#0b1120] border border-white/5 rounded-xl p-6 hover:border-[#00e599]/20 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-[#080f1e]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Get started in 3 steps
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              From zero to a fully monitored microservices platform in minutes.
            </p>
          </div>
          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex gap-8 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl border border-[#00e599]/20 bg-[#00e599]/5 flex items-center justify-center">
                  <span className="font-extrabold text-[#00e599] text-lg">{step.num}</span>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-white/40 leading-relaxed">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute left-[3.25rem] w-px h-6 bg-[#00e599]/10 mt-16" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              What is QuantumMesh used for?
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Any system with multiple backend services benefits from a central gateway and mesh.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {USE_CASES.map(u => (
              <div
                key={u.title}
                className="bg-[#0b1120] border border-white/5 rounded-xl p-6 hover:border-[#00e599]/20 transition-colors"
              >
                <div className="text-4xl mb-4">{u.emoji}</div>
                <h3 className="font-bold text-base mb-2">{u.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-[#080f1e]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="bg-[#0b1120] border border-white/5 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium">{faq.q}</span>
                  <span className={`text-[#00e599] text-xl flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-white/50 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Start monitoring your services today
          </h2>
          <p className="text-white/40 mb-8">
            Open the dashboard and see your microservices health in real time.
          </p>
          {subscribed ? (
            <div className="text-[#00e599] font-semibold">You're in! Check your email.</div>
          ) : (
            <form
              onSubmit={e => { e.preventDefault(); if (email) setSubscribed(true); }}
              className="flex gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 bg-[#0b1120] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00e599]/40"
              />
              <button
                type="submit"
                className="bg-[#00e599] text-black font-bold px-6 py-3 rounded-lg text-sm hover:bg-[#00d488] transition-colors flex-shrink-0"
              >
                Notify me
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 font-bold text-lg mb-4">
                <span className="text-[#00e599]">⬡</span>
                QuantumMesh
              </div>
              <p className="text-sm text-white/30 leading-relaxed">
                Intelligent API gateway and service mesh for modern distributed systems.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Product</div>
              <ul className="space-y-2 text-sm text-white/40">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#use-cases" className="hover:text-white transition-colors">Use cases</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Services</div>
              <ul className="space-y-2 text-sm text-white/40">
                <li>Auth Service</li>
                <li>Gateway Service</li>
                <li>Analytics Service</li>
                <li>AI Engine</li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Stack</div>
              <ul className="space-y-2 text-sm text-white/40">
                <li>Java 21 + Spring Boot</li>
                <li>React + TypeScript</li>
                <li>Kafka + Redis</li>
                <li>Docker + Eureka</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/20">© 2026 QuantumMesh. Built with Spring Cloud, React, and Kafka.</p>
            <Link to={ctaTo} className="text-xs text-[#00e599] hover:underline">Open dashboard →</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
