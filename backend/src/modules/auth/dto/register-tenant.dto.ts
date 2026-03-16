import { IsString, MinLength } from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  companyName: string;

  @IsString()
  name: string;

  @IsString()
  mobile: string;

  @IsString()
  @MinLength(6)
  password: string;
}
