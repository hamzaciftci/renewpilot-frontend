import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn, ZoomOut } from "lucide-react";

interface AvatarCropDialogProps {
  open: boolean;
  file: File | null;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}

const VIEW_SIZE = 320;
const OUTPUT_SIZE = 256;
const OUTPUT_QUALITY = 0.85;

export function AvatarCropDialog({ open, file, onCancel, onConfirm }: AvatarCropDialogProps) {
  const { t } = useTranslation();
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [saving, setSaving] = useState(false);

  // Load file → data URL + natural size; compute min zoom so image fully covers crop square.
  useEffect(() => {
    if (!file || !open) {
      setImgSrc(null);
      setImgNatural(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () => {
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        setImgNatural({ w: nw, h: nh });
        const cover = VIEW_SIZE / Math.min(nw, nh);
        setMinZoom(cover);
        setZoom(cover);
        setOffset({ x: 0, y: 0 });
        setImgSrc(src);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, [file, open]);

  // Clamp the offset so the image always covers the crop window.
  const clampOffset = useCallback(
    (x: number, y: number, z: number, nat: { w: number; h: number }) => {
      const dw = nat.w * z;
      const dh = nat.h * z;
      const maxX = Math.max(0, (dw - VIEW_SIZE) / 2);
      const maxY = Math.max(0, (dh - VIEW_SIZE) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !imgNatural) return;
    const nx = dragStart.current.ox + (e.clientX - dragStart.current.x);
    const ny = dragStart.current.oy + (e.clientY - dragStart.current.y);
    setOffset(clampOffset(nx, ny, zoom, imgNatural));
  };

  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    dragStart.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || !imgNatural) return;
    const t = e.touches[0];
    const nx = dragStart.current.ox + (t.clientX - dragStart.current.x);
    const ny = dragStart.current.oy + (t.clientY - dragStart.current.y);
    setOffset(clampOffset(nx, ny, zoom, imgNatural));
  };

  const handleZoomChange = (z: number) => {
    if (!imgNatural) return;
    const clamped = Math.min(minZoom * 4, Math.max(minZoom, z));
    setZoom(clamped);
    setOffset(clampOffset(offset.x, offset.y, clamped, imgNatural));
  };

  const handleConfirm = async () => {
    if (!imgSrc || !imgNatural) return;
    try {
      setSaving(true);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = imgSrc;
      });

      // Source rectangle in the natural image corresponding to the crop window.
      const srcW = VIEW_SIZE / zoom;
      const srcH = VIEW_SIZE / zoom;
      const srcX = (imgNatural.w - srcW) / 2 - offset.x / zoom;
      const srcY = (imgNatural.h - srcH) / 2 - offset.y / zoom;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      const dataUrl = canvas.toDataURL("image/jpeg", OUTPUT_QUALITY);
      onConfirm(dataUrl);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("avatarCrop.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative bg-black rounded-lg overflow-hidden select-none"
            style={{ width: VIEW_SIZE, height: VIEW_SIZE, cursor: dragging ? "grabbing" : "grab" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {imgSrc && imgNatural && (
              <img
                src={imgSrc}
                alt={t("avatarCrop.altText")}
                draggable={false}
                style={{
                  position: "absolute",
                  width: imgNatural.w * zoom,
                  height: imgNatural.h * zoom,
                  maxWidth: "none",
                  maxHeight: "none",
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            )}
            {/* Circle overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                borderRadius: "9999px",
                clipPath: `circle(${VIEW_SIZE / 2}px at center)`,
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none border-2 border-white/80 rounded-full"
              style={{ boxSizing: "border-box" }}
            />
          </div>

          <div className="flex items-center gap-3 w-full px-2">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <input
              type="range"
              min={minZoom}
              max={minZoom * 4}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 accent-primary"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t("avatarCrop.help")}
          </p>

          <div className="flex gap-2 justify-end w-full pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t("avatarCrop.cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving || !imgSrc}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? t("avatarCrop.saving") : t("avatarCrop.cropAndUpload")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
