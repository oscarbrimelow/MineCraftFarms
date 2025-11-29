import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const farms = [
  {
    title: 'Auto Sugarcane Farm - Compact Design',
    description: 'A highly efficient auto sugarcane farm using observers and pistons. Produces up to 2000 sugarcane per hour. Works perfectly in survival mode.',
    platform: ['Java', 'Bedrock'],
    versions: ['Java 1.21.1', 'Java 1.20.6', 'Bedrock 1.21.0'],
    tags: ['auto-sugarcane', 'redstone', 'easy', 'efficient'],
    materials: [
      { name: 'Observer', count: 8 },
      { name: 'Piston', count: 8 },
      { name: 'Redstone Dust', count: 16 },
      { name: 'Hopper', count: 4 },
      { name: 'Chest', count: 1 },
      { name: 'Water Bucket', count: 1 },
      { name: 'Dirt', count: 32 },
      { name: 'Sugarcane', count: 8 },
    ],
    optional_materials: [
      { name: 'Building Blocks', count: 20 },
    ],
    estimated_time: 15,
    chunk_requirements: 'Works in any chunk',
    notes: 'Make sure to place observers facing the sugar cane. Water must flow to the hopper.',
  },
  {
    title: 'Iron Golem Farm - 400+ Iron/Hour',
    description: 'Massive iron farm using villager mechanics. Produces iron ingots, poppies, and experience. Requires villagers and zombie for maximum efficiency.',
    platform: ['Java'],
    versions: ['Java 1.21.1', 'Java 1.20.6', 'Java 1.19.4'],
    tags: ['iron-farm', 'mob-farm', 'xp-farm', 'villager'],
    materials: [
      { name: 'Villager', count: 3 },
      { name: 'Zombie', count: 1 },
      { name: 'Bed', count: 3 },
      { name: 'Workstation', count: 3 },
      { name: 'Obsidian', count: 64 },
      { name: 'Water Bucket', count: 4 },
      { name: 'Hopper', count: 32 },
      { name: 'Chest', count: 8 },
      { name: 'Killing Chamber Blocks', count: 50 },
    ],
    optional_materials: [
      { name: 'Nametag', count: 4 },
      { name: 'Rail', count: 32 },
      { name: 'Minecart', count: 4 },
    ],
    estimated_time: 120,
    chunk_requirements: 'Build at least 100 blocks away from other villagers',
    height_requirements: 'Build above Y level 120',
    notes: 'Requires patience to transport villagers. Make sure zombie is name-tagged.',
  },
  {
    title: 'Gold Farm - Nether Portal Based',
    description: 'Efficient gold and XP farm using zombified piglin mechanics. Uses portal ticking for maximum spawn rates.',
    platform: ['Java'],
    versions: ['Java 1.21.1', 'Java 1.20.6'],
    tags: ['gold-farm', 'mob-farm', 'xp-farm', 'nether'],
    materials: [
      { name: 'Obsidian', count: 256 },
      { name: 'Flint and Steel', count: 1 },
      { name: 'Trapdoor', count: 48 },
      { name: 'Hopper', count: 64 },
      { name: 'Chest', count: 16 },
      { name: 'Killing Mechanism', count: 1 },
    ],
    optional_materials: [
      { name: 'Soul Sand', count: 32 },
      { name: 'Soul Fire', count: 8 },
    ],
    estimated_time: 180,
    chunk_requirements: 'Build in Nether at least 128 blocks away from other portals',
    notes: 'Can produce massive amounts of gold. Be careful of ghast spawns during construction.',
  },
  {
    title: 'Simple Crop Farm - Auto Harvest',
    description: 'Basic automatic crop farm for wheat, carrots, potatoes, and beets. Uses villagers or pistons to harvest.',
    platform: ['Java', 'Bedrock', 'Xbox', 'PlayStation', 'Switch'],
    versions: ['Java 1.21.1', 'Bedrock 1.21.0', 'Bedrock 1.20.0'],
    tags: ['crop-farm', 'auto-harvest', 'easy', 'villager'],
    materials: [
      { name: 'Villager', count: 1 },
      { name: 'Composter', count: 1 },
      { name: 'Bed', count: 1 },
      { name: 'Hopper Minecart', count: 1 },
      { name: 'Rail', count: 20 },
      { name: 'Chest', count: 2 },
      { name: 'Farmland', count: 80 },
      { name: 'Water', count: 1 },
    ],
    optional_materials: [
      { name: 'Light Source', count: 10 },
      { name: 'Fence', count: 40 },
    ],
    estimated_time: 30,
    notes: 'Villager will automatically plant and harvest crops. Very beginner-friendly.',
  },
  {
    title: 'Mob Grinder - Sky Platform Design',
    description: 'Classic mob grinder built high in the sky. Collects drops from natural mob spawning. Works in any version.',
    platform: ['Java', 'Bedrock', 'Xbox', 'PlayStation', 'Switch', 'Mobile'],
    versions: ['Java 1.21.1', 'Bedrock 1.21.0', 'All versions'],
    tags: ['mob-farm', 'easy', 'drops'],
    materials: [
      { name: 'Cobblestone', count: 512 },
      { name: 'Water Bucket', count: 8 },
      { name: 'Sign', count: 32 },
      { name: 'Torch', count: 128 },
      { name: 'Hopper', count: 16 },
      { name: 'Chest', count: 4 },
      { name: 'Ladder', count: 32 },
    ],
    optional_materials: [
      { name: 'Trident Killer', count: 1 },
    ],
    estimated_time: 60,
    height_requirements: 'Build above Y level 200 for best results',
    notes: 'Make sure to light up surrounding area and caves to maximize spawn rates.',
  },
  // Add more farms...
];

async function seed() {
  console.log('Starting seed...');

  // Create a test user if it doesn't exist
  // Use environment variables for credentials (fallback to defaults for development only)
  const testEmail = process.env.SEED_TEST_EMAIL || 'test@minecraftfarms.com';
  const testPassword = process.env.SEED_TEST_PASSWORD || 'testpassword123';

  // Warn if using default credentials
  if (!process.env.SEED_TEST_EMAIL || !process.env.SEED_TEST_PASSWORD) {
    console.warn('⚠️  WARNING: Using default test credentials. Set SEED_TEST_EMAIL and SEED_TEST_PASSWORD environment variables for production.');
  }

  let testUserId: string;

  try {
    // Try to sign in first
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInData.user) {
      testUserId = signInData.user.id;
      console.log('Test user already exists');
    }
  } catch {
    // User doesn't exist, create it
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError || !signUpData.user) {
      console.error('Error creating test user:', signUpError);
      return;
    }

    testUserId = signUpData.user.id;

    // Update user profile
    const testUsername = process.env.SEED_TEST_USERNAME || 'TestFarmer';
    await supabase
      .from('users')
      .update({ username: testUsername, role: 'admin' })
      .eq('id', testUserId);

    console.log('Created test user');
  }

  // Insert farms
  for (const farm of farms) {
    const slug = farm.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data, error } = await supabase
      .from('farms')
      .upsert(
        {
          slug,
          ...farm,
          author_id: testUserId,
          public: true,
          upvotes_count: Math.floor(Math.random() * 100),
          materials: JSON.stringify(farm.materials),
          optional_materials: JSON.stringify(farm.optional_materials || []),
          images: [],
        },
        { onConflict: 'slug' }
      );

    if (error) {
      console.error(`Error inserting farm ${farm.title}:`, error);
    } else {
      console.log(`✓ Inserted farm: ${farm.title}`);
    }
  }

  console.log('Seed complete!');
  if (process.env.SEED_TEST_EMAIL && process.env.SEED_TEST_PASSWORD) {
    console.log(`Test account created: ${testEmail}`);
  } else {
    console.log(`Test account: ${testEmail} / ${testPassword}`);
    console.log('⚠️  Set SEED_TEST_EMAIL and SEED_TEST_PASSWORD environment variables to use custom credentials.');
  }
}

seed().catch(console.error);

