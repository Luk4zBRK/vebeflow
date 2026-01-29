# Requirements Document

## Introduction

This specification addresses the Turnstile CAPTCHA configuration issue in production VPS deployment. The CAPTCHA component works correctly in local development but fails in production because Vite environment variables are not being properly passed to the Docker build process. The system currently shows console errors indicating that `VITE_TURNSTILE_SITE_KEY` is not configured, preventing the CAPTCHA from rendering.

## Glossary

- **Turnstile**: Cloudflare's CAPTCHA service used for bot protection
- **Vite**: The build tool used for bundling the React application
- **Build-time Variables**: Environment variables that are embedded into the JavaScript bundle during the build process
- **Docker Build**: The containerization process that creates the production image
- **Site Key**: The public key from Cloudflare Turnstile used to render the CAPTCHA widget
- **VPS**: Virtual Private Server where the production application is deployed
- **TurnstileCaptcha Component**: The React component located at `src/components/TurnstileCaptcha.tsx` that renders the CAPTCHA widget

## Requirements

### Requirement 1: Docker Build Environment Variable Injection

**User Story:** As a DevOps engineer, I want environment variables to be properly injected during the Docker build process, so that the production build contains the necessary CAPTCHA configuration.

#### Acceptance Criteria

1. WHEN the Docker build process runs, THE Build System SHALL accept environment variables as build arguments
2. WHEN build arguments are provided, THE Build System SHALL make them available to the Vite build process with the `VITE_` prefix
3. WHEN the Vite build completes, THE JavaScript Bundle SHALL contain the embedded environment variable values
4. WHERE the `.env` file exists, THE Build System SHALL use it as a fallback source for environment variables during local builds

### Requirement 2: Environment Variable Validation

**User Story:** As a developer, I want clear validation and error messages when CAPTCHA configuration is missing, so that I can quickly identify and fix deployment issues.

#### Acceptance Criteria

1. WHEN the TurnstileCaptcha component initializes, THE Component SHALL check if `VITE_TURNSTILE_SITE_KEY` is defined
2. IF `VITE_TURNSTILE_SITE_KEY` is undefined or empty, THEN THE Component SHALL log a descriptive error message to the console
3. IF `VITE_TURNSTILE_SITE_KEY` is undefined or empty, THEN THE Component SHALL render a fallback message indicating CAPTCHA is not configured
4. WHEN the application starts in production mode, THE System SHALL validate that all required environment variables are present

### Requirement 3: Deployment Documentation

**User Story:** As a DevOps engineer, I want comprehensive deployment documentation, so that I can correctly configure environment variables for production deployments.

#### Acceptance Criteria

1. THE Documentation SHALL include step-by-step instructions for building the Docker image with environment variables
2. THE Documentation SHALL provide example commands for both development and production builds
3. THE Documentation SHALL explain the difference between build-time and runtime environment variables in Vite
4. THE Documentation SHALL list all required environment variables for CAPTCHA functionality
5. THE Documentation SHALL include troubleshooting steps for common CAPTCHA configuration issues

### Requirement 4: Build Script Enhancement

**User Story:** As a developer, I want convenient build scripts that handle environment variables correctly, so that I can easily create production builds locally and in CI/CD pipelines.

#### Acceptance Criteria

1. THE Build Scripts SHALL provide a command for building Docker images with environment variables
2. THE Build Scripts SHALL validate that required environment variables are set before starting the build
3. WHEN environment variables are missing, THE Build Scripts SHALL display helpful error messages indicating which variables are required
4. THE Build Scripts SHALL support both `.env` file and explicit environment variable passing

### Requirement 5: Production Verification

**User Story:** As a QA engineer, I want to verify that the CAPTCHA is properly configured in production, so that I can confirm the fix is working correctly.

#### Acceptance Criteria

1. WHEN the production application loads, THE TurnstileCaptcha Component SHALL render the CAPTCHA widget without console errors
2. WHEN viewing the browser console in production, THE System SHALL NOT display "VITE_TURNSTILE_SITE_KEY não configurado" errors
3. WHEN inspecting the JavaScript bundle, THE Bundle SHALL contain the embedded CAPTCHA site key value
4. WHEN a user attempts to log in, THE CAPTCHA Widget SHALL be visible and functional

### Requirement 6: Graceful Degradation

**User Story:** As a product owner, I want the application to handle missing CAPTCHA configuration gracefully, so that the application remains functional even if CAPTCHA is not configured.

#### Acceptance Criteria

1. IF `VITE_TURNSTILE_SITE_KEY` is not configured, THEN THE Auth Page SHALL still render without the CAPTCHA component
2. IF `VITE_TURNSTILE_SITE_KEY` is not configured, THEN THE Login Form SHALL allow authentication without requiring CAPTCHA verification
3. WHEN CAPTCHA is not configured, THE System SHALL log a warning but SHALL NOT prevent application functionality
4. WHEN CAPTCHA configuration is added later, THE System SHALL automatically enable CAPTCHA protection without code changes
