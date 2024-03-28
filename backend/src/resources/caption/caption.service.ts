import {
  ClassSerializerInterceptor,
  Injectable,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { DbService } from '../../modules/db/db.service';
import {
  CaptionHistory,
  LeanCaptionDocument,
} from '../../modules/db/schemas/caption.schema';
import {
  LeanProjectDocument,
  ProjectDocument,
} from '../../modules/db/schemas/project.schema';
import { LeanTranscriptionDocument } from '../../modules/db/schemas/transcription.schema';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import {
  CustomBadRequestException,
  CustomForbiddenException,
} from '../../utils/exceptions';
import { isSameObjectId } from '../../utils/objectid';
import { AuthUser } from '../auth/auth.interfaces';
import { EventsGateway } from '../events/events.gateway';
import { CreateCaptionDto } from './dto/create-caption.dto';
import { FindAllCaptionsQuery } from './dto/find-all-captions.dto';
import { UpdateCaptionDto } from './dto/update-caption.dto';
import { CaptionListEntity } from './entities/caption-list.entity';
import { CaptionEntity } from './entities/caption.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Injectable()
export class CaptionService {
  constructor(
    private db: DbService,
    private events: EventsGateway,
    private permissions: PermissionsService,
  ) {}

  _isCaptionEditable(caption: LeanCaptionDocument, authUser: AuthUser) {
    return (
      caption.lockedBy === null || isSameObjectId(caption.lockedBy, authUser.id)
    );
  }

  _isValidSpeakerId(
    transcription: LeanTranscriptionDocument,
    speakerId: string,
  ): boolean {
    return transcription.speakers.some((o) => isSameObjectId(o._id, speakerId));
  }

  async create(
    authUser: AuthUser,
    createCaptionDto: CreateCaptionDto,
  ): Promise<CaptionEntity> {
    const {
      transcription: transcriptionId,
      speakerId,
      text,
      ...dto
    } = createCaptionDto;

    const transcription = await this.db.transcriptionModel
      .findById(transcriptionId)
      .populate('project')
      .lean()
      .exec();

    // Unknown transcriptionId
    if (transcription === null) {
      throw new CustomBadRequestException('unknown_transcription_id');
    }

    // Check project permissions
    const project = transcription.project as LeanProjectDocument;
    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('must_be_project_member');
    }

    // Unknown speaker id
    if (!this._isValidSpeakerId(transcription, speakerId)) {
      throw new CustomBadRequestException('unknown_speaker_id');
    }

    // Create caption
    const doc = await this.db.captionModel.create({
      project: project._id.toString(),
      transcription: transcriptionId,
      wasManuallyEdited: false,
      updatedBy: authUser.id,
      lockedBy: null,
      initialText: text,
      speakerId,
      text,
      ...dto,
    });

    const caption = doc.toObject();

    // Entity
    const entity = plainToInstance(CaptionEntity, caption);

    // Send events
    this.events.captionCreated(project, entity);

    return entity;
  }

  async findAll(
    authUser: AuthUser,
    query: FindAllCaptionsQuery,
  ): Promise<CaptionListEntity> {
    const { transcriptionId } = query;

    const transcription = await this.db.transcriptionModel
      .findById(transcriptionId)
      .populate('project')
      .lean()
      .exec();

    // Unknown transcriptionId
    if (transcription === null) {
      throw new CustomBadRequestException('unknown_transcription_id');
    }

    // Check project permissions
    const project = transcription.project as ProjectDocument;
    // if (!this.permissions.isProjectMember(project, authUser)) {
    if (!this.permissions.isProjectReadable(project, authUser)) {
      throw new CustomForbiddenException('must_be_project_member');
    }

    const { limit, page = 1 } = query;
    const skip = limit ? limit * (page - 1) : undefined;

    // Find captions
    const [total, captions] = await Promise.all([
      this.db.captionModel.countDocuments({ transcription: transcriptionId }),
      this.db.captionModel
        .find({
          transcription: transcriptionId,
        })
        .sort({ start: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    // Entity
    const entity = plainToInstance(CaptionListEntity, {
      captions,
      total,
      page,
      count: captions.length,
    });

    return entity;
  }

  async findOne(authUser: AuthUser, id: string): Promise<CaptionEntity> {
    const caption = await this.db.captionModel
      .findById(id)
      .populate('project')
      .exec();

    // Unknown captionId
    if (caption === null) {
      throw new CustomBadRequestException('unknown_caption_id');
    }

    // Check project permissions
    const project = caption.project as ProjectDocument;
    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('must_be_project_member');
    }

    // Depopulate project
    caption.depopulate();

    // Entity
    const entity = plainToInstance(
      CaptionEntity,
      caption.toObject(),
    ) as unknown as CaptionEntity;

    return entity;
  }

  async update(
    authUser: AuthUser,
    id: string,
    updateCaptionDto: UpdateCaptionDto,
  ): Promise<CaptionEntity> {
    const caption = await this.db.captionModel
      .findById(id)
      .populate('project')
      .lean()
      .exec();

    // Unknown captionId
    if (caption === null) {
      throw new CustomBadRequestException('unknown_caption_id');
    }

    // Check project permissions
    const project = caption.project as ProjectDocument;
    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('must_be_project_member');
    }

    // Check caption lock
    if (!this._isCaptionEditable(caption, authUser)) {
      throw new CustomBadRequestException('caption_locked_by_other_user');
    }

    // Compare dto with caption in db and check if there is any change in the send properties
    const hasChanges = Object.keys(updateCaptionDto).some(
      (key) => updateCaptionDto[key] !== caption[key],
    );

    // Return caption directly if no values have changes
    if (!hasChanges) {
      caption.project = caption.project._id;
      return plainToInstance(CaptionEntity, caption);
    }

    // Update caption
    const updatedCaption = await this.db.captionModel
      .findByIdAndUpdate(
        id,
        {
          $set: { ...updateCaptionDto, updatedBy: authUser.id },
          // Create history entry if text has changed
          ...(updateCaptionDto.text && updateCaptionDto.text !== caption.text
            ? {
                $push: {
                  history: {
                    createdAt: new Date(),
                    createdBy: caption.updatedBy,
                    text: caption.text,
                  },
                },
              }
            : {}),
        },
        { new: true },
      )
      .lean()
      .exec();

    // Entity
    const entity = plainToInstance(CaptionEntity, updatedCaption);

    // Send events
    this.events.captionUpdated(project, entity);

    return entity;
  }

  async remove(authUser: AuthUser, id: string): Promise<void> {
    const caption = await this.db.captionModel
      .findById(id)
      .populate('project')
      .lean()
      .exec();

    // Unknown captionId
    if (caption === null) {
      throw new CustomBadRequestException('unknown_caption_id');
    }

    // Check project permissions
    const project = caption.project as ProjectDocument;
    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('must_be_project_member');
    }
    // Check caption lock
    if (!this._isCaptionEditable(caption, authUser)) {
      throw new CustomBadRequestException('caption_locked_by_other_user');
    }

    // Remove caption
    const removedCaption = await this.db.captionModel
      .findByIdAndRemove(id)
      .lean()
      .exec();

    // Send events
    this.events.captionRemoved(project, removedCaption);
  }

  async getHistory(authUser: AuthUser, id: string): Promise<CaptionHistory[]> {
    const caption = await this.db.captionModel
      .findById(id)
      .populate('project')
      .exec();

    // Unknown captionId
    if (caption === null) {
      throw new CustomBadRequestException('unknown_caption_id');
    }

    // Check project permissions
    const project = caption.project as ProjectDocument;
    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('must_be_project_member');
    }

    // Depopulate project
    caption.depopulate();

    // // Entity
    const entity = plainToInstance(
      CaptionEntity,
      caption.toObject(),
    ) as unknown as CaptionEntity;

    return entity.history;
  }

  // bulk operations

  /**
   * only internal usage // without validation & dont send events
   */
  async createMany(
    authUser: AuthUser,
    createCaptionDtos: CreateCaptionDto[],
    projectId: string,
  ) {
    const models = createCaptionDtos.map(
      (dto) =>
        new this.db.captionModel({
          project: projectId,
          wasManuallyEdited: false,
          updatedBy: authUser.id,
          lockedBy: null,
          initialText: dto.text,
          ...dto,
        }),
    );

    const result = await this.db.captionModel.insertMany(models);

    return result.map((obj) => obj.toObject());
  }
}
