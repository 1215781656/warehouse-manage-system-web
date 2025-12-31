import {
  Controller,
  Post,
  Param,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  Delete,
  Get,
  Res,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import type { Express } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AttachmentsService } from './attachments.service';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog } from '../../system/operation-log.entity';

@ApiTags('finance-attachments')
@Controller('finance')
export class AttachmentsController {
  constructor(
    private readonly svc: AttachmentsService,
    @InjectRepository(OperationLog)
    private readonly logRepo: Repository<OperationLog>,
  ) {}

  @Post('receivable/:id/attachments/tax-invoice')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'string', format: 'binary' } },
    },
  })
  async uploadTaxForReceivable(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || !files.length) throw new BadRequestException('未选择文件');
    const oversized = files.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) throw new BadRequestException('单文件大小不能超过10MB');
    const list = await this.svc.saveTaxFiles(
      id,
      files.map((f) => ({
        buffer: f.buffer,
        mimetype: f.mimetype,
        originalname: f.originalname,
      })),
    );
    await this.logRepo.save(
      this.logRepo.create({
        module: 'file',
        action: 'upload',
        refId: id,
        operator: 'system',
        detail: JSON.stringify({ type: 'tax', count: files.length }),
      }),
    );
    const base = process.env.FILE_BASE || '';
    return list.map((x) => ({
      ...x,
      path: base ? `${base}${x.path}` : x.path,
    }));
  }

  @Post('inbound/:id/attachments/tax-invoice')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'string', format: 'binary' } },
    },
  })
  async uploadTaxForInbound(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || !files.length) throw new BadRequestException('未选择文件');
    const oversized = files.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) throw new BadRequestException('单文件大小不能超过10MB');
    const list = await this.svc.saveTaxFiles(
      id,
      files.map((f) => ({
        buffer: f.buffer,
        mimetype: f.mimetype,
        originalname: f.originalname,
      })),
    );
    await this.logRepo.save(
      this.logRepo.create({
        module: 'file',
        action: 'upload',
        refId: id,
        operator: 'system',
        detail: JSON.stringify({ type: 'tax', count: files.length, category: 'inbound' }),
      }),
    );
    const base = process.env.FILE_BASE || '';
    return list.map((x) => ({
      ...x,
      path: base ? `${base}${x.path}` : x.path,
    }));
  }

  @Post('outbound/:id/attachments/tax-invoice')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'string', format: 'binary' } },
    },
  })
  async uploadTaxForOutbound(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || !files.length) throw new BadRequestException('未选择文件');
    const oversized = files.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) throw new BadRequestException('单文件大小不能超过10MB');
    const list = await this.svc.saveTaxFiles(
      id,
      files.map((f) => ({
        buffer: f.buffer,
        mimetype: f.mimetype,
        originalname: f.originalname,
      })),
    );
    await this.logRepo.save(
      this.logRepo.create({
        module: 'file',
        action: 'upload',
        refId: id,
        operator: 'system',
        detail: JSON.stringify({ type: 'tax', count: files.length, category: 'outbound' }),
      }),
    );
    const base = process.env.FILE_BASE || '';
    return list.map((x) => ({
      ...x,
      path: base ? `${base}${x.path}` : x.path,
    }));
  }

  @Post('receivable/:id/attachments/other')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 20))
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'string', format: 'binary' } },
    },
  })
  async uploadOtherForReceivable(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || !files.length) throw new BadRequestException('未选择文件');
    const oversized = files.find((f) => f.size > 20 * 1024 * 1024);
    if (oversized) throw new BadRequestException('单文件大小不能超过20MB');
    const list = await this.svc.saveOtherFiles(
      id,
      files.map((f) => ({
        buffer: f.buffer,
        mimetype: f.mimetype,
        originalname: f.originalname,
      })),
    );
    await this.logRepo.save(
      this.logRepo.create({
        module: 'file',
        action: 'upload',
        refId: id,
        operator: 'system',
        detail: JSON.stringify({ type: 'other', count: files.length }),
      }),
    );
    const base = process.env.FILE_BASE || '';
    return list.map((x) => ({
      ...x,
      path: base ? `${base}${x.path}` : x.path,
    }));
  }

  @Post('payable/:id/attachments/tax-invoice')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'string', format: 'binary' } },
    },
  })
  async uploadTaxForPayable(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || !files.length) throw new BadRequestException('未选择文件');
    const oversized = files.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) throw new BadRequestException('单文件大小不能超过10MB');
    const list = await this.svc.saveTaxFiles(
      id,
      files.map((f) => ({
        buffer: f.buffer,
        mimetype: f.mimetype,
        originalname: f.originalname,
      })),
    );
    await this.logRepo.save(
      this.logRepo.create({
        module: 'file',
        action: 'upload',
        refId: id,
        operator: 'system',
        detail: JSON.stringify({ type: 'tax', count: files.length }),
      }),
    );
    const base = process.env.FILE_BASE || '';
    return list.map((x) => ({
      ...x,
      path: base ? `${base}${x.path}` : x.path,
    }));
  }

  @Post('payable/:id/attachments/other')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 20))
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'string', format: 'binary' } },
    },
  })
  async uploadOtherForPayable(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || !files.length) throw new BadRequestException('未选择文件');
    const oversized = files.find((f) => f.size > 20 * 1024 * 1024);
    if (oversized) throw new BadRequestException('单文件大小不能超过20MB');
    const list = await this.svc.saveOtherFiles(
      id,
      files.map((f) => ({
        buffer: f.buffer,
        mimetype: f.mimetype,
        originalname: f.originalname,
      })),
    );
    await this.logRepo.save(
      this.logRepo.create({
        module: 'file',
        action: 'upload',
        refId: id,
        operator: 'system',
        detail: JSON.stringify({ type: 'other', count: files.length }),
      }),
    );
    const base = process.env.FILE_BASE || '';
    return list.map((x) => ({
      ...x,
      path: base ? `${base}${x.path}` : x.path,
    }));
  }

  @Delete('attachments/tax/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteTax(@Param('id') id: string) {
    const item = await this.svc.deleteTaxById(id);
    if (item)
      await this.logRepo.save(
        this.logRepo.create({
          module: 'file',
          action: 'delete',
          refId: item.refId,
          operator: 'system',
          detail: JSON.stringify({ type: 'tax', id }),
        }),
      );
    return { success: true };
  }

  @Delete('attachments/other/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteOther(@Param('id') id: string) {
    const item = await this.svc.deleteOtherById(id);
    if (item)
      await this.logRepo.save(
        this.logRepo.create({
          module: 'file',
          action: 'delete',
          refId: item.refId,
          operator: 'system',
          detail: JSON.stringify({ type: 'other', id }),
        }),
      );
    return { success: true };
  }

  @Get('attachments/tax/:file/download')
  async downloadTax(@Param('file') file: string, @Res() res: Response) {
    const item = await this.svc.getTaxByFileName(file);
    if (!item) throw new BadRequestException('文件不存在');
    const fs = await import('fs');
    const path = require('path').join(
      process.cwd(),
      'server_uploads',
      'finance',
      'tax',
      file,
    );
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${file}"`);
    const stream = fs.createReadStream(path);
    stream.pipe(res);
  }

  @Get('attachments/other/:file/download')
  async downloadOther(@Param('file') file: string, @Res() res: Response) {
    const item = await this.svc.getOtherByFileName(file);
    if (!item) throw new BadRequestException('文件不存在');
    const fs = await import('fs');
    const path = require('path').join(
      process.cwd(),
      'server_uploads',
      'finance',
      'other',
      file,
    );
    res.setHeader('Content-Type', item.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(item.originalName)}"`,
    );
    const stream = fs.createReadStream(path);
    stream.pipe(res);
  }
}
