import { Body, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
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

  async createPasswordResetToken(
    @Body() createPasswordResetTokenDto: CreatePasswordResetTokenDto,
  ) {
    let user;
    try {
      user = await this.userRepository.findOne({
        where: { email: createPasswordResetTokenDto.email },
      });
    } catch (error) {
      throwHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Database error');
      return;
    }

    if (!user) {
      throwHttpException(HttpStatus.NOT_FOUND, 'User not found');
      return;
    }

    const token = randomBytes(20).toString('hex');
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
    await this.emailService.sendUserRecovery(user);
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
  
      const payload = {id: user?.id  ,email: user?.email};
      const token = this.jwtService.sign(payload);

      return { access_token: token };

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

  async verifyToken(token: string) {
    console.log(process.env.SECRET_JWT);
    console.log(token)
    try {
      const payload = await this.jwtService.verify(token);
      return payload;
    } catch (e) {
      throw new UnauthorizedException('INVALID_TOKEN');
    }
  }

}
