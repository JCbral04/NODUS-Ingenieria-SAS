import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  ALLOWED_MIME_TYPES,
  DocumentsService,
  MAX_FILE_SIZE,
} from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ADVISORY', 'MIPYME', 'CONSULTOR')
@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('cases/:id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException('Tipo de archivo no permitido'),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  upload(
    @Req() req: { user: { sub: number; role: string } },
    @Param('id', ParseIntPipe) caseId: number,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Debes adjuntar un archivo');

    return this.documents.upload(
      { userId: req.user.sub, role: req.user.role },
      caseId,
      dto,
      file,
    );
  }

  @Get('cases/:id/documents')
  list(
    @Req() req: { user: { sub: number; role: string } },
    @Param('id', ParseIntPipe) caseId: number,
  ) {
    return this.documents.listForCase(
      { userId: req.user.sub, role: req.user.role },
      caseId,
    );
  }

  @Get('documents/:id/download')
  async download(
    @Req() req: { user: { sub: number; role: string } },
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const document = await this.documents.prepareDownload(
      { userId: req.user.sub, role: req.user.role },
      id,
    );

    if (document.mimeType) {
      res.setHeader('Content-Type', document.mimeType);
    }

    res.download(document.path, document.name);
  }
}