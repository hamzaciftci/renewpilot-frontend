import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguageCode } from "@/i18n";
import { authApi, orgsApi, notificationsApi, reminderPoliciesApi, type ReminderPolicy } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/date";
import { Trash2, Plus, Star, Send, Bell, Mail, MessageSquare, Smartphone, Upload, X, Languages } from "lucide-react";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";

type TabKey = "profile" | "organization" | "security" | "notifications" | "reminders" | "language";
const TAB_KEYS: TabKey[] = ["profile", "organization", "security", "notifications", "reminders", "language"];

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const { user, membership, orgId } = useAuth();
  const qc = useQueryClient();

  // ── Profile ──
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [timezone, setTimezone] = useState(user?.defaultTimezone ?? "UTC");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setTimezone(user.defaultTimezone);
      setPhoneNumber(user.phoneNumber ?? "");
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: () => authApi.updateProfile({
      fullName,
      timezone,
      phoneNumber: phoneNumber || undefined,
    }),
    onSuccess: () => {
      toast.success(t("settings.profile.updated"));
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: any) => toast.error(e.message ?? t("common.somethingWentWrong")),
  });

  const updateAvatar = useMutation({
    mutationFn: (avatarUrl: string | null) =>
      authApi.updateProfile({ avatarUrl: avatarUrl ?? "" }),
    onSuccess: (_, avatarUrl) => {
      toast.success(avatarUrl ? t("settings.profile.avatarUpdated") : t("settings.profile.avatarRemoved"));
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: any) => toast.error(e.message ?? t("common.somethingWentWrong")),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("settings.profile.mustBeImage"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("settings.profile.fileTooLarge"));
      return;
    }
    setCropFile(file);
  };

  const handleCropConfirm = (dataUrl: string) => {
    if (dataUrl.length > 700_000) {
      toast.error(t("settings.profile.cropTooBig"));
      return;
    }
    setCropFile(null);
    updateAvatar.mutate(dataUrl);
  };

  // ── Organization ──
  const { data: org } = useQuery({
    queryKey: ["org", orgId],
    queryFn: () => orgsApi.get(orgId!),
    enabled: !!orgId,
  });

  const [orgName, setOrgName] = useState("");
  const [orgTimezone, setOrgTimezone] = useState("UTC");
  const [orgCurrency, setOrgCurrency] = useState("USD");

  useEffect(() => {
    if (org) {
      setOrgName(org.name);
      setOrgTimezone(org.timezone);
      setOrgCurrency(org.currency);
    }
  }, [org]);

  const updateOrg = useMutation({
    mutationFn: () => orgsApi.update(orgId!, { name: orgName, timezone: orgTimezone, currency: orgCurrency }),
    onSuccess: () => {
      toast.success(t("settings.organization.updated"));
      qc.invalidateQueries({ queryKey: ["org", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? t("common.somethingWentWrong")),
  });

  // ── Security ──
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword: currentPwd, newPassword: newPwd }),
    onSuccess: () => {
      toast.success(t("settings.security.updated"));
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    },
    onError: (e: any) => toast.error(e.message ?? t("common.somethingWentWrong")),
  });

  const handleChangePassword = () => {
    if (newPwd !== confirmPwd) { toast.error(t("settings.security.mismatch")); return; }
    if (newPwd.length < 8) { toast.error(t("settings.security.tooShort")); return; }
    changePassword.mutate();
  };

  // ── Notification Preferences ──
  const { data: prefs } = useQuery({
    queryKey: ["notif-prefs", orgId],
    queryFn: () => notificationsApi.getPreferences(orgId!),
    enabled: !!orgId,
  });

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  useEffect(() => {
    if (prefs) {
      setEmailEnabled(prefs.emailEnabled);
      setPushEnabled(prefs.pushEnabled);
      setSmsEnabled(prefs.smsEnabled);
      setWhatsappEnabled(prefs.whatsappEnabled);
    }
  }, [prefs]);

  const updatePrefs = useMutation({
    mutationFn: () => notificationsApi.updatePreferences(orgId!, {
      emailEnabled, pushEnabled, smsEnabled, whatsappEnabled,
    }),
    onSuccess: () => {
      toast.success(t("settings.notifications.preferencesSaved"));
      qc.invalidateQueries({ queryKey: ["notif-prefs", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? t("common.somethingWentWrong")),
  });

  // ── Test Notification ──
  const testNotif = useMutation({
    mutationFn: (channel: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH") =>
      notificationsApi.test(orgId!, channel),
    onSuccess: (res, channel) => {
      if (res.success) toast.success(t("settings.notifications.testSent", { channel }));
      else toast.error(t("settings.notifications.testFailed", { channel, error: res.error ?? "" }));
    },
    onError: (e: any) => toast.error(e.message ?? t("settings.notifications.testFailedGeneric")),
  });

  // ── Reminder Policies ──
  const { data: policies = [] } = useQuery({
    queryKey: ["reminder-policies", orgId],
    queryFn: () => reminderPoliciesApi.list(orgId!),
    enabled: !!orgId,
  });

  const ensureDefault = useMutation({
    mutationFn: () => reminderPoliciesApi.ensureDefault(orgId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminder-policies", orgId] });
    },
  });

  // Auto-create default policy if none exist
  useEffect(() => {
    if (activeTab === "reminders" && orgId && policies.length === 0 && !ensureDefault.isPending) {
      ensureDefault.mutate();
    }
  }, [activeTab, orgId, policies.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Language ──
  const currentLang = (i18n.language?.split("-")[0] ?? "en") as SupportedLanguageCode;
  const handleLanguageChange = (code: SupportedLanguageCode) => {
    i18n.changeLanguage(code);
    toast.success(t("settings.language.saved"));
  };

  const userInitials = user ? initials(user.fullName) : "?";

  return (
    <div className="flex gap-8 max-w-5xl">
      {/* Left Tabs */}
      <div className="w-44 flex-shrink-0 space-y-0.5">
        {TAB_KEYS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 relative ${
              activeTab === tab ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {activeTab === tab && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />}
            {t(`settings.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "profile" && (
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">{t("settings.profile.title")}</h2>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updateAvatar.isPending}
                  className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-xl font-semibold text-foreground overflow-hidden relative ring-1 ring-border hover:ring-primary/50 transition-all disabled:opacity-60"
                  title={t("settings.profile.changePhoto")}
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userInitials}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Upload className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={updateAvatar.isPending}
                    className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {updateAvatar.isPending ? t("settings.profile.uploading") : t("settings.profile.uploadPhoto")}
                  </button>
                  {user?.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => updateAvatar.mutate(null)}
                      disabled={updateAvatar.isPending}
                      className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t("settings.profile.remove")}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t("settings.profile.avatarHelp")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("settings.profile.fullName")}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("settings.profile.email")}</label>
                <input
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-muted text-muted-foreground"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  {t("settings.profile.phoneNumber")}
                  <span className="text-xs text-muted-foreground ml-2 font-normal">{t("settings.profile.phoneHelp")}</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t("settings.profile.phonePlaceholder")}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("settings.profile.timezone")}</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground"
                >
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                  <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50"
            >
              {updateProfile.isPending ? t("settings.profile.saving") : t("settings.profile.save")}
            </button>
          </div>
        )}

        {activeTab === "organization" && (
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">{t("settings.organization.title")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("settings.organization.name")}</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("settings.organization.slug")}</label>
                <input
                  type="text"
                  value={org?.slug ?? ""}
                  readOnly
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-muted text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("settings.organization.defaultTimezone")}</label>
                <select
                  value={orgTimezone}
                  onChange={(e) => setOrgTimezone(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground"
                >
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                  <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("settings.organization.defaultCurrency")}</label>
                <select
                  value={orgCurrency}
                  onChange={(e) => setOrgCurrency(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="TRY">TRY (₺)</option>
                </select>
              </div>
            </div>
            {membership?.role === "OWNER" || membership?.role === "ADMIN" ? (
              <button
                onClick={() => updateOrg.mutate()}
                disabled={updateOrg.isPending}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50"
              >
                {updateOrg.isPending ? t("settings.profile.saving") : t("settings.organization.save")}
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">{t("settings.organization.adminOnly")}</p>
            )}
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">{t("settings.security.title")}</h2>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">{t("settings.security.currentPassword")}</label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("settings.security.newPassword")}</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("settings.security.confirmPassword")}</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("settings.security.passwordHelp")}</p>
            <button
              onClick={handleChangePassword}
              disabled={changePassword.isPending || !currentPwd || !newPwd || !confirmPwd}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50"
            >
              {changePassword.isPending ? t("settings.security.updating") : t("settings.security.update")}
            </button>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-8 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t("settings.notifications.title")}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t("settings.notifications.desc")}</p>
              </div>
              <div className="space-y-4">
                {[
                  { label: t("settings.notifications.email"), desc: t("settings.notifications.emailDesc"), icon: Mail, value: emailEnabled, setter: setEmailEnabled, channel: "EMAIL" as const },
                  { label: t("settings.notifications.sms"), desc: t("settings.notifications.smsDesc"), icon: MessageSquare, value: smsEnabled, setter: setSmsEnabled, channel: "SMS" as const },
                  { label: t("settings.notifications.whatsapp"), desc: t("settings.notifications.whatsappDesc"), icon: MessageSquare, value: whatsappEnabled, setter: setWhatsappEnabled, channel: "WHATSAPP" as const },
                  { label: t("settings.notifications.push"), desc: t("settings.notifications.pushDesc"), icon: Smartphone, value: pushEnabled, setter: setPushEnabled, channel: "PUSH" as const },
                ].map(({ label, desc, icon: Icon, value, setter, channel }) => (
                  <div key={channel} className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {value && (
                        <button
                          onClick={() => testNotif.mutate(channel)}
                          disabled={testNotif.isPending}
                          className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {t("settings.notifications.test")}
                        </button>
                      )}
                      <button
                        onClick={() => setter(!value)}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? "bg-primary" : "bg-secondary border border-border"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => updatePrefs.mutate()}
                disabled={updatePrefs.isPending}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50"
              >
                {updatePrefs.isPending ? t("settings.profile.saving") : t("settings.notifications.save")}
              </button>
            </div>
          </div>
        )}

        {activeTab === "reminders" && (
          <RemindersTab
            policies={policies}
            orgId={orgId!}
            canEdit={membership?.role === "OWNER" || membership?.role === "ADMIN"}
          />
        )}

        {activeTab === "language" && (
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <div className="flex items-start gap-3">
              <Languages className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t("settings.language.title")}</h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">{t("settings.language.desc")}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                {t("settings.language.label")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const selected = currentLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-colors duration-150 ${
                        selected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-primary/40"
                      }`}
                    >
                      <span className="text-xl leading-none">{lang.flag}</span>
                      <span className="flex-1 text-left">{lang.label}</span>
                      {selected && (
                        <span className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">
                          {lang.code}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <AvatarCropDialog
        open={!!cropFile}
        file={cropFile}
        onCancel={() => setCropFile(null)}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}

// ─── Reminders Tab ────────────────────────────────────────────────────────────

function RemindersTab({
  policies,
  orgId,
  canEdit,
}: {
  policies: ReminderPolicy[];
  orgId: string;
  canEdit: boolean;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createPolicy = useMutation({
    mutationFn: (body: any) => reminderPoliciesApi.create(orgId, body),
    onSuccess: () => {
      toast.success(t("settings.reminders.created"));
      qc.invalidateQueries({ queryKey: ["reminder-policies", orgId] });
      setIsCreating(false);
    },
    onError: (e: any) => toast.error(e.message ?? t("settings.reminders.createFailed")),
  });

  const updatePolicy = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => reminderPoliciesApi.update(orgId, id, body),
    onSuccess: () => {
      toast.success(t("settings.reminders.updated"));
      qc.invalidateQueries({ queryKey: ["reminder-policies", orgId] });
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message ?? t("settings.reminders.updateFailed")),
  });

  const deletePolicy = useMutation({
    mutationFn: (id: string) => reminderPoliciesApi.remove(orgId, id),
    onSuccess: () => {
      toast.success(t("settings.reminders.deleted"));
      qc.invalidateQueries({ queryKey: ["reminder-policies", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? t("settings.reminders.deleteFailed")),
  });

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-8 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              {t("settings.reminders.title")}
            </h2>
            <p
              className="text-xs text-muted-foreground mt-1"
              dangerouslySetInnerHTML={{ __html: t("settings.reminders.desc") }}
            />
          </div>
          {canEdit && !isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t("settings.reminders.newPolicy")}
            </button>
          )}
        </div>

        <div className="bg-secondary/50 border border-border rounded-lg p-4 text-xs text-muted-foreground space-y-1">
          <p><strong className="text-foreground">{t("settings.reminders.howItWorksIntro")}</strong></p>
          <p dangerouslySetInnerHTML={{ __html: "• " + t("settings.reminders.bullet1") }} />
          <p dangerouslySetInnerHTML={{ __html: "• " + t("settings.reminders.bullet2") }} />
          <p>• {t("settings.reminders.bullet3")}</p>
          <p>• {t("settings.reminders.bullet4")}</p>
        </div>

        {isCreating && (
          <PolicyEditor
            initial={{ name: "", offsetDays: [60, 30, 14, 7, 3, 1, 0, -1, -3, -7], channelConfig: { email: true, sms: false, whatsapp: false, push: false }, isDefault: false }}
            onSave={(body) => createPolicy.mutate(body)}
            onCancel={() => setIsCreating(false)}
            isSaving={createPolicy.isPending}
          />
        )}

        {policies.length === 0 && !isCreating && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {t("settings.reminders.noPolicies")}
          </div>
        )}

        <div className="space-y-3">
          {policies.map((p) =>
            editingId === p.id ? (
              <PolicyEditor
                key={p.id}
                initial={p}
                onSave={(body) => updatePolicy.mutate({ id: p.id, body })}
                onCancel={() => setEditingId(null)}
                isSaving={updatePolicy.isPending}
              />
            ) : (
              <PolicyCard
                key={p.id}
                policy={p}
                canEdit={canEdit}
                onEdit={() => setEditingId(p.id)}
                onDelete={() => {
                  if (window.confirm(t("settings.reminders.deleteConfirm", { name: p.name }))) {
                    deletePolicy.mutate(p.id);
                  }
                }}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function PolicyCard({
  policy,
  canEdit,
  onEdit,
  onDelete,
}: {
  policy: ReminderPolicy;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const before = policy.offsetDays.filter((d) => d > 0).sort((a, b) => b - a);
  const onDay = policy.offsetDays.includes(0);
  const after = policy.offsetDays.filter((d) => d < 0).sort((a, b) => a - b);

  return (
    <div className="border border-border rounded-lg p-4 bg-secondary/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{policy.name}</h3>
            {policy.isDefault && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                <Star className="w-3 h-3" /> {t("settings.reminders.defaultBadge")}
              </span>
            )}
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            {before.length > 0 && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{t("settings.reminders.preRenewal")}</span>{" "}
                {before.map((d) => t("settings.reminders.days", { count: d })).join(", ")}
              </p>
            )}
            {onDay && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{t("settings.reminders.renewalDay")}</span>{" "}
                {t("settings.reminders.notifyToday")}
              </p>
            )}
            {after.length > 0 && (
              <p className="text-orange-600 dark:text-orange-400">
                <span className="font-medium">{t("settings.reminders.ifOverdue")}</span>{" "}
                {after.map((d) => t("settings.reminders.daysAfter", { count: Math.abs(d) })).join(", ")}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {policy.channelConfig.email && <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded">{t("settings.reminders.channels.email")}</span>}
              {policy.channelConfig.sms && <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs px-2 py-0.5 rounded">{t("settings.reminders.channels.sms")}</span>}
              {policy.channelConfig.whatsapp && <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-0.5 rounded">{t("settings.reminders.channels.whatsapp")}</span>}
              {policy.channelConfig.push && <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs px-2 py-0.5 rounded">{t("settings.reminders.channels.push")}</span>}
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="text-xs text-primary hover:underline px-2 py-1">
              {t("settings.reminders.edit")}
            </button>
            {!policy.isDefault && (
              <button
                onClick={onDelete}
                className="text-xs text-red-600 hover:text-red-700 p-1"
                title={t("settings.reminders.deleteTitle")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PolicyEditor({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: Partial<ReminderPolicy>;
  onSave: (body: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial.name ?? "");
  const [offsetDaysText, setOffsetDaysText] = useState((initial.offsetDays ?? []).join(", "));
  const [email, setEmail] = useState(initial.channelConfig?.email ?? true);
  const [sms, setSms] = useState(initial.channelConfig?.sms ?? false);
  const [whatsapp, setWhatsapp] = useState(initial.channelConfig?.whatsapp ?? false);
  const [push, setPush] = useState(initial.channelConfig?.push ?? false);
  const [isDefault, setIsDefault] = useState(initial.isDefault ?? false);

  const handleSave = () => {
    if (!name.trim()) { toast.error(t("settings.reminders.nameRequired")); return; }
    const offsetDays = offsetDaysText
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    if (offsetDays.length === 0) { toast.error(t("settings.reminders.daysRequired")); return; }
    if (!email && !sms && !whatsapp && !push) { toast.error(t("settings.reminders.channelsRequired")); return; }
    onSave({
      name: name.trim(),
      offsetDays,
      channelConfig: { email, sms, whatsapp, push },
      isDefault,
    });
  };

  return (
    <div className="border border-primary/30 rounded-lg p-5 bg-secondary/30 space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">{t("settings.reminders.name")}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("settings.reminders.namePlaceholder")}
          className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-background text-foreground focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">
          {t("settings.reminders.notificationDays")}
          <span className="text-xs text-muted-foreground ml-2 font-normal">{t("settings.reminders.daysHelp")}</span>
        </label>
        <input
          type="text"
          value={offsetDaysText}
          onChange={(e) => setOffsetDaysText(e.target.value)}
          placeholder={t("settings.reminders.daysExample")}
          className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-background text-foreground focus:outline-none focus:border-primary font-mono"
        />
        <p
          className="text-xs text-muted-foreground mt-1"
          dangerouslySetInnerHTML={{ __html: t("settings.reminders.daysExampleHelp") }}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-2">{t("settings.reminders.notificationChannels")}</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: t("settings.reminders.channels.email"), value: email, setter: setEmail },
            { label: t("settings.reminders.channels.sms"), value: sms, setter: setSms },
            { label: t("settings.reminders.channels.whatsapp"), value: whatsapp, setter: setWhatsapp },
            { label: t("settings.reminders.channels.push"), value: push, setter: setPush },
          ].map(({ label, value, setter }) => (
            <label key={label} className="flex items-center gap-2 p-2 rounded border border-border bg-background cursor-pointer hover:bg-secondary/50">
              <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-foreground">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4" />
        <span className="text-sm text-foreground">{t("settings.reminders.setDefault")}</span>
      </label>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t("settings.reminders.cancel")}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? t("settings.reminders.saving") : t("settings.reminders.save")}
        </button>
      </div>
    </div>
  );
}
