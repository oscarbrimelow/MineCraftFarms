// Helper function to get Minecraft item icon URL from mowinpeople.com
export function getMinecraftItemIcon(itemName: string): string {
  // URL pattern from mowinpeople.com
  const baseUrl = 'https://www.mowinpeople.com/wp-content/plugins/minecraft-list-by-W/Icons';
  // Item names need to match exactly as they appear in the icon filenames
  return `${baseUrl}/${itemName}.png`;
}

