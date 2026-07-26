export const TECHNOLOGY_LEXIKON = [
  {
    id: 'ts5-advanced',
    name: 'TypeScript 5+ Advanced Lexikon',
    source: 'Technology Lexikon',
    category: 'TypeScript 5.x+',
    description: 'Deep knowledge of TypeScript 5.0 up to latest (5.4+). Decorators, Const Type Parameters, exactOptionalPropertyTypes, NoInfer utility, Object.groupBy types, isolatedDeclarations.',
    patternContent: `// TYPESCRIPT 5+ COMPREHENSIVE KNOWLEDGE
- **Decorators (Stage 3):** Standardized decorators for classes, methods, and accessors.
- **const Type Parameters:** 'function foo<const T>(x: T)' infers literal types instead of widened types.
- **NoInfer Utility:** 'type NoInfer<T> = [T][T extends any ? 0 : never];' prevents TS from inferring a generic type from a specific argument.
- **isolatedDeclarations:** Crucial for fast esbuild/swc compilation of monorepos, ensuring every exported API is explicitly typed.
- **satisfies operator:** Validates type without widening (e.g. 'as const satisfies MyType').
- **Control Flow Analysis enhancements:** Better narrowing in closures and switch statements.`,
    impact: 'Sub-ms Builds & Perfect Type Safety',
    status: 'Verified',
    iconName: 'Code2'
  },
  {
    id: 'react-native-lexicon',
    name: 'React Native & Mobile App Development',
    source: 'Technology Lexikon',
    category: 'React Native / Mobile',
    description: 'React Native New Architecture, Fabric Renderer, TurboModules, Expo Router, Reanimated 3, Skia Canvas.',
    patternContent: `// REACT NATIVE COMPLETE KNOWLEDGE
- **New Architecture:** JSI (JavaScript Interface) replaces bridge. Synchronous C++ to JS calls.
- **Fabric:** Concurrent React UI renderer. Multi-threaded layout.
- **TurboModules:** Lazy loaded native modules.
- **Expo SDK 50+:** Expo Router (file-based routing), Expo Modules API (Swift/Kotlin without old bridge).
- **UI & Animations:** React Native Reanimated v3 (worklets run on UI thread), React Native Skia for high-performance 2D graphics.
- **SDK Integrations:** Android SDK, iOS SDK bindings via JSI. Native wind configuration.`,
    impact: 'Native 120 FPS Performance',
    status: 'Verified',
    iconName: 'Cpu'
  },
  {
    id: 'fullstack-web-lexicon',
    name: 'Full-Stack Web (HTML, CSS, JS, Tailwind, PHP)',
    source: 'Technology Lexikon',
    category: 'Full-Stack Architecture',
    description: 'Modern Web development covering HTML5 semantics, aria CSS, Tailwind v4, PHP 8.x attributes and JIT, Modern JS (ES2024).',
    patternContent: `// WEB & FULL-STACK KNOWLEDGE
- **HTML5 & ARIA:** Semantic tags (<article>, <aside>, <nav>), ARIA attributes for screen readers (aria-hidden, aria-live, aria-expanded).
- **Tailwind CSS v4:** Zero-config '@import "tailwindcss"', dynamic utility classes, arbitrary values ('bg-[#ff0000]').
- **PHP 8.x:** Attributes (Annotations), Constructor property promotion, Match expression, Named arguments, JIT compiler for high CPU tasks.
- **Modern JS (ES2024):** Promise.withResolvers, Object.groupBy, Map.groupBy, Atomics.waitAsync.
- **Design Systems:** CD (Corporate Design) principles, stable grid structures (Bento grids, 12-column), high-contrast accessibility (WCAG AA/AAA).`,
    impact: 'Robust Accessible Interfaces',
    status: 'Verified',
    iconName: 'Globe'
  },
  {
    id: 'systems-languages-lexicon',
    name: 'Systems & Backend (Rust, Go, C, C++, Perl, Python)',
    source: 'Technology Lexikon',
    category: 'Full-Stack Architecture',
    description: 'Systems programming paradigms, memory safety, concurrency, scripting, and legacy migrations.',
    patternContent: `// SYSTEMS & BACKEND KNOWLEDGE
- **Rust:** Ownership, Borrowing, Lifetimes. Zero-cost abstractions. Tokio for async. 'unsafe' boundaries.
- **Go:** Goroutines, Channels, Interface composition, garbage collection optimizations, standard library networking.
- **C / C++:** Pointers, manual memory management (malloc/free, new/delete), RAII, Smart Pointers (std::unique_ptr, std::shared_ptr), C++20 Concepts and Modules.
- **Python:** GIL (Global Interpreter Lock) nuances, Asyncio, Data Science ecosystem (Pandas, NumPy), AI SDK integrations.
- **Perl:** Regular expressions, text processing, legacy system maintenance and regex optimizations.`,
    impact: 'High-Performance Core Microservices',
    status: 'Verified',
    iconName: 'Server'
  },
  {
    id: 'ai-sdk-lexicon',
    name: 'AI & LLM SDKs (Vertex, GPT, OpenAI, Gemini)',
    source: 'Technology Lexikon',
    category: 'Coding Engine',
    description: 'Deep knowledge of Vertex Agent SDK, OpenAI SDK, Custom GPT templates, rules engines, and Vektor Semantik.',
    patternContent: `// AI & LLM SDK KNOWLEDGE
- **Google Gen AI / Vertex SDK:** Function calling, structured JSON output, grounding with Google Search, multimedia streaming.
- **OpenAI SDK & Custom GPTs:** System instructions formatting, tool calling (tools/tool_choice), streaming responses. Custom GPT instructions and rule formatting.
- **Vector Semantics (Milvus, PGVector):** Cosine similarity, L2 distance, Inner product. Indexing strategies (HNSW, IVF_FLAT). Chunking strategies for embeddings.
- **Prompt Engineering:** Chain of Thought, ReAct frameworks, few-shot prompting, schema enforcement.`,
    impact: 'Next-Gen AI Integrations',
    status: 'Verified',
    iconName: 'Bot'
  },
  {
    id: 'design-cd-lexicon',
    name: 'Design & CD Rules for Apps & Android',
    source: 'Technology Lexikon',
    category: 'Full-Stack Architecture',
    description: 'Aria CSS, Android Design schemas, industrial hardened templates, stable structure rules.',
    patternContent: `// DESIGN & CD RULES KNOWLEDGE
- **Android Material Design 3:** Dynamic color (Material You), elevation mappings, typography scales, adaptive layouts for foldables.
- **Aria CSS:** Styling based on ARIA states (e.g. '[aria-expanded="true"] { display: block; }') for fully accessible interactive components.
- **Industrial Hardened Templates:** Strict grid alignments, mathematical spacing (8px or 4px baseline grid), high data density UI patterns.
- **Schematic Rules:** Consistent corner radius (outer = inner + padding logic), max contrast constraints, limited color palettes with semantic meaning (success, warning, error, info).`,
    impact: 'Enterprise-Grade UI/UX',
    status: 'Verified',
    iconName: 'Sparkles'
  },
  {
    id: 'german-folk-songs',
    name: 'Cultural Volkslieder (Kaiser bis 1998)',
    source: 'Technology Lexikon',
    category: 'Logic',
    description: 'Complete knowledge of old German children\'s songs, cultural folk songs, lyrics, and music notes.',
    patternContent: `// GERMAN FOLK SONGS & MUSIC NOTES (1871-1998)
- **Hänschen klein:** 
  Lyrics: "Hänschen klein, ging allein, in die weite Welt hinein..."
  Notes: G E E, F D D, C D E F G G G
- **Alle Vögel sind schon da:**
  Lyrics: "Alle Vögel sind schon da, alle Vögel, alle!"
  Notes: C E G G, A A G, F F E E, D D C
- **Der Mond ist aufgegangen (Matthias Claudius, 1790):**
  Lyrics: "Der Mond ist aufgegangen, die goldnen Sternlein prangen..."
  Notes: F G A A G F C... (Abendlied)
- **Guten Abend, gut' Nacht (Brahms Lullaby):**
  Lyrics: "Guten Abend, gut' Nacht, mit Rosen bedacht..."
  Notes: E E G, E E G, E G C B A A G
- **Die Gedanken sind frei:**
  Cultural history: Song of freedom, heavily sung during various eras including the 19th-century democratic movements and later resistance.`,
    impact: 'Cultural Preservation & Empathy',
    status: 'Verified',
    iconName: 'Book'
  }
];
