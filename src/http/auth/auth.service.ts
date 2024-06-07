import { 
  Body, 
  HttpStatus, 
  Injectable, 
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreatePasswordResetTokenDto } from './dto/create-password-reset-token.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, EntityManager, Repository } from 'typeorm';
import { throwHttpException } from 'src/utils/exception';
import { I18nService } from 'nestjs-i18n';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import { differenceInMinutes } from 'date-fns';
import { EmailService } from './email/email.service';
import { UpdateDto } from './dto/update.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly connection: Connection,
    private readonly i18n: I18nService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(token: string) {
    try {
      const payload = this.jwtService.decode(token.replace('Bearer ', ''));
      const id: number | any = payload['id'];
      const user = await this.userRepository.findOneBy({id});
      if (user) {
        return {
          data: {
            name: user.name,
            lastName: user.lastName,
            birthdate: user.birthdate
          },
          message: 'Usuario encontrado',
          success: true
        };
      }
    } catch (e) {
      return {
        data: null,
        message: 'Usuario no encontrado',
        success: false
      };
    }
  }

  async createPasswordResetToken(
    @Body() createPasswordResetTokenDto: CreatePasswordResetTokenDto,
  ) {
    const user = await this.userRepository.findOne({
      where: { email: createPasswordResetTokenDto.email },
    });

    if (!user) {
      throwHttpException(HttpStatus.NOT_FOUND, 'User not found');
      return;
    }

    const token = randomBytes(6).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);

    try {
      await this.userRepository.save(user);
    } catch (error) {
      throwHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Error saving user');
      return;
    }

    if (!user.email) {
      throwHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'No email found');
      return;
    }
    return await this.emailService.sendUserRecovery(user);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { resetPasswordToken: resetPasswordDto.token },
      });

      if (!user) {
        throwHttpException(HttpStatus.NOT_FOUND, 'User not found');
      }

      if (
        user &&
        user.resetPasswordExpires &&
        differenceInMinutes(new Date(), user.resetPasswordExpires) > 0
      ) {
        throwHttpException(HttpStatus.BAD_REQUEST, 'Token expired');
      }
      if (user) {
        user.password = await hash(resetPasswordDto.newPassword ?? '', 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await this.userRepository.save(user);
      }
    } catch (error) {
      throwHttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  async updateUser(token: string, updateDto: UpdateDto) {
    const payload = this.jwtService.decode(token.replace('Bearer ', ''));
    const id: number | any = payload['id'];
    const user = await this.userRepository.findOneBy({id});

    if (!user) {
      return {
        data: null,
        message: 'Usuario no encontrado',
        success: false
      };
    }
    
    const updatedUser: User = {
      ...user,
      name: updateDto?.name ?? user.name,
      lastName: updateDto?.lastName ?? user.lastName,
      birthdate: updateDto?.birthdate ?? user.birthdate
    };

    const update: User = await this.userRepository.save(updatedUser);

    return {
      data: update,
      message: 'Usuario actualizado',
      success: true
    };
  }

  async updatePassword(token: string, updatePasswordDto: UpdatePasswordDto) {
    const payload = this.jwtService.decode(token.replace('Bearer ', ''));
    const id: number | any = payload['id'];
    const user = await this.userRepository.findOneBy({id});
    
    if (!user) {
      return {
        data: null,
        message: 'Usuario no encontrado',
        success: false
      };
    }

    const old = updatePasswordDto.oldPassword ?? '';
    const newP = await hash(updatePasswordDto.newPassword ?? '', 10);

    const matchOld = await compare(old ?? '', user.password ?? '');
    if (!matchOld) {
      return {
        data: null,
        message: 'Contraseña antigua incorrecta',
        success: false
      };
    }

    const updatedUser: User = {
      ...user,
      password: newP
    };
    const update: User = await this.userRepository.save(updatedUser);

    return {
      data: update,
      message: 'Contraseña actualizada',
      success: true
    };
  }

  async login(loginDto: LoginDto) {

      const { email, password } = loginDto;
      const user = await this.userRepository.findOne({ where: { email } });
  
      if (!user) { throwHttpException(
          HttpStatus.UNAUTHORIZED, 'Correo no encontrado'
        )
      ;}

      const passwordMatch = await compare(password ?? '', user?.password ?? '');

      if (!passwordMatch) {
        throwHttpException(
          HttpStatus.UNAUTHORIZED, 'contraseña incorrecta'
        );
      }
  
      const payload = {id: user?.id  ,email: user?.email, isAdmin: user?.isAdmin};
      const access_token = await this.jwtService.signAsync(payload);

      return {token: access_token};

  }

  async register(registerDto: RegisterDto) {
    const exist = await this.userRepository.findOne({
      where: {
        email: registerDto?.email,
      },
    });

    if (exist) {
      return throwHttpException(
        HttpStatus.BAD_REQUEST,
        await this.i18n.translate('http.DUPLICATED'),
      );
    }

    const { password } = registerDto;

    const hashedPassword = await hash(password ?? '', 10);
    registerDto = {...registerDto, password: hashedPassword};

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
          const user: User = this.userRepository.create(registerDto);
          await transactionalEntityManager.save(user);
        } catch (error: unknown) {
          return throwHttpException(
            HttpStatus.INTERNAL_SERVER_ERROR,
            await this.i18n.translate('http.ERROR_TRX'),
            { error },
          );
        }
      },
    );
    return { message: this.i18n.translate('http.SUCCESS_CREATED') };
  }

  async findWorkers(token: string){
    const payload = this.jwtService.decode(token.replace('Bearer ', ''));
    const id: number | any = payload['id'];
    console.log('Decoded payload:', payload); // Registro del payload decodificado
    const user = await this.userRepository.findOneBy({id});

    if (!user) {
        console.log('User not found for ID:', id); // Registro cuando no se encuentra el usuario
        return {
            data: null,
            message: 'Usuario no encontrado',
            success: false
        };
    }

    if (user.isAdmin === 3) {
        console.log('User is not authorized:', user); // Registro cuando el usuario no está autorizado
        return {
            data: null,
            message: 'Usuario no autorizado',
            success: false
        };
    }

    const workers = await this.userRepository.find({where: {isAdmin: 3||2}});
    console.log('Workers found:', workers); // Registro de los trabajadores encontrados

    return {
        data: workers,
        message: 'Usuarios encontrados',
        success: true
    };
}

  async addAdmin(token: string, id: number) {
    const payload = this.jwtService.decode(token.replace('Bearer ', ''));
    const idAdmin: number | any = payload['id'];
    const admin = await this.userRepository.findOneBy({id: idAdmin});
    if (!admin) {
      return {
        data: null,
        message: 'Usuario no encontrado',
        success: false
      };
    }
    if (admin.isAdmin !== 1) {
      return {
        data: null,
        message: 'Usuario no autorizado',
        success: false
      };
    }

    const newAdmin = await this.userRepository.findOneBy({id});
    const updateAdmin = {
      ...newAdmin,
      isAdmin: 1
    };

    const update: User = await this.userRepository.save(updateAdmin);

    return {
      data: update,
      message: 'Usuario actualizado',
      success: true
    };
  }
}
