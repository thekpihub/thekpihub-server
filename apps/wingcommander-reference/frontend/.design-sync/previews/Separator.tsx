import { Separator } from "thekpihub-wingcommander-frontend";

export function HorizontalBetweenSections() {
  return (
    <div className="w-72">
      <div>
        <h4 className="text-sm font-medium leading-none">Wingcommander workspace</h4>
        <p className="text-sm text-muted-foreground">Revenue, churn, and retention KPIs.</p>
      </div>
      <Separator className="my-4" />
      <div>
        <h4 className="text-sm font-medium leading-none">Billing workspace</h4>
        <p className="text-sm text-muted-foreground">Invoices, plans, and payment methods.</p>
      </div>
    </div>
  );
}

export function VerticalBetweenLabels() {
  return (
    <div className="flex h-5 items-center gap-4 text-sm">
      <span>Dashboard</span>
      <Separator orientation="vertical" />
      <span>Reports</span>
      <Separator orientation="vertical" />
      <span>Settings</span>
    </div>
  );
}
