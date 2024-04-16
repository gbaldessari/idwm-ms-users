import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: 'TuClaveSecreta', // Cambia esto por tu propia clave secreta
      signOptions: { expiresIn: '12h' }, // Opcional: especifica el tiempo de expiración del token
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
