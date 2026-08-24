import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from "thekpihub-wingcommander-frontend";

export function Default() {
  return (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Weekly revenue review</CardTitle>
        <CardDescription>
          A summary of the KPIs your team tracked over the last 7 days, generated automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Revenue is up 12% week over week, driven mostly by repeat customers in the Wingcommander
          workspace. Churn stayed flat at 2.1%.
        </p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" size="sm">
          Dismiss
        </Button>
        <Button size="sm">View details</Button>
      </CardFooter>
    </Card>
  );
}

export function WithBadge() {
  return (
    <Card className="w-[360px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Deployment status</CardTitle>
          <Badge variant="success">Healthy</Badge>
        </div>
        <CardDescription>thekpihub-wingcommander-frontend · production</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Last deploy finished 14 minutes ago. All health checks are passing.
        </p>
      </CardContent>
    </Card>
  );
}

export function ContentOnly() {
  return (
    <Card className="w-[280px]">
      <CardContent className="pt-6">
        <p className="text-sm">
          A minimal card with no header or footer — just composed content for compact layouts.
        </p>
      </CardContent>
    </Card>
  );
}
