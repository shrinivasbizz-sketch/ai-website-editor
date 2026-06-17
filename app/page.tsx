import {
  Zap,
  Shield,
  BarChart3,
  Star,
  ArrowRight,
  Check,
  Globe,
  Users,
  TrendingUp,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Lightning Fast Automation",
    description:
      "Automate repetitive workflows in minutes, not months. Connect your tools and watch tasks complete themselves.",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description:
      "SOC 2 Type II certified with end-to-end encryption. Your data stays yours — always.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Deep insights into every workflow. Track efficiency gains and spot bottlenecks before they slow you down.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "FlowCraft cut our onboarding time by 60%. What used to take our team a week now happens automatically on day one.",
    name: "Sarah Chen",
    role: "Head of Operations",
    company: "Meridian Health",
    avatar: "SC",
  },
  {
    quote:
      "We process 10,000+ orders per day without a single manual step. FlowCraft is the backbone of our fulfillment pipeline.",
    name: "James Okafor",
    role: "CTO",
    company: "NovaBrand",
    avatar: "JO",
  },
  {
    quote:
      "Finally, automation that doesn't require a PhD. Our non-technical team was up and running in an afternoon.",
    name: "Maria Torres",
    role: "VP of Engineering",
    company: "PulseAI",
    avatar: "MT",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    description: "Perfect for small teams getting started with automation.",
    features: ["Up to 5 workflows", "1,000 runs/month", "Email support", "Basic analytics"],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/mo",
    description: "For growing teams that need more power and flexibility.",
    features: [
      "Unlimited workflows",
      "50,000 runs/month",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
      "Team collaboration",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for large-scale operations.",
    features: [
      "Everything in Pro",
      "Unlimited runs",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option",
      "Custom contracts",
    ],
    cta: "Contact sales",
    highlight: false,
  },
];

const STATS = [
  { value: "10M+", label: "Workflows automated", icon: TrendingUp },
  { value: "50K+", label: "Teams using FlowCraft", icon: Users },
  { value: "99.9%", label: "Uptime SLA", icon: Globe },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">FlowCraft</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Customers
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors">
              Sign in
            </button>
            <button className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Get started free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm px-3 py-1.5 rounded-full mb-8 font-medium">
            <Star size={13} />
            Rated #1 workflow automation platform
          </div>
          <h1 className="text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            Automate anything.<br />
            <span className="text-indigo-600">Ship faster.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            FlowCraft connects your apps, automates your workflows, and eliminates manual work — so your team can focus on what actually matters.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-colors shadow-lg shadow-indigo-200">
              Start for free
              <ArrowRight size={16} />
            </button>
            <button className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 px-8 py-3.5 rounded-xl font-semibold text-base transition-colors">
              Watch demo
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-4">No credit card required · 14-day free trial</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 py-12 px-6 border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <stat.icon size={20} className="text-indigo-500 mb-1" />
              <div className="text-3xl font-extrabold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to automate at scale
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Powerful tools built for teams who move fast and need to stay reliable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-5`}>
                  <feature.icon size={22} className={feature.color} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-500">Start free. Scale as you grow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.highlight
                    ? "bg-indigo-600 text-white ring-2 ring-indigo-600 shadow-xl"
                    : "bg-white border border-gray-200 shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <div className="inline-block bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-4">
                    Most popular
                  </div>
                )}
                <div className="mb-6">
                  <h3
                    className={`text-xl font-bold mb-1 ${
                      plan.highlight ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-end gap-1 my-3">
                    <span
                      className={`text-4xl font-extrabold ${
                        plan.highlight ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm mb-1 ${
                        plan.highlight ? "text-indigo-200" : "text-gray-500"
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      plan.highlight ? "text-indigo-200" : "text-gray-500"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Check
                        size={15}
                        className={plan.highlight ? "text-indigo-200" : "text-indigo-600"}
                      />
                      <span className={plan.highlight ? "text-indigo-100" : "text-gray-600"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-white text-indigo-600 hover:bg-indigo-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by 50,000+ teams</h2>
            <p className="text-lg text-gray-500">See what our customers are saying</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-gray-700 leading-relaxed mb-6">
                  &quot;{t.quote}&quot;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">
                      {t.role} · {t.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to automate your workflow?
          </h2>
          <p className="text-indigo-200 text-lg mb-10">
            Join 50,000+ teams already using FlowCraft. Start your free 14-day trial today.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3.5 rounded-xl font-semibold text-base transition-colors shadow-md">
              Get started for free
            </button>
            <button className="border border-indigo-400 text-indigo-100 hover:bg-indigo-700 px-8 py-3.5 rounded-xl font-semibold text-base transition-colors">
              Talk to sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
                  <Zap size={13} className="text-white" />
                </div>
                <span className="text-white font-bold">FlowCraft</span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs">
                The workflow automation platform for modern teams.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-8 text-sm">
              {[
                { heading: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
                { heading: "Company", links: ["About", "Blog", "Careers", "Press"] },
                { heading: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
              ].map((col) => (
                <div key={col.heading}>
                  <h4 className="text-white font-semibold mb-3">{col.heading}</h4>
                  <ul className="space-y-2">
                    {col.links.map((l) => (
                      <li key={l}>
                        <a href="#" className="hover:text-white transition-colors">
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-600">
            © 2025 FlowCraft, Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
