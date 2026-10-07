import Link from "next/link";
import { notFound } from "next/navigation";
import { can, currentUser } from "@/lib/api";
import { formData } from "@/lib/options";
import { RESOURCES, seoFields } from "@/lib/resources";
import { ResourceForm } from "@/components/resource-form";
import { saveResource } from "../../actions";
import { Card, PageHeader } from "@/components/ui";

export default async function NewResourcePage({ params }: PageProps<"/[resource]/new">) {
  const config = RESOURCES[(await params).resource];
  if (!config) notFound();
  const user = await currentUser();
  const fields = config.seo ? [...config.fields, ...seoFields] : config.fields;
  const { options, currencies } = await formData(fields);
  const singular = config.singular.charAt(0).toUpperCase() + config.singular.slice(1);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/${config.key}`} className="text-cobalt hover:underline">
          {config.title}
        </Link>
      </p>
      <PageHeader title={`New ${config.singular}`} />
      {can(user, config.write) ? (
        <Card>
          <ResourceForm
            fields={fields}
            row={null}
            options={options}
            currencies={currencies}
            submitLabel={`Create ${config.singular}`}
            save={saveResource.bind(null, config.key, null)}
            createdPath={`/${config.key}`}
          />
        </Card>
      ) : (
        <p className="text-sm text-muted">{singular}s can only be created by an {config.write.replace("_", " ").toLowerCase()}.</p>
      )}
    </>
  );
}
