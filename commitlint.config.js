module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Formatting, missing semi colons, etc.
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding missing tests
        'chore',    // Maintain build tasks, configs, dependencies, etc.
        'revert',   // Revert commit
        'ci'        // CI/CD pipelines
      ]
    ]
  }
};
