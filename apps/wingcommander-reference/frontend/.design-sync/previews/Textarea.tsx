import { Textarea } from "thekpihub-wingcommander-frontend";

export function Placeholder() {
  return <Textarea placeholder="Add notes about this KPI…" />;
}

export function Filled() {
  return (
    <Textarea defaultValue="Revenue dashboard is trending 12% above target this quarter. Flagging for the Friday standup." />
  );
}

export function Disabled() {
  return <Textarea disabled defaultValue="Locked while the report is being finalized." />;
}
