import { InjectQueue } from '@nestjs/bull';
import { Injectable, StreamableFile } from '@nestjs/common';
import { Queue } from 'bull';
import { plainToInstance } from 'class-transformer';
import { Types } from 'mongoose';
import { UploadService } from 'src/modules/upload/upload.service';
import { DbService } from '../../modules/db/db.service';
import { LeanProjectDocument } from '../../modules/db/schemas/project.schema';
import {
  LeanTranscriptionDocument,
  Speaker,
  TranscriptionStatus,
} from '../../modules/db/schemas/transcription.schema';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { ExportSubtitlesService } from '../../modules/subtitle-format/export-subtitles.service';
import {
  TiptapCaption,
  TiptapDocument,
} from '../../modules/tiptap/tiptap.interfaces';
import { TiptapService } from '../../modules/tiptap/tiptap.service';
import {
  AlignPayload,
  ProcessSubtitlesJob,
  SubtitlesType,
} from '../../processors/processor.interfaces';
import {
  CustomBadRequestException,
  CustomForbiddenException,
} from '../../utils/exceptions';
import { isSameObjectId } from '../../utils/objectid';
import { AuthUser } from '../auth/auth.interfaces';
import { CaptionService } from '../caption/caption.service';
import { EventsGateway } from '../events/events.gateway';
import { ProjectEntity } from '../project/entities/project.entity';
import { CreateSpeakersDto } from './dto/create-speakers.dto';
import { CreateTranscriptionDto } from './dto/create-transcription.dto';
import {
  DownloadSubtitlesQuery,
  SubtitleExportType,
} from './dto/download-subtitles.dto';
import { FindAllTranscriptionsQuery } from './dto/find-all-transcriptions.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { UpdateTranscriptionDto } from './dto/update-transcription.dto';
import { TranscriptionEntity } from './entities/transcription.entity';

@Injectable()
export class TranscriptionService {
  constructor(
    private db: DbService,
    private permissions: PermissionsService,
    private events: EventsGateway,
    private exportSubtitlesService: ExportSubtitlesService,
    private captionService: CaptionService,
    @InjectQueue('subtitles')
    private subtitlesQueue: Queue<ProcessSubtitlesJob>,
    private tiptapService: TiptapService,
    private uploadService: UploadService,
  ) {}

  /**
   * @param authUser
   * @param createTranscriptionDto
   * @param subtitleFile if subtitleFile is != null, a queue job will be added
   * @returns
   */
  async create(
    authUser: AuthUser,
    createTranscriptionDto: CreateTranscriptionDto,
  ): Promise<TranscriptionEntity> {
    const { project: projectId, ...dto } = createTranscriptionDto;

    const project = await this.db.projectModel
      .findById(projectId)
      .orFail(new CustomBadRequestException('unknown_project_id'))
      .lean()
      .exec();

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    const transcriptionId = new Types.ObjectId();

    // TODO use transactions
    const [transcription, updatedProject] = await Promise.all([
      this.db.transcriptionModel.create({
        ...dto,
        createdBy: authUser.id,
        _id: transcriptionId,
        project: projectId,
        status: TranscriptionStatus.WAITING,
      }), // ,{populate:'createdBy'}
      this.db.updateProjectByIdAndReturn(projectId as Types.ObjectId, {
        $push: { transcriptions: transcriptionId },
      }),
    ]);

    const json: TiptapDocument = {
      type: 'doc',
      content: [
        // {
        //   type: 'paragraph',
        //   content: [
        //     {
        //       type: 'text',
        //       marks: [
        //         {
        //           type: 'word',
        //           attrs: {},
        //         },
        //       ],
        //       text: 'This is your transcript!',
        //     },
        //   ],
        // },
      ],
    };

    await this.tiptapService.updateDocument(transcription._id.toString(), json);

    await transcription.populate('createdBy');

    // Entity
    const entity = plainToInstance(
      TranscriptionEntity,
      transcription.toObject(),
    ) as unknown as TranscriptionEntity;

    // add queue job to fill transcription
    if (createTranscriptionDto.uploadId) {
      const subtitleFile = await this.uploadService.getUploadMetadata(
        createTranscriptionDto.uploadId,
      );
      // fill with subtitles file
      this.subtitlesQueue.add({
        project: updatedProject,
        transcription: entity,
        payload: {
          type: SubtitlesType.FROM_FILE,
          file: subtitleFile,
        },
      });
    } else if (createTranscriptionDto.asrDto) {
      const audio = // TODO this id should be in the DTO I guess ?
        updatedProject.audios.find((audio) => audio.extension === 'mp3') ||
        updatedProject.audios[0];
      this.subtitlesQueue.add({
        project: updatedProject,
        transcription: entity,
        payload: {
          type: SubtitlesType.FROM_ASR,
          ...createTranscriptionDto.asrDto,
          audio,
        },
      });
    } else if (createTranscriptionDto.translateDto) {
      this.subtitlesQueue.add({
        project: updatedProject,
        transcription: entity,
        payload: {
          type: SubtitlesType.FROM_TRANSLATION,
          ...createTranscriptionDto.translateDto,
        },
      });
    } else if (createTranscriptionDto.copyDto) {
      this.subtitlesQueue.add({
        project: updatedProject,
        transcription: entity,
        payload: {
          type: SubtitlesType.FROM_COPY,
          ...createTranscriptionDto.copyDto,
        },
      });
    } else {
      // empty transcription
      await this.db.transcriptionModel
        .findByIdAndUpdate(transcription._id, {
          $set: {
            status: TranscriptionStatus.OK,
          },
        })
        .lean()
        .exec();
      entity.status = TranscriptionStatus.OK;
    }

    const projectEntity = plainToInstance(ProjectEntity, updatedProject);

    // Send events
    this.events.projectUpdated(projectEntity);
    this.events.transcriptionCreated(projectEntity, entity);

    return entity;
  }

  async findAll(
    authUser: AuthUser,
    query: FindAllTranscriptionsQuery,
  ): Promise<TranscriptionEntity[]> {
    const project = await this.db.projectModel
      .findById(query.projectId)
      .orFail(new CustomBadRequestException('unknown_project_id'))
      .populate({ path: 'transcriptions', populate: { path: 'createdBy' } })
      .lean()
      .exec();

    if (!this.permissions.isProjectReadable(project, authUser)) {
      // if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    const transcriptions =
      project.transcriptions as LeanTranscriptionDocument[];

    // Entities
    const entities = transcriptions.map((o) =>
      plainToInstance(TranscriptionEntity, o),
    );

    return entities;
  }

  async findOne(authUser: AuthUser, id: string): Promise<TranscriptionEntity> {
    const transcription = await this.db.transcriptionModel
      .findById(id)
      .orFail(new CustomBadRequestException('unknown_transaction_id'))
      .populate('project')
      .populate('createdBy')
      .exec();

    const project = transcription.project as LeanProjectDocument;
    // if (!this.permissions.isProjectMember(project, authUser)) {
    if (!this.permissions.isProjectReadable(project, authUser)) {
      throw new CustomForbiddenException('access_to_transcription_denied');
    }

    // Entity
    const entity = plainToInstance(
      TranscriptionEntity,
      transcription.toObject(),
    ) as unknown as TranscriptionEntity;
    return entity;
  }

  async update(
    authUser: AuthUser,
    id: string,
    updateTranscriptionDto: UpdateTranscriptionDto,
  ): Promise<TranscriptionEntity> {
    const transcription = await this.db.transcriptionModel
      .findById(id)
      .orFail(new CustomBadRequestException('unknown_transaction_id'))
      .populate('project')
      .lean()
      .exec();

    const project = transcription.project as LeanProjectDocument;
    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_transcription_denied');
    }

    const updatedTranscription = await this.db.transcriptionModel
      .findByIdAndUpdate(
        id,
        {
          $set: updateTranscriptionDto,
        },
        {
          new: true,
          populate: 'createdBy',
        },
      )
      .lean()
      .exec();

    // Entity
    const entity = plainToInstance(TranscriptionEntity, updatedTranscription);

    // Send events
    this.events.transcriptionUpdated(project, entity);

    return entity;
  }

  async remove(authUser: AuthUser, id: string): Promise<void> {
    const transcription = await this.db.transcriptionModel
      .findById(id)
      .orFail(new CustomBadRequestException('unknown_transaction_id'))
      .populate('project')
      .populate('createdBy')
      .lean()
      .exec();

    const project = transcription.project as LeanProjectDocument;

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    //TODO als transaction

    await this.db.transcriptionModel.findByIdAndRemove(id);

    await this.db.updateProjectByIdAndReturn(project._id, {
      $pullAll: { transcriptions: [transcription._id] },
    });

    const updatedProject = await this.db.findProjectByIdOrThrow(
      project._id.toString(),
    );

    const projectEntity = plainToInstance(ProjectEntity, updatedProject);

    // Send events
    this.events.projectUpdated(projectEntity);
    this.events.transcriptionRemoved(projectEntity, transcription);
  }

  async downloadSubtitles(
    authUser: AuthUser,
    transcriptionId: string,
    downloadSubtitlesquery: DownloadSubtitlesQuery,
  ): Promise<StreamableFile> {
    const transcription = await this.db.transcriptionModel
      .findById(transcriptionId)
      .orFail(new CustomBadRequestException('unknown_transaction_id'))
      .populate('project speakers')
      .exec();

    const project = transcription.project as LeanProjectDocument;
    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_transcription_denied');
    }

    const captions = await this.captionService.findAll(authUser, {
      transcriptionId,
    });

    let streamableFile: StreamableFile;
    switch (downloadSubtitlesquery.type) {
      case SubtitleExportType.VTT:
        streamableFile = await this.exportSubtitlesService.toVttFile(
          transcription,
        );
        break;
      case SubtitleExportType.SRT:
        streamableFile = await this.exportSubtitlesService.toSrtFile(
          transcription,
        );
        break;
      case SubtitleExportType.TXT:
        streamableFile = await this.exportSubtitlesService.toTxtFile(
          transcription,
        );
        break;
    }

    return streamableFile;
  }

  async createSpeakers(
    authUser: AuthUser,
    id: string,
    createSpeakersDto: CreateSpeakersDto,
  ): Promise<TranscriptionEntity> {
    const transcription = await this.db.transcriptionModel
      .findById(id)
      .orFail(new CustomBadRequestException('unknown_transaction_id'))
      .populate('project')
      .lean()
      .exec();

    const project = transcription.project as LeanProjectDocument;
    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_transcription_denied');
    }

    const newSpeakers: Speaker[] = [...createSpeakersDto.names].map(
      (speakerName) => {
        return { _id: new Types.ObjectId(), name: speakerName };
      },
    );
    const updatedTranscription = await this.db.transcriptionModel
      .findByIdAndUpdate(
        id,
        {
          $push: { speakers: { $each: newSpeakers } },
        },
        { new: true },
      )
      .lean()
      .exec();

    // Entity
    const entity = plainToInstance(TranscriptionEntity, updatedTranscription);

    // Send events
    this.events.transcriptionUpdated(project, entity);

    return entity;
  }

  async updateSpeaker(
    authUser: AuthUser,
    id: string,
    idSpeaker: string,
    updateSpeakerDto: UpdateSpeakerDto,
  ) {
    const transcription = await this.db.transcriptionModel
      .findById(id)
      .orFail(new CustomBadRequestException('unknown_transaction_id'))
      .populate('project')
      .lean()
      .exec();

    const speakerExists = transcription.speakers.some((elem) =>
      isSameObjectId(elem._id, idSpeaker),
    );
    if (!speakerExists) {
      throw new CustomBadRequestException('unknown_speaker_id');
    }

    const project = transcription.project as LeanProjectDocument;
    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_transcription_denied');
    }

    const updatedTranscription = await this.db.transcriptionModel
      .findByIdAndUpdate(
        id,
        {
          $set: { 'speakers.$[element].name': updateSpeakerDto.name },
        },
        {
          arrayFilters: [
            { 'element._id': { $eq: new Types.ObjectId(idSpeaker) } },
          ],
          new: true,
        },
      )
      .lean()
      .exec();

    // Entity
    const entity = plainToInstance(TranscriptionEntity, updatedTranscription);

    // Send events
    this.events.transcriptionUpdated(project, entity);

    return entity;
  }

  async removeSpeaker(
    authUser: AuthUser,
    transcriptionId: string,
    speakerId: string,
  ) {
    const transcription = await this.db.transcriptionModel
      .findById(transcriptionId)
      .orFail(new CustomBadRequestException('unknown_transaction_id'))
      .populate('project')
      .lean()
      .exec();

    const speakerExists = transcription.speakers.some((elem) =>
      isSameObjectId(elem._id, speakerId),
    );
    if (!speakerExists) {
      throw new CustomBadRequestException('unknown_speaker_id');
    }

    const project = transcription.project as LeanProjectDocument;
    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_transcription_denied');
    }

    const updatedTranscription = await this.db.transcriptionModel
      .findByIdAndUpdate(
        transcriptionId,
        {
          $pull: { speakers: { _id: new Types.ObjectId(speakerId) } },
        },
        { new: true },
      )
      .lean()
      .exec();

    // Entity
    const entity = plainToInstance(TranscriptionEntity, updatedTranscription);

    // Send events
    this.events.transcriptionUpdated(project, entity);

    return entity;
  }

  /**
   * new YDOC logic
   */

  async getCaptions(authUser: AuthUser, id: string): Promise<TiptapCaption[]> {
    const transcription = await this.db.transcriptionModel
      .findById(id)
      .orFail(new CustomBadRequestException('unknown_transaction_id'))
      .populate('project')
      .populate('createdBy')
      .exec();

    const project = transcription.project as LeanProjectDocument;
    // if (!this.permissions.isProjectMember(project, authUser)) {
    if (!this.permissions.isProjectReadable(project, authUser)) {
      throw new CustomForbiddenException('access_to_transcription_denied');
    }

    // const ydoc = this.tiptapService.toYDoc(transcription.ydoc);

    const tiptapCaptions = await this.tiptapService.getCaptionsById(id);
    return tiptapCaptions;
  }

  // TODO mehr provisorisch bis wir wissen wir das umsetzen wollen
  // speaker mapping fehlt, aktuell wird einfach nur eine neue transcription erstellt mit dem text, ohne jeweilige speaker
  async alignTranscription(authUser: AuthUser, id: string): Promise<void> {
    const transcription = await this.db.transcriptionModel
      .findById(id)
      .orFail(new CustomBadRequestException('unknown_transaction_id'))
      .populate('project')
      .populate('createdBy')
      .exec();

    const project = transcription.project as LeanProjectDocument;
    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_transcription_denied');
    }

    const projectId = project._id.toString();
    const transcriptionId = new Types.ObjectId();

    // create new transcription

    const dto: CreateTranscriptionDto = {
      title: transcription.title
        ? transcription.title + ' - aligned'
        : 'aligned',
      language: transcription.language,
      project: projectId as any,
    };
    const [newtranscription, updatedProject] = await Promise.all([
      this.db.transcriptionModel.create({
        ...dto,
        createdBy: authUser.id,
        _id: transcriptionId,
        project: projectId,
        speakers: [
          ...transcription.speakers.map((speaker) => ({
            ...speaker,
            _id: new Types.ObjectId(),
          })),
        ],
      }), // ,{populate:'createdBy'}
      this.db.updateProjectByIdAndReturn(projectId, {
        $push: { transcriptions: transcriptionId },
      }),
    ]);

    // align text from old transcription to new trasncriptiopn

    // const text = await this.tiptapService.getPlainText(
    //   transcription._id.toString(),
    // );

    // TODO
    const transcriptToAlign = await this.tiptapService.getAsMelvinTranscript(
      transcription._id.toString(),
    );

    // run task
    const payload: AlignPayload = {
      type: SubtitlesType.ALIGN,
      audio: project.audios[0],
      transcriptionId: transcription._id.toString(),
      // text,
      transcriptToAlign: transcriptToAlign,
    };
    this.subtitlesQueue.add({
      project: project,
      transcription: newtranscription,
      payload,
    });

    // events
    await newtranscription.populate('createdBy');

    // Entity
    const entity = plainToInstance(
      TranscriptionEntity,
      newtranscription.toObject(),
    ) as unknown as TranscriptionEntity;

    const projectEntity = plainToInstance(ProjectEntity, updatedProject);

    // Send events
    this.events.projectUpdated(projectEntity);
    this.events.transcriptionCreated(projectEntity, entity);

    return;
  }
}
