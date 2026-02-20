@echo off
REM Install Git Hooks for Branch Protection (Windows)
REM This script installs a pre-push hook that prevents direct pushes to main and develop branches
REM
REM Usage: scripts\install-git-hooks.bat

echo Installing Git Hooks for Branch Protection...
echo.

REM Check if we're in a git repository
if not exist .git (
  echo Error: Not a git repository
  echo Please run this script from the repository root
  exit /b 1
)

REM Create hooks directory if it doesn't exist
if not exist .git\hooks mkdir .git\hooks

REM Create pre-push hook
(
echo #!/bin/bash
echo # Git Pre-Push Hook - Prevent Direct Pushes to Protected Branches
echo # This hook prevents accidental direct pushes to main and develop branches
echo #
echo # To bypass this hook ^(USE WITH CAUTION^):
echo #   git push --no-verify
echo.
echo protected_branches=^("main" "develop"^)
echo current_branch=^$^(git symbolic-ref HEAD ^| sed -e 's,.*/\^(.*\^),\1,'^^)
echo.
echo echo "Checking branch: $current_branch"
echo.
echo for branch in "${protected_branches[@]}"; do
echo   if [ "$current_branch" = "$branch" ]; then
echo     echo ""
echo     echo "ERROR: Direct push to '$branch' branch is not allowed!"
echo     echo ""
echo     echo "Best Practice: Create a feature branch and open a Pull Request"
echo     echo ""
echo     echo "To create a feature branch:"
echo     echo "  git checkout -b feature/your-feature-name"
echo     echo ""
echo     echo "To push your feature branch:"
echo     echo "  git push origin feature/your-feature-name"
echo     echo ""
echo     echo "Then open a Pull Request on GitHub."
echo     echo ""
echo     echo "To bypass this check ^(NOT RECOMMENDED^):"
echo     echo "  git push --no-verify"
echo     echo ""
echo     exit 1
echo   fi
echo done
echo.
echo echo "Branch check passed"
echo exit 0
) > .git\hooks\pre-push

echo.
echo Git hooks installed successfully!
echo.
echo What was installed:
echo   - Pre-push hook: Prevents direct pushes to main and develop branches
echo.
echo Test the hook:
echo   1. Try: git checkout main ^&^& git push
echo   2. You should see an error message
echo   3. Create a feature branch instead: git checkout -b feature/test
echo.
echo To bypass the hook ^(use with caution^):
echo   git push --no-verify
echo.
echo Done! Your repository now has branch protection at the local level.
