const { Router } = require('express');

const UserController = require('./app/controllers/UserController');

const router = Router();

router.get('/users', UserController.index);
router.get('/users/:id', UserController.show);
router.delete('/users/:id', UserController.delete);

module.exports = router;
