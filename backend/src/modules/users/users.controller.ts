import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Body,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';

import { UsersService } from './users.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './user.entity';
import { uploadToR2 } from '../../common/utils/r2.service';

function parseBoolean(value: any): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // ============================================================
  // GET MY SITE
  // ============================================================
  @Get('me/site')
  async getMySite(@CurrentUser() user: User) {
    return this.usersService.getUserSite(user);
  }

  // ============================================================
  // SAVE PUSH TOKEN
  // ============================================================
  @Patch('me/push-token')
  async savePushToken(
    @CurrentUser() user: User,
    @Body('pushToken') pushToken: string,
  ) {
    return this.usersService.updatePushToken(user.id, pushToken);
  }

  // ============================================================
  // SELF UPLOAD — PROFILE PHOTO
  // PATCH /users/me/profile-photo
  // ⚠️ Must stay ABOVE @Patch(':id')
  // ============================================================
  @Patch('me/profile-photo')
  @UseInterceptors(FileInterceptor('profilePhoto'))
  async uploadOwnProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    console.log('=== me/profile-photo HIT ===');
    console.log('User:', user?.id, user?.name);
    console.log('File received:', file ? `${file.originalname} (${file.size} bytes)` : 'NO FILE');

    if (!file) throw new BadRequestException('No file provided');

    const url = await uploadToR2(file.buffer, 'profile', file.mimetype);
    console.log('R2 URL:', url);

    return this.usersService.updateOwnProfilePhoto(user.id, url, user);
  }

  // ============================================================
  // SELF UPLOAD — ID PROOF
  // PATCH /users/me/id-proof
  // ⚠️ Must stay ABOVE @Patch(':id')
  // ============================================================
  @Patch('me/id-proof')
  @UseInterceptors(FileInterceptor('idProof'))
  async uploadOwnIdProof(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    console.log('=== me/id-proof HIT ===');
    console.log('User:', user?.id, user?.name);
    console.log('File received:', file ? `${file.originalname} (${file.size} bytes)` : 'NO FILE');

    if (!file) throw new BadRequestException('No file provided');

    const url = await uploadToR2(file.buffer, 'documents', file.mimetype);
    console.log('R2 URL:', url);

    return this.usersService.updateOwnIdProof(user.id, url, user);
  }


  // ============================================================
  // GET ALL USERS
  // ============================================================
  @Get()
  @RequirePermission('admin.view')
  async findAll(@CurrentUser() user: User) {
    return this.usersService.findAll(user);
  }

  // ============================================================
  // GET SINGLE USER
  // ============================================================
  @Get(':id')
  @RequirePermission('admin.view')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.usersService.findOne(id, user);
  }

  // ============================================================
  // CREATE USER
  // ============================================================
  @Post()
  @RequirePermission('admin.create')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profilePhoto', maxCount: 1 },
      { name: 'idProof', maxCount: 1 },
    ]),
  )
  async create(
    @UploadedFiles()
    files: {
      profilePhoto?: Express.Multer.File[];
      idProof?: Express.Multer.File[];
    },
    @Body() body: any,
    @CurrentUser() user: User,
  ) {
    let profilePhotoUrl: string | undefined;
    let idProofUrl: string | undefined;

    if (body.roleIds) {
      if (typeof body.roleIds === 'string') {
        try { body.roleIds = JSON.parse(body.roleIds); }
        catch { body.roleIds = [body.roleIds]; }
      }
      if (!Array.isArray(body.roleIds)) body.roleIds = [body.roleIds];
    }

    if (files?.profilePhoto?.length) {
      const file = files.profilePhoto[0];
      profilePhotoUrl = await uploadToR2(file.buffer, 'profile', file.mimetype);
    }

    if (files?.idProof?.length) {
      const file = files.idProof[0];
      idProofUrl = await uploadToR2(file.buffer, 'documents', file.mimetype);
    }

    return this.usersService.createUser(
      {
        ...body,
        profilePhotoUrl,
        idProofUrl,
        allowSelfPhotoUpload: parseBoolean(body.allowSelfPhotoUpload) ?? false,
        allowSelfIdUpload: parseBoolean(body.allowSelfIdUpload) ?? false,
      },
      user,
    );
  }

  // ============================================================
  // UPDATE USER
  // ============================================================
  @Patch(':id')
  @RequirePermission('admin.edit')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profilePhoto', maxCount: 1 },
      { name: 'idProof', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      profilePhoto?: Express.Multer.File[];
      idProof?: Express.Multer.File[];
    },
    @Body() body: any,
    @CurrentUser() user: User,
  ) {
    let profilePhotoUrl: string | undefined;
    let idProofUrl: string | undefined;

    if (body.roleIds) {
      if (typeof body.roleIds === 'string') {
        try { body.roleIds = JSON.parse(body.roleIds); }
        catch { body.roleIds = [body.roleIds]; }
      }
      if (!Array.isArray(body.roleIds)) body.roleIds = [body.roleIds];
    }

    if (files?.profilePhoto?.length) {
      const file = files.profilePhoto[0];
      profilePhotoUrl = await uploadToR2(file.buffer, 'profile', file.mimetype);
    }

    if (files?.idProof?.length) {
      const file = files.idProof[0];
      idProofUrl = await uploadToR2(file.buffer, 'documents', file.mimetype);
    }

    const payload: any = { ...body };

    if (profilePhotoUrl !== undefined) payload.profilePhotoUrl = profilePhotoUrl;
    if (idProofUrl !== undefined) payload.idProofUrl = idProofUrl;

    const parsedSelfPhoto = parseBoolean(body.allowSelfPhotoUpload);
    const parsedSelfId = parseBoolean(body.allowSelfIdUpload);

    if (parsedSelfPhoto !== undefined) payload.allowSelfPhotoUpload = parsedSelfPhoto;
    if (parsedSelfId !== undefined) payload.allowSelfIdUpload = parsedSelfId;

    return this.usersService.updateUser(id, payload, user);
  }

  // ============================================================
  // DEACTIVATE USER
  // ============================================================
  @Delete(':id')
  @RequirePermission('admin.delete')
  async deactivate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.usersService.deactivateUser(id, user);
  }

  // ============================================================
  // PERMANENT DELETE
  // ============================================================
  @Delete(':id/permanent')
  @RequirePermission('admin.delete')
  async permanentDelete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.usersService.permanentDeleteUser(id, user);
  }
}