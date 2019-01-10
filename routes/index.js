module.exports = router => {
  /* GET home page. */
  router.get("/", async (req, res, next) => {
    res.render("index", { title: "Express" });
  });
};
