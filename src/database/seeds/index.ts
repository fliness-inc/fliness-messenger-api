import { createConnection, Connection } from 'typeorm';
import { config as setupDotEnv } from 'dotenv';
import { UserSeeder, UserFactory } from './users.seeder';

setupDotEnv();

createConnection().then(async (connection: Connection) => {
  connection.query('TRUNCATE users CASCADE');

  const userSeeder = new UserSeeder(new UserFactory());
  userSeeder.run(10);
});
