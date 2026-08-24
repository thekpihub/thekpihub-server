import { Button } from "thekpihub-wingcommander-frontend";
import { Download, Loader2 } from "lucide-react";

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
      <Button variant="gradient">Gradient</Button>
      <Button variant="glass">Glass</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra large</Button>
    </div>
  );
}

export function WithIcon() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Download />
        Download report
      </Button>
      <Button size="icon" variant="outline">
        <Download />
      </Button>
    </div>
  );
}

export function States() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button loading>Saving changes</Button>
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>
        <Loader2 className="animate-spin" />
        Syncing
      </Button>
    </div>
  );
}
