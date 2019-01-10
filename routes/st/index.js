const jsonParser = require("body-parser").json();

const st = require.main.require("./controllers/st/handler");

module.exports = router => {

  /* GET /st page. */
  router.get("/", async (request, response, next) => {
    response.render("index", { title: "st" });
  });
  
  /* POST /st for smartapp execution */
  router.post("/", jsonParser, async (request, response) => {
    st.entry(request, response);
  });
};
