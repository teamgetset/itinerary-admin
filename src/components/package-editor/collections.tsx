"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { MediaPicker, type PickedImage } from "../media-picker";
import { buttonStyles, inputStyles } from "../ui";
import { FieldError, ItemControls, SaveBar, move, uid, useSectionSave } from "./shared";

type Option = { value: string; label: string };

/** Hotel options: which hotels the package uses, for how many nights, and which one the price includes. */
export function HotelsEditor({
  packageId,
  initial,
  hotels,
}: {
  packageId: string;
  initial: { hotelId: string; nights: number; roomType: string | null; mealPlan: string | null; isDefault: boolean }[];
  hotels: Option[];
}) {
  const [rows, setRows] = useState(() => initial.map((row) => ({ key: uid(), hotelId: row.hotelId, nights: String(row.nights), roomType: row.roomType ?? "", mealPlan: row.mealPlan ?? "", isDefault: row.isDefault })));
  const { save, pending, result, errors } = useSectionSave(packageId, "hotels");
  const update = (index: number, patch: Partial<(typeof rows)[number]>) => setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Hotels marked “Included” are the stays in the listed price and appear in “Where you stay”. Others are alternatives. Without hotels, the page lists stays from the itinerary.
        {hotels.length === 0 && " Add hotels first under Travel › Hotels."}
      </p>
      <ol className="space-y-3">
        {rows.map((row, index) => (
          <li key={row.key} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[1fr_6rem_1fr_1fr_auto_auto] sm:items-center">
            <select aria-label={`Hotel ${index + 1}`} value={row.hotelId} onChange={(event) => update(index, { hotelId: event.target.value })} className={inputStyles}>
              <option value="">Choose a hotel…</option>
              {hotels.map((hotel) => (
                <option key={hotel.value} value={hotel.value}>
                  {hotel.label}
                </option>
              ))}
            </select>
            <input type="number" min={1} aria-label={`Hotel ${index + 1} nights`} placeholder="Nights" value={row.nights} onChange={(event) => update(index, { nights: event.target.value })} className={inputStyles} />
            <input aria-label={`Hotel ${index + 1} room type`} placeholder="Room type" value={row.roomType} onChange={(event) => update(index, { roomType: event.target.value })} className={inputStyles} />
            <input aria-label={`Hotel ${index + 1} meal plan`} placeholder="Meal plan" value={row.mealPlan} onChange={(event) => update(index, { mealPlan: event.target.value })} className={inputStyles} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-navy" checked={row.isDefault} onChange={(event) => update(index, { isDefault: event.target.checked })} />
              Included
            </label>
            <ItemControls index={index} count={rows.length} label={`hotel ${index + 1}`} onMove={(to) => setRows(move(rows, index, to))} onRemove={() => setRows(rows.filter((_, i) => i !== index))} />
            <div className="sm:col-span-6">
              <FieldError message={Object.entries(errors).find(([path]) => path.startsWith(`hotels.${index}.`))?.[1]} />
            </div>
          </li>
        ))}
      </ol>
      <button type="button" disabled={!hotels.length} onClick={() => setRows([...rows, { key: uid(), hotelId: "", nights: "1", roomType: "", mealPlan: "", isDefault: true }])} className={`${buttonStyles.secondary} mt-3`}>
        <Plus aria-hidden className="size-4" />
        Add hotel
      </button>
      <FieldError message={errors.hotels} />
      <SaveBar
        pending={pending}
        result={result}
        label="Save hotels"
        onSave={() =>
          save({
            hotels: rows.map((row) => ({
              hotelId: row.hotelId,
              nights: Number(row.nights),
              roomType: row.roomType.trim() || null,
              mealPlan: row.mealPlan.trim() || null,
              isDefault: row.isDefault,
            })),
          })
        }
      />
    </div>
  );
}

/** Catalogue activities featured in the package. */
export function ActivitiesEditor({ packageId, initial, activities }: { packageId: string; initial: { activityId: string }[]; activities: Option[] }) {
  const [ids, setIds] = useState(() => initial.map((row) => row.activityId));
  const { save, pending, result, errors } = useSectionSave(packageId, "activities");
  const label = (id: string) => activities.find((activity) => activity.value === id)?.label ?? "Removed activity";
  const available = activities.filter((activity) => !ids.includes(activity.value));

  return (
    <div>
      <p className="mb-4 text-sm text-muted">Experiences included in this package, from the shared Activities list.</p>
      <ol className="space-y-2">
        {ids.map((id, index) => (
          <li key={id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
            <span>{label(id)}</span>
            <ItemControls index={index} count={ids.length} label={label(id)} onMove={(to) => setIds(move(ids, index, to))} onRemove={() => setIds(ids.filter((x) => x !== id))} />
          </li>
        ))}
      </ol>
      <label className="mt-3 block max-w-sm text-sm font-semibold">
        Add an activity
        <select
          value=""
          onChange={(event) => event.target.value && setIds([...ids, event.target.value])}
          className={`${inputStyles} mt-1.5 font-normal`}
        >
          <option value="">Choose…</option>
          {available.map((activity) => (
            <option key={activity.value} value={activity.value}>
              {activity.label}
            </option>
          ))}
        </select>
      </label>
      <FieldError message={errors.activityIds} />
      <SaveBar pending={pending} result={result} label="Save activities" onSave={() => save({ activityIds: ids })} />
    </div>
  );
}

/** Gallery photos after the hero image, in order. Photos come from the shared media library. */
export function GalleryEditor({ packageId, initial }: { packageId: string; initial: { mediaId: string; image: PickedImage | null }[] }) {
  const [images, setImages] = useState<PickedImage[]>(() => initial.flatMap((row) => (row.image ? [row.image] : [])));
  const { save, pending, result, errors } = useSectionSave(packageId, "gallery");

  return (
    <div>
      <p className="mb-4 text-sm text-muted">Shown on the package page, in this order, after the hero image (set in Details).</p>
      {images.length === 0 && <p className="mb-3 text-sm text-muted">No gallery photos yet.</p>}
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <li key={image.id} className="overflow-hidden rounded-lg border border-line">
            <img src={image.url ?? ""} alt={image.alt} className="aspect-[4/3] w-full object-cover" />
            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
              <span className="truncate text-xs text-muted">{index + 1}. {image.alt}</span>
              <ItemControls index={index} count={images.length} label={`photo ${index + 1}`} onMove={(to) => setImages(move(images, index, to))} onRemove={() => setImages(images.filter((_, i) => i !== index))} />
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-3">
        <MediaPicker label="Add photo" onPick={(image) => !images.some((i) => i.id === image.id) && setImages([...images, image])} />
      </div>
      <FieldError message={errors.mediaIds} />
      <SaveBar pending={pending} result={result} label="Save gallery" onSave={() => save({ mediaIds: images.map((image) => image.id) })} />
    </div>
  );
}
