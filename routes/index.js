const router = require('express').Router();

/* GET home page. */
router.get('/', async (req, res, next) => {
  res.render('index', { title: 'Express' });
});

module.exports = router;
