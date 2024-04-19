import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, EntityManager, Repository } from 'typeorm';
import { throwHttpException } from 'src/utils/exception';
import { I18nService } from 'nestjs-i18n';
import { LoginAuthDto } from './dto/login.dto';
import { hash, compare } from 'bcrypt';
import { JwtService} from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {

  constructor(
    private readonly connection: Connection,
    private readonly i18n: I18nService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

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

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
          const { password } = registerDto;
          const planeToHash = await hash(password ?? '', 10);
          registerDto = {...registerDto, password: planeToHash};

          console.log(registerDto.name)
          console.log(registerDto.password)
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

  async login(loginAuthDto:LoginAuthDto){
    const { email, password } = loginAuthDto;
    const findUser = await this.userRepository.findOne({where: { email }});

    if (!findUser) throw new HttpException('USER_NOT_FOUND',404);
    const passwordMatch = await compare(password ?? '', findUser.password ?? '');
    if (!passwordMatch) throw new HttpException('PASSWORD_INCORRECT',403);

    const payload: JwtPayload = {
      id: findUser.id as number, 
      email: findUser.email as string, 
      active: findUser.active as boolean};
      
    const token = this.jwtService.sign(payload);
    const data = {
      user: findUser,
      token,
    };

    return data;
  };

}
