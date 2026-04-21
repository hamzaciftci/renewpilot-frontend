import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, orgsApi, notificationsApi, reminderPoliciesApi, type ReminderPolicy } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/date";
import { Trash2, Plus, Star, Send, CheckCircle, XCircle, Bell, Mail, MessageSquare, Smartphone } from "lucide-react";

const tabs = ["Profil", "Organizasyon", "Güvenlik", "Bildirimler", "Hatırlatıcılar"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profil");
  const { user, membership, orgId } = useAuth();
  const qc = useQueryClient();

  // ── Profile ──
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [timezone, setTimezone] = useState(user?.defaultTimezone ?? "UTC");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");

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
      toast.success("Profil güncellendi");
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Bir hata oluştu"),
  });

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
      toast.success("Organizasyon güncellendi");
      qc.invalidateQueries({ queryKey: ["org", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Bir hata oluştu"),
  });

  // ── Security ──
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword: currentPwd, newPassword: newPwd }),
    onSuccess: () => {
      toast.success("Şifre güncellendi");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    },
    onError: (e: any) => toast.error(e.message ?? "Bir hata oluştu"),
  });

  const handleChangePassword = () => {
    if (newPwd !== confirmPwd) { toast.error("Yeni şifreler eşleşmiyor"); return; }
    if (newPwd.length < 8) { toast.error("Şifre en az 8 karakter olmalı"); return; }
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
      toast.success("Bildirim tercihleri kaydedildi");
      qc.invalidateQueries({ queryKey: ["notif-prefs", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Bir hata oluştu"),
  });

  // ── Test Notification ──
  const testNotif = useMutation({
    mutationFn: (channel: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH") =>
      notificationsApi.test(orgId!, channel),
    onSuccess: (res, channel) => {
      if (res.success) toast.success(`${channel} test bildirimi gönderildi ✓`);
      else toast.error(`${channel} başarısız: ${res.error}`);
    },
    onError: (e: any) => toast.error(e.message ?? "Test gönderilemedi"),
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
    if (activeTab === "Hatırlatıcılar" && orgId && policies.length === 0 && !ensureDefault.isPending) {
      ensureDefault.mutate();
    }
  }, [activeTab, orgId, policies.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const userInitials = user ? initials(user.fullName) : "?";

  return (
    <div className="flex gap-8 max-w-5xl">
      {/* Left Tabs */}
      <div className="w-44 flex-shrink-0 space-y-0.5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 relative ${
              activeTab === tab ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {activeTab === tab && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "Profil" && (
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Profil Ayarları</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-lg font-semibold text-foreground">
                {userInitials}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Ad Soyad</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">E-posta</label>
                <input
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-muted text-muted-foreground"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Telefon Numarası
                  <span className="text-xs text-muted-foreground ml-2 font-normal">(SMS/WhatsApp bildirimleri için — E.164 formatı: +905551234567)</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+905551234567"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground block mb-1.5">Saat Dilimi</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground"
                >
                  <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50"
            >
              {updateProfile.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </div>
        )}

        {activeTab === "Organizasyon" && (
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Organizasyon Ayarları</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Organizasyon Adı</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Slug</label>
                <input
                  type="text"
                  value={org?.slug ?? ""}
                  readOnly
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-muted text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Varsayılan Saat Dilimi</label>
                <select
                  value={orgTimezone}
                  onChange={(e) => setOrgTimezone(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground"
                >
                  <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Varsayılan Para Birimi</label>
                <select
                  value={orgCurrency}
                  onChange={(e) => setOrgCurrency(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="TRY">TRY (₺)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
            {membership?.role === "OWNER" || membership?.role === "ADMIN" ? (
              <button
                onClick={() => updateOrg.mutate()}
                disabled={updateOrg.isPending}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50"
              >
                {updateOrg.isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">Organizasyon ayarlarını değiştirmek için Admin yetkisi gereklidir.</p>
            )}
          </div>
        )}

        {activeTab === "Güvenlik" && (
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Güvenlik</h2>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Mevcut Şifre</label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Yeni Şifre</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Şifreyi Onayla</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">En az 8 karakter, 1 büyük harf ve 1 rakam içermeli.</p>
            <button
              onClick={handleChangePassword}
              disabled={changePassword.isPending || !currentPwd || !newPwd || !confirmPwd}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50"
            >
              {changePassword.isPending ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </div>
        )}

        {activeTab === "Bildirimler" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-8 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Bildirim Tercihleri</h2>
                <p className="text-xs text-muted-foreground mt-1">Hangi kanaldan bildirim almak istediğinizi seçin.</p>
              </div>
              <div className="space-y-4">
                {[
                  { label: "E-posta Bildirimleri", desc: "Yenileme hatırlatıcıları e-posta olarak gönderilir", icon: Mail, value: emailEnabled, setter: setEmailEnabled, channel: "EMAIL" as const },
                  { label: "SMS Bildirimleri", desc: "Önemli yenileme hatırlatıcıları SMS ile gönderilir (telefon numarası gerekli)", icon: MessageSquare, value: smsEnabled, setter: setSmsEnabled, channel: "SMS" as const },
                  { label: "WhatsApp Bildirimleri", desc: "Yenileme hatırlatıcıları WhatsApp üzerinden gönderilir", icon: MessageSquare, value: whatsappEnabled, setter: setWhatsappEnabled, channel: "WHATSAPP" as const },
                  { label: "Push Bildirimleri", desc: "Tarayıcı push bildirimleri", icon: Smartphone, value: pushEnabled, setter: setPushEnabled, channel: "PUSH" as const },
                ].map(({ label, desc, icon: Icon, value, setter, channel }) => (
                  <div key={label} className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
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
                          title={`${channel} için test bildirimi gönder`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Test
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
                {updatePrefs.isPending ? "Kaydediliyor..." : "Tercihleri Kaydet"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "Hatırlatıcılar" && (
          <RemindersTab
            policies={policies}
            orgId={orgId!}
            canEdit={membership?.role === "OWNER" || membership?.role === "ADMIN"}
          />
        )}
      </div>
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
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createPolicy = useMutation({
    mutationFn: (body: any) => reminderPoliciesApi.create(orgId, body),
    onSuccess: () => {
      toast.success("Politika oluşturuldu");
      qc.invalidateQueries({ queryKey: ["reminder-policies", orgId] });
      setIsCreating(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Oluşturulamadı"),
  });

  const updatePolicy = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => reminderPoliciesApi.update(orgId, id, body),
    onSuccess: () => {
      toast.success("Politika güncellendi");
      qc.invalidateQueries({ queryKey: ["reminder-policies", orgId] });
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Güncellenemedi"),
  });

  const deletePolicy = useMutation({
    mutationFn: (id: string) => reminderPoliciesApi.remove(orgId, id),
    onSuccess: () => {
      toast.success("Politika silindi");
      qc.invalidateQueries({ queryKey: ["reminder-policies", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Silinemedi"),
  });

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-8 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Hatırlatıcı Politikaları
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Yenileme tarihinden kaç gün önce ve hangi kanallardan bildirim göndereceğini belirle. Negatif değerler tarihinden <em>sonra</em> gönderilir (aşamalı hatırlatma).
            </p>
          </div>
          {canEdit && !isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Yeni Politika
            </button>
          )}
        </div>

        <div className="bg-secondary/50 border border-border rounded-lg p-4 text-xs text-muted-foreground space-y-1">
          <p><strong className="text-foreground">📅 Nasıl çalışır?</strong></p>
          <p>• Varsayılan gün değerleri: <code>60, 30, 14, 7, 3, 1, 0</code> — yenileme öncesi günler</p>
          <p>• Negatif değerler: <code>-1, -3, -7, -14</code> — yenileme geçtikten sonra hatırlatma (escalation)</p>
          <p>• Her gün 08:00 UTC'de sistem taranır ve uygun hatırlatıcılar gönderilir</p>
          <p>• Aynı gün içinde tekrar aynı bildirim gönderilmez (deduplication)</p>
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
            Henüz politika yok. Varsayılan politika otomatik oluşturulacak...
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
                  if (window.confirm(`"${p.name}" politikasını silmek istediğinize emin misiniz?`)) {
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
                <Star className="w-3 h-3" /> Varsayılan
              </span>
            )}
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            {before.length > 0 && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Yenileme öncesi:</span>{" "}
                {before.map((d) => `${d} gün`).join(", ")}
              </p>
            )}
            {onDay && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Yenileme günü:</span> bugün bildir
              </p>
            )}
            {after.length > 0 && (
              <p className="text-orange-600 dark:text-orange-400">
                <span className="font-medium">Geciktiyse:</span>{" "}
                {after.map((d) => `${Math.abs(d)} gün sonra`).join(", ")}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {policy.channelConfig.email && <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded">E-posta</span>}
              {policy.channelConfig.sms && <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs px-2 py-0.5 rounded">SMS</span>}
              {policy.channelConfig.whatsapp && <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-0.5 rounded">WhatsApp</span>}
              {policy.channelConfig.push && <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs px-2 py-0.5 rounded">Push</span>}
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="text-xs text-primary hover:underline px-2 py-1">
              Düzenle
            </button>
            {!policy.isDefault && (
              <button
                onClick={onDelete}
                className="text-xs text-red-600 hover:text-red-700 p-1"
                title="Sil"
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
  const [name, setName] = useState(initial.name ?? "");
  const [offsetDaysText, setOffsetDaysText] = useState((initial.offsetDays ?? []).join(", "));
  const [email, setEmail] = useState(initial.channelConfig?.email ?? true);
  const [sms, setSms] = useState(initial.channelConfig?.sms ?? false);
  const [whatsapp, setWhatsapp] = useState(initial.channelConfig?.whatsapp ?? false);
  const [push, setPush] = useState(initial.channelConfig?.push ?? false);
  const [isDefault, setIsDefault] = useState(initial.isDefault ?? false);

  const handleSave = () => {
    if (!name.trim()) { toast.error("Politika adı gerekli"); return; }
    const offsetDays = offsetDaysText
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    if (offsetDays.length === 0) { toast.error("En az bir gün değeri girin"); return; }
    if (!email && !sms && !whatsapp && !push) { toast.error("En az bir kanal seçin"); return; }
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
        <label className="text-sm font-medium text-foreground block mb-1.5">Politika Adı</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn: Standart Yenileme"
          className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-background text-foreground focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">
          Bildirim Günleri
          <span className="text-xs text-muted-foreground ml-2 font-normal">(virgülle ayır — pozitif: öncesi, negatif: sonrası)</span>
        </label>
        <input
          type="text"
          value={offsetDaysText}
          onChange={(e) => setOffsetDaysText(e.target.value)}
          placeholder="60, 30, 14, 7, 3, 1, 0, -1, -3, -7"
          className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-background text-foreground focus:outline-none focus:border-primary font-mono"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Örn: <code>60, 30, 14, 7, 3, 1, 0, -1, -3, -7</code> = 60/30/14/7/3/1 gün önce, yenileme günü, 1/3/7 gün sonra
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Bildirim Kanalları</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "E-posta", value: email, setter: setEmail },
            { label: "SMS", value: sms, setter: setSms },
            { label: "WhatsApp", value: whatsapp, setter: setWhatsapp },
            { label: "Push", value: push, setter: setPush },
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
        <span className="text-sm text-foreground">Varsayılan politika olarak ayarla</span>
      </label>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          İptal
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
