import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsString()
  @IsNotEmpty()
  birthdate?: string;
}
