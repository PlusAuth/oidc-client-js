module.exports = {
  hooks: {
    "before:init": ["npm run lint", "npm test"],
    "after:bump": ["npm run docs", "npm run build"],
  },
  git: {
    commitMessage: "chore: release v${version}",
    requireCleanWorkingDir: true,
    tagAnnotation: "Release v${version}",
    tagName: "v${version}",
  },
  github: {
    release: true,
    draft: true,
    releaseName: "v${version}",
  },
  plugins: {
    "@release-it/conventional-changelog": {
      preset: "angular",
      infile: "CHANGELOG.md",
    },
  },
}
