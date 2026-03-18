import { useState } from "react";

const tabs = ["Profil", "Organizasyon", "Güvenlik", "Entegrasyonlar", "API Anahtarları"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profil");

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
            {(tab === "Entegrasyonlar" || tab === "API Anahtarları") && (
              <span className="ml-1 text-[10px] text-muted-foreground">(yakında)</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "Profil" && (
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Profil Ayarları</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-lg font-semibold text-foreground">HY</div>
              <button className="text-sm text-primary font-medium hover:text-primary/80 transition-colors duration-150">Avatar değiştir</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Ad Soyad</label>
                <input type="text" defaultValue="Hamza Yılmaz" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">E-posta</label>
                <div className="flex items-center gap-2">
                  <input type="email" defaultValue="hamza@agency.com" readOnly className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm bg-muted text-muted-foreground" />
                  <button className="text-xs text-primary font-medium whitespace-nowrap transition-colors duration-150">E-posta Değiştir</button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Saat Dilimi</label>
                <select className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground">
                  <option>Europe/Istanbul (UTC+3)</option>
                  <option>America/New_York (UTC-5)</option>
                  <option>Europe/London (UTC+0)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Dil</label>
                <select className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground">
                  <option>Türkçe</option>
                  <option>English</option>
                </select>
              </div>
            </div>
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150">
              Değişiklikleri Kaydet
            </button>
          </div>
        )}

        {activeTab === "Organizasyon" && (
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Organizasyon Ayarları</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Organizasyon Adı</label>
                <input type="text" defaultValue="Acme Agency" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Slug</label>
                <input type="text" defaultValue="acme-agency" readOnly className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-muted text-muted-foreground" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Varsayılan Saat Dilimi</label>
                <select className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground">
                  <option>Europe/Istanbul (UTC+3)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Varsayılan Para Birimi</label>
                <select className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground">
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>TRY (₺)</option>
                </select>
              </div>
            </div>
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150">
              Kaydet
            </button>
          </div>
        )}

        {activeTab === "Güvenlik" && (
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Güvenlik</h2>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Mevcut Şifre</label>
              <input type="password" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Yeni Şifre</label>
                <input type="password" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Şifreyi Onayla</label>
                <input type="password" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150" />
              </div>
            </div>
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150">
              Şifreyi Güncelle
            </button>
          </div>
        )}

        {(activeTab === "Entegrasyonlar" || activeTab === "API Anahtarları") && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary mx-auto mb-4 flex items-center justify-center">
              <span className="text-xl">🔌</span>
            </div>
            <h3 className="font-medium text-foreground">{activeTab}</h3>
            <p className="text-sm text-muted-foreground mt-1">Yakında. Bu özellik üzerinde çalışıyoruz.</p>
          </div>
        )}
      </div>
    </div>
  );
}
