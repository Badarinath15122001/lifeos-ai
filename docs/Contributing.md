# Contributing Guidelines

Thank you for interest in contributing to **LifeOS AI**! To maintain portfolio quality, please adhere to these workflow patterns.

## 1. Coding Standards
- **TypeScript**: Strict typing must be enforced. Avoid using `any` unless implementing mock adapters.
- **Tailwind CSS**: Follow standard v4 practices; define custom style overrides in `app/globals.css` rather than ad-hoc inline styles where possible.
- **Components**: Focus on modular, responsive, accessible, and reusable designs. Save global UI components in `components/ui/`.

## 2. Development Setup
To prepare your environment:
1. Fork the repository and clone locally.
2. Initialize environment variables via `.env.local`.
3. Start the dev compiler:
   ```bash
   npm run dev
   ```

## 3. Pull Request Guidelines
- **Branches**: Create a feature branch named `feature/your-feature-name`.
- **Commits**: Follow semantic commit formatting (e.g. `feat: ...`, `fix: ...`, `docs: ...`).
- **Uptime checks**: Verify the build locally before submitting:
  ```bash
  npm run build
  ```
