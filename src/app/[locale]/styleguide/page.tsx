import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Info, CircleCheck, TriangleAlert, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/site/logo";
import { EstimateBadge } from "@/components/primitives/estimate-badge";
import { Disclaimer, DISCLAIMERS } from "@/components/primitives/disclaimer";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

const swatches = [
  { name: "primary", className: "bg-primary text-primary-foreground" },
  { name: "sea", className: "bg-sea text-sea-foreground" },
  { name: "secondary", className: "bg-secondary text-secondary-foreground" },
  { name: "muted", className: "bg-muted text-muted-foreground" },
  { name: "accent", className: "bg-accent text-accent-foreground" },
  { name: "destructive", className: "bg-destructive text-destructive-foreground" },
  { name: "success", className: "bg-success text-success-foreground" },
  { name: "warning", className: "bg-warning text-warning-foreground" },
];

const navyShades = [
  "bg-navy-50",
  "bg-navy-100",
  "bg-navy-200",
  "bg-navy-300",
  "bg-navy-400",
  "bg-navy-500",
  "bg-navy-600",
  "bg-navy-700",
  "bg-navy-800",
  "bg-navy-900",
];
const seaShades = [
  "bg-sea-50",
  "bg-sea-100",
  "bg-sea-200",
  "bg-sea-300",
  "bg-sea-400",
  "bg-sea-500",
  "bg-sea-600",
  "bg-sea-700",
  "bg-sea-800",
  "bg-sea-900",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t pt-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default async function StyleguidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl space-y-10 px-6 py-12">
      <header className="space-y-2">
        <Logo />
        <h1 className="text-3xl font-semibold tracking-tight">Designsystem</h1>
        <p className="text-muted-foreground">
          Alle tokens og komponenter med tilstander. Intern referanse.
        </p>
      </header>

      <Section title="Farger">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map((s) => (
            <div key={s.name} className={`rounded-md p-4 text-sm font-medium ${s.className}`}>
              {s.name}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {navyShades.map((c) => (
            <div key={c} className={`size-10 rounded ${c}`} title={c.replace("bg-", "")} />
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {seaShades.map((c) => (
            <div key={c} className={`size-10 rounded ${c}`} title={c.replace("bg-", "")} />
          ))}
        </div>
      </Section>

      <Section title="Typografi">
        <h1 className="text-4xl font-semibold tracking-tight">Overskrift 1</h1>
        <h2 className="text-2xl font-semibold tracking-tight">Overskrift 2</h2>
        <h3 className="text-xl font-semibold">Overskrift 3</h3>
        <p className="max-w-prose leading-7">
          Brødtekst. Et energismart boligområde ved sjøen i Rødberg, med sjøutsikt og natur tett på.
        </p>
        <p className="text-muted-foreground text-sm">Dempet, mindre tekst.</p>
      </Section>

      <Section title="Knapper">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primær</Button>
          <Button variant="sea">Sjø</Button>
          <Button variant="secondary">Sekundær</Button>
          <Button variant="outline">Omriss</Button>
          <Button variant="ghost">Diskré</Button>
          <Button variant="link">Lenke</Button>
          <Button variant="destructive">Slett</Button>
          <Button disabled>Deaktivert</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Liten</Button>
          <Button size="default">Standard</Button>
          <Button size="lg">Stor</Button>
        </div>
      </Section>

      <Section title="Merkelapper">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Standard</Badge>
          <Badge variant="secondary">Sekundær</Badge>
          <Badge variant="sea">Sjø</Badge>
          <Badge variant="outline">Omriss</Badge>
          <Badge variant="success">Ledig</Badge>
          <Badge variant="warning">Reservert</Badge>
          <Badge variant="destructive">Solgt</Badge>
        </div>
      </Section>

      <Section title="Varsler">
        <Alert variant="info">
          <Info />
          <AlertTitle>Informasjon</AlertTitle>
          <AlertDescription>Tomtene er foreløpige og kan endres.</AlertDescription>
        </Alert>
        <Alert variant="success">
          <CircleCheck />
          <AlertTitle>Lagret</AlertTitle>
          <AlertDescription>Endringene er lagret.</AlertDescription>
        </Alert>
        <Alert variant="warning">
          <TriangleAlert />
          <AlertTitle>Merk</AlertTitle>
          <AlertDescription>Tallene er indikative estimater.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <CircleX />
          <AlertTitle>Noe gikk galt</AlertTitle>
          <AlertDescription>Skjemaet kunne ikke sendes. Prøv igjen.</AlertDescription>
        </Alert>
      </Section>

      <Section title="Skjemafelt">
        <div className="grid max-w-md gap-4">
          <div className="grid gap-2">
            <Label htmlFor="navn">Navn</Label>
            <Input id="navn" placeholder="Ditt navn" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="epost">E-post</Label>
            <Input id="epost" type="email" placeholder="navn@example.no" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ugyldig">Felt med feil</Label>
            <Input id="ugyldig" aria-invalid defaultValue="ugyldig verdi" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="melding">Melding</Label>
            <Textarea id="melding" placeholder="Skriv en melding" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="samtykke" />
            <Label htmlFor="samtykke">Jeg samtykker til å bli kontaktet</Label>
          </div>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Interesse</legend>
            <RadioGroup defaultValue="tomt">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="tomt" id="r-tomt" />
                <Label htmlFor="r-tomt">Tomt</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="bolig" id="r-bolig" />
                <Label htmlFor="r-bolig">Bolig</Label>
              </div>
            </RadioGroup>
          </fieldset>
          <div className="grid gap-2">
            <Label htmlFor="velg">Velg tomt</Label>
            <Select>
              <SelectTrigger id="velg">
                <SelectValue placeholder="Velg en tomt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a1">Tomt A1</SelectItem>
                <SelectItem value="a2">Tomt A2</SelectItem>
                <SelectItem value="a3">Tomt A3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Kort">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Tomt A1</CardTitle>
            <CardDescription>Sjøutsikt mot Sniksfjorden</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Areal og pris er foreløpige.
          </CardContent>
          <CardFooter>
            <Button size="sm">Se tomten</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Faner">
        <Tabs defaultValue="oversikt" className="max-w-lg">
          <TabsList>
            <TabsTrigger value="oversikt">Oversikt</TabsTrigger>
            <TabsTrigger value="energi">Energi</TabsTrigger>
            <TabsTrigger value="sol">Sol</TabsTrigger>
          </TabsList>
          <TabsContent value="oversikt">Oversikt over området.</TabsContent>
          <TabsContent value="energi">Energikonseptet kort fortalt.</TabsContent>
          <TabsContent value="sol">Sol og orientering.</TabsContent>
        </Tabs>
      </Section>

      <Section title="Trekkspill">
        <Accordion type="single" collapsible className="max-w-lg">
          <AccordionItem value="a">
            <AccordionTrigger>Hvordan fungerer energideling?</AccordionTrigger>
            <AccordionContent>
              Egenprodusert strøm kan deles mellom målepunkter på samme eiendom.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Hva skjer hvis jeg selger?</AccordionTrigger>
            <AccordionContent>Dette beskrives i salgsoppgaven.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section title="Dialog og tooltip">
        <div className="flex flex-wrap items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Åpne dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Meld interesse</DialogTitle>
                <DialogDescription>Uforpliktende. Vi tar kontakt for en prat.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button>Send</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Hold over meg</Button>
              </TooltipTrigger>
              <TooltipContent>Kort forklaring</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Section>

      <Section title="Tabell">
        <Table>
          <TableCaption>Foreløpige tomter</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Tomt</TableHead>
              <TableHead>Areal</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>A1</TableCell>
              <TableCell>placeholder m2</TableCell>
              <TableCell>
                <Badge variant="success">Ledig</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>A2</TableCell>
              <TableCell>placeholder m2</TableCell>
              <TableCell>
                <Badge variant="warning">Reservert</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Section title="Brødsmuler og skille">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Hjem</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Tomtene</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Tomt A1</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Separator />
      </Section>

      <Section title="Ærlighet: estimater og forbehold">
        <EstimateBadge source="PVGIS (2026)" />
        <Disclaimer>{DISCLAIMERS.estimate}</Disclaimer>
        <Disclaimer>{DISCLAIMERS.notFinancialAdvice}</Disclaimer>
        <Disclaimer>{DISCLAIMERS.simulation}</Disclaimer>
      </Section>

      <Section title="Bevegelse">
        <p className="text-muted-foreground max-w-prose text-sm">
          Bevegelser bruker felles varighet (150 til 400 ms) og easing, animerer kun transform og
          opasitet, og slås av når brukeren har valgt redusert bevegelse.
        </p>
      </Section>
    </main>
  );
}
