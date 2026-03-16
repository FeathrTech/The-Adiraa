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
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { UsersService } from './users.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './user.entity';

import { uploadToR2 } from '../../common/utils/r2.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me/site')
  async getMySite(@CurrentUser() user: User) {
    return this.usersService.getUserSite(user);
  }

  // ============================================
  // SAVE PUSH TOKEN
  // ============================================

  @Patch('me/push-token')
  async savePushToken(
    @CurrentUser() user: User,
    @Body('pushToken') pushToken: string,
  ) {
    return this.usersService.updatePushToken(user.id, pushToken);
  }

  /*
  ============================================
  GET ALL USERS
  ============================================
  */

  @Get()
  @RequirePermission('admin.view')
  async findAll(@CurrentUser() user: User) {
    return this.usersService.findAll(user);
  }

  /*
  ============================================
  GET SINGLE USER
  ============================================
  */

  @Get(':id')
  @RequirePermission('admin.view')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.usersService.findOne(id, user);
  }

  /*
  ============================================
  CREATE USER (WITH FILE UPLOAD)
  ============================================
  */

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
        try {
          body.roleIds = JSON.parse(body.roleIds);
        } catch {
          body.roleIds = [body.roleIds];
        }
      }

      if (!Array.isArray(body.roleIds)) {
        body.roleIds = [body.roleIds];
      }
    }

    if (files?.profilePhoto?.length) {
      const file = files.profilePhoto[0];
      profilePhotoUrl = await uploadToR2(
        file.buffer,
        'profile',
        file.mimetype,
      );
    }

    if (files?.idProof?.length) {
      const file = files.idProof[0];
      idProofUrl = await uploadToR2(
        file.buffer,
        'documents',
        file.mimetype,
      );
    }

    return this.usersService.createUser(
      {
        ...body,
        profilePhotoUrl,
        idProofUrl,
      },
      user,
    );
  }

  /*
  ============================================
  UPDATE USER (OPTIONAL FILE UPDATE)
  ============================================
  */

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
        try {
          body.roleIds = JSON.parse(body.roleIds);
        } catch {
          body.roleIds = [body.roleIds];
        }
      }

      if (!Array.isArray(body.roleIds)) {
        body.roleIds = [body.roleIds];
      }
    }

    if (files?.profilePhoto?.length) {
      const file = files.profilePhoto[0];
      profilePhotoUrl = await uploadToR2(
        file.buffer,
        'profile',
        file.mimetype,
      );
    }

    if (files?.idProof?.length) {
      const file = files.idProof[0];
      idProofUrl = await uploadToR2(
        file.buffer,
        'documents',
        file.mimetype,
      );
    }

    return this.usersService.updateUser(
      id,
      {
        ...body,
        profilePhotoUrl,
        idProofUrl,
      },
      user,
    );
  }

  /*
  ============================================
  DEACTIVATE USER
  ============================================
  */

  @Delete(':id')
  @RequirePermission('admin.delete')
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.usersService.deactivateUser(id, user);
  }
}