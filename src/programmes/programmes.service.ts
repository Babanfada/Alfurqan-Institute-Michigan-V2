import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateProgrammeDto,
  UpdateProgrammeDto,
  UpdateProgrammeOutcomesDto,
} from './dto';
import cloudinary from 'src/utils/cloudinary.config';
import * as fs from 'fs';
@Injectable()
export class ProgrammesService {
  constructor(private prisma: PrismaService) {}

  async createProgramme(data: CreateProgrammeDto) {
    // 1 — create main programme
    const programme = await this.prisma.programmes.create({
      data,
    });

    // 2 — auto-create default images
    await this.prisma.programmesimages.create({
      data: {
        programme_id: programme.programme_id,
        image0: '/uploads/default.jpeg',
        image0_public_id: 'default_public_id',
        image1: '/uploads/default.jpeg',
        image1_public_id: 'default_public_id',
        image2: '/uploads/default.jpeg',
        image2_public_id: 'default_public_id',
      },
    });

    // 3 — auto-create default outcomes
    await this.prisma.programmeoutcomes.create({
      data: {
        programme_id: programme.programme_id,
        outcome1: 'placeholder benefit 1',
        outcome2: 'placeholder benefit 2',
        outcome3: 'placeholder benefit 3',
      },
    });

    return {
      message: 'Programme created successfully',
      programme,
    };
  }

  // update programme
  async updateProgramme(programmeId: number, data: UpdateProgrammeDto) {
    const programme = await this.prisma.programmes.findUnique({
      where: { programme_id: programmeId },
    });

    if (!programme) {
      throw new NotFoundException(`No programme found with id ${programmeId}`);
    }

    await this.prisma.programmes.update({
      where: { programme_id: programmeId },
      data,
    });

    return { msg: 'programme updated successfully' };
  }

  // update programme outcomes
  async updateProgrammeOut(
    programmeId: number,
    data: UpdateProgrammeOutcomesDto,
  ) {
    const programme = await this.prisma.programmes.findUnique({
      where: { programme_id: programmeId },
      include: {
        programmeoutcomes: true, // fetch all related outcomes
      },
    });

    if (!programme) {
      throw new NotFoundException(`No programme found with id ${programmeId}`);
    }

    await this.prisma.programmeoutcomes.update({
      where: { outcome_id: programmeId },
      data,
    });

    return { msg: 'programme outcomes updated successfully' };
  }

  //upload programmes images
  async uploadProgrammeImages(
    programmeId: number,
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Please upload at least one image');
    }

    // Fetch existing images record
    const imageRecord = await this.prisma.programmesimages.findFirst({
      where: { img_id: programmeId },
    });

    if (!imageRecord) {
      throw new NotFoundException(
        `No images record found for programme ID ${programmeId}`,
      );
    }

    const uploadedImages = await Promise.all(
      files.map(async (file, i) => {
        if (!file) return null;

        if (!file.mimetype || !file.mimetype.startsWith('image')) {
          return null;
        }

        const maxSize = 4000 * 6000; // 12MB
        if (file.size > maxSize) return null;

        // Delete existing Cloudinary image if exists
        const currentPublicId = imageRecord[`image${i}_public_id`];
        if (currentPublicId) {
          await cloudinary.uploader.destroy(currentPublicId);
        }

        // Upload new image
        const result = await cloudinary.uploader.upload(file.path, {
          use_filename: true,
          folder: 'AIM programmes Images',
        });

        // Update DB record
        imageRecord[`image${i}`] = result.secure_url;
        imageRecord[`image${i}_public_id`] = result.public_id;
        await this.prisma.programmesimages.update({
          where: { img_id: imageRecord.img_id },
          data: {
            [`image${i}`]: result.secure_url,
            [`image${i}_public_id`]: result.public_id,
          },
        });

        // Delete temp file
        fs.unlinkSync(file.path);

        return {
          id: result.public_id,
          src: result.secure_url,
        };
      }),
    );

    // Filter out skipped files
    const validUploadedImages = uploadedImages.filter(Boolean);

    return { images: validUploadedImages };
  }

  //remove programme
  async removeProgramme(programmeId: number) {
    // 1 — check if programme exists
    const programme = await this.prisma.programmes.findUnique({
      where: { programme_id: programmeId },
      include: { programmesimages: true, programmeoutcomes: true },
    });

    if (!programme) {
      throw new NotFoundException(`No programme found with id ${programmeId}`);
    }

    // 2 — delete programme images first (if using Cloudinary, also delete from cloud)
    if (programme.programmesimages.length) {
      for (const img of programme.programmesimages) {
        if (img.image0_public_id)
          await cloudinary.uploader.destroy(img.image0_public_id);
        if (img.image1_public_id)
          await cloudinary.uploader.destroy(img.image1_public_id);
        if (img.image2_public_id)
          await cloudinary.uploader.destroy(img.image2_public_id);
      }
      await this.prisma.programmesimages.deleteMany({
        where: { img_id: programmeId },
      });
    }

    // 3 — delete programme outcomes
    await this.prisma.programmeoutcomes.deleteMany({
      where: { outcome_id: programmeId },
    });

    // 4 — delete the main programme
    await this.prisma.programmes.delete({
      where: { programme_id: programmeId },
    });

    return { msg: `Programme with id ${programmeId} deleted successfully` };
  }

  // Get all programmes with pagination and optional title filter
  async getAllProgrammes(query: any) {
    const { title, page = 1, limit = 6 } = query;

    const filters: any = {};
    if (title) {
      filters.title = {
        contains: title,
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const totalProgrammes = await this.prisma.programmes.count({
      where: filters,
    });

    const programmes = await this.prisma.programmes.findMany({
      where: filters,
      skip,
      take: Number(limit),
      include: {
        programmesimages: true,
        programmeoutcomes: true,
      },
    });

    const numOfPages = Math.ceil(totalProgrammes / Number(limit));

    return {
      programmes,
      numOfPages,
      totalProgrammes,
      currentCount: programmes.length,
    };
  }
  //get programmes title only
  async getAllProgrammesTitle() {
    const programmes = await this.prisma.programmes.findMany({
      select: {
        title: true,
      },
    });
    return {
      programmes,
    };
  }
  // Get single programme by ID
  async getSingleProgramme(programmeId: number) {
    const programme = await this.prisma.programmes.findUnique({
      where: { programme_id: programmeId },
      include: {
        programmesimages: true,
        programmeoutcomes: true,
      },
    });

    if (!programme) {
      throw new NotFoundException(
        `There is no programme with an id of ${programmeId}`,
      );
    }

    return programme;
  }
}
