#!/bin/bash
# Install Git Hooks for Branch Protection
# This script installs a pre-push hook that prevents direct pushes to main and develop branches
#
# Usage: bash scripts/install-git-hooks.sh

set -e

echo "🔧 Installing Git Hooks for Branch Protection..."
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
  echo "❌ Error: Not a git repository"
  echo "Please run this script from the repository root"
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
# Git Pre-Push Hook - Prevent Direct Pushes to Protected Branches
# This hook prevents accidental direct pushes to main and develop branches
#
# To bypass this hook (USE WITH CAUTION):
#   git push --no-verify

protected_branches=("main" "develop")
current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

echo "🔍 Checking branch: $current_branch"

for branch in "${protected_branches[@]}"; do
  if [ "$current_branch" = "$branch" ]; then
    echo ""
    echo "❌ ERROR: Direct push to '$branch' branch is not allowed!"
    echo ""
    echo "📋 Best Practice: Create a feature branch and open a Pull Request"
    echo ""
    echo "To create a feature branch:"
    echo "  git checkout -b feature/your-feature-name"
    echo ""
    echo "To push your feature branch:"
    echo "  git push origin feature/your-feature-name"
    echo ""
    echo "Then open a Pull Request on GitHub."
    echo ""
    echo "⚠️  To bypass this check (NOT RECOMMENDED):"
    echo "  git push --no-verify"
    echo ""
    exit 1
  fi
done

echo "✅ Branch check passed"
exit 0
EOF

# Make the hook executable
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed successfully!"
echo ""
echo "📋 What was installed:"
echo "  - Pre-push hook: Prevents direct pushes to main and develop branches"
echo ""
echo "🧪 Test the hook:"
echo "  1. Try: git checkout main && git push"
echo "  2. You should see an error message"
echo "  3. Create a feature branch instead: git checkout -b feature/test"
echo ""
echo "🔓 To bypass the hook (use with caution):"
echo "  git push --no-verify"
echo ""
echo "✨ Done! Your repository now has branch protection at the local level."
