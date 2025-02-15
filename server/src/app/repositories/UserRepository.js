const { uuid } = require('uuidv4');

const users = [
  {
    id: uuid(),
    name: 'João',
    email: 'joao@gmail.com',
    phone: '1212121212',
    role_id: uuid(),
  },
  {
    id: uuid(),
    name: 'Matheus',
    email: 'matheus@gmail.com',
    phone: '1212121212',
    role_id: uuid(),
  },
  {
    id: uuid(),
    name: 'Carlos',
    email: 'carlos@gmail.com',
    phone: '1212121212',
    role_id: uuid(),
  },
  {
    id: uuid(),
    name: 'Paulo',
    email: 'paulo@gmail.com',
    phone: '1212121212',
    role_id: uuid(),
  },
];

class UserRepository {
  findAll() {}
}

module.exports = new UserRepository();
