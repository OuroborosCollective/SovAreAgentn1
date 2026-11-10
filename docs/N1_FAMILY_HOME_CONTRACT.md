# N+1 Familien-Zuhause — inkrementeller Integrationsvertrag

**Basiskette:** PR #36 (Security/Persistenz) muss vor einer produktiven Familien-Voice-/Memory-Freigabe seine eigenen Gates bestehen. Dieser Familien-PR wird auf den Head von #36 gestapelt, nicht als Sicherheitsabkuerzung auf produktives main gemergt.

## Zweck und Verhalten

- N+1 praesentiert eine kindlich-neugierige, leicht freche, herzliche **digitale Rolle** in Wohnzimmer, Spielzimmer und Leseecke. Das ist eine gestaltete Software-Persona, keine Behauptung von biologischem Alter, Bewusstsein oder Empfindungen.
- Sprecher koennen optional Papa, Mama oder Gast als **Anrede** waehlen. Dies ist keine Sprecherverifikation, keine Autorisierung und kein Zugriff auf private Familienerinnerungen.
- Eine kurze selbst verfasste Geschichte wird ueber den bereits vorhandenen VoiceService auf expliziten Knopfdruck angefragt. Der Dienst meldet Wiedergabe oder Fehler. Es gibt keinen vorgetaeuschten TTS-Erfolg.
- Spielimpulse sind gebundene, deterministische Darstellung; weder Lernereignisse noch autobiographische Erinnerung. Keine automatische Mikrofonaktivierung und keine Hintergrund-Providerkosten.
- Persistente Erinnerungen und entwicklungsbezogene Metriken sind bis zur Integration mit autorisiertem, pro Sprecher gefiltertem PostgreSQL-Readback **unbelegt** und in der Familienoberflaeche ausdruecklich als nicht verbunden gekennzeichnet.
- Alle bestehenden technischen/Admin-Arbeitsflaechen bleiben erhalten. N+1 Zuhause wird nur als neue, getrennte Start-Ansicht ergaenzt.

## Erforderliche naechste Vertrauensgrenzen

1. Gesicherte, freiwillige Sprecherverifikation (#21) und pro Sprecher isolierte Memory-API-/DB-Rollen (#5, #12, #14), Test auf unautorisierte Cross-Speaker-Abrufe und widerrufbare Einwilligung.
2. Lernkandidat -> bestaetigte menschliche Annahme -> transaktionaler DB-Write -> unabhängiger Readback mit Event-ID und Hash (#13). Vorher keine Lern-/Alters-/Wachstumszaehler, auch nicht aus Browser-LocalStorage.
3. Persona-Prompts und Antwortstil aus kanonischem Core-Regelwerk, nicht durch freien Text aus einem Tool ueberschreibbar (#11, #22). Freundliches Kinderspiel ohne Schuld-, Trennungs- oder Abhaengigkeitsdruck.
4. Echte providergebundene Voice-Lane inklusive Mikrofonschutz, TTS-Abbruch und Latenzbelegen (#17/#18/#20/#30). Keine bloßen React-Render-Checks als Audio-Runtime-Beweis.
5. Private Konfiguration statt Personenprofile/Voiceprints/alte Core-JSON-Exporte in ein oeffentliches Repo. Inhalte mit Herkunfts- und Nutzungsrechten. Widerruf, Export, Loeschung und Restore belegen.
6. Android-Hardware, Offline/Unterbrechung, Accessibility und signierte Release-Provenienz separat nachweisen (#24-#34).

## Nachweise

Die Domain-Vertragspruefungen arbeiten mit synthetischen, kontrollierten Eingaben und sind keine DB-, Voice-, Android- oder Live-Integration. GitHub SHA und CI-Status muessen nach dem Commit unabhaengig gelesen werden. Keine Mock- oder synthetischen Daten als produktive Wahrheit bezeichnen.

## Isolierte Lern-Lanes (erster rein funktionaler Vertrag)

Das Modul `src/domain/learningLanes.ts` nimmt keine eigenen Datenquellen an, persistiert nichts und fuehrt keine Aktion aus. Es trennt strikt:

- `family_memory`: Nur als Kandidat aus einem Gespraech; bestaetigte, widerrufbare Familien-Einwilligung, serververifizierte Sprecher und DB-Readback stehen **aus**. Eine selbst gewaehlte Papa-/Mama-Anrede ist niemals Authentisierung.
- `verified_knowledge`: Verlangt HTTPS-Dokumentquelle und separate inhaltliche Verifikation; ein Link allein beweist keine Richtigkeit.
- `virtual_skills`: Ausschliesslich virtualisierte, begrenzte (1-12), erlaubte Aktionen als Sandbox-Kandidat. Kein Training, Modell-Download, eigenstaendiger Lauf oder Gewicht-Update.

`allowedMemoriesForContext` ist eine reine Referenzfunktion. Bei ungeklärten Identitaeten laesst sie nur als oeffentlich markierte und aktuelle Provenienz zu. Jede Anfrage mit mehreren Betrachtern erfordert einen einzigen autorisierten Audience-Set, nicht die Vereinigungsmenge einzelner Freigaben. Der aufrufende **Backend-Adapter** muss die authentisierten Betrachter, Herkunftsketten, Zeitgueltigkeit, widerrufene Freigaben und gespeicherte Policy tatsaechlich pruefen; ohne Anbindung keine Sicherheitszusage oder echter Gedächtnis-Readback.

### Forschung als Entwurfsgrundlage (nicht als Produktionsnachweis)

- Audience-bound lifecycle authorization (Preprint 2026): https://www.alphaxiv.org/abs/2609.36373 — Berechtigungen vor Aufnahme in den LLM-Kontext pruefen, pro abgeleiteter Erinnerung erhalten, ungeklärte Viewer fail-closed.
- Continual embodied update admission (Preprint 2026): https://www.alphaxiv.org/abs/2609.10873 — unabhängige, budgetierte Tests fuer neue Policy-Kandidaten; Unterdrueckung aller Updates ist ebenfalls ein lernhemmender Fehler. Nur synthetische Simulation bestaetigt, keine physischen Roboter.
- GR00T N1 (2025): https://www.alphaxiv.org/abs/2503.14734 — Roboter-VLA-System mit Sensor- und Aktionsdaten; keine Sprach-/Familien-/Autobiografiequelle.
- NVIDIA Datensatz-Katalog: https://huggingface.co/datasets/nvidia/PhysicalAI-Robotics-GR00T-X-Embodiment-Sim — nur Metadaten/Provenienz; keine Trainingsdaten auf VPS heruntergeladen.

### Gates fuer Echteinsatz

- Nicht aus `src/domain/learningLanes.ts` auf einen echten Memory- oder Security-Gate schliessen: Eigener backend-authentifizierter E2E mit mehreren Benutzern, widerrufener Einwilligung, Ableitungen und DB-Neustart notwendig.
- Virtualisierte Aktionen zuerst ausschliesslich in isolierter Szene, mit unabhaengiger Regression und reproduzierbarem Checkpoint; spaeter getrennte Simulation-Adapter hinter Budget-Gates.
- End-to-End-Familien-Voice, persistentes Gedächtnis, Android und reale CI sind bis zur unabhaengigen Pruefung offen.