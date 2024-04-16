import { Body, HttpStatus, Injectable } from '@nestjs/common';
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
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

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

  async createPasswordResetToken(
    @Body() createPasswordResetTokenDto: CreatePasswordResetTokenDto,
  ): Promise<void> {
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
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour from now

    try {
      await this.userRepository.save(user);
    } catch (error) {
      throwHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Error saving user');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      auth: {
        user: 'postmaster@sandboxe9d7672a884f4c6bbd740cd8dab7e513.mailgun.org',
        pass: '291e6b1289c99859dab46ccb22bdd38a-19806d14-f5a67df8',
      },
    });

    const mailOptions = {
      to: user.email,
      from: 'postmaster@sandboxe9d7672a884f4c6bbd740cd8dab7e513.mailgun.org',
      subject: 'Node.js Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      http://localhost:3000/reset/${token}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    try {
      if (!mailOptions.to) {
        throw new Error('Recipient email is not defined');
      }
      await this.emailService.sendText(
        mailOptions.to,
        mailOptions.subject,
        mailOptions.text,
      );
    } catch (error) {
      if (error.code === 'ECONNECTION') {
        throwHttpException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Error de conexión al servidor SMTP',
        );
      } else if (error.code === 'EAUTH') {
        throwHttpException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Error de autenticación SMTP',
        );
      } else {
        throwHttpException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Error enviando el correo electrónico',
        );
      }
      return;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
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
        user.password = await hash(resetPasswordDto.newPassword, 10);
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
    let user: User | null;
    try {
      user = await this.userRepository.findOne({
        where: { email: loginDto?.email },
      });
    } catch (error) {
      throwHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Database error');
      return;
    }

    if (!user) {
      throwHttpException(HttpStatus.UNAUTHORIZED, 'Correo no encontrado');
      return;
    }

    if (user.password === undefined) {
      throwHttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'La contraseña no está definida',
      );
      return;
    }

    try {
      const passwordMatch = await compare(loginDto.password, user.password);
      if (!passwordMatch) {
        throwHttpException(HttpStatus.UNAUTHORIZED, 'contraseña incorrecta');
        return;
      }
    } catch (error) {
      throwHttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Error al comparar contraseñas',
      );
      return;
    }

    const payload = { email: user.email, sub: user.id };
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

    // Encripta la contraseña
    const hashedPassword = await hash(registerDto.password, 10);
    registerDto.password = hashedPassword;

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
}
