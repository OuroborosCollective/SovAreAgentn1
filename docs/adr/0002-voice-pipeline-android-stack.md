# ADR 0002: Architektur-ADR für günstige Echtzeit-Voice-Pipeline und Android-Stack

## 1. Status
**Entschieden**

## 2. Kontext & Ziel
Für N+1 als "Familienmitglied" ist eine natürliche, verzögerungsarme Sprachinteraktion (Voice) essenziell. Die Lösung muss auf Android-Geräten der Familie stabil laufen, die Privatsphäre schützen, Kostensicherheit bieten und offline-degradierbar sein. 
Dieses Dokument definiert die Architektur für den Android-Stack, den Audio-Transport, STT/TTS-Provider und das LLM-Routing (OpenRouter), wie in Issue #16 gefordert.

## 3. Varianten-Vergleich

### 3.1 Android App Stack
*   **Variante A: React/Vite + Capacitor (Gewählt)**
    *   *Wartung:* Sehr hoch (Nutzung der bestehenden Web-Codebasis, 1:1 Mirroring von UI/UX).
    *   *Latenz/Performance:* Ausreichend für Web Audio APIs, minimaler Overhead durch Capacitor-Bridge für native Audio-Aufnahme.
    *   *Kosten:* 0€ (Single-Codebase).
    *   *Offline:* PWA-Fähigkeiten via Service Worker und lokale IndexDB/SQLite (via Capacitor-Plugins).
*   **Variante B: React Native / Expo**
    *   *Wartung:* Hoch (Erfordert separaten UI-Baum und eigene Komponentenbibliothek, doppelter Pflegeaufwand).
    *   *Latenz/Performance:* Besserer Zugriff auf Low-Level Native-APIs, aber für unsere Voice-App nicht zwingend nötig.
    *   *Kosten:* 0€, aber hohe Entwicklungsopportunitätskosten.
    *   *Offline:* Native Speicherung, aber komplexer zu synchronisieren mit dem Web-Core.

*Entscheidung:* Capacitor wird als Android-Wrapper für die bestehende Vite/React-SPA genutzt, um maximale Kohäsion und schnelle Iteration zu sichern.

### 3.2 Audio-Transport
*   **Variante A: WebSocket (Gewählt)**
    *   *Latenz:* Gering (~50-100ms Overhead pro Chunk). Bidirektionale Events (Transcript, Context, Audio).
    *   *Einfachheit:* Sehr hoch, einfache Integration in Node.js Backend und React.
    *   *Robustheit:* Gut kontrollierbare Reconnect-Logik, gut für N+1 Session-Kontext.
*   **Variante B: WebRTC**
    *   *Latenz:* Minimal (UDP-basiert).
    *   *Einfachheit:* Gering (Benötigt TURN/STUN Server, komplexe ICE-Aushandlung, hoher Overhead für simple Server-Client-Architektur).
*   **Variante C: Chunked HTTP / SSE**
    *   *Latenz:* Mittel bis hoch für bidirektional, gut für TTS-Streaming (SSE), schlecht für STT-Streaming (HTTP POST Overhead).

*Entscheidung:* WebSocket als primärer Transport für den Voice-Kanal. Erlaubt synchronisierte Event-Protokolle (Audio-Chunks + Metadaten + Memory-Retrieval-Events).

### 3.3 STT / TTS & Provider-Fallback
*   *Architektur:* Adapter-Pattern im Backend. Der N+1-Core kennt nur das Interface `IVoiceProvider`.
*   *Fallback-Kette (STT):* 
    1. Primär (High Quality): Cloud-Provider (z.B. Whisper API / Google Speech-to-Text).
    2. Sekundär (Degraded/Free): Kostenlose Kontingente / OpenRouter Audio-Modelle falls verfügbar.
    3. Offline (Local): On-Device Web Speech API / Capacitor Native STT als Fallback ohne Kosten/Netz.
*   *Fallback-Kette (TTS):*
    1. Primär: Hochwertige Cloud-TTS (z.B. ElevenLabs / OpenAI TTS).
    2. Sekundär: Standard Cloud-TTS.
    3. Offline: On-Device TTS (Native Android TTS via Capacitor).

### 3.4 LLM Routing (OpenRouter)
*   **Vorgabe:** OpenRouter als primäres Abstraktions-Layer für LLM-Aufrufe. *LiteLLM wird explizit nicht verwendet.*
*   **Free Routes:** Nutzung von kostenlosen / Keyless-Routen (Revolver-Pattern) zur Kostenminimierung (z.B. `google/gemini-2.5-flash:free`, `meta-llama/llama-3-8b-instruct:free`).
*   **Fallback:** Paid-Routen werden nur als Fallback bei Quota-Exhaustion der Free-Routen und nur innerhalb des harten Kostenbudgets genutzt. "Keyless/Free" wird vor Ausführung durch eine Heartbeat-Prüfung validiert.

## 4. Zielwerte & Metriken (SLAs)

Um die Natürlichkeit der Interaktion zu garantieren, gelten folgende maximale Zielwerte:
*   **Time-to-first-transcript (TTFT):** < 400ms (ab Ende des Sprechens bis zum ersten Text).
*   **Time-to-first-audio (TTFA):** < 800ms (ab fertigem Transcript, inklusive LLM-Generierung und erstem TTS-Chunk). LLM-Streaming und TTS-Streaming müssen kaskadiert werden.
*   **Abbruchzeit (VAD - Voice Activity Detection):** ~600ms Stille triggert das Ende der Nutzer-Eingabe.
*   **Datenverbrauch:** < 1 MB pro Minute aktiver Unterhaltung (Nutzung effizienter Codecs wie Opus @ 16kHz).
*   **Monatliches Kostenlimit:** < 5,00€ für die gesamte Familie (Sichergestellt durch harte Limits im N+1 Backend und Bevorzugung von OpenRouter Free-Routes).

## 5. Konsequenzen
*   Die UI muss eine WebSocket-Connection verwalten (Reconnection, Ping/Pong).
*   Backend-Architektur erfordert strenge Adapter-Grenzen (`VoiceManager` -> `STTProvider` / `TTSProvider`).
*   Sessions müssen kurzlebig sein; Memory-Retrieval passiert asynchron beim STT-Abschluss, bevor das LLM antwortet.
*   Ein strikter "Cost-Circuit-Breaker" muss implementiert werden: Ist das Budget ausgeschöpft, degradiert das System auf "Offline-Mode" oder "Free-Tier-Only".

## 6. Abhängigkeiten
*   Löst Issue #16.
*   Legt den Grundstein für STT/TTS-Implementierung (#17, #18) und LLM-Voice-Loop.
