import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Link2,
  Globe,
  Bell,
  Users,
  Search,
  Languages,
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  Server,
  Lock,
  Check,
  Eye,
  AlertTriangle,
  PlusCircle,
  SlidersHorizontal,
  BellRing,
} from "lucide-react";
import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguageCode } from "@/i18n";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/Logo";

/**
 * Public landing page rendered at "/". Authenticated users are redirected
 * to /dashboard one level up in App.tsx, so this component only ever runs
 * for guests.
 *
 * Visual rules: this page has to look and feel like the rest of the app.
 * It uses the same Tailwind tokens (`bg-background`, `text-foreground`,
 * `border-border`, `text-primary`), the same lucide-react icon set, and
 * the same `ThemeProvider` so the dark/light toggle wires up for free.
 *
 * No marketing-template antics: no parallax, no glassmorphism, no
 * mouse-trail. Subtle gradient on hero, then stop.
 */
export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main>
        <Hero />
        <SocialProof />
        <PainPoints />
        <HowItWorks />
        <FeatureGrid />
        <FeatureBlock
          eyebrow={t("landing.featureBlocks.assets.eyebrow")}
          title={t("landing.featureBlocks.assets.title")}
          body={t("landing.featureBlocks.assets.body")}
          image="/screenshots/assets-list.svg"
          imageAlt={t("landing.featureBlocks.assets.alt")}
          reverse={false}
        />
        <FeatureBlock
          eyebrow={t("landing.featureBlocks.calendar.eyebrow")}
          title={t("landing.featureBlocks.calendar.title")}
          body={t("landing.featureBlocks.calendar.body")}
          image="/screenshots/calendar.svg"
          imageAlt={t("landing.featureBlocks.calendar.alt")}
          reverse={true}
        />
        <FeatureBlock
          eyebrow={t("landing.featureBlocks.detail.eyebrow")}
          title={t("landing.featureBlocks.detail.title")}
          body={t("landing.featureBlocks.detail.body")}
          image="/screenshots/asset-detail.svg"
          imageAlt={t("landing.featureBlocks.detail.alt")}
          reverse={false}
        />
        <FeatureBlock
          eyebrow={t("landing.featureBlocks.reminders.eyebrow")}
          title={t("landing.featureBlocks.reminders.title")}
          body={t("landing.featureBlocks.reminders.body")}
          image="/screenshots/settings-notifications.svg"
          imageAlt={t("landing.featureBlocks.reminders.alt")}
          reverse={true}
        />
        <FeatureBlock
          eyebrow={t("landing.featureBlocks.share.eyebrow")}
          title={t("landing.featureBlocks.share.title")}
          body={t("landing.featureBlocks.share.body")}
          image="/screenshots/share-dialog.svg"
          imageAlt={t("landing.featureBlocks.share.alt")}
          reverse={false}
        />
        <I18nShowcase />
        <TrustSignals />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}

// ─── Top nav ──────────────────────────────────────────────────────────────────

function TopNav() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-foreground" aria-label="RenewPilot">
          <Logo size="sm" />
          <span className="text-[10px] font-mono uppercase text-primary border border-primary/40 rounded px-1.5 py-0.5 ml-1">
            {t("landing.betaBadge")}
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <LangSwitcher />
          <ThemeToggle />
          <Link
            to="/login"
            className="hidden sm:inline-block text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition-colors"
          >
            {t("landing.nav.signIn")}
          </Link>
          <Link
            to="/register"
            className="text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-lg transition-colors"
          >
            {t("landing.nav.startFree")}
          </Link>
        </div>
      </nav>
    </header>
  );
}

function LangSwitcher() {
  const [open, setOpen] = useState(false);
  const current = (i18n.language?.split("-")[0] ?? "en") as SupportedLanguageCode;
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === current) ?? SUPPORTED_LANGUAGES[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-2 rounded-lg transition-colors"
        aria-label="Change language"
      >
        <Languages className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{currentLang.flag}</span>
        <span className="hidden md:inline uppercase">{currentLang.code}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary transition-colors ${
                  lang.code === current ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
                {lang.code === current && <Check className="w-3 h-3 ml-auto text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="text-muted-foreground hover:text-foreground p-2 rounded-lg transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Subtle radial gradient — single, no animation */}
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.15), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8 md:pt-20 md:pb-16 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-6 space-y-5">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary border border-primary/30 bg-primary/5 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t("landing.hero.eyebrow")}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            {t("landing.hero.title")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
            {t("landing.hero.subtitle")}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {t("landing.hero.ctaPrimary")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-foreground hover:bg-secondary border border-border px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {t("landing.hero.ctaSecondary")}
            </a>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            <span className="text-success">●</span> {t("landing.hero.noCard")}
          </p>
        </div>
        <div className="lg:col-span-6">
          <ScreenshotFrame
            src="/screenshots/dashboard.svg"
            alt={t("landing.hero.imageAlt")}
            priority
          />
        </div>
      </div>
    </section>
  );
}

// ─── Social proof strip ───────────────────────────────────────────────────────

function SocialProof() {
  const { t } = useTranslation();
  const stats = [
    { value: "7", label: t("landing.stats.types") },
    { value: "5", label: t("landing.stats.channels") },
    { value: "5", label: t("landing.stats.languages") },
    { value: "<2 min", label: t("landing.stats.setup") },
  ];
  return (
    <section className="border-b border-border bg-card/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center md:text-left">
            <p className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">{s.value}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Pain points ──────────────────────────────────────────────────────────────

function PainPoints() {
  const { t } = useTranslation();
  const pains = [
    {
      icon: Globe,
      title: t("landing.pains.domain.title"),
      desc: t("landing.pains.domain.desc"),
      solution: t("landing.pains.domain.solution"),
    },
    {
      icon: ShieldCheck,
      title: t("landing.pains.ssl.title"),
      desc: t("landing.pains.ssl.desc"),
      solution: t("landing.pains.ssl.solution"),
    },
    {
      icon: AlertTriangle,
      title: t("landing.pains.license.title"),
      desc: t("landing.pains.license.desc"),
      solution: t("landing.pains.license.solution"),
    },
  ];
  return (
    <section className="py-12 md:py-20 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("landing.pains.heading")}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            {t("landing.pains.subheading")}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {pains.map(({ icon: Icon, title, desc, solution }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-xl p-5 md:p-6 space-y-3"
            >
              <div className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-foreground leading-relaxed flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                  <span>{solution}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { icon: PlusCircle, key: "add" },
    { icon: SlidersHorizontal, key: "policy" },
    { icon: BellRing, key: "ping" },
  ] as const;
  return (
    <section className="py-12 md:py-20 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <p className="text-[11px] uppercase tracking-wider font-medium text-primary mb-2">
            {t("landing.how.eyebrow")}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("landing.how.heading")}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            {t("landing.how.subheading")}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-5 relative">
          {steps.map(({ icon: Icon, key }, idx) => (
            <div
              key={key}
              className="bg-card border border-border rounded-xl p-5 md:p-6 relative"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-[11px] text-primary border border-primary/30 rounded-md px-1.5 py-0.5">
                  0{idx + 1}
                </span>
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {t(`landing.how.${key}.title`)}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(`landing.how.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Feature grid ─────────────────────────────────────────────────────────────

function FeatureGrid() {
  const { t } = useTranslation();
  const features = [
    { icon: Globe, key: "multiAsset" },
    { icon: Bell, key: "multiChannel" },
    { icon: Users, key: "team" },
    { icon: Search, key: "whois" },
    { icon: Link2, key: "share" },
    { icon: Languages, key: "i18n" },
  ] as const;
  return (
    <section id="features" className="py-12 md:py-20 border-b border-border bg-card/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <p className="text-[11px] uppercase tracking-wider font-medium text-primary mb-2">
            {t("landing.features.eyebrow")}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("landing.features.heading")}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            {t("landing.features.subheading")}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {features.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="bg-card border border-border rounded-xl p-5 md:p-6 hover:border-primary/40 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {t(`landing.features.${key}.title`)}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(`landing.features.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Alternating feature block ────────────────────────────────────────────────

function FeatureBlock({
  eyebrow,
  title,
  body,
  image,
  imageAlt,
  reverse,
}: {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  reverse: boolean;
}) {
  return (
    <section className="py-12 md:py-20 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className={`grid lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
            reverse ? "lg:[&>*:first-child]:order-2" : ""
          }`}
        >
          <div className="lg:col-span-5 space-y-4">
            <p className="text-[11px] uppercase tracking-wider font-medium text-primary">
              {eyebrow}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{body}</p>
          </div>
          <div className="lg:col-span-7">
            <ScreenshotFrame src={image} alt={imageAlt} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── i18n showcase ────────────────────────────────────────────────────────────

function I18nShowcase() {
  const { t } = useTranslation();
  const samples = [
    { code: "en", label: "English", flag: "🇬🇧", title: "Renewals", days: "Days remaining" },
    { code: "tr", label: "Türkçe", flag: "🇹🇷", title: "Yenilemeler", days: "Kalan gün" },
    { code: "de", label: "Deutsch", flag: "🇩🇪", title: "Verlängerungen", days: "Verbleibende Tage" },
    { code: "fr", label: "Français", flag: "🇫🇷", title: "Renouvellements", days: "Jours restants" },
    { code: "es", label: "Español", flag: "🇪🇸", title: "Renovaciones", days: "Días restantes" },
  ];
  return (
    <section className="py-12 md:py-20 border-b border-border bg-card/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("landing.i18n.heading")}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            {t("landing.i18n.subheading")}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {samples.map((s) => (
            <div key={s.code} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-base">{s.flag}</span>
                <span className="text-muted-foreground">{s.label}</span>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-[11px] uppercase font-medium text-muted-foreground tracking-wider">
                  {s.days}
                </p>
                <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">14</p>
              </div>
              <p className="text-xs font-medium text-foreground">{s.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trust signals ────────────────────────────────────────────────────────────

function TrustSignals() {
  const { t } = useTranslation();
  const items = [
    { icon: Lock, key: "encryption" },
    { icon: ShieldCheck, key: "isolation" },
    { icon: Server, key: "hosting" },
    { icon: Eye, key: "audit" },
  ] as const;
  return (
    <section className="py-12 md:py-20 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("landing.trust.heading")}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            {t("landing.trust.subheading")}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {items.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="bg-card border border-border rounded-xl p-5 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground">
                  {t(`landing.trust.${key}.title`)}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  {t(`landing.trust.${key}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Closing CTA ──────────────────────────────────────────────────────────────

function ClosingCTA() {
  const { t } = useTranslation();
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center space-y-6">
          <Logo size="lg" showWordmark={false} className="mx-auto" />
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
            {t("landing.cta.heading")}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            {t("landing.cta.subheading")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              {t("landing.cta.button")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center text-foreground hover:bg-secondary border border-border px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              {t("landing.cta.signIn")}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">{t("landing.cta.disclaimer")}</p>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const { t } = useTranslation();
  const cols: Array<{ key: string; links: { label: string; href: string }[] }> = [
    {
      key: "product",
      links: [
        { label: t("landing.footer.product.features"), href: "#features" },
        { label: t("landing.footer.product.signIn"), href: "/login" },
        { label: t("landing.footer.product.register"), href: "/register" },
      ],
    },
    {
      key: "company",
      links: [
        { label: t("landing.footer.company.about"), href: "#" },
        { label: t("landing.footer.company.contact"), href: "mailto:hello@renewpilot.app" },
      ],
    },
    {
      key: "legal",
      links: [
        { label: t("landing.footer.legal.terms"), href: "#" },
        { label: t("landing.footer.legal.privacy"), href: "#" },
      ],
    },
    {
      key: "resources",
      links: [
        { label: t("landing.footer.resources.docs"), href: "#" },
        { label: t("landing.footer.resources.status"), href: "#" },
      ],
    },
  ];
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-3">
            <Logo size="sm" />
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              {t("landing.footer.tagline")}
            </p>
            <div className="pt-2">
              <LangSwitcher />
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.key}>
              <h4 className="text-[11px] uppercase tracking-wider font-medium text-foreground mb-3">
                {t(`landing.footer.${col.key}.title`)}
              </h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} RenewPilot · {t("landing.footer.copyright")}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>{t("landing.footer.beta")}</span>
            <span>·</span>
            <span className="font-mono">v1.0</span>
            <span>·</span>
            <span>{t("landing.footer.madeIn")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Reusable screenshot frame ────────────────────────────────────────────────

function ScreenshotFrame({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative">
      <div
        className="absolute -inset-4 -z-10 opacity-40 blur-3xl rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.3), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-card/60">
          <span className="w-2 h-2 rounded-full bg-destructive/40" />
          <span className="w-2 h-2 rounded-full bg-warning/40" />
          <span className="w-2 h-2 rounded-full bg-success/40" />
          <span className="ml-auto text-[10px] font-mono text-muted-foreground truncate">
            renewpilot.app
          </span>
        </div>
        <img
          src={src}
          alt={alt}
          width={1440}
          height={900}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          className="w-full h-auto block"
        />
      </div>
    </div>
  );
}
