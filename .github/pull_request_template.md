# =============================================================================
# JOL-HUB Pull Request Template
# =============================================================================

## 📋 Description

<!-- Provide a clear and concise description of your changes -->

**What does this PR do?**


**Why is this change needed?**


**Related Issue(s):**
<!-- Link to related issues using #issue-number -->
- Fixes #
- Related to #

---

## 🔄 Type of Change

<!-- Check all that apply -->

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔒 Security fix
- [ ] 🎨 UI/UX improvement
- [ ] ♻️ Refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test addition/update
- [ ] 🔧 Configuration change
- [ ] 🌐 Internationalization/Localization

---

## 🏗️ Components Affected

<!-- Check all that apply -->

- [ ] Backend (Django API)
- [ ] Frontend (Next.js)
- [ ] Database (Migrations)
- [ ] Authentication
- [ ] Payments/Donations
- [ ] Content Management
- [ ] Admin Dashboard
- [ ] Infrastructure
- [ ] CI/CD
- [ ] Documentation

---

## 🌍 Country/Region Impact

<!-- Which countries are affected by this change? -->

- [ ] All Countries (Global change)
- [ ] Specific Countries: <!-- LT, LV, DE, etc. -->

---

## 🛡️ GDPR & Compliance

<!-- Important: Does this change involve personal data? -->

- [ ] This change does NOT involve personal data (PII)
- [ ] This change involves personal data - GDPR assessment completed
- [ ] This change requires Data Protection Impact Assessment (DPIA)
- [ ] This change affects consent management
- [ ] This change affects data subject rights
- [ ] This change affects data retention policies
- [ ] This change affects audit logging

**If personal data is involved, please describe:**

---

## 🧪 Testing

### Tests Performed

<!-- Describe tests you ran to verify your changes -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

### Test Coverage

| Area | Coverage |
|------|----------|
| New Code | <!-- e.g., 85% --> |
| Overall | <!-- e.g., 78% --> |

### Test Results

```
Paste test results here (or link to CI run)
```

### Manual Testing Steps

<!-- Steps for reviewers to manually test -->

1. 
2. 
3. 

---

## 📸 Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

### Before

<!-- Screenshot of the UI before changes -->

### After

<!-- Screenshot of the UI after changes -->

---

## 📝 Documentation

- [ ] Code is self-documenting
- [ ] Inline comments added for complex logic
- [ ] API documentation updated (OpenAPI spec)
- [ ] README updated
- [ ] Architecture documentation updated
- [ ] User documentation updated

---

## 🔍 Code Review Checklist

### Author Checklist

- [ ] Code follows project coding standards
- [ ] No hardcoded secrets or credentials
- [ ] Error handling is appropriate
- [ ] Logging is appropriate (no sensitive data in logs)
- [ ] Database queries are optimized (N+1 issues addressed)
- [ ] Proper input validation implemented
- [ ] Security best practices followed
- [ ] Accessibility standards met (WCAG 2.1 AA)

### Reviewer Checklist

- [ ] Code is readable and maintainable
- [ ] Logic is correct
- [ ] Edge cases are handled
- [ ] Tests are comprehensive
- [ ] No security vulnerabilities introduced
- [ ] Performance implications considered
- [ ] Backward compatibility maintained

---

## 🚀 Deployment Notes

### Database Migrations

- [ ] No database migrations
- [ ] Database migrations included (tested)
- [ ] Database migrations require downtime

### Environment Variables

<!-- List any new environment variables required -->

| Variable | Description | Required |
|----------|-------------|----------|
| | | |

### Breaking Changes

<!-- Describe any breaking changes and migration steps -->

---

## 📋 Pre-Merge Checklist

- [ ] All CI checks pass
- [ ] Code review approved
- [ ] No unresolved conversations
- [ ] Branch is up-to-date with target branch
- [ ] Commit messages follow conventions
- [ ] Ready for merge

---

## 📎 Additional Context

<!-- Add any other context about the PR here -->

---

**By submitting this pull request, I confirm that:**

- [ ] I have read and agree to the contributing guidelines
- [ ] I have tested my changes thoroughly
- [ ] I have considered the security and privacy implications
- [ ] I have documented my changes appropriately
