"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ImageSquare, UploadSimple, X } from "@phosphor-icons/react";
import { listMedia, uploadMedia, type MediaItem } from "@/app/(admin)/actions";
import { buttonStyles, inputStyles } from "./ui";

export interface PickedImage {
  id: string;
  url: string | null;
  alt: string;
}

/**
 * Chooses an image from the media library, or uploads a new one into it.
 * Files are reused across the site, so the same photo is never uploaded twice.
 */
export function MediaPicker({ onPick, label = "Choose image" }: { onPick: (image: PickedImage) => void; label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [uploading, startUpload] = useTransition();

  const load = (q: string, target: number) =>
    startLoading(async () => {
      const result = await listMedia(q, target);
      setItems(result.items);
      setPage(target);
      setTotalPages(result.meta?.totalPages ?? 1);
    });

  useEffect(() => {
    const handle = setTimeout(() => dialog.current?.open && load(query, 1), 250);
    return () => clearTimeout(handle);
  }, [query]);

  const open = () => {
    dialog.current?.showModal();
    load(query, 1);
  };

  const pick = (image: PickedImage) => {
    onPick(image);
    dialog.current?.close();
  };

  const upload = (file: File) =>
    startUpload(async () => {
      setError(null);
      const form = new FormData();
      form.append("file", file);
      form.append("alt", file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
      const result = await uploadMedia(form);
      if (result.ok) pick({ id: result.data.id, url: result.data.url, alt: result.data.alt });
      else setError(result.message);
    });

  return (
    <>
      <button type="button" onClick={open} className={buttonStyles.secondary}>
        <ImageSquare aria-hidden className="size-4" />
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-label="Media library"
        className="m-auto w-[min(56rem,calc(100vw-2rem))] rounded-card border border-line bg-white p-0 backdrop:bg-night/50"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="font-semibold text-navy">Media library</h2>
          <button type="button" onClick={() => dialog.current?.close()} className="grid size-9 place-items-center rounded-lg hover:bg-frost">
            <X aria-hidden className="size-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="flex flex-col gap-3 border-b border-line px-5 py-3 sm:flex-row sm:items-center">
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by file name or alt text" className={inputStyles} aria-label="Search images" />
          <label className={`${buttonStyles.primary} cursor-pointer`}>
            <UploadSimple aria-hidden className="size-4" />
            {uploading ? "Uploading…" : "Upload new"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) upload(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        {error && <p role="alert" className="mx-5 mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <div className="max-h-[60vh] overflow-y-auto p-5" aria-busy={loading}>
          {items.length === 0 && !loading ? (
            <p className="text-sm text-muted">No images found. Upload one above.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => pick({ id: item.id, url: item.url, alt: item.alt })}
                    className="group block w-full overflow-hidden rounded-lg border border-line text-left hover:border-cobalt"
                  >
                    <img src={item.url ?? ""} alt={item.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                    <span className="block truncate px-2 py-1.5 text-xs text-muted group-hover:text-ink">{item.alt || item.fileName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between border-t border-line px-5 py-3 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => load(query, page - 1)} className={buttonStyles.secondary}>
              Previous
            </button>
            <span className="self-center text-muted">
              Page {page} of {totalPages}
            </span>
            <button type="button" disabled={page >= totalPages} onClick={() => load(query, page + 1)} className={buttonStyles.secondary}>
              Next
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}

/** An image field: preview, change, remove. */
export function ImageField({
  value,
  onChange,
  invalid,
}: {
  value: PickedImage | null;
  onChange: (image: PickedImage | null) => void;
  invalid?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-lg border p-3 ${invalid ? "border-danger" : "border-line"}`}>
      {value?.url ? (
        <img src={value.url} alt={value.alt} className="h-16 w-24 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="grid h-16 w-24 shrink-0 place-items-center rounded-md bg-frost text-xs text-muted">No image</span>
      )}
      <div className="flex flex-wrap gap-2">
        <MediaPicker onPick={onChange} label={value ? "Change" : "Choose image"} />
        {value && (
          <button type="button" onClick={() => onChange(null)} className={buttonStyles.ghost}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
