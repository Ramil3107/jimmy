# Documentation

This folder contains module-specific documentation for the Jimmy assistant bot project.

## Purpose

Each implemented module/feature should have its own documentation file here to help understand:
- What the module does
- How it integrates with other parts
- API/interface contracts
- Usage examples
- Testing approach

## Structure

Documentation files are created as modules are implemented:

```
docs/
├── README.md           # This file
├── bot-core.md         # Bot initialization, middleware pipeline
├── auth.md             # Authentication and user management
├── onboarding.md       # Onboarding flow
├── voice.md            # Voice message processing
├── llm-router.md       # LLM intent routing
├── skills.md           # Skill system architecture
├── confirmations.md    # Confirmation system
├── tasks.md            # Task management (M2)
├── notes.md            # Notes system (M3)
├── calendar.md         # Google Calendar integration (M4)
└── ...                 # Additional modules as implemented
```

## Documentation Guidelines

When creating module documentation, include:

1. **Overview**
   - Purpose of the module
   - Key responsibilities
   - Where it fits in the architecture

2. **Interface/API**
   - Public functions and their signatures
   - Types and interfaces
   - Configuration options

3. **Dependencies**
   - What this module depends on
   - What depends on this module
   - External services/APIs used

4. **Usage Examples**
   - Code snippets showing common use cases
   - Integration examples

5. **Testing**
   - How to test this module
   - Mock strategies
   - Key test scenarios

6. **Implementation Notes**
   - Important decisions made
   - Edge cases handled
   - Future improvements

## Maintenance

- Update docs when module behavior changes
- Keep examples current with actual implementation
- Document breaking changes prominently
- Add migration guides if APIs change

## Reference

For overall architecture and planning, see:
- `CLAUDE.md` — Project guide for Claude Code
- `claude/architecture.md` — System architecture
- `claude/roadmap.md` — Feature roadmap
- `claude/technical-plan.md` — Implementation steps
