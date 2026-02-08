# Contributing to WhatsApp Micro-Store

Thank you for your interest in contributing to WhatsApp Micro-Store! We welcome contributions from the community.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

- A clear, descriptive title
- Steps to reproduce the bug
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, browser, Node version)

### Suggesting Features

We welcome feature suggestions! Please create an issue with:

- A clear description of the feature
- Use cases and benefits
- Any implementation ideas you have

### Pull Requests

1. **Fork the repository**

   ```bash
   git clone https://github.com/yourusername/whatsapp-micro-store.git
   cd whatsapp-micro-store
   ```

2. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Test your changes**

   ```bash
   pnpm test:unit
   pnpm test:e2e
   pnpm lint
   pnpm tsc --noEmit
   ```

5. **Commit your changes**

   ```bash
   git commit -m "feat: add amazing new feature"
   ```

   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

6. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template

## 📋 Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful variable and function names
- Add comments for complex logic

### Component Guidelines

- Use client components only when necessary
- Prefer server components by default
- Keep components small and focused
- Use proper TypeScript types

### Database Changes

- Create migration files in `supabase/migrations/`
- Use timestamp prefixes (YYYYMMDDHHMMSS)
- Test migrations on a dev database first
- Document schema changes in the migration file

### Testing

- Write unit tests for utility functions
- Add E2E tests for critical user flows
- Test edge cases and error scenarios
- Ensure tests pass before submitting PR

### Documentation

- Update README.md for significant changes
- Add JSDoc comments to functions
- Update relevant documentation files
- Include examples where helpful

## 🔍 Code Review Process

1. A maintainer will review your PR
2. They may request changes or ask questions
3. Make requested changes and push to your branch
4. Once approved, a maintainer will merge your PR

## 🎯 Areas We Need Help

- 📱 Mobile app improvements
- 🌐 Internationalization (i18n)
- ♿ Accessibility enhancements
- 📊 Analytics and reporting features
- 🎨 UI/UX improvements
- 📝 Documentation improvements
- 🧪 More test coverage

## 💬 Communication

- **GitHub Issues** - Bug reports, feature requests
- **Pull Requests** - Code contributions
- **Discussions** - General questions and ideas

## 🙏 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- GitHub contributors page

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions
- No harassment or discrimination

## ❓ Questions?

Feel free to:

- Open an issue for questions
- Ask in your PR if related to your contribution
- Check existing documentation first

Thank you for contributing to WhatsApp Micro-Store! 🎉
