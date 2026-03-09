# Contributing to Cloud Device Lab

Thank you for your interest in contributing to Cloud Device Lab! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Use the bug report template
3. Include detailed steps to reproduce
4. Provide system information
5. Add screenshots if applicable

### Suggesting Features

1. Check existing feature requests
2. Use the feature request template
3. Clearly describe the problem it solves
4. Provide use cases and examples
5. Consider implementation complexity

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Update documentation
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## Development Setup

See [QUICKSTART.md](QUICKSTART.md) for development setup instructions.

## Code Style

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### React Components

- Use functional components with hooks
- Keep components small and reusable
- Use TypeScript for props
- Follow component file structure:
  ```tsx
  // Imports
  import React from 'react';
  
  // Types
  interface ComponentProps {
    // ...
  }
  
  // Component
  export default function Component({ }: ComponentProps) {
    // Hooks
    // Event handlers
    // Render
  }
  ```

### Backend Code

- Follow RESTful API conventions
- Use async/await for promises
- Handle errors properly
- Add logging for debugging
- Write unit tests

### Git Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests

Examples:
```
Add Android 14 support
Fix WebRTC connection timeout
Update deployment documentation
Refactor session management service
```

## Testing

### Frontend Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend/api-server
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Manual Testing

1. Test device launching
2. Test WebRTC streaming
3. Test session controls
4. Test admin panel
5. Test on different browsers

## Documentation

- Update README.md for major changes
- Add inline code comments
- Update API documentation
- Include examples
- Keep documentation current

## Project Structure

```
cloud-device-lab/
├── frontend/          # React frontend
├── backend/           # Node.js backend services
├── vm-images/         # VM configuration and scripts
├── infrastructure/    # Kubernetes and deployment configs
├── security/          # Security policies
├── docs/             # Additional documentation
└── scripts/          # Utility scripts
```

## Key Architecture Decisions

### Frontend
- React with TypeScript for type safety
- TailwindCSS for consistent styling
- WebRTC for real-time streaming
- Zustand for state management

### Backend
- Node.js + Express for API
- PostgreSQL for persistence
- Redis for caching
- Socket.io for WebSocket

### Infrastructure
- Kubernetes for orchestration
- Docker for containerization
- QEMU/KVM for VMs
- Prometheus for monitoring

## Areas Needing Help

- [ ] iOS device support
- [ ] Additional Android versions
- [ ] Performance optimizations
- [ ] Security audits
- [ ] Documentation improvements
- [ ] Test coverage
- [ ] Internationalization
- [ ] Accessibility improvements

## Getting Help

- Read the documentation
- Check existing issues
- Ask in discussions
- Join Discord/Slack community

## Recognition

Contributors will be recognized in:
- Contributors list in README
- Release notes
- GitHub contributors page

Thank you for contributing! 🙏
