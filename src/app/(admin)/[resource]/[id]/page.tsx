import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, SITE_URL, api, can, currentUser } from "@/lib/api";
import { formData } from "@/lib/options";
import { RESOURCES, seoFields } from "@/lib/resources";
import { ResourceForm } from "@/components/resource-form";
import { saveResource } from "../../actions";
import { DeleteButton } from "@/components/row-actions";
import { ButtonLink, Card, PageHeader } from "@/components/ui";

type Row = Record<string, unknown> & { id: string };

export default async function EditResourcePage({ params }: PageProps<"/[resource]/[id]">) {
  const { resource, id } = await params;
  const config = RESOURCES[resource];
  if (!config) notFound();
  const fields = config.seo ? [...config.fields, ...seoFields] : config.fields;

  let row: Row;
  try {
    row = (await api<Row>(`/admin/${config.apiPath}/${id}`)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const [user, { options, currencies }] = await Promise.all([currentUser(), formData(fields)]);
  const name = String(row.name ?? row.title ?? row.customerName ?? config.singular);
  const sitePath = config.sitePath && row.slug ? `${SITE_URL}/${config.sitePath}/${row.slug}` : null;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/${config.key}`} className="text-cobalt hover:underline">
          {config.title}
        </Link>
      </p>
      <PageHeader
        title={name}
        actions={
          <>
            {sitePath && (
              <ButtonLink variant="secondary" href={sitePath} target="_blank" rel="noreferrer">
                View on site
              </ButtonLink>
            )}
            {config.remove && can(user, config.remove) && (
              <DeleteButton resource={config.key} id={row.id} name={name} label={config.removeLabel} redirectTo={`/${config.key}`} check={config.deleteCheck} />
            )}
          </>
        }
      />
      <Card>
        {can(user, config.write) ? (
          <ResourceForm
            fields={fields}
            row={row}
            options={options}
            currencies={currencies}
            submitLabel="Save changes"
            save={saveResource.bind(null, config.key, row.id)}
          />
        ) : (
          <p className="text-sm text-muted">Only an {config.write.replace("_", " ").toLowerCase()} can edit this.</p>
        )}
      </Card>
    </>
  );
}
