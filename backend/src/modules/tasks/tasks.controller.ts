import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  TaskResponseDto,
  PaginatedTasksDto,
} from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from 'src/common/current-user.decorator';

@ApiTags('tasks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle tâche' })
  @ApiResponse({ status: 201, description: 'Tâche créée avec succès', type: TaskResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.create(createTaskDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les tâches avec filtres et pagination' })
  @ApiResponse({ status: 200, description: 'Liste des tâches', type: PaginatedTasksDto })
  async findAll(
    @Query() filters: TaskFilterDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.findAll(filters, user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Récupérer les statistiques des tâches' })
  async getStats(@CurrentUser() user: User) {
    return this.tasksService.getTaskStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une tâche par son ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Tâche trouvée', type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Tâche non trouvée' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Tâche mise à jour', type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Tâche non trouvée' })
  @ApiResponse({ status: 403, description: 'Permission refusée' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.update(id, updateTaskDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une tâche' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Tâche supprimée' })
  @ApiResponse({ status: 404, description: 'Tâche non trouvée' })
  @ApiResponse({ status: 403, description: 'Permission refusée' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.tasksService.remove(id, user.id);
    return { message: 'Tâche supprimée avec succès' };
  }
}
