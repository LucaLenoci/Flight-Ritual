import { CardDetailView } from "../../../../components/cards/card-detail-view";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ kind: string; code: string }>;
}) {
  const { kind, code } = await params;
  return <CardDetailView kind={kind} code={decodeURIComponent(code)} />;
}
