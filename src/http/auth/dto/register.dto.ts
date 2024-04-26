import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'El nombre del usuario', example: 'John' })
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ description: 'El apellido del usuario', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiProperty({
    description: 'El correo electrónico del usuario',
    example: 'john@example.com',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiProperty({
    description: 'La contraseña del usuario',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password?: string;

  @ApiProperty({
    description: 'La fecha de nacimiento del usuario',
    example: '1990-01-01',
  })
  @IsString()
  @IsNotEmpty()
  birthdate?: string;
}
