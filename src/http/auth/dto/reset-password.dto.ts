import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: '1234567890abcdef',
    description: 'Token de restablecimiento de contraseña',
  })
  @IsString()
  @IsNotEmpty()
  token?: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'Nueva contraseña del usuario',
  })
  @IsString()
  @IsNotEmpty()
  newPassword?: string;
}
