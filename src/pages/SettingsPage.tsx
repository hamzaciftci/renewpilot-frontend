import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, orgsApi, notificationsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/date";

const tabs = ["Profil", "Organizasyon", "Güvenlik", "Bildirimler"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profil");
  const { user, membership, orgId } = useAuth();
  const qc = useQueryClient();

  // ── Profile ──
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [timezone, setTimezone] = useState(user?.defaultTimezone ?? "UTC");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setTimezone(user.defaultTimezone);
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: () => authApi.updateProfile({ fullName, timezone }),
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
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Bildirim Tercihleri</h2>
            <div className="space-y-4">
              {[
                { label: "E-posta Bildirimleri", value: emailEnabled, setter: setEmailEnabled },
                { label: "Push Bildirimleri", value: pushEnabled, setter: setPushEnabled },
                { label: "SMS Bildirimleri", value: smsEnabled, setter: setSmsEnabled },
                { label: "WhatsApp Bildirimleri", value: whatsappEnabled, setter: setWhatsappEnabled },
              ].map(({ label, value, setter }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <button
                    onClick={() => setter(!value)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${value ? "bg-primary" : "bg-secondary border border-border"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
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
        )}
      </div>
    </div>
  );
}
