import Link from "next/link";
import type { Metadata } from "next";
import { formData } from "@/lib/options";
import { NEW_PACKAGE_FIELDS } from "@/lib/package-fields";
import { ResourceForm } from "@/components/resource-form";
import { Card, PageHeader } from "@/components/ui";
import { createPackage } from "../actions";

export const metadata: Metadata = { title: "New package" };

export default async function NewPackagePage() {
  const { options } = await formData(NEW_PACKAGE_FIELDS);
  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/packages" className="text-cobalt hover:underline">
          Packages
        </Link>
      </p>
      <PageHeader title="New package" description="Start with the basics. Photos, itinerary, prices and the rest come next, in the editor. New packages are drafts." />
      <Card>
        <ResourceForm fields={NEW_PACKAGE_FIELDS} row={null} options={options} submitLabel="Create draft" save={createPackage} createdPath="/packages" />
      </Card>
    </>
  );
}
