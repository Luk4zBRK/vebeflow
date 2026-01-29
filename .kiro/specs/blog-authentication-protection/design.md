# Design Document: Blog Authentication Protection

## Overview

This design implements authentication-based route protection for the blog section using React Router and the existing Supabase authentication system. The solution introduces a reusable `ProtectedRoute` component that wraps protected routes and handles authentication checks, redirects, and return URL preservation. The design prioritizes smooth user experience by handling loading states properly and preventing redirect loops.

## Architecture

### Component Structure

```
App.tsx (Router Configuration)
├── ProtectedRoute (New Component)
│   ├── useAuth() hook
│   ├── useLocation() hook
│   ├── useNavigate() hook
│   └── Loading State UI
└── Blog Page (Protected Content)
```

### Data Flow

1. **Initial Navigation**: User clicks blog link or navigates to /blog
2. **Authentication Check**: ProtectedRoute component checks authentication state via useAuth hook
3. **Decision Point**:
   - If `isLoading === true`: Display loading indicator
   - If `user === null`: Redirect to /auth with return URL
   - If `user !== null`: Render protected content
4. **Post-Login**: Auth page checks for return URL and redirects back to original destination

### Integration Points

- **useAuth Hook**: Provides `user`, `session`, and `isLoading` state
- **React Router**: Handles navigation and URL parameter management
- **Auth Page**: Modified to handle return URL parameter and post-login redirect
- **App.tsx**: Updated to wrap /blog route with ProtectedRoute component

## Components and Interfaces

### ProtectedRoute Component

**Purpose**: Wraps any route that requires authentication and handles the protection logic.

**Props Interface**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Implementation Pseudocode**:
```
COMPONENT ProtectedRoute(children):
  auth = useAuth()
  location = useLocation()
  navigate = useNavigate()
  
  EFFECT on mount:
    IF auth.isLoading:
      RETURN  // Wait for auth state to be determined
    
    IF NOT auth.user:
      // User is not authenticated
      currentPath = location.pathname + location.search
      redirectUrl = `/auth?returnUrl=${encodeURIComponent(currentPath)}`
      navigate(redirectUrl, { replace: true })
  
  IF auth.isLoading:
    RETURN LoadingSpinner component
  
  IF auth.user:
    RETURN children
  
  RETURN null  // During redirect
```

**Key Behaviors**:
- Uses `replace: true` to prevent back button issues
- Encodes return URL to handle special characters
- Shows loading state while authentication is being determined
- Only redirects after loading is complete to prevent flicker

### Auth Page Modifications

**Current Behavior**: Redirects to /dashboard after successful login

**New Behavior**: 
1. Check for `returnUrl` query parameter
2. If present, redirect to that URL after successful login
3. If not present, redirect to /dashboard (default behavior)

**Implementation Pseudocode**:
```
COMPONENT Auth:
  // ... existing state ...
  location = useLocation()
  
  FUNCTION getReturnUrl():
    params = new URLSearchParams(location.search)
    returnUrl = params.get('returnUrl')
    
    IF returnUrl:
      // Validate return URL is internal
      IF returnUrl.startsWith('/'):
        RETURN returnUrl
    
    RETURN '/dashboard'  // Default
  
  FUNCTION handleLogin(event):
    // ... existing login logic ...
    
    IF login successful:
      returnUrl = getReturnUrl()
      navigate(returnUrl)
```

**Security Consideration**: The return URL validation ensures only internal paths are accepted (must start with '/') to prevent open redirect vulnerabilities.

### Router Configuration Update

**Current Configuration**:
```typescript
<Route path="/blog" element={<Blog />} />
```

**New Configuration**:
```typescript
<Route path="/blog" element={
  <ProtectedRoute>
    <Blog />
  </ProtectedRoute>
} />
```

## Data Models

### URL Parameters

**Return URL Parameter**:
- **Name**: `returnUrl`
- **Type**: String (URL-encoded)
- **Format**: Internal path starting with '/'
- **Example**: `/blog` or `/blog/my-post-slug`
- **Validation**: Must start with '/' to prevent external redirects

### Authentication State (from useAuth)

```typescript
interface AuthState {
  user: User | null;           // Supabase user object or null
  session: Session | null;     // Supabase session object or null
  isLoading: boolean;          // True during initial auth check
  signIn: (email, password, captchaToken?) => Promise<{error: any}>;
  signUp: (email, password, fullName) => Promise<{error: any}>;
  signOut: () => Promise<void>;
  isAdmin: boolean;            // Admin role flag
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Unauthenticated Redirect with Return URL Preservation

*For any* unauthenticated user attempting to navigate to /blog, the system should redirect to /auth with the original destination preserved as a returnUrl query parameter, and the Blog page content should never be displayed during this redirect.

**Validates: Requirements 1.1, 2.1, 2.2, 2.3**

### Property 2: Authenticated Access with Reactivity

*For any* authenticated user, navigation to /blog should render the Blog page content, and when authentication state changes from unauthenticated to authenticated, the route guard should immediately re-evaluate and grant access.

**Validates: Requirements 1.2, 1.3**

### Property 3: Loading State Display

*For any* navigation attempt to /blog while authentication state is being determined (isLoading === true), the route guard should display a loading indicator instead of the Blog page content or triggering a redirect.

**Validates: Requirements 4.1**

### Property 4: Post-Login Return URL Redirect

*For any* successful authentication at /auth, if a returnUrl parameter is present in the URL, the system should navigate to that return URL; otherwise, it should navigate to the default destination (/dashboard).

**Validates: Requirements 3.1, 3.2**

### Property 5: Navigation Menu Link Visibility

*For any* authentication state (authenticated or unauthenticated), the blog link in the navigation menu should remain visible and functional.

**Validates: Requirements 5.3**

### Property 6: Auth State Change Reactivity

*For any* change in authentication state from the useAuth hook, the route guard should react and update its rendering decision within one render cycle.

**Validates: Requirements 6.2**

### Property 7: Redirect Idempotence

*For any* sequence of rapid navigation attempts to /blog by an unauthenticated user, the system should perform only one redirect to /auth, preventing duplicate redirects to the same destination.

**Validates: Requirements 4.4**

### Property 8: Authentication Error Handling

*For any* authentication system error or failure to determine session status, the route guard should default to treating the user as unauthenticated and allow redirect to /auth.

**Validates: Requirements 7.1**

### Property 9: Post-Authentication Redirect Error Fallback

*For any* error occurring during post-authentication redirect to a return URL, the system should fall back to navigating to the default destination (/dashboard) instead of leaving the user on the /auth page.

**Validates: Requirements 7.3**

### Property 10: Redirect Performance

*For any* authentication state determination, once isLoading becomes false, the redirect (if needed) should complete within 200ms, and if authentication state cannot be determined within 2 seconds, the system should default to unauthenticated.

**Validates: Requirements 4.2, 4.3**

## Error Handling

### Authentication Errors

**Scenario**: useAuth hook fails to determine session status or returns an error

**Handling**:
1. Route guard defaults to treating user as unauthenticated
2. Redirect to /auth proceeds normally
3. Error is logged to console for debugging
4. User can attempt to authenticate at /auth page

**Rationale**: Failing closed (defaulting to unauthenticated) is more secure than failing open.

### Navigation Errors

**Scenario**: React Router navigation fails (rare edge case)

**Handling**:
1. Error is caught and logged
2. User-friendly error message displayed
3. Manual navigation link provided as fallback

**Rationale**: Provides graceful degradation when navigation fails.

### Return URL Validation Errors

**Scenario**: Return URL parameter contains invalid or external URL

**Handling**:
1. Validate return URL starts with '/' (internal path)
2. If invalid, ignore return URL and use default destination
3. Log validation failure for security monitoring

**Rationale**: Prevents open redirect vulnerabilities.

### Timeout Handling

**Scenario**: Authentication state determination takes longer than 2 seconds

**Handling**:
1. After 2 second timeout, default to unauthenticated
2. Allow redirect to /auth to proceed
3. Log timeout event for monitoring

**Rationale**: Prevents indefinite loading states and ensures user can proceed.

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific scenarios, edge cases, and integration points
- **Property tests**: Verify universal behaviors across all authentication states and navigation patterns

### Unit Testing Focus

Unit tests should cover:

1. **ProtectedRoute Component**:
   - Renders loading indicator when isLoading is true
   - Renders children when user is authenticated
   - Redirects to /auth when user is not authenticated
   - Preserves return URL in redirect
   - Uses replace: true for navigation

2. **Auth Page Modifications**:
   - Extracts returnUrl from query parameters
   - Validates return URL format (starts with '/')
   - Redirects to return URL after successful login
   - Falls back to /dashboard when no return URL
   - Rejects external URLs in return URL parameter

3. **Integration Tests**:
   - Complete flow: unauthenticated → redirect → login → return to blog
   - Auth state changes trigger re-evaluation
   - Multiple protected routes work correctly
   - Navigation menu blog link works in both auth states

### Property-Based Testing Configuration

**Testing Library**: Use `@fast-check/vitest` for TypeScript/React property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: blog-authentication-protection, Property {N}: {description}`

**Property Test Implementation**:

Each correctness property should be implemented as a property-based test:

1. **Property 1**: Generate random auth states (null/user) and verify redirect behavior
2. **Property 2**: Generate random user objects and verify access granted
3. **Property 3**: Test with isLoading=true across random navigation attempts
4. **Property 4**: Generate random return URLs and verify post-login navigation
5. **Property 5**: Verify link visibility across random auth states
6. **Property 6**: Simulate auth state changes and verify reactivity timing
7. **Property 7**: Generate sequences of rapid navigation attempts
8. **Property 8**: Simulate auth errors and verify fallback behavior
9. **Property 9**: Simulate redirect errors and verify fallback
10. **Property 10**: Measure redirect timing across random scenarios

**Example Property Test Structure**:
```typescript
// Feature: blog-authentication-protection, Property 1: Unauthenticated Redirect with Return URL Preservation
describe('ProtectedRoute - Unauthenticated Redirect', () => {
  it('should redirect unauthenticated users to /auth with return URL', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // unauthenticated user
        fc.oneof(fc.constant('/blog'), fc.constant('/blog/some-post')), // paths
        (user, path) => {
          // Test that navigation to path with user=null results in redirect to /auth?returnUrl=path
          // and Blog content is never rendered
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: 90%+ for new components (ProtectedRoute, Auth modifications)
- **Property Test Coverage**: All 10 correctness properties implemented
- **Integration Test Coverage**: Complete user flows (redirect → login → return)
- **Edge Case Coverage**: Timeouts, errors, invalid URLs, rapid navigation

### Testing Tools

- **Unit Testing**: Vitest + React Testing Library
- **Property Testing**: @fast-check/vitest
- **Mocking**: Mock useAuth hook for different auth states
- **Navigation Testing**: Mock React Router hooks (useNavigate, useLocation)

## Implementation Notes

### Performance Considerations

1. **Minimize Re-renders**: ProtectedRoute should only re-render when auth state changes
2. **Avoid Redirect Loops**: Use `replace: true` and proper conditional logic
3. **Loading State**: Show loading indicator immediately, don't wait for timeout
4. **URL Encoding**: Properly encode/decode return URLs to handle special characters

### Security Considerations

1. **Return URL Validation**: Only allow internal paths (must start with '/')
2. **No External Redirects**: Prevent open redirect vulnerabilities
3. **Fail Closed**: Default to unauthenticated on errors
4. **Session Validation**: Rely on Supabase session validation, don't implement custom logic

### Accessibility Considerations

1. **Loading Indicator**: Include aria-live region for screen readers
2. **Focus Management**: Maintain focus during redirects
3. **Error Messages**: Ensure error messages are announced to screen readers

### Browser Compatibility

- **URL API**: Use URLSearchParams for query parameter handling (supported in all modern browsers)
- **React Router v6**: Ensure compatibility with React Router v6 API
- **History API**: Use replace: true to avoid back button issues

## Migration Path

### Phase 1: Create ProtectedRoute Component
1. Create new component in `src/components/ProtectedRoute.tsx`
2. Implement authentication check logic
3. Add loading state handling
4. Add redirect logic with return URL

### Phase 2: Modify Auth Page
1. Add return URL extraction logic
2. Add return URL validation
3. Update post-login redirect logic
4. Add fallback to default destination

### Phase 3: Update Router Configuration
1. Wrap /blog route with ProtectedRoute in App.tsx
2. Test complete flow
3. Verify no breaking changes to other routes

### Phase 4: Testing
1. Write unit tests for ProtectedRoute
2. Write unit tests for Auth modifications
3. Write property-based tests for all properties
4. Write integration tests for complete flows

### Phase 5: Documentation
1. Update component documentation
2. Add usage examples for ProtectedRoute
3. Document return URL parameter format
4. Add troubleshooting guide

## Future Enhancements

1. **Multiple Protected Routes**: Extend ProtectedRoute to protect other routes (dashboard, settings, etc.)
2. **Role-Based Access**: Add role checking to ProtectedRoute (e.g., admin-only routes)
3. **Permission System**: Implement fine-grained permissions beyond authentication
4. **Redirect History**: Track redirect history for better UX
5. **Session Timeout**: Add session timeout warnings and automatic logout
