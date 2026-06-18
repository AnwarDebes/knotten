import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Structural accessibility (roles, names, labels) on the static components.
// Full keyboard and colour-contrast verification runs in a real browser in
// SPEC-22; jsdom cannot compute rendered contrast.
describe("component accessibility", () => {
  it("has no axe violations for the core static components", async () => {
    const { container } = render(
      <main>
        <h1>Knotten</h1>
        <Button>Meld interesse</Button>
        <Badge variant="success">Ledig</Badge>
        <Alert variant="info">
          <AlertTitle>Informasjon</AlertTitle>
          <AlertDescription>Tomtene er foreløpige.</AlertDescription>
        </Alert>
        <h2>Tomtene</h2>
        <Card>
          <CardHeader>
            <CardTitle>Tomt A1</CardTitle>
          </CardHeader>
          <CardContent>Sjøutsikt.</CardContent>
        </Card>
        <div>
          <Label htmlFor="navn">Navn</Label>
          <Input id="navn" />
        </div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Hjem</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Tomt A1</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </main>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
