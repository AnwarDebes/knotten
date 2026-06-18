## Personvern og analyse: Google Analytics, Plausible og cookie-samtykke

### Google Analytics og overføring til USA
Datatilsynet konkluderte i vedtak publisert 27. juli 2023 (klage fra noyb, nettstedet telenor.com) med at bruk av standard Google Analytics hadde vært ulovlig: "når nettstedet brukte Google Analytics, ble det overført personopplysninger til USA i strid med reglene." Grunnlaget er Schrems II-dommen (2020), der EU-domstolen slo fast at standard personvernbestemmelser (SCC) alene ikke er nok for overføring til USA.

Datatilsynet legger samtidig til grunn at det sentrale overføringsproblemet ser ut til å være løst etter at EU-US Data Privacy Framework (DPF) ble vedtatt i juli 2023: personopplysninger kan nå overføres til amerikanske virksomheter som er sertifisert under rammeverket, og Google er sertifisert. Dette gjelder kun selve overføringen, ikke alle andre personvernspørsmål ved verktøyet.

### DPF-forbeholdet
Posisjonen er betinget. Underretten (General Court) opprettholdt DPF 3. september 2025 (Latombe, sak T-553/23), men en anke er registrert ved EU-domstolen (sak C-703/25 P) og var ikke avgjort per juni 2026. Uavhengigheten til det amerikanske tilsynsorganet PCLOB er trukket fram som en risiko. Rammeverket er gyldig nå, men kan svekkes eller kjennes ugyldig. Google Analytics på amerikansk infrastruktur bør derfor ikke fremstilles som varig regelrett.

### Cookieless analyse og ny ekomlov
Fra 1. januar 2025 krever ny ekomlov (paragraf 3-15) GDPR-gyldig samtykke for å "lagre eller skaffe seg tilgang til opplysninger i brukerens kommunikasjonsutstyr." Regelen gjelder alle typer opplysninger, ikke bare personopplysninger, med snevre unntak (ren overføring og strengt nødvendig for en tjeneste brukeren uttrykkelig har bedt om). Nkom vurderer om en teknologi omfattes og om unntak gjelder; Datatilsynet vurderer informasjon og samtykkekvalitet.

Et cookieless, EU-hostet verktøy som Plausible oppgir at det verken setter informasjonskapsler eller leser opplysninger fra enheten, og at det ikke behandler personopplysninger: "By not using cookies, you do not need to obtain consent from visitors to store and retrieve data from their devices." Unike besøkende telles via en "salt" som roteres og slettes hver 24. time, rå IP og User-Agent lagres ikke, og alle data forblir i EU (Hetzner i Tyskland, UpCloud i Finland, Bunny i Slovenia).

### Rettslig grunnlag og dataminimering
Logikken er todelt: ingen tilgang til enheten (ekomlov/ePrivacy) og ingen personopplysninger (GDPR). Da utløses verken samtykkekravet for cookies eller behov for et GDPR-rettslig grunnlag, fordi det ikke er noen personopplysninger å behandle. Begrunnelsen er dataminimering (GDPR art. 5(1)(c)): "We measure only the most essential data points and nothing else." Den konservative fremstillingen er at fravær av personopplysninger og enhetslagring fjerner plikten til samtykkebanner, ikke at et annet grunnlag erstatter samtykke. Skulle restdata likevel bli vurdert som personopplysninger, må et art. 6-grunnlag og ny vurdering på plass.

### Kilder / Sources
- Datatilsynet, Vedtak i Google Analytics-saken: https://www.datatilsynet.no/regelverk-og-verktoy/lover-og-regler/avgjorelser-fra-datatilsynet/2023/vedtak-i-google-analytics-saken/
- Datatilsynet, Nye cookie-regler fra 1. januar: https://www.datatilsynet.no/aktuelt/aktuelle-nyheter-2024/nye-cookie-regler-fra-1.-januar/
- Plausible, Data Policy: https://plausible.io/data-policy
- Plausible, Privacy-focused web analytics: https://plausible.io/privacy-focused-web-analytics
- Heuking, EuG confirms effectiveness of EU-US DPF (Latombe, T-553/23): https://www.heuking.de/en/news-events/newsletter-articles/detail/eug-confirms-effectiveness-of-eu-us-data-privacy-framework.html

Alle kilder ble kontrollert i juni 2026. Regler og status (særlig DPF-anken og sertifiseringer) endres, og må verifiseres på nytt før offentlig bruk.
