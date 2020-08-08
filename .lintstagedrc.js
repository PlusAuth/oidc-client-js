module.exports = {
  "*.ts": (filenames) => {
    return [
      "yarn lint",
      `git add ${filenames.join(' ')}`
    ];
  },
};
