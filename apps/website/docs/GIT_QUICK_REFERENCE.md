# 🚀 GIT SYNC QUICK REFERENCE CARD

## ⚡ Daily Workflow (Remember This!)

### MORNING: Before Starting Work
```bash
git pull origin main          # Get latest remote
git log -1 --oneline         # Verify you're current
```

### DURING: As You Work
```bash
# Your edits happen here...
```

### EVENING: After Making Changes
```bash
git add -A                    # Stage all changes
git commit -m "feat: ..."     # Describe what you did
git push origin main          # PUSH IMMEDIATELY (don't batch)
```

---

## 🆘 If Something Goes Wrong

### "Your branch is ahead of origin/main"
You have commits not yet pushed.
```bash
git push origin main    # Just push it!
```

### "Your branch is behind origin/main"
Remote has commits you don't have.
```bash
git pull origin main    # Merge remote into local
git push origin main    # Then push your merged version
```

### "Both ahead and behind"
Diverged repos (like we just had).
```bash
git fetch origin                    # Get remote state
git merge origin/main               # Merge remote into local
git add .                           # Stage merged changes
git commit -m "merge: sync branches"
git push origin main                # Push merged result
```

### "SSH/Auth Errors"
Can't authenticate when pushing.
```bash
# Try HTTPS instead
git remote set-url origin https://github.com/nitro0dust-pixel/thekpihub-website.git
git push origin main

# Or set up SSH keys (recommended for long-term)
# Follow: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

---

## 📋 Multi-Step Recovery (Current Situation)

You're in: **Diverged repos** (local ahead 1, remote ahead 25)

```bash
# Step 1: Get remote state
git fetch origin

# Step 2: Merge remote into local
git merge origin/main
# ↳ If conflicts: Open files, keep both versions, git add .

# Step 3: Commit merged result
git commit -m "merge: sync GA4 with remote updates"

# Step 4: Push
git push origin main

# Step 5: Cleanup Windows files
find . -name "*.Zone.Identifier" -delete
git add -A
git commit -m "chore: remove Zone.Identifier files"
git push origin main
```

---

## 🛡️ Prevention Checklist

- [ ] **Configure Git auth** (SSH keys or personal access token)
- [ ] **Add `.gitignore`** entries:
  ```
  *.Zone.Identifier
  .DS_Store
  Thumbs.db
  __pycache__/
  .env.local
  ```
- [ ] **Daily sync ritual**: `git pull` morning, `git push` evening
- [ ] **Never batch commits**: Commit → Push immediately
- [ ] **Verify before break**: `git log origin/main..main` (should be empty)

---

## 🔍 Inspection Commands

Check current state:
```bash
git status                    # What's changed locally?
git log -1 --oneline         # What's my last commit?
git log main..origin/main    # What's on remote I don't have?
git log origin/main..main    # What have I not pushed?
```

---

## 💾 One-Liner Reference

| Task | Command |
|------|---------|
| Get latest | `git pull origin main` |
| See my changes | `git status` or `git diff` |
| Commit & push | `git add -A && git commit -m "msg" && git push origin main` |
| Undo last commit (local only) | `git reset --soft HEAD~1` |
| See what's on remote | `git fetch origin && git log main..origin/main` |
| Sync before work | `git pull origin main && git log -1 --oneline` |

---

## 📌 Remember

✅ **DO:**
- Pull before starting work
- Push immediately after committing
- Verify pushed: `git log origin/main..main` (should be empty)

❌ **DON'T:**
- Work without pulling first
- Batch multiple commits without pushing
- Ignore merge conflicts
- Commit Windows metadata files (Zone.Identifier, etc.)

---

**Saved**: /home/hsharma/thekpihub-website/  
**For detailed guide**: See REPO_SYNC_REPORT.md
