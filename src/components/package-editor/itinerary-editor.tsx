"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { ImageField, type PickedImage } from "../media-picker";
import { buttonStyles, inputStyles } from "../ui";
import { FieldError, ItemControls, SaveBar, move, uid, useSectionSave } from "./shared";

const MEALS = [
  ["BREAKFAST", "Breakfast"],
  ["LUNCH", "Lunch"],
  ["DINNER", "Dinner"],
] as const;

const ACTIVITY_TYPES = [
  ["ARRIVAL", "Arrival"],
  ["TRANSFER", "Transfer"],
  ["CHECK_IN", "Check-in"],
  ["SIGHTSEEING", "Sightseeing"],
  ["ACTIVITY", "Activity"],
  ["MEAL", "Meal"],
  ["FREE_TIME", "Free time"],
  ["CHECK_OUT", "Check-out"],
  ["DEPARTURE", "Departure"],
  ["OTHER", "Other"],
] as const;

interface Activity {
  key: string;
  time: string;
  title: string;
  description: string;
  location: string;
  type: string;
  activityId: string;
}

interface Day {
  key: string;
  title: string;
  description: string;
  stay: string;
  hotelId: string;
  meals: string[];
  image: PickedImage | null;
  activities: Activity[];
}

export interface ItineraryDayInput {
  title: string;
  description: string;
  stay: string | null;
  hotelId: string | null;
  meals: string[];
  imageId: string | null;
  image: { id: string; url: string; alt: string } | null;
  activities: { time: string | null; title: string; description: string | null; location: string | null; type: string; activityId: string | null }[];
}

const blankActivity = (): Activity => ({ key: uid(), time: "", title: "", description: "", location: "", type: "OTHER", activityId: "" });

/**
 * Structured day-by-day editor: each day has a title, description, stay, meals, hotel, photo and a timeline.
 * Day numbers follow the order on screen.
 */
export function ItineraryEditor({
  packageId,
  initial,
  hotels,
  activities,
  durationDays,
}: {
  packageId: string;
  initial: ItineraryDayInput[];
  hotels: { value: string; label: string }[];
  activities: { value: string; label: string }[];
  durationDays: number;
}) {
  const [days, setDays] = useState<Day[]>(() =>
    initial.map((day) => ({
      key: uid(),
      title: day.title,
      description: day.description,
      stay: day.stay ?? "",
      hotelId: day.hotelId ?? "",
      meals: day.meals,
      image: day.image,
      activities: day.activities.map((a) => ({
        key: uid(),
        time: a.time ?? "",
        title: a.title,
        description: a.description ?? "",
        location: a.location ?? "",
        type: a.type,
        activityId: a.activityId ?? "",
      })),
    })),
  );
  const { save, pending, result, errors } = useSectionSave(packageId, "itinerary");
  const updateDay = (index: number, patch: Partial<Day>) => setDays(days.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  const updateActivity = (dayIndex: number, index: number, patch: Partial<Activity>) =>
    updateDay(dayIndex, { activities: days[dayIndex]!.activities.map((a, i) => (i === index ? { ...a, ...patch } : a)) });

  const body = () => ({
    days: days.map((day) => ({
      title: day.title,
      description: day.description,
      stay: day.stay.trim() || null,
      hotelId: day.hotelId || null,
      meals: day.meals,
      imageId: day.image?.id ?? null,
      activities: day.activities.map((a) => ({
        time: a.time || null,
        title: a.title,
        description: a.description.trim() || null,
        location: a.location.trim() || null,
        type: a.type,
        activityId: a.activityId || null,
      })),
    })),
  });

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        {days.length} of {durationDays} days written. The publish checklist flags an empty itinerary or more days than the package lasts.
        In each day’s timeline, a step’s type sets its icon on the website (“Other” shows none), and a linked catalogue activity adds
        its photo, plus its description and location where the step has none.
      </p>
      <ol className="space-y-5">
        {days.map((day, dayIndex) => {
          const at = (field: string) => errors[`days.${dayIndex}.${field}`];
          return (
            <li key={day.key} className="rounded-card border border-line">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-mist px-4 py-2.5">
                <h3 className="font-bold text-navy">Day {String(dayIndex + 1).padStart(2, "0")}</h3>
                <ItemControls
                  index={dayIndex}
                  count={days.length}
                  label={`day ${dayIndex + 1}`}
                  onMove={(to) => setDays(move(days, dayIndex, to))}
                  onRemove={() => {
                    if (!day.title && !day.description && !day.activities.length) setDays(days.filter((_, i) => i !== dayIndex));
                    else if (confirm(`Remove day ${dayIndex + 1}, "${day.title}"?`)) setDays(days.filter((_, i) => i !== dayIndex));
                  }}
                />
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <label className="text-sm font-semibold sm:col-span-2">
                  Title
                  <input aria-label={`Day ${dayIndex + 1} title`} value={day.title} onChange={(event) => updateDay(dayIndex, { title: event.target.value })} aria-invalid={at("title") ? true : undefined} className={`${inputStyles} mt-1.5 font-normal`} />
                  <FieldError message={at("title")} />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  Description
                  <textarea aria-label={`Day ${dayIndex + 1} description`} rows={3} value={day.description} onChange={(event) => updateDay(dayIndex, { description: event.target.value })} className={`${inputStyles} mt-1.5 font-normal`} />
                </label>
                <label className="text-sm font-semibold">
                  Overnight in
                  <input aria-label={`Day ${dayIndex + 1} overnight in`} value={day.stay} placeholder="Empty on the departure day" onChange={(event) => updateDay(dayIndex, { stay: event.target.value })} className={`${inputStyles} mt-1.5 font-normal`} />
                </label>
                <label className="text-sm font-semibold">
                  Hotel
                  <select aria-label={`Day ${dayIndex + 1} hotel`} value={day.hotelId} onChange={(event) => updateDay(dayIndex, { hotelId: event.target.value })} className={`${inputStyles} mt-1.5 font-normal`}>
                    <option value="">Not set</option>
                    {hotels.map((hotel) => (
                      <option key={hotel.value} value={hotel.value}>
                        {hotel.label}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset className="text-sm">
                  <legend className="font-semibold">Meals included</legend>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {MEALS.map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          aria-label={`Day ${dayIndex + 1} ${label.toLowerCase()}`}
                          className="size-4 accent-navy"
                          checked={day.meals.includes(value)}
                          onChange={(event) =>
                            updateDay(dayIndex, {
                              meals: MEALS.map(([meal]) => meal).filter((meal) => (meal === value ? event.target.checked : day.meals.includes(meal))),
                            })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="text-sm">
                  <p className="mb-1.5 font-semibold">Day photo (optional)</p>
                  <ImageField value={day.image} onChange={(image) => updateDay(dayIndex, { image })} />
                </div>

                <div className="sm:col-span-2">
                  <p className="mb-2 text-sm font-semibold">Timeline</p>
                  {day.activities.length === 0 && <p className="mb-2 text-sm text-muted">No timed activities. Add pickups, visits and meals in order.</p>}
                  <ol className="space-y-2">
                    {day.activities.map((activity, index) => {
                      const err = (field: string) => errors[`days.${dayIndex}.activities.${index}.${field}`];
                      return (
                        <li key={activity.key} className="rounded-lg border border-line p-3">
                          <div className="grid gap-2 sm:grid-cols-[7rem_1fr_10rem_auto]">
                            <input
                              type="time"
                              aria-label={`Day ${dayIndex + 1} activity ${index + 1} time`}
                              value={activity.time}
                              onChange={(event) => updateActivity(dayIndex, index, { time: event.target.value })}
                              aria-invalid={err("time") ? true : undefined}
                              className={inputStyles}
                            />
                            <input
                              aria-label={`Day ${dayIndex + 1} activity ${index + 1} title`}
                              placeholder="What happens, e.g. Hotel transfer"
                              value={activity.title}
                              onChange={(event) => updateActivity(dayIndex, index, { title: event.target.value })}
                              aria-invalid={err("title") ? true : undefined}
                              className={inputStyles}
                            />
                            <select aria-label={`Day ${dayIndex + 1} activity ${index + 1} type`} value={activity.type} onChange={(event) => updateActivity(dayIndex, index, { type: event.target.value })} className={inputStyles}>
                              {ACTIVITY_TYPES.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <ItemControls
                              index={index}
                              count={day.activities.length}
                              label={`activity ${index + 1}`}
                              onMove={(to) => updateDay(dayIndex, { activities: move(day.activities, index, to) })}
                              onRemove={() => updateDay(dayIndex, { activities: day.activities.filter((_, i) => i !== index) })}
                            />
                            <input
                              aria-label={`Day ${dayIndex + 1} activity ${index + 1} location`}
                              placeholder="Location (optional)"
                              value={activity.location}
                              onChange={(event) => updateActivity(dayIndex, index, { location: event.target.value })}
                              className={`${inputStyles} sm:col-span-2`}
                            />
                            <select
                              aria-label={`Day ${dayIndex + 1} activity ${index + 1} linked activity`}
                              value={activity.activityId}
                              onChange={(event) => updateActivity(dayIndex, index, { activityId: event.target.value })}
                              className={`${inputStyles} sm:col-span-2`}
                            >
                              <option value="">Not linked to a catalogue activity</option>
                              {activities.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <FieldError message={err("time") ?? err("title")} />
                        </li>
                      );
                    })}
                  </ol>
                  <button type="button" onClick={() => updateDay(dayIndex, { activities: [...day.activities, blankActivity()] })} className={`${buttonStyles.secondary} mt-2`}>
                    <Plus aria-hidden className="size-4" />
                    Add activity
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() => setDays([...days, { key: uid(), title: "", description: "", stay: "", hotelId: "", meals: [], image: null, activities: [] }])}
        className={`${buttonStyles.secondary} mt-4`}
      >
        <Plus aria-hidden className="size-4" />
        Add day {days.length + 1}
      </button>
      {errors.days && <FieldError message={errors.days} />}
      <SaveBar pending={pending} result={result} label="Save itinerary" onSave={() => save(body())} />
    </div>
  );
}
