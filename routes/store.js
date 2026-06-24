const express = require('express');
const { getStoreCatalog } = require('../controllers/storeCatalogController');

const router = express.Router();

router.get('/catalog', getStoreCatalog);

module.exports = router;
