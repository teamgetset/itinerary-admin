import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import type { Enquiry } from "@/lib/enquiries";
import { formatAmount, formatDate, formatDateTime, humanize } from "@/lib/format";
import { EnquiryNoteForm, EnquiryStatus } from "@/components/enquiry-controls";
import { Badge, Card, PageHeader, STATUS_TONE } from "@/components/ui";

type Detail = Enquiry & { notes: { id: string; body: string; createdAt: string; author: string | null }[] };

export default async function EnquiryPage({ params }: PageProps<"/enquiries/[id]">) {
  const { id } = await params;
  let enquiry: Detail;
  try {
    enquiry = (await api<Detail>(`/admin/enquiries/${id}`)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const whatsapp = (enquiry.whatsapp ?? enquiry.phone)?.replace(/\D/g, "");
  const rows: [string, React.ReactNode][] = [
    ["Package", enquiry.package ? <Link href={`/packages/${enquiry.package.id}`} className="text-cobalt hover:underline">{enquiry.package.title}</Link> : "General enquiry"],
    ["Branch", enquiry.branch?.name ?? "—"],
    ["Travellers", `${enquiry.adults} adults, ${enquiry.children} children, ${enquiry.infants} infants`],
    ["Travel date", formatDate(enquiry.travelDate)],
    ["Estimate shown", enquiry.estimatedTotal !== null && enquiry.currencyCode ? formatAmount(enquiry.estimatedTotal, enquiry.currencyCode) : "—"],
    ["Email", enquiry.email ? <a href={`mailto:${enquiry.email}`} className="text-cobalt hover:underline">{enquiry.email}</a> : "—"],
    ["Phone", enquiry.phone ? <a href={`tel:${enquiry.phone.replace(/\s/g, "")}`} className="text-cobalt hover:underline">{enquiry.phone}</a> : "—"],
    ["WhatsApp", whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="text-cobalt hover:underline">{enquiry.whatsapp ?? enquiry.phone}</a> : "—"],
    ["Received", formatDateTime(enquiry.createdAt)],
  ];

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/enquiries" className="text-cobalt hover:underline">
          Enquiries
        </Link>
      </p>
      <PageHeader title={enquiry.name} description={<Badge tone={STATUS_TONE[enquiry.status]}>{humanize(enquiry.status)}</Badge>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Details" className="lg:col-span-2">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {enquiry.message && (
            <>
              <h3 className="mt-6 text-sm font-semibold">Message</h3>
              <p className="mt-1 text-sm whitespace-pre-line">{enquiry.message}</p>
            </>
          )}
        </Card>
        <div className="space-y-6">
          <Card title="Follow-up">
            <EnquiryStatus id={enquiry.id} status={enquiry.status} />
          </Card>
          <Card title="Internal notes">
            <EnquiryNoteForm id={enquiry.id} />
            <ul className="mt-5 space-y-4">
              {enquiry.notes.map((note) => (
                <li key={note.id} className="border-l-2 border-sun pl-3 text-sm">
                  <p className="whitespace-pre-line">{note.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {note.author ?? "Former user"}, {formatDateTime(note.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
