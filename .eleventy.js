module.exports = function(eleventyConfig){
  eleventyConfig.addWatchTarget("./src/styles/styles.css");
  eleventyConfig.addWatchTarget("./src/styles/partials/**.css");
  eleventyConfig.addWatchTarget("./dist/assets/styles/styles.css");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/scripts");
  return{
    dir: {
      input: "src",
      output: "dist",
      includes:"_includes",
      layouts:"_layout",
    }
  }
};
