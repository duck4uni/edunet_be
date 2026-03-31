import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupportTicketService } from './support-ticket.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { TicketStatus } from './entities/support-ticket.entity';
import { PaginationParams, Pagination } from 'src/core/decorators/pagination-params.decorator';
import { SortingParams, Sorting } from 'src/core/decorators/sorting-params.decorator';
import { FilteringParams, Filtering } from 'src/core/decorators/filtering-params.decorator';
import { IncludeRelations, Including } from 'src/core/decorators/including-params.decorator';

@ApiTags('Support Tickets')
@ApiBearerAuth('access-token')
@Controller('support-tickets')
@UseGuards(AuthGuard)
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @Post()
  create(@Body() createSupportTicketDto: CreateSupportTicketDto, @CurrentUser() user: any) {
    return this.supportTicketService.create(createSupportTicketDto, user.id);
  }

  @Get()
  findAll(
    @PaginationParams() pagination: Pagination,
    @SortingParams() sorts: Sorting[] | null,
    @FilteringParams() filters: Filtering[] | null,
    @IncludeRelations() includes: Including | null,
  ) {
    return this.supportTicketService.findAll(pagination, sorts, filters, includes);
  }

  @Get('stats')
  getStats() {
    return this.supportTicketService.getStats();
  }

  @Get('my-tickets')
  findMyTickets(@CurrentUser() user: any) {
    return this.supportTicketService.findByUser(user.id);
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: TicketStatus) {
    return this.supportTicketService.findByStatus(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supportTicketService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupportTicketDto: UpdateSupportTicketDto) {
    return this.supportTicketService.update(id, updateSupportTicketDto);
  }

  @Post(':id/respond')
  respond(
    @Param('id') id: string,
    @Body('response') response: string,
    @Body('assignedToId') assignedToId?: string,
  ) {
    return this.supportTicketService.respond(id, response, assignedToId);
  }

  @Post(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.supportTicketService.resolve(id);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.supportTicketService.close(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supportTicketService.remove(id);
  }
}
