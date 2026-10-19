import { redirect } from "next/navigation";
type Props = { params: Promise<{ slug: string }> };
export default async function LegacyExamAttemptPage({ params }: Props) { const { slug } = await params; redirect(`/attempt/${encodeURIComponent(slug)}`); }
