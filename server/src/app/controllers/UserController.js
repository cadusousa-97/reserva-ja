class UserController {
  index(req, res) {
    //listar todos usuários
    res.send('Send from User Controller');
  }

  show() {
    //obter um usuário
  }

  store() {
    //criar um novo usuário
  }

  update() {
    //editar um usuário
  }

  delete() {
    //deletar um usuário
  }
}

module.exports = new UserController();
