import { MINECRAFT_ITEMS } from './minecraftItems';

export interface ParsedMaterial {
  name: string;
  count: number;
}

export interface MaterialParseResult {
  added: ParsedMaterial[];
  failed: string[];
}

/**
 * Parse materials from various text formats
 * Supports:
 * - "93 Cobbled Deepslate"
 * - "Cobbled Deepslate x93"
 * - "93x Cobbled Deepslate"
 * - "Cobbled Deepslate: 93"
 * - "93 Cobbled Deepslate; 59 Scaffolding" (semicolon separated)
 * - "93 Cobbled Deepslate, 59 Scaffolding" (comma separated)
 */
export function parseMaterialsFromText(text: string): MaterialParseResult {
  const added: ParsedMaterial[] = [];
  const failed: string[] = [];

  if (!text.trim()) {
    return { added, failed };
  }

  // Split by semicolon or comma, then by newlines
  const lines = text
    .split(/[;\n]/)
    .flatMap(line => line.split(','))
    .map(line => line.trim())
    .filter(line => line);

  // Helper function to find matching Minecraft item
  const findMatchingItem = (itemName: string): string | null => {
    const normalized = itemName.toLowerCase().trim();
    
    // Try exact match first (case-insensitive)
    const exactMatch = MINECRAFT_ITEMS.find(item => item.toLowerCase() === normalized);
    if (exactMatch) return exactMatch;

    // Try removing common suffixes/plurals
    const withoutSuffixes = normalized
      .replace(/\s+blocks?$/i, '')
      .replace(/\s+block$/i, '')
      .replace(/\s+buckets?$/i, '')
      .replace(/\s+bucket$/i, '')
      .replace(/\s+slabs?$/i, '')
      .replace(/\s+slab$/i, '')
      .replace(/\s+trapdoors?$/i, '')
      .replace(/\s+trapdoor$/i, '')
      .replace(/\s+chests?$/i, '')
      .replace(/\s+chest$/i, '')
      .replace(/\s+hoppers?$/i, '')
      .replace(/\s+hopper$/i, '')
      .replace(/\s+signs?$/i, '')
      .replace(/\s+sign$/i, '')
      .replace(/\s+torches?$/i, '')
      .replace(/\s+torch$/i, '')
      .replace(/\s+repeaters?$/i, '')
      .replace(/\s+repeater$/i, '')
      .replace(/\s+pistons?$/i, '')
      .replace(/\s+piston$/i, '')
      .replace(/\s+levers?$/i, '')
      .replace(/\s+lever$/i, '')
      .trim();

    // Try matching without suffixes
    const suffixMatch = MINECRAFT_ITEMS.find(item => 
      item.toLowerCase() === withoutSuffixes ||
      item.toLowerCase().includes(withoutSuffixes) ||
      withoutSuffixes.includes(item.toLowerCase())
    );
    if (suffixMatch) return suffixMatch;

    // Try partial match
    const partialMatch = MINECRAFT_ITEMS.find(item => 
      item.toLowerCase().includes(normalized) ||
      normalized.includes(item.toLowerCase())
    );
    if (partialMatch) return partialMatch;

    return null;
  };

  lines.forEach((line) => {
    // Pattern 1: "93 Cobbled Deepslate" or "93 Cobbled Deepslate blocks"
    let match = line.match(/^(\d+)\s+(.+)$/i);
    
    // Pattern 2: "Cobbled Deepslate x93" or "Cobbled Deepslate x 93"
    if (!match) {
      match = line.match(/^(.+?)\s*x\s*(\d+)$/i);
      if (match) {
        // Swap groups: item name is first, count is second
        match = [match[0], match[2], match[1]];
      }
    }
    
    // Pattern 3: "93x Cobbled Deepslate"
    if (!match) {
      match = line.match(/^(\d+)x\s+(.+)$/i);
    }
    
    // Pattern 4: "Cobbled Deepslate: 93" or "Cobbled Deepslate : 93"
    if (!match) {
      match = line.match(/^(.+?)\s*:\s*(\d+)$/i);
      if (match) {
        // Swap groups
        match = [match[0], match[2], match[1]];
      }
    }

    if (!match) {
      failed.push(line);
      return;
    }

    const count = parseInt(match[1]);
    const itemName = match[2].trim();
    
    if (isNaN(count) || count <= 0) {
      failed.push(line);
      return;
    }

    const matchedItem = findMatchingItem(itemName);
    if (matchedItem) {
      added.push({ name: matchedItem, count });
    } else {
      failed.push(line);
    }
  });

  return { added, failed };
}

