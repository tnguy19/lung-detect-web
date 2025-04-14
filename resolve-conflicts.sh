#!/bin/bash
# Script to resolve all conflicts by accepting the incoming changes

# Make sure we're in the root directory of the project
# cd /path/to/your/project

# Accept all incoming changes (theirs) for conflicted files
git diff --name-only --diff-filter=U | while read file; do
  echo "Resolving conflict in $file"
  git checkout --theirs "$file"
  git add "$file"
done

# Continue with the rebase
echo "All conflicts resolved. Running git rebase --continue"
git rebase --continue