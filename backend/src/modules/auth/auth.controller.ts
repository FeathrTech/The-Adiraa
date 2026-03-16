import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  // No guard needed — authService.logout extracts user from the token itself
  @Post('logout')
  async logout(@Req() req: any) {
    const authHeader = req.headers?.authorization ?? '';
    const rawToken = authHeader.replace('Bearer ', '').trim();
    await this.authService.logout(rawToken);
    return { success: true };
  }

  @Public()
  @Post('register-tenant')
  async registerTenant(
    @Body() body: { companyName: string; name: string; mobile: string; password: string },
  ) {
    return this.authService.registerTenant(body);
  }
}