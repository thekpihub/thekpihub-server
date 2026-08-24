import { Badge } from "thekpihub-wingcommander-frontend";

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  );
}

export function StatusLabels() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="success">Deployed</Badge>
      <Badge variant="warning">Pending review</Badge>
      <Badge variant="destructive">Build failed</Badge>
      <Badge variant="info">Syncing</Badge>
    </div>
  );
}

export function InlineWithText() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium">Wingcommander workspace</span>
      <Badge variant="secondary">production</Badge>
    </div>
  );
}
