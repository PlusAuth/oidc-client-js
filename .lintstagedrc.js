module.exports = {
  "*.ts": (filenames) => {
    return [
      "npm run lint",
      `git add ${filenames.join(' ')}`
    ];
  },
};
