const { v4 } = require('uuid');

let users = [
  {
    id: v4(),
    name: 'João',
    email: 'joao@gmail.com',
    phone: '1212121212',
    role_id: v4(),
  },
  {
    id: v4(),
    name: 'Matheus',
    email: 'matheus@gmail.com',
    phone: '1212121212',
    role_id: v4(),
  },
  {
    id: v4(),
    name: 'Carlos',
    email: 'carlos@gmail.com',
    phone: '1212121212',
    role_id: v4(),
  },
  {
    id: v4(),
    name: 'Paulo',
    email: 'paulo@gmail.com',
    phone: '1212121212',
    role_id: v4(),
  },
];

class UserRepository {
  findAll() {
    return new Promise((resolve) => resolve(users));
  }

  findById(id) {
    return new Promise((resolve) =>
      resolve(users.find((user) => user.id === id)),
    );
  }

  delete(id) {
    return new Promise((resolve) => {
      users.filter((user) => user.id !== id);
      resolve();
    });
  }
}

module.exports = new UserRepository();
