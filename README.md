# N+1 — souveräne Familien-Voice-Persona (in Arbeit)

**Status: nicht produktions- oder Android-releasefähig.** GitHub-Issue [#1](https://github.com/OuroborosCollective/SovAreAgentn1/issues/1) beschreibt das Ziel. Ein geschlossenes Issue, ein Build, ein Mock, eine CLI-Ausgabe oder ein grüner statischer Test ersetzen keinen echten Runtime-Readback.

N+1 soll eine minimalistische, liebevoll animierte Android-App mit sprachlicher Interaktion, nachvollziehbarem Gedächtnis und nur freiwilliger, widerrufbarer Familien-Sprecherverifikation werden. Historische Aliasnamen dürfen nicht die kanonische Identität ersetzen.

## Wahrheitspfade und Eigentümer

| Fläche | Verantwortlicher | Prüfnachweis |
|---|---|---|
| Core | Versionsgebundene Persona-, Event- und Sicherheitsverträge | Deterministische Contract-Tests |
| Produktion/Runtime | Express/Node-Prozess im gebauten Docker-Image | Git-SHA, tatsächlicher HTTP-Readback |
| Persistenz | PostgreSQL/pgvector und Migrationen | Datenbankschreib- und Neustart-Readback |
| Effekt | Auth, Voice, Provider, Löschung, Geräte-/Git-Eingriff | Server-/Providerquittung; sonst unavailable |
| Tests | Vitest, echter TCP-Router, Compose-PostgreSQL, Playwright | Reproduzierbarer GitHub-Actions-Job und Log |
| Android | Separater Mobile-Client; derzeit nicht geräteverifiziert | Signatur, APK/AAB-Digest, Installation und Gesprächszyklus |

**Bewusste Grenzen:** Zeitstempel und kryptografisch sichere IDs dürfen asynchrone Randereignisse beschreiben, aber nicht unseeded in deterministische Kernentscheidungen fließen. Ein Memory- oder Lernen-Endpunkt quittiert einen Effekt erst nach Datenbankquittung. Löschung und Sprecherverifikation sind deaktiviert, solange vollständiger Widerruf, Backup-Propagation und Provider-/Gerätenachweise fehlen.

## Isolierter lokaler Test-Betrieb

Zum Starten ist eine **tatsächlich konfigurierte** PostgreSQL-URI mit demselben Passwort wie `POSTGRES_PASSWORD`, eine kryptografisch zufällige Cookie-Signing-Key sowie ein 40-stelliger Git-Commit-SHA erforderlich. Niemals feste Beispielpasswörter auf einem VPS übernehmen.

```bash
export GIT_REVISION="$(git rev-parse HEAD)"
export POSTGRES_PASSWORD="$(openssl rand -hex 32)"
export N1_COOKIE_SECRET="$(openssl rand -hex 48)"
export DB_URI="postgres://n1_user:${POSTGRES_PASSWORD}@db:5432/n1_db"
docker compose up --build -d
```

Nur in einer separaten Testumgebung ausführen: `docker compose down --volumes` löscht lokale Daten; **nicht auf dem Produktions-VPS verwenden**. Der Compose-Stack beansprucht begrenzte CPU/RAM-Ressourcen und startet den autonomen Hintergrundscanner standardmäßig nicht. Externer OAuth verlangt explizit konfigurierte Client-ID, Client-Secret und feste `N1_OAUTH_REDIRECT_URI`. Ohne gültige Konfiguration ist die Anmeldung geschlossen, nicht simuliert.

## Prüfungen

```bash
npm ci
npm run check:proof
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:contract
npm run test:security
```

Das sind lokale Stufen; **sie belegen weder echten PostgreSQL-Betrieb noch Android-Funktionalität**. GitHub Actions unter [N+1 Evidence CI](https://github.com/OuroborosCollective/SovAreAgentn1/actions/workflows/n1-ci.yml) startet zusätzlich das echte Compose-Image und PostgreSQL, prüft HTTP-/Auth-Grenzen, Datenbankpersistenz nach Containerneustart und Chromium-E2E; CodeQL, Gitleaks, Trivy und SBOM ergänzen die Sicherheitsprüfung.

Die Runtime-Regressionen `scripts/test-runtime-truth.mjs` und `scripts/test-runtime-persistence.mjs` dürfen nur gegen die in CI erzeugte **ephemere Testinstanz** ausgeführt werden. Sie tragen explizit als Testfixtures gekennzeichnete Ereignisse ein; solche Daten dürfen nie als Familien- oder Produktionsbelege ausgegeben werden.

## Release-Politik

CI darf **keinen** NPM-/Docker-/APK-Release vorwegnehmen. Issue #31 muss ein signiertes APK/AAB und ein reales Geräteprotokoll liefern; #32 den VPS-Image-Digest und Readback, #33 das vollständige Security-/Privacy-Audit und #34 die Familienabnahme. Ohne diese Belege bleibt #1 offen.

Entwicklungsverlauf: [Draft-PR #36](https://github.com/OuroborosCollective/SovAreAgentn1/pull/36). Kein Merge ohne belegte Pflichtgates und genau einen revisionsgebundenen `Memory.md`-Eintrag mit Änderung, Erkenntnis und Evidence.
