import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Server, ShieldCheck, Database, Key, Zap, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { useCreateAsset } from "@/hooks/useAssets";
import { useProjects } from "@/hooks/useOrganization";
import type { AssetType } from "@/types";

const assetTypes: { label: string; type: AssetType; icon: typeof Globe; color: string }[] = [
  { label: "Domain", type: "DOMAIN", icon: Globe, color: "text-primary" },
  { label: "Server / VPS", type: "SERVER", icon: Server, color: "text-info" },
  { label: "SSL Certificate", type: "SSL_CERTIFICATE", icon: ShieldCheck, color: "text-success" },
  { label: "Hosting", type: "HOSTING_SERVICE", icon: Database, color: "text-info" },
  { label: "License", type: "LICENSE", icon: Key, color: "text-warning" },
  { label: "CDN", type: "CDN_SERVICE", icon: Zap, color: "text-success" },
  { label: "Custom", type: "CUSTOM", icon: Plus, color: "text-muted-foreground" },
];

const steps = ["Asset Type", "Basic Info", "Renewal Settings", "Confirm"];

export default function AddAssetPage() {
  const navigate = useNavigate();
  const createAsset = useCreateAsset();
  const { data: projects = [] } = useProjects();

  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<AssetType | "">("");
  const [form, setForm] = useState({
    name: "",
    vendor: "",
    projectId: "",
    notes: "",
    renewalDate: "",
    price: "",
    currency: "USD",
    autoRenew: false,
  });

  const update = (key: string, value: string | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));
  const progress = ((step + 1) / steps.length) * 100;

  const handleCreate = async () => {
    if (!selectedType || !form.name || !form.renewalDate) return;
    try {
      await createAsset.mutateAsync({
        assetType: selectedType,
        name: form.name,
        vendorName: form.vendor || undefined,
        projectId: form.projectId || undefined,
        notes: form.notes || undefined,
        renewalDate: form.renewalDate,
        priceAmount: form.price || undefined,
        priceCurrency: form.currency,
      });
      navigate("/assets");
    } catch (err: unknown) {
      console.error("Failed to create asset:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress */}
      <div>
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Step {step + 1} of {steps.length} — {steps[step]}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8">
        {/* Step 1 */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-6">Select Asset Type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {assetTypes.map((at) => (
                <button
                  key={at.type}
                  onClick={() => setSelectedType(at.type)}
                  className={`p-5 rounded-[10px] border transition-all duration-150 flex flex-col items-center gap-3 ${
                    selectedType === at.type
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50 hover:border-muted-foreground"
                  }`}
                >
                  <at.icon
                    className={`w-6 h-6 ${selectedType === at.type ? "text-primary" : at.color}`}
                    strokeWidth={1.5}
                  />
                  <span className="text-sm font-medium text-foreground">{at.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-foreground mb-6">Basic Information</h2>
            {[
              { label: "Asset Name", key: "name", placeholder: "e.g. clientsite.com" },
              { label: "Vendor / Provider", key: "vendor", placeholder: "e.g. GoDaddy" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium text-foreground block mb-1.5">{f.label}</label>
                <input
                  type="text"
                  value={(form as Record<string, unknown>)[f.key] as string}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Project</label>
              <select
                value={form.projectId}
                onChange={(e) => update("projectId", e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-foreground mb-6">Renewal Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Renewal Date</label>
                <input
                  type="date"
                  value={form.renewalDate}
                  onChange={(e) => update("renewalDate", e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => update("currency", e.target.value)}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="TRY">TRY</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Price</label>
              <input
                type="text"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="0.00"
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>
            <div className="flex items-center justify-between py-3 px-4 bg-secondary rounded-lg">
              <span className="text-sm font-medium text-foreground">Auto-renew enabled</span>
              <button
                onClick={() => update("autoRenew", !form.autoRenew)}
                className={`w-10 h-6 rounded-full transition-colors duration-150 ${form.autoRenew ? "bg-primary" : "bg-border"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-foreground shadow transition-transform mx-1 ${form.autoRenew ? "translate-x-4" : ""}`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Confirm & Create</h2>
            {createAsset.error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {(createAsset.error as { message?: string })?.message ?? "Failed to create asset"}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4 bg-secondary rounded-xl p-6">
              {[
                ["Type", assetTypes.find((t) => t.type === selectedType)?.label ?? "—"],
                ["Name", form.name || "—"],
                ["Vendor", form.vendor || "—"],
                ["Project", projects.find((p) => p.id === form.projectId)?.name ?? "—"],
                ["Renewal Date", form.renewalDate || "—"],
                ["Price", form.price ? `${form.price} ${form.currency}` : "—"],
                ["Auto-renew", form.autoRenew ? "Enabled" : "Disabled"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
                  <p className="text-sm text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button
            onClick={() => (step === 0 ? navigate("/assets") : setStep(step - 1))}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            {step === 0 ? "Cancel" : "Back"}
          </button>
          <button
            onClick={() => (step < 3 ? setStep(step + 1) : handleCreate())}
            disabled={(step === 0 && !selectedType) || createAsset.isPending}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 disabled:opacity-40 flex items-center gap-2"
          >
            {step < 3 ? (
              <>
                Next <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </>
            ) : createAsset.isPending ? (
              "Creating…"
            ) : (
              "Create Asset"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
