import { redirect } from "next/navigation";
type Props = { params: Promise<{ slug: string }> };
export default async function LegacyExamResultPage({ params }: Props) { const { slug } = await params; redirect(`/result/${encodeURIComponent(slug)}`); }
