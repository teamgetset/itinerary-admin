/** Enquiry statuses in workflow order. */
export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "CONVERTED", "CLOSED"];

export interface Enquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  travelDate: string | null;
  adults: number;
  children: number;
  infants: number;
  currencyCode: string | null;
  estimatedTotal: number | null;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  package: { id: string; title: string; slug: string } | null;
  branch: { id: string; name: string } | null;
}

