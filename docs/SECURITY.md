# Security Measures

This document outlines the security measures implemented in the Minecraft Farms application.

## Fixed Security Issues

### 1. ✅ Removed Hardcoded API Keys
- **Issue**: YouTube API key was hardcoded in client-side code
- **Fix**: Now uses environment variable `VITE_YOUTUBE_API_KEY` or requires user input
- **Location**: `src/components/YouTubePlaylistImporter.tsx`

### 2. ✅ Removed Exposed Credentials from Documentation
- **Issue**: Supabase credentials were exposed in `SETUP_SUPABASE.md`
- **Fix**: Replaced with placeholder text instructing users to get their own keys
- **Location**: `SETUP_SUPABASE.md`

### 3. ✅ Fixed XSS Vulnerability
- **Issue**: `decodeHtmlEntities` function used `innerHTML` which can be exploited
- **Fix**: Replaced with `DOMParser` which is safer
- **Location**: `src/lib/urlSanitizer.ts`

### 4. ✅ Added Input Validation and Length Limits
- **Issue**: No length limits on user inputs could lead to DoS attacks
- **Fix**: Added length limits:
  - Username: 3-30 characters
  - Title: 200 characters max
  - Description: 5000 characters max
  - Comments: 5000 characters max
- **Locations**: 
  - `src/pages/Account.tsx`
  - `src/pages/Upload.tsx`
  - `src/components/CommentsSection.tsx`

### 5. ✅ Enhanced Password Validation
- **Issue**: No password strength requirements
- **Fix**: Added minimum 8 character requirement
- **Location**: `src/pages/Account.tsx`

### 6. ✅ Improved Email Validation
- **Issue**: Basic email validation
- **Fix**: Added proper email format regex validation
- **Location**: `src/pages/Account.tsx`

### 7. ✅ Enhanced Admin Route Protection
- **Issue**: Admin check only happened client-side (could be bypassed)
- **Fix**: Added proper error handling and server-side verification
- **Note**: Full server-side protection requires Supabase RLS policies (already in place)
- **Location**: `src/pages/Admin.tsx`

## Existing Security Measures

### URL Sanitization
- All URLs are sanitized using `sanitizeUrl()` function
- YouTube URLs are validated and converted to safe embed URLs
- Image URLs are validated
- **Location**: `src/lib/urlSanitizer.ts`

### HTML Escaping
- `escapeHtml()` function prevents XSS attacks
- Used for user-generated content
- **Location**: `src/lib/urlSanitizer.ts`

### Supabase Row Level Security (RLS)
- Database policies enforce access control
- Users can only modify their own content
- Admins have elevated permissions
- **Location**: `supabase/schema.sql` and `supabase/fix_rls.sql`

### Input Sanitization
- Username validation: Only alphanumeric, underscores, hyphens
- Material names validated against Minecraft items list
- Category validation against allowed categories
- **Locations**: Various components

## Security Best Practices

### API Keys
- ✅ Never hardcode API keys in source code
- ✅ Use environment variables for sensitive keys
- ✅ Client-side keys (like Supabase anon key) are safe to expose (by design)
- ⚠️ Server-side keys (service role) should NEVER be exposed

### User Input
- ✅ All user inputs are validated
- ✅ Length limits prevent DoS attacks
- ✅ HTML is escaped to prevent XSS
- ✅ URLs are sanitized before use

### Authentication
- ✅ Supabase handles authentication securely
- ✅ Passwords are hashed server-side
- ✅ Sessions are managed by Supabase
- ✅ JWT tokens are used for authorization

### Database
- ✅ RLS policies enforce data access
- ✅ SQL injection prevented by Supabase client (parameterized queries)
- ✅ Foreign key constraints prevent orphaned data

## Recommendations for Production

1. **Rate Limiting**: Implement rate limiting on API endpoints (consider Cloudflare or similar)
2. **CSP Headers**: Add Content Security Policy headers to prevent XSS
3. **HTTPS Only**: Ensure all traffic uses HTTPS
4. **API Key Rotation**: Regularly rotate API keys
5. **Monitoring**: Set up error monitoring (Sentry, etc.)
6. **Backup**: Regular database backups
7. **Audit Logs**: Log admin actions for audit trail

## Known Limitations

1. **Client-Side Admin Check**: While improved, admin routes still rely on client-side checks. Supabase RLS provides server-side protection, but consider additional middleware for critical operations.

2. **Rate Limiting**: No rate limiting implemented yet. Consider adding:
   - Client-side debouncing
   - Server-side rate limiting via Supabase Edge Functions
   - Cloudflare rate limiting

3. **File Upload Validation**: File uploads are validated but consider:
   - Virus scanning
   - File size limits (already implemented)
   - File type validation (already implemented)

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do NOT create a public issue
2. Contact the maintainer privately
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be fixed before public disclosure

