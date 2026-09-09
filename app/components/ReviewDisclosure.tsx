import Link from "next/link";

type Props = {
  lastReviewed: string;
  basis?: string;
  label?: string;
};

export default function ReviewDisclosure({
  lastReviewed,
  basis = "Curated rule packs + official-source review",
  label = "CONTENT REVIEW",
}: Props) {
  return (
    <div className="review-disclosure" aria-label="SellComply review information">
      <div>
        <span>{label}</span>
        <strong>SellComply regulatory review workflow</strong>
      </div>
      <div>
        <span>LAST REVIEWED / VERIFIED</span>
        <strong>{lastReviewed}</strong>
      </div>
      <div>
        <span>REVIEW BASIS</span>
        <strong>{basis}</strong>
      </div>
      <div className="review-disclosure-links">
        <Link href="/methodology">Methodology</Link>
        <Link href="/sources-policy">Sources</Link>
        <Link href="/corrections">Corrections</Link>
      </div>
    </div>
  );
}
