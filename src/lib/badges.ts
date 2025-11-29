/**
 * Badge system for user achievements
 */

export interface Badge {
  type: string;
  name: string;
  description: string;
}

export const BADGE_TYPES: Record<string, Badge> = {
  first_farm: {
    type: 'first_farm',
    name: 'First Farm',
    description: 'Uploaded your first farm',
  },
  ten_farms: {
    type: 'ten_farms',
    name: 'Farm Builder',
    description: 'Uploaded 10 farms',
  },
  fifty_farms: {
    type: 'fifty_farms',
    name: 'Master Builder',
    description: 'Uploaded 50 farms',
  },
  hundred_upvotes: {
    type: 'hundred_upvotes',
    name: 'Popular Creator',
    description: 'Received 100 upvotes on your farms',
  },
  first_test: {
    type: 'first_test',
    name: 'Tester',
    description: 'Tested your first farm',
  },
  ten_tests: {
    type: 'ten_tests',
    name: 'Quality Tester',
    description: 'Tested 10 farms',
  },
  helpful_comment: {
    type: 'helpful_comment',
    name: 'Helpful',
    description: 'Received 10 helpful reactions on comments',
  },
};

/**
 * Check and award badges based on user achievements
 */
export async function checkAndAwardBadges(userId: string, supabase: any) {
  // This function would be called after significant actions
  // For now, badges can be awarded manually or through database triggers
  // In a production system, you'd want to check achievements and award badges here
}

