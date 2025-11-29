# YouTube Playlist Importer Setup Guide

## Overview
The YouTube Playlist Importer allows admins to automatically extract farm data from YouTube playlist videos using AI analysis. It processes each video in a playlist, extracts relevant information, and generates a CSV file ready for bulk import.

## Features
- ✅ Automatic extraction from YouTube playlists
- ✅ AI-powered analysis using GPT-4o
- ✅ Preview and edit extracted data before download
- ✅ CSV generation compatible with bulk import
- ✅ Progress tracking for large playlists
- ✅ Validation and error reporting

## Prerequisites

### 1. YouTube Data API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **API Key**
6. Copy your API key (starts with `AIza...`)

**Note:** The free tier provides 10,000 units per day. Each playlist fetch uses ~1 unit per video.

### 2. OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to **API Keys**
4. Click **Create new secret key**
5. Copy your API key (starts with `sk-...`)

**Note:** GPT-4o costs approximately $0.01-0.03 per video analysis. Monitor your usage in the OpenAI dashboard.

## Usage

### Step 1: Access the Importer
1. Log in as an admin user
2. Navigate to **Admin Panel**
3. Click on the **YouTube Import** tab

### Step 2: Enter API Keys
1. Paste your YouTube Data API key in the first field
2. Paste your OpenAI API key in the second field
3. These keys are stored only in your browser session (not saved)

### Step 3: Process Playlist
1. Paste a YouTube playlist URL (e.g., `https://www.youtube.com/playlist?list=PLxxxxx`)
2. Click **Process Playlist**
3. Wait for the AI to analyze each video (progress bar will show status)
4. Review the extracted data

### Step 4: Review and Edit
- Videos marked with **"Needs Review"** may have missing or incorrect data
- Click the **Edit** button (pencil icon) to modify any farm entry
- Fix categories, platforms, versions, materials, etc.

### Step 5: Download CSV
1. Click **Download CSV** button
2. The CSV file will be saved with format: `youtube_farms_import_YYYY-MM-DD.csv`
3. Import the CSV using the **Bulk Import** page

## CSV Format

The generated CSV matches the bulk import format:
- `title` - Farm title
- `description` - Farm description
- `category` - Must match a category from the list
- `platform` - "Java" or "Bedrock" or "Java; Bedrock"
- `versions` - "1.21" or "1.21; 1.20.6"
- `video_url` - YouTube video URL
- `materials` - Simple format: "64 Cobbled Deepslate; 32 Glass"
- `optional_materials` - Optional materials
- `tags` - Semicolon-separated tags
- `farmable_items` - Semicolon-separated items
- `estimated_time` - Build time in minutes
- `required_biome` - Required biome if any
- `farm_designer` - Channel/designer name
- `drop_rate_per_hour` - Drop rates if mentioned
- `notes` - Additional notes

## Tips for Best Results

1. **Playlist Quality**: Use playlists with clear, descriptive video titles
2. **Review Extracted Data**: Always review AI-extracted data before importing
3. **Category Matching**: Ensure categories match exactly with the available list
4. **Materials Format**: The AI extracts materials, but you may need to verify quantities
5. **Batch Processing**: For large playlists, process in smaller batches to avoid rate limits

## Troubleshooting

### "Invalid playlist URL"
- Ensure the URL contains `list=` parameter
- Try copying the playlist URL directly from YouTube

### "Failed to fetch playlist"
- Check your YouTube API key is valid
- Verify YouTube Data API v3 is enabled
- Check API quota hasn't been exceeded

### "AI analysis failed"
- Verify your OpenAI API key is valid
- Check you have sufficient credits
- Try processing fewer videos at once

### Rate Limiting
- YouTube API: 10,000 units/day (free tier)
- OpenAI API: Check your tier limits
- Add delays between requests if needed

## Security Note

⚠️ **Important**: API keys are currently entered in the browser and used client-side. For production, consider:
- Moving API calls to a serverless function
- Using environment variables on the server
- Implementing API key management

## Cost Estimation

For a playlist with 50 videos:
- **YouTube API**: ~50 units (well within free tier)
- **OpenAI GPT-4o**: ~$0.50 - $1.50 (depending on video description length)

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify API keys are correct
3. Ensure you have sufficient API quotas
4. Review extracted data for accuracy before importing

