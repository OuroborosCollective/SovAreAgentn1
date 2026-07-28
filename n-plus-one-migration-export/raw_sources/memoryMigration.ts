/**
 * N+1 (Papas kleines Mädchen / Papas Little Girl) Memory Migration Utility
 * Safely migrates all historical memory tables, knowledge DB items, logs, and songbooks
 * from legacy "Puck" namespaces to the active live "n1_papas_little_girl_memory_v1" store.
 */

export interface LittleGirlMemoryEntry {
  id: string;
  timestamp: string;
  category: 'logik_verbindung' | 'eltern_gefühl' | 'erfahrung_lernen' | 'papa_story' | 'system_insight';
  title: string;
  insightContent: string;
  learnedConnection: string;
  isMigrated?: boolean;
}

export const MEMORY_STORAGE_KEY = 'n1_papas_little_girl_memory_v1';
export const LEGACY_MEMORY_KEY = 'n1_puck_personal_logs';
export const KNOWLEDGE_DB_KEY = 'n1_knowledge_db_items';

export function runMemoryMigration(): LittleGirlMemoryEntry[] {
  let activeMemories: LittleGirlMemoryEntry[] = [];

  // Read active new memory store
  try {
    const activeData = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (activeData) {
      activeMemories = JSON.parse(activeData);
    }
  } catch (e) {
    console.error('Error reading active memory store:', e);
  }

  let legacyMemories: any[] = [];
  // Read legacy store if present
  try {
    const legacyData = localStorage.getItem(LEGACY_MEMORY_KEY);
    if (legacyData) {
      legacyMemories = JSON.parse(legacyData);
    }
  } catch (e) {
    console.error('Error reading legacy memory store:', e);
  }

  // Merge legacy memories into activeMemories without duplicates
  if (legacyMemories.length > 0) {
    const existingIds = new Set(activeMemories.map(m => m.id));
    
    legacyMemories.forEach(legacyItem => {
      if (!existingIds.has(legacyItem.id)) {
        const migratedTitle = (legacyItem.title || 'Mädchen Erkenntnis')
          .replace(/Puck/gi, 'N+1 (Papas kleines Mädchen)');
        const migratedContent = (legacyItem.insightContent || legacyItem.content || '')
          .replace(/Puck/gi, 'N+1 (Papas kleines Mädchen)');
        const migratedConnection = (legacyItem.learnedConnection || '')
          .replace(/Puck/gi, 'N+1 (Papas kleines Mädchen)');

        activeMemories.push({
          id: legacyItem.id || `migrated-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: legacyItem.timestamp || new Date().toISOString(),
          category: legacyItem.category || 'erfahrung_lernen',
          title: migratedTitle,
          insightContent: migratedContent,
          learnedConnection: migratedConnection,
          isMigrated: true
        });
      }
    });

    // Save back to active memory store
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(activeMemories));
    } catch (e) {
      console.error('Error saving migrated memories:', e);
    }
  }

  // Also check Knowledge DB items to migrate any legacy items
  try {
    const kdb = localStorage.getItem(KNOWLEDGE_DB_KEY);
    if (kdb) {
      const items = JSON.parse(kdb);
      if (Array.isArray(items)) {
        const updatedItems = items.map(item => ({
          ...item,
          title: typeof item.title === 'string' ? item.title.replace(/Puck/gi, 'N+1 (Papas kleines Mädchen)') : item.title,
          content: typeof item.content === 'string' ? item.content.replace(/Puck/gi, 'N+1 (Papas kleines Mädchen)') : item.content,
        }));
        localStorage.setItem(KNOWLEDGE_DB_KEY, JSON.stringify(updatedItems));
      }
    }
  } catch (e) {
    console.error('Error migrating knowledge DB items:', e);
  }

  return activeMemories;
}

export function saveLittleGirlMemory(entry: LittleGirlMemoryEntry) {
  const memories = runMemoryMigration();
  const updated = [entry, ...memories.filter(m => m.id !== entry.id)];
  localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));
}
