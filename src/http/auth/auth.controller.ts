import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Get, 
  Request, 
  Put, 
  Headers 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiBody, 
  ApiResponse, 
  ApiOperation, 
  ApiHeader 
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { 
  CreatePasswordResetTokenDto 
} from './dto/create-password-reset-token.dto';
import { JwtAuthGuard } from 'src/http/auth/guard/auth.guard';
import { UpdateDto } from './dto/update.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

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
    try {
      return this.authService.register(registerDto);
    } catch (e) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  @Post('/login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto, description: 'Data for logging in a user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    try {
      return this.authService.login(loginDto);
    } catch (e) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }
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
    try {
      return await this.authService.createPasswordResetToken(
        createPasswordResetTokenDto,
      );
    } catch (e) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }
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
    try {
      await this.authService.resetPassword(resetPasswordDto);
    } catch (e) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/verify-token')
  @ApiOperation({ summary: 'Verify access token' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  @ApiResponse({ status: 200, description: 'Token verified' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async verifyToken(@Request() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('/update-user')
  @ApiOperation({ summary: 'Update user data' })
  @ApiBody({
    type: UpdateDto,
    description: 'Optional data to update user data',
  })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateUser(
    @Headers('Authorization') token: string,
    @Body() updateDto: UpdateDto,
  ) {
    try {
      return this.authService.updateUser(token, updateDto);
    } catch (e) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('/update-password')
  @ApiOperation({ summary: 'Update user password' })
  @ApiBody({
    type: UpdatePasswordDto,
    description: 'Data to update user password',
  })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  @ApiResponse({ status: 200, description: 'Password updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updatePassword(
    @Headers('Authorization') token: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    try {
      return this.authService.updatePassword(
        token, 
        updatePasswordDto
      );
    } catch (e) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/get-user')
  @ApiOperation({ summary: 'Return user' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  @ApiResponse({ status: 200, description: 'User returned' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getUser(@Headers('Authorization') token: string) {
    try {
      return this.authService.findOne(token);
    } catch (e) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/get-workers')
  @ApiOperation({ summary: 'Return all workers' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  @ApiResponse({ status: 200, description: 'Workers returned' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getWorkers(@Headers('Authorization') token: string) {
    try {
      const result = await this.authService.findWorkers(token);
      return result;
    } catch (e) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/add-admin')
  @ApiOperation({ summary: 'Add admin' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  @ApiBody({
    type: Number,
    description: 'ID of the user to be added as admin',
  })
  @ApiResponse({ status: 200, description: 'Admin added' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async addAdmin(
    @Headers('Authorization') token: string, 
    @Body() id: number
  ) {
    try {
      return this.authService.addAdmin(token, id);
    } catch (e) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }
}
