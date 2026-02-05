import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    this.logger.log(`Tentative d'inscription: ${email}`);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      this.logger.warn(`Email déjà utilisé: ${email}`);
      throw new ConflictException('Cet email est déjà utilisé');
    }

    try {
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Créer un utilisateur
      const user = this.userRepository.create({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: 'user',
        isActive: true,
      });

      await this.userRepository.save(user);

      this.logger.log(`Utilisateur créé: ${email}`);

      // Generer token
      const token = this.generateToken(user);

      return {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      this.logger.error(`Erreur lors de l'inscription: ${error.message}`);
      throw new BadRequestException('Erreur lors de la création du compte');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    this.logger.log(`Tentative de connexion: ${email}`);

    // Charger un utilisateur par son email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      this.logger.warn(`Utilisateur non trouvé: ${email}`);
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Verifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Mot de passe incorrect pour: ${email}`);
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifiez si l'utilisateur est actif
    if (!user.isActive) {
      this.logger.warn(`Compte désactivé: ${email}`);
      throw new UnauthorizedException('Ce compte a été désactivé');
    }

    this.logger.log(`Connexion réussie: ${email}`);

    // Generer token
    const token = this.generateToken(user);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur non trouvé ou inactif');
    }
    return user;
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.validateUser(userId);
    const token = this.generateToken(user);
    return { accessToken: token };
  }
}
