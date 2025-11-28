# Mass Import Options for Minecraft Farms

## Recommended Solutions

### 1. **CSV/JSON Bulk Import (Recommended)**
**Best for**: Manual data entry, spreadsheet exports, migrating from other systems

**Format Example (CSV)**:
```csv
title,description,category,platform,versions,video_url,materials,optional_materials,tags,farmable_items,estimated_time,required_biome,farm_designer
"Iron Farm","Efficient iron golem farm",Iron Farm,"Java, Bedrock","1.21, 1.20.6",https://youtube.com/watch?v=...,"[{""name"":""Villager"",""count"":3}]","[]","iron-farm,mob-farm","Iron Ingot",120,,
```

**Format Example (JSON)**:
```json
[
  {
    "title": "Iron Farm",
    "description": "Efficient iron golem farm",
    "category": "Iron Farm",
    "platform": ["Java", "Bedrock"],
    "versions": ["1.21", "1.20.6"],
    "video_url": "https://youtube.com/watch?v=...",
    "materials": [{"name": "Villager", "count": 3}],
    "optional_materials": [],
    "tags": ["iron-farm", "mob-farm"],
    "farmable_items": ["Iron Ingot"],
    "estimated_time": 120
  }
]
```

**Features**:
- Upload CSV or JSON file
- Preview before import
- Validation with error reporting
- Duplicate detection
- Batch processing with progress
- Rollback on errors

### 2. **YouTube Playlist/Channel Import**
**Best for**: Importing farms from a specific YouTuber's channel

**Features**:
- Enter YouTube playlist/channel URL
- Auto-extract video metadata
- Auto-detect farm designer
- Extract thumbnails
- Parse video descriptions for materials (using AI/pattern matching)
- User fills in remaining fields in bulk edit mode

### 3. **Template-Based Import**
**Best for**: Standardized farm types with common fields

**Features**:
- Pre-filled templates for common farm types
- Fill in only unique fields
- Bulk apply templates to multiple farms
- Custom template creation

### 4. **API Endpoint**
**Best for**: Programmatic imports, integrations, automation

**Features**:
- REST API endpoint: `POST /api/farms/bulk`
- Authentication required
- Rate limiting
- Webhook notifications
- Import status tracking

### 5. **Import Wizard with Validation**
**Best for**: Guided bulk imports with error prevention

**Features**:
- Step-by-step wizard
- Real-time validation
- Preview each farm before import
- Edit individual farms in preview
- Skip/approve workflow
- Summary report

### 6. **Duplicate Detection & Merging**
**Best for**: Updating existing farms, preventing duplicates

**Features**:
- Detect duplicates by title, video URL, or slug
- Options: Skip, Update, or Create New
- Merge data from multiple sources
- Conflict resolution UI

## Implementation Priority

1. **CSV/JSON Bulk Import** - Most versatile, easy to use
2. **Import Wizard** - Better UX for large imports
3. **YouTube Playlist Import** - Great for content creators
4. **API Endpoint** - For advanced users/automation

