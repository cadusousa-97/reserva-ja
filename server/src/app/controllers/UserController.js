const UserRepository = require('../repositories/UserRepository');
class UserController {
  async index(req, res) {
    const users = await UserRepository.findAll();
    res.json(users);
  }

  async show(req, res) {
    const { id } = req.params;
    const user = await UserRepository.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  }

  store() {
    //criar um novo usuário
  }

  update() {
    //editar um usuário
  }

  async delete(req, res) {
    const { id } = req.params;
    const user = await UserRepository.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await UserRepository.delete(id);

    res.sendStatus(204);
  }
}

module.exports = new UserController();
