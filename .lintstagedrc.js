module.exports = {
  "*.ts": (filenames) => {
    return [
      "eslint --fix",
      `git add ${filenames.join(' ')}`
    ];
  },
};
