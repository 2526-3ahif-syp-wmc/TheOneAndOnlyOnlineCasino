import { createUser } from './services/user-service';

const user = createUser('tester', 'pwd', 1000);

console.log('Created user:', user);
