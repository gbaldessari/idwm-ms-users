import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { CreatePasswordResetTokenDto } from './dto/create-password-reset-token.dto';
import { ApiTags, ApiBody, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/http/auth/auth.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    type: RegisterDto,
    description: 'Data for registering a new user',
  })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('/login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto, description: 'Data for logging in a user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('/create-password-reset-token')
  @ApiOperation({ summary: 'Create password reset token' })
  @ApiBody({
    type: CreatePasswordResetTokenDto,
    description: 'Email for which to create a password reset token',
  })
  @ApiResponse({ status: 200, description: 'Token creation successful' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async createPasswordResetToken(
    @Body() createPasswordResetTokenDto: CreatePasswordResetTokenDto,
  ) {
    await this.authService.createPasswordResetToken(
      createPasswordResetTokenDto,
    );

    return { message: 'Password reset email sent' };
  }

  @Post('/password-reset')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiBody({
    type: ResetPasswordDto,
    description: 'Data for resetting a user password',
  })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);

    return { message: 'Password reset successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/verify-token')
  @ApiOperation({ summary: 'Verify access token' })
  @ApiBody({
    type: String,
    description: 'Access token to verify',
  })
  @ApiResponse({ status: 201, description: 'Token verified'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  async verifyToken(@Body('token') token: string) {
    return this.authService.verifyToken(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/get-users')
  @ApiOperation({ summary: 'Return all users' })
  @ApiBody({
    description: 'Return all users',
  })
  @ApiResponse({ status: 201, description: 'Users returned'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getUsers() {
    return this.authService.findAll();
  }

}
