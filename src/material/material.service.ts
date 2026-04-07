import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/material.entity';
import { Pagination } from 'src/core/decorators/pagination-params.decorator';
import { Sorting } from 'src/core/decorators/sorting-params.decorator';
import { Filtering } from 'src/core/decorators/filtering-params.decorator';
import { Including } from 'src/core/decorators/including-params.decorator';
import { getOrder, getWhere, getRelations } from 'src/core/helpers';
import { ErrorResponse, SuccessResponse } from 'src/core/responses/base.responses';
import { CommonResponse, PaginationResponseInterface } from 'src/core/types/response';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  async create(createMaterialDto: CreateMaterialDto): Promise<CommonResponse<Material>> {
    const material = this.materialRepository.create(createMaterialDto);
    const savedMaterial = await this.materialRepository.save(material);
    return new SuccessResponse(savedMaterial, HttpStatus.CREATED);
  }

  async findAll(
    pagination: Pagination,
    sorts: Sorting[] | null,
    filters: Filtering[] | null,
    includes: Including | null,
  ): Promise<CommonResponse<PaginationResponseInterface<Material>>> {
    const where = filters ? getWhere(filters) : {};
    const order = sorts ? getOrder(sorts) : { createdAt: 'DESC' };
    const relations = includes ? getRelations(includes) : [];

    const [rows, count] = await this.materialRepository.findAndCount({
      where,
      order,
      relations,
      skip: pagination.offset,
      take: pagination.limit,
    });

    return new SuccessResponse({ rows, count });
  }

  async findOne(id: string): Promise<CommonResponse<Material>> {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!material) {
      return new ErrorResponse('Material not found', HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(material);
  }

  async findByCourse(courseId: string, visibleOnly = false): Promise<CommonResponse<Material[]>> {
    const where: any = { courseId };
    if (visibleOnly) {
      where.isVisible = true;
    }
    const materials = await this.materialRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return new SuccessResponse(materials);
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto): Promise<CommonResponse<Material>> {
    const material = await this.materialRepository.findOne({ where: { id } });

    if (!material) {
      return new ErrorResponse('Material not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(material, updateMaterialDto);
    const updatedMaterial = await this.materialRepository.save(material);

    return new SuccessResponse(updatedMaterial);
  }

  async remove(id: string): Promise<CommonResponse> {
    const material = await this.materialRepository.findOne({ where: { id } });

    if (!material) {
      return new ErrorResponse('Material not found', HttpStatus.NOT_FOUND);
    }

    await this.materialRepository.softDelete(id);
    return new SuccessResponse({ message: 'Material deleted successfully' });
  }
}
