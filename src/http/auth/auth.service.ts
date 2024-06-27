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
import { Connection, EntityManager, In, Repository } from 'typeorm';
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

  async findOne(token: string) {
    try {
      if (!token) {
        throwHttpException(HttpStatus.BAD_REQUEST, 'Token is required');
      }
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
          message: 'User found',
          success: true
        };
      }
    } catch (e) {
      return {
        data: null,
        message: 'User not found',
        success: false
      };
    }
  }

  async createPasswordResetToken(
    @Body() createPasswordResetTokenDto: CreatePasswordResetTokenDto,
  ) {
    const { email } = createPasswordResetTokenDto;

    if (!email) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Email is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email || '')) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Invalid email');
    }

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
    }

    const sendMail = await this.emailService.sendUserRecovery(user);
    if (!sendMail.success) {
      throwHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Error sending email');
    }

    return sendMail;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const { newPassword, token } = resetPasswordDto;

      if (!newPassword) {
        throwHttpException(HttpStatus.BAD_REQUEST, 'New password is required');
      }
      if ((newPassword ?? '').length < 8) {
        throwHttpException(HttpStatus.BAD_REQUEST, 
          'New password must be at least 8 characters long');
      }

      if (!token) {
        throwHttpException(HttpStatus.BAD_REQUEST, 'Token is required');
      }

      const user = await this.userRepository.findOne({
        where: { resetPasswordToken: resetPasswordDto.token },
      });

      if (!user) {
        throwHttpException(HttpStatus.NOT_FOUND, 'User not found');
      }

      if (
        user && user.resetPasswordExpires &&
        differenceInMinutes(new Date(), user.resetPasswordExpires) > 0
      ) {
        throwHttpException(HttpStatus.BAD_REQUEST, 'Token expired');
      }
      if (user) {
        user.password = await hash(newPassword ?? '', 10);
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
    const { name, lastName, birthdate } = updateDto;

    if (!name) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Name is required');
    }

    if (!lastName) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Last name is required');
    }

    const birthdateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
    if (!birthdateRegex.test(birthdate || '')) {
      throwHttpException(HttpStatus.BAD_REQUEST, 
        'Invalid birthdate format, should be dd/MM/yyyy');
    }

    const [day, month, year] = (birthdate ?? '').split('/');
    const birthDateObj = new Date(`${year}-${month}-${day}`);
    if (birthDateObj.toString() === 'Invalid Date') {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Invalid birthdate');
    }

    const payload = this.jwtService.decode(token.replace('Bearer ', ''));
    const id: number | any = payload['id'];
    const user = await this.userRepository.findOneBy({id});

    if (!user) {
      return {
        data: null,
        message: 'User not found',
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
      message: 'User updated',
      success: true
    };
  }

  async updatePassword(token: string, updatePasswordDto: UpdatePasswordDto) {
    const { oldPassword, newPassword } = updatePasswordDto;
    if (!oldPassword) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Old password is required');
    }
    if ((oldPassword ?? '').length < 8) {
      throwHttpException(HttpStatus.BAD_REQUEST, 
        'Old password must be at least 8 characters long');
    }
    if (!newPassword) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'New password is required');
    }
    if ((newPassword ?? '').length < 8) {
      throwHttpException(HttpStatus.BAD_REQUEST, 
        'New password must be at least 8 characters long');
    }

    const payload = this.jwtService.decode(token.replace('Bearer ', ''));
    const id: number | any = payload['id'];
    const user = await this.userRepository.findOneBy({id});
    
    if (!user) {
      return {
        data: null,
        message: 'User not found',
        success: false
      };
    }

    const old = oldPassword ?? '';
    const newP = await hash(newPassword ?? '', 10);

    const matchOld = await compare(old ?? '', user.password ?? '');
    if (!matchOld) {
      return {
        data: null,
        message: 'Incorrect old password',
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
      message: 'Password updated',
      success: true
    };
  }

  async login(loginDto: LoginDto) {
      const { email, password } = loginDto;

      if (!email) {
        throwHttpException(HttpStatus.BAD_REQUEST, 'Email is required');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email || '')) {
        throwHttpException(HttpStatus.BAD_REQUEST, 'Invalid email');
      }
      
      if (!password) {
        throwHttpException(HttpStatus.BAD_REQUEST, 'Password is required');
      }
      if ((password ?? '').length < 8) {
        throwHttpException(HttpStatus.BAD_REQUEST, 
          'Password must be at least 8 characters long');
      }

      const user = await this.userRepository.findOne({ where: { email } });
  
      if (!user) { throwHttpException(
          HttpStatus.UNAUTHORIZED, 'Email not found'
        )
      ;}

      const passwordMatch = await compare(password ?? '', user?.password ?? '');

      if (!passwordMatch) {
        throwHttpException(
          HttpStatus.UNAUTHORIZED, 'Password does not match'
        );
      }
  
      const payload = {id: user?.id  ,email: user?.email, isAdmin: user?.isAdmin};
      const access_token = await this.jwtService.signAsync(payload);

      return {token: access_token};
  }

  async register(registerDto: RegisterDto) {
    const { name, lastName, password, email, birthdate } = registerDto;

    if (!name) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Name is required');
    }

    if (!lastName) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Last name is required');
    }

    if (!email) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email || '')) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Invalid email');
    }
    
    if (!password) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Password is required');
    }
    if (password !== undefined && password.length < 8) {
      throwHttpException(HttpStatus.BAD_REQUEST, 
        'Password must be at least 8 characters long');
    }

    const birthdateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
    if (!birthdateRegex.test(birthdate || '')) {
      throwHttpException(HttpStatus.BAD_REQUEST, 
        'Invalid birthdate format, should be dd/MM/yyyy');
    }

    const [day, month, year] = (birthdate ?? '').split('/');
    const birthDateObj = new Date(`${year}-${month}-${day}`);
    if (birthDateObj.toString() === 'Invalid Date') {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Invalid birthdate');
    }

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
    if (!token) {
        throwHttpException(HttpStatus.BAD_REQUEST, 'Token is required');
    }
    const payload = this.jwtService.decode(token.replace('Bearer ', ''));
    const id: number | any = payload['id'];
    const user = await this.userRepository.findOneBy({id});

    if (!user) {
        return {
            data: null,
            message: 'User not found',
            success: false
        };
    }

    if (user.isAdmin === 3) {
        return {
            data: null,
            message: 'User not authorized',
            success: false
        };
    }

    const workers = await this.userRepository.find({
      where: { 
        isAdmin: In([2, 3])
      },
      select: [
        'id', 
        'name', 
        'lastName', 
        'email', 
        'birthdate', 
        'isAdmin'] 
    });

    return {
        data: workers,
        message: 'Workers found',
        success: true
    };
}

  async addAdmin(token: string, id: number) {
    if (!token) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Token is required');
    }
    if (!id) {
      throwHttpException(HttpStatus.BAD_REQUEST, 'Id is required');
    }
    const payload = this.jwtService.decode(token.replace('Bearer ', ''));
    const idAdmin: number | any = payload['id'];
    const admin = await this.userRepository.findOneBy({id: idAdmin});
    if (!admin) {
      return {
        data: null,
        message: 'User not found',
        success: false
      };
    }
    if (admin.isAdmin !== 1) {
      return {
        data: null,
        message: 'User not authorized',
        success: false
      };
    }

    const newAdmin = await this.userRepository.findOneBy({id});
    if (!newAdmin) {
      return {
        data: null,
        message: 'Worker not found',
        success: false
      };
    }
    const updateAdmin = {
      ...newAdmin,
      isAdmin: 1
    };

    const update: User = await this.userRepository.save(updateAdmin);

    return {
      data: update,
      message: 'User updated',
      success: true
    };
  }
}
