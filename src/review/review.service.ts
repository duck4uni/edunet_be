import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Pagination } from 'src/core/decorators/pagination-params.decorator';
import { Sorting } from 'src/core/decorators/sorting-params.decorator';
import { Filtering } from 'src/core/decorators/filtering-params.decorator';
import { Including } from 'src/core/decorators/including-params.decorator';
import { getOrder, getWhere, getRelations } from 'src/core/helpers';
import { ErrorResponse, SuccessResponse } from 'src/core/responses/base.responses';
import { CommonResponse, PaginationResponseInterface } from 'src/core/types/response';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { User, UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<CommonResponse<Review>> {
    // Check if user already reviewed this course
    const existingReview = await this.reviewRepository.findOne({
      where: { courseId: createReviewDto.courseId, userId },
    });

    if (existingReview) {
      return new ErrorResponse('You have already reviewed this course', HttpStatus.BAD_REQUEST);
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      userId,
    });
    const savedReview = await this.reviewRepository.save(review);
    return new SuccessResponse(savedReview, HttpStatus.CREATED);
  }

  async findAll(
    pagination: Pagination,
    sorts: Sorting[] | null,
    filters: Filtering[] | null,
    includes: Including | null,
  ): Promise<CommonResponse<PaginationResponseInterface<Review>>> {
    const where = filters ? getWhere(filters) : {};
    const order = sorts ? getOrder(sorts) : { createdAt: 'DESC' };
    const relations = includes ? getRelations(includes) : [];

    const [rows, count] = await this.reviewRepository.findAndCount({
      where,
      order,
      relations,
      skip: pagination.offset,
      take: pagination.limit,
    });

    return new SuccessResponse({ rows, count });
  }

  async findOne(id: string): Promise<CommonResponse<Review>> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['course', 'user'],
    });

    if (!review) {
      return new ErrorResponse('Review not found', HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(review);
  }

  async findByCourse(courseId: string): Promise<CommonResponse<Review[]>> {
    const reviews = await this.reviewRepository.find({
      where: { courseId, isVisible: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return new SuccessResponse(reviews);
  }

  async getCourseStats(courseId: string): Promise<CommonResponse<{ averageRating: number; totalReviews: number }>> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.courseId = :courseId', { courseId })
      .andWhere('review.isVisible = :isVisible', { isVisible: true })
      .getRawOne();

    return new SuccessResponse({
      averageRating: parseFloat(result?.averageRating) || 0,
      totalReviews: parseInt(result?.totalReviews) || 0,
    });
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, userId: string): Promise<CommonResponse<Review>> {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      return new ErrorResponse('Review not found', HttpStatus.NOT_FOUND);
    }

    if (review.userId !== userId) {
      return new ErrorResponse('You can only update your own review', HttpStatus.FORBIDDEN);
    }

    Object.assign(review, updateReviewDto);
    const updatedReview = await this.reviewRepository.save(review);

    return new SuccessResponse(updatedReview);
  }

  async remove(id: string, currentUser: User): Promise<CommonResponse> {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      return new ErrorResponse('Review not found', HttpStatus.NOT_FOUND);
    }

    if (currentUser.role !== UserRole.ADMIN && review.userId !== currentUser.id) {
      return new ErrorResponse('Forbidden: you are not allowed to delete this review', HttpStatus.FORBIDDEN);
    }

    await this.reviewRepository.softDelete(id);
    return new SuccessResponse({ message: 'Review deleted successfully' });
  }

  async toggleVisibility(id: string, currentUser: User): Promise<CommonResponse<Review>> {
    if (currentUser.role !== UserRole.ADMIN) {
      return new ErrorResponse('Only admin can moderate review visibility', HttpStatus.FORBIDDEN);
    }

    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      return new ErrorResponse('Review not found', HttpStatus.NOT_FOUND);
    }

    review.isVisible = !review.isVisible;
    const updatedReview = await this.reviewRepository.save(review);

    return new SuccessResponse(updatedReview);
  }
}
