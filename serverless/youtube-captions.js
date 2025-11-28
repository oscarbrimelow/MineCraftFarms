// Cloudflare Worker for fetching YouTube captions
// Deploy to Cloudflare Workers (free tier)

export default {
  async fetch(request) {
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const videoId = url.searchParams.get('videoId');

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'videoId parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Method 1: Use youtube-transcript-api approach (client-side library)
      // This would need to be implemented differently in a Worker
      // For now, return instructions for manual input

      // Method 2: YouTube Data API (requires API key)
      const apiKey = url.searchParams.get('apiKey');
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error: 'YouTube API key required',
            fallback: 'Please use manual caption input or provide API key',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch captions using YouTube Data API
      const captionResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/captions?videoId=${videoId}&part=snippet&key=${apiKey}`
      );

      if (!captionResponse.ok) {
        throw new Error('Failed to fetch captions');
      }

      const captionData = await captionResponse.json();
      
      // Note: Downloading actual caption content requires OAuth
      // For free tier, recommend manual input
      
      return new Response(
        JSON.stringify({
          message: 'Caption fetching requires OAuth. Please use manual input.',
          captions: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};

// To deploy:
// 1. Install Wrangler: npm i -g wrangler
// 2. Login: wrangler login
// 3. Deploy: wrangler publish serverless/youtube-captions.js
// 4. Update your frontend to call: https://your-worker.your-subdomain.workers.dev?videoId=xxx

