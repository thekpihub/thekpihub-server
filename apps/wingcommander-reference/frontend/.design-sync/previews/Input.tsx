import { Input } from "thekpihub-wingcommander-frontend";

export function Placeholder() {
  return <Input placeholder="Search dashboards…" />;
}

export function Filled() {
  return <Input defaultValue="ana@thekpihub.com" />;
}

export function Email() {
  return <Input type="email" placeholder="teammate@thekpihub.com" />;
}

export function Password() {
  return <Input type="password" defaultValue="••••••••••" />;
}

export function Number() {
  return <Input type="number" defaultValue="42" />;
}

export function Disabled() {
  return <Input disabled defaultValue="Workspace locked" />;
}
