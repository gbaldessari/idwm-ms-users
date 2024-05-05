import { IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePasswordResetTokenDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user who wants to reset their password',
  })
  @IsEmail()
  @IsNotEmpty()
  email?: string;
}
