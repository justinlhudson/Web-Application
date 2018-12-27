const router = require('express').Router();
const jsonParser = require('body-parser').json();

const st = require.main.require('./controllers/st/handler');

/* GET home page. */
router.get('/', async (request, response, next) => {
  response.render('index', { title: 'st' });
});

router.post('/', jsonParser, async (request, response) => {
  st.entry(request, response);
});

module.exports = router;
