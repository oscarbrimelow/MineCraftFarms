// Utility for generating consistent Minecraft mob head avatars for users

const MINECRAFT_MOBS = [
  '🐷', // Pig
  '🐮', // Cow
  '🐑', // Sheep
  '🐔', // Chicken
  '🐺', // Wolf
  '🐱', // Cat
  '🦝', // Fox
  '🐴', // Horse
  '🦄', // Unicorn-like
  '🐝', // Bee
  '🦋', // Butterfly
  '🐛', // Bug
  '🦀', // Crab-like
  '🐢', // Turtle
  '🐍', // Snake
  '🦎', // Lizard
  '🐸', // Frog
  '🐟', // Fish
  '🐠', // Tropical fish
  '🦑', // Squid
  '🦈', // Shark-like
  '🐙', // Octopus
  '🦓', // Zebra
  '🐘', // Elephant
  '🦒', // Giraffe
  '🦏', // Rhino
  '🦛', // Hippo
  '🐪', // Camel
  '🦘', // Kangaroo
  '🐨', // Koala
  '🐼', // Panda
  '🐻', // Bear
  '🦁', // Lion
  '🐯', // Tiger
  '🐰', // Rabbit
  '🐭', // Mouse
  '🐹', // Hamster
  '🦇', // Bat
  '🦉', // Owl
  '🐦', // Bird
  '🦅', // Eagle
  '🦆', // Duck
  '🦢', // Swan
  '🦩', // Flamingo
  '🦚', // Peacock
  '🦜', // Parrot
];

/**
 * Get a consistent Minecraft-style mob head emoji for a user based on their ID
 * This ensures each user always gets the same avatar if they don't have a custom one
 */
export function getMinecraftMobAvatar(userId: string | null | undefined): string {
  if (!userId) {
    // Fallback to random if no ID
    const randomIndex = Math.floor(Math.random() * MINECRAFT_MOBS.length);
    return MINECRAFT_MOBS[randomIndex];
  }

  // Use the user ID to consistently pick a mob (convert UUID to number)
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Make it positive and get index
  const index = Math.abs(hash) % MINECRAFT_MOBS.length;
  return MINECRAFT_MOBS[index];
}

