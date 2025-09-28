# Documentation Guidelines

## What This Covers

Guidelines for keeping documentation in `docs/runbooks/` useful and up-to-date.

**Why documentation matters:**

- Helps team members understand procedures
- Reduces time spent figuring things out
- Prevents mistakes during operations
- Makes onboarding easier

## File Organization

### Directory Structure

```
docs/runbooks/
├── README.md                           # Overview of all runbooks
├── cache-invalidation-runbook.md       # CloudFront invalidation
├── cdn-operations-automation.md        # CDN automation tools
├── credential-rotation-playbook.md     # Credential rotation
├── incident-response-guide.md          # Incident response
├── training-distribution-guide.md      # Team training
└── documentation-hygiene-guidelines.md # This document
```

### File Naming

**Use this format**: `topic-type.md`

**Good examples:**
- `cache-invalidation-runbook.md`
- `credential-rotation-playbook.md`
- `s3-troubleshooting-guide.md`

**Avoid:**
- Spaces in filenames
- Version numbers in filenames
- Special characters

## Document Structure

### Required Sections

Every runbook should have:

1. **Title and brief description**
2. **What it covers** - Purpose and scope
3. **Setup** - Prerequisites and requirements
4. **Main content** - Step-by-step procedures
5. **Troubleshooting** - Common issues
6. **Quick reference** - Summary table or commands

### Writing Style

**Good practices:**

- Use simple, clear language
- Write step-by-step instructions
- Include code examples
- Use bullet points and numbered lists
- Test all commands before documenting them

**Avoid:**

- Complex jargon or technical terms without explanation
- Long paragraphs
- Assuming too much background knowledge
- Outdated screenshots or examples

## Keeping Documentation Current

### When to Update

**Update documentation when:**

- Commands or procedures change
- New tools or scripts are added
- Someone finds an error or unclear instruction
- New team members struggle with existing docs

### How to Update

1. **Make changes** in a new branch
2. **Test procedures** to make sure they work
3. **Get someone to review** your changes
4. **Merge** to main branch
5. **Tell the team** about important changes

### Quick Validation

Before updating any runbook:

```bash
# Test the commands work
make cf-invalidate-dry-run PATHS="/test/*"
npm run s3:health

# Check links aren't broken
# Review for typos and clarity
```

## Version Control

### Git Best Practices

```bash
# Use clear commit messages
git commit -m "docs: update S3 health check procedure"
git commit -m "docs: fix broken commands in cache invalidation guide"
git commit -m "docs: add troubleshooting section for credential rotation"

# Create branches for major changes
git checkout -b update-cdn-docs
```

### Commit Message Format

- `docs: add new troubleshooting section`
- `docs: update AWS credential rotation steps`
- `docs: fix typos in cache invalidation guide`

## Review and Maintenance

### Regular Maintenance

**Monthly tasks:**

- Test critical procedures in frequently-used runbooks
- Check if any commands have changed
- Fix any reported issues or unclear sections

**When starting a new project:**

- Review related documentation
- Update any outdated information you find
- Add new procedures if needed

### Getting Feedback

**Ways to improve documentation:**

- Ask new team members what's confusing
- Note what questions come up repeatedly
- Track which runbooks are used most/least
- Fix issues as soon as you find them

## Common Issues

### Outdated Commands

**Problem**: Commands in docs don't work anymore

**Solution**: 
- Test all commands when updating docs
- Set up alerts for major tool updates
- Review docs when dependencies change

### Missing Context

**Problem**: Instructions assume too much knowledge

**Solution**:
- Add "before you start" sections
- Define technical terms
- Include links to related documentation

### Too Much Detail

**Problem**: Docs are overwhelming with unnecessary information

**Solution**:
- Focus on what people actually need
- Move detailed explanations to appendices
- Use simple language

### Broken Links

**Problem**: Links to other docs or external resources don't work

**Solution**:
- Check links when updating documents
- Use relative links for internal documentation
- Keep external links to a minimum

## Tools and Tips

### Recommended Tools

**For editing:**
- VS Code with Markdown extensions
- Any text editor that shows Markdown preview

**For validation:**
- Test commands in a safe environment
- Use spell check
- Get someone else to review

### Markdown Tips

```markdown
# Use clear headings

## Organize with subheadings

### Break up long sections

- Use bullet points for lists
- `Use code blocks for commands`
- **Bold important information**

| Use | Tables | For | Reference |
|-----|--------|-----|-----------|
| Command | Purpose | Example | Notes |
```

## Quick Reference

### Before Writing Documentation

- [ ] Know your audience (new developers? experienced ops?)
- [ ] Test all procedures yourself
- [ ] Have a clear structure planned

### Before Publishing

- [ ] Test all commands and code examples
- [ ] Check spelling and grammar
- [ ] Get someone else to review
- [ ] Make sure links work

### Maintenance Checklist

- [ ] Review frequently-used docs monthly
- [ ] Update when tools or procedures change
- [ ] Fix issues as soon as they're reported
- [ ] Archive or remove outdated documentation

## Getting Help

**If you're updating docs:**
1. Test everything in a safe environment first
2. Ask someone to review before merging
3. Update incrementally rather than massive rewrites

**If you find issues:**
1. Fix small issues immediately
2. Create GitHub issues for larger problems
3. Let the team know about important changes

**If you're writing new docs:**
1. Look at existing runbooks for format examples
2. Focus on practical, step-by-step instructions
3. Include troubleshooting for common problems
