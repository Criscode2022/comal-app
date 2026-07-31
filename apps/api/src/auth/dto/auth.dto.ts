import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['COOK', 'OPERATOR'])
  role?: 'COOK' | 'OPERATOR';
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
