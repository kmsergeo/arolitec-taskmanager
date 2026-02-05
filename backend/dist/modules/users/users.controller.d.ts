import { UsersService } from './users.service';
import { User } from './entities/user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<Partial<User>[]>;
    findOne(id: string): Promise<Partial<User>>;
    updateProfile(user: User, updateData: Partial<User>): Promise<Partial<User>>;
}
