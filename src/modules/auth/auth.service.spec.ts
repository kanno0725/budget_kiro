import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      const hashedPassword = 'hashedPassword';
      const createdUser = {
        id: '1',
        email: registerDto.email,
        name: registerDto.name,
        createdAt: new Date(),
      };
      const accessToken = 'jwt-token';

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(accessToken);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        success: true,
        data: {
          user: createdUser,
          accessToken,
        },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const existingUser = { id: '1', email: registerDto.email };
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = 'hashedPassword';

    it('should return user without password if credentials are valid', async () => {
      const user = {
        id: '1',
        email,
        password: hashedPassword,
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser(email, password);

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });

    it('should return null if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const user = {
        id: '1',
        email,
        password: hashedPassword,
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const user = {
        id: '1',
        email: loginDto.email,
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const accessToken = 'jwt-token';

      jest.spyOn(service, 'validateUser').mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
          },
          accessToken,
        },
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});