module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
  overrides: [
    {
      test: /\.[jt]sx$/,
      presets: ["@babel/preset-react"],
    },
  ],
};
