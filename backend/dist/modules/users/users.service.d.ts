import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    findAll(): Promise<Partial<User>[]>;
    findOne(id: string): Promise<Partial<User>>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, updateData: Partial<User>): Promise<Partial<User>>;
    deactivate(id: string): Promise<void>;
}
